"use client"

import { useEffect, useRef, useCallback } from "react"
import type { Canvas as FabricCanvas, FabricObject } from "fabric"
import { useDesignerStore } from "../store/designerStore"

// Shape drawing state (module-level to avoid closure issues)
let _isDown = false
let _startX = 0
let _startY = 0
let _activeShape: FabricObject | null = null
const _handlers: { down?: (e: unknown) => void; move?: (e: unknown) => void; up?: (e: unknown) => void } = {}

interface Props {
  initialJson?: object | null
  onCanvasReady: (canvas: FabricCanvas) => void
}

// Fabric.js se carga dinámicamente para evitar SSR
let fabricModule: typeof import("fabric") | null = null

async function getFabric() {
  if (!fabricModule) {
    fabricModule = await import("fabric")
  }
  return fabricModule
}

const HISTORY_LIMIT = 50

export function DesignerCanvas({ initialJson, onCanvasReady }: Props) {
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const historyRef = useRef<string[]>([])
  const historyPosRef = useRef(-1)
  const isRestoringRef = useRef(false)

  const { tool, strokeColor, strokeWidth, fillColor, fontSize, setCanUndo, setCanRedo, setDirty } =
    useDesignerStore()

  const pushHistory = useCallback((json: string) => {
    const hist = historyRef.current
    const pos = historyPosRef.current
    // Truncate redo stack
    hist.splice(pos + 1)
    hist.push(json)
    if (hist.length > HISTORY_LIMIT) hist.shift()
    historyPosRef.current = hist.length - 1
    setCanUndo(historyPosRef.current > 0)
    setCanRedo(false)
    setDirty(true)
  }, [setCanUndo, setCanRedo, setDirty])

  // Expose undo/redo to parent via store actions on canvas
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handleUndo = () => {
      const pos = historyPosRef.current
      if (pos <= 0) return
      isRestoringRef.current = true
      historyPosRef.current = pos - 1
      const json = historyRef.current[historyPosRef.current]
      canvas.loadFromJSON(JSON.parse(json)).then(() => {
        canvas.renderAll()
        isRestoringRef.current = false
        setCanUndo(historyPosRef.current > 0)
        setCanRedo(true)
      })
    }

    const handleRedo = () => {
      const hist = historyRef.current
      const pos = historyPosRef.current
      if (pos >= hist.length - 1) return
      isRestoringRef.current = true
      historyPosRef.current = pos + 1
      const json = hist[historyPosRef.current]
      canvas.loadFromJSON(JSON.parse(json)).then(() => {
        canvas.renderAll()
        isRestoringRef.current = false
        setCanUndo(true)
        setCanRedo(historyPosRef.current < hist.length - 1)
      })
    }

    // Expose on window for toolbar buttons
    ;(window as Window & { __designerUndo?: () => void; __designerRedo?: () => void }).__designerUndo = handleUndo
    ;(window as Window & { __designerUndo?: () => void; __designerRedo?: () => void }).__designerRedo = handleRedo
  })

  // Init canvas
  useEffect(() => {
    if (!canvasEl.current) return
    let destroyed = false

    getFabric().then(async ({ Canvas, PencilBrush }) => {
      if (destroyed || !canvasEl.current) return

      const container = canvasEl.current.parentElement!
      const w = container.clientWidth
      const h = Math.max(500, container.clientHeight)

      const canvas = new Canvas(canvasEl.current, {
        width: w,
        height: h,
        backgroundColor: "#1c1c1f",
        selection: true,
      })

      canvas.freeDrawingBrush = new PencilBrush(canvas)

      // Load existing JSON
      if (initialJson) {
        await canvas.loadFromJSON(initialJson)
        canvas.renderAll()
      }

      // Initial history snapshot
      const snap = JSON.stringify(canvas.toJSON())
      historyRef.current = [snap]
      historyPosRef.current = 0

      // Track changes
      canvas.on("object:added", () => {
        if (isRestoringRef.current) return
        pushHistory(JSON.stringify(canvas.toJSON()))
      })
      canvas.on("object:modified", () => {
        if (isRestoringRef.current) return
        pushHistory(JSON.stringify(canvas.toJSON()))
      })
      canvas.on("object:removed", () => {
        if (isRestoringRef.current) return
        pushHistory(JSON.stringify(canvas.toJSON()))
      })

      fabricRef.current = canvas
      onCanvasReady(canvas)

      // Responsive resize
      const ro = new ResizeObserver(() => {
        if (!canvas || !container) return
        canvas.setDimensions({ width: container.clientWidth })
        canvas.renderAll()
      })
      ro.observe(container)

      return () => ro.disconnect()
    })

    return () => {
      destroyed = true
      fabricRef.current?.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync tool changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    // Remove previous shape handlers
    if (_handlers.down) canvas.off("mouse:down", _handlers.down as never)
    if (_handlers.move) canvas.off("mouse:move", _handlers.move as never)
    if (_handlers.up)   canvas.off("mouse:up",   _handlers.up   as never)
    _handlers.down = _handlers.move = _handlers.up = undefined
    _isDown = false
    _activeShape = null

    getFabric().then(({ PencilBrush, Rect, Ellipse, Line }) => {
      const c = fabricRef.current
      if (!c) return

      if (tool === "draw") {
        c.isDrawingMode = true
        c.selection = false
        c.freeDrawingBrush = new PencilBrush(c)
        c.freeDrawingBrush.color = strokeColor
        c.freeDrawingBrush.width = strokeWidth
        return
      }

      c.isDrawingMode = false

      if (tool === "select") {
        c.selection = true
        return
      }

      if (tool === "eraser") {
        c.selection = true
        const down = (e: { target?: unknown }) => {
          if (e.target) {
            c.remove(e.target as Parameters<typeof c.remove>[0])
            c.renderAll()
          }
        }
        c.on("mouse:down", down as never)
        _handlers.down = down as (e: unknown) => void
        return
      }

      c.selection = false

      if (tool === "line") {
        const down = (e: { scenePoint: { x: number; y: number } }) => {
          _isDown = true; _startX = e.scenePoint.x; _startY = e.scenePoint.y
          const obj = new Line([_startX, _startY, _startX, _startY], {
            stroke: strokeColor, strokeWidth, selectable: false, evented: false,
          })
          c.add(obj); _activeShape = obj as unknown as FabricObject
        }
        const move = (e: { scenePoint: { x: number; y: number } }) => {
          if (!_isDown || !_activeShape) return
          ;(_activeShape as unknown as { set: (p: object) => void }).set({ x2: e.scenePoint.x, y2: e.scenePoint.y })
          c.renderAll()
        }
        const up = () => {
          _isDown = false
          if (_activeShape) { ;(_activeShape as unknown as { set: (p: object) => void }).set({ selectable: true, evented: true }); c.renderAll() }
          _activeShape = null
        }
        c.on("mouse:down", down as never); c.on("mouse:move", move as never); c.on("mouse:up", up as never)
        _handlers.down = down as (e: unknown) => void; _handlers.move = move as (e: unknown) => void; _handlers.up = up
        return
      }

      if (tool === "rect") {
        const down = (e: { scenePoint: { x: number; y: number } }) => {
          _isDown = true; _startX = e.scenePoint.x; _startY = e.scenePoint.y
          const obj = new Rect({ left: _startX, top: _startY, width: 0, height: 0,
            stroke: strokeColor, strokeWidth, fill: fillColor === "transparent" ? "transparent" : fillColor,
            selectable: false, evented: false })
          c.add(obj); _activeShape = obj as unknown as FabricObject
        }
        const move = (e: { scenePoint: { x: number; y: number } }) => {
          if (!_isDown || !_activeShape) return
          const { x, y } = e.scenePoint
          ;(_activeShape as unknown as { set: (p: object) => void }).set({
            left: Math.min(x, _startX), top: Math.min(y, _startY),
            width: Math.abs(x - _startX), height: Math.abs(y - _startY),
          }); c.renderAll()
        }
        const up = () => {
          _isDown = false
          if (_activeShape) { ;(_activeShape as unknown as { set: (p: object) => void }).set({ selectable: true, evented: true }); c.renderAll() }
          _activeShape = null
        }
        c.on("mouse:down", down as never); c.on("mouse:move", move as never); c.on("mouse:up", up as never)
        _handlers.down = down as (e: unknown) => void; _handlers.move = move as (e: unknown) => void; _handlers.up = up
        return
      }

      if (tool === "ellipse") {
        const down = (e: { scenePoint: { x: number; y: number } }) => {
          _isDown = true; _startX = e.scenePoint.x; _startY = e.scenePoint.y
          const obj = new Ellipse({ left: _startX, top: _startY, rx: 0, ry: 0,
            stroke: strokeColor, strokeWidth, fill: fillColor === "transparent" ? "transparent" : fillColor,
            selectable: false, evented: false })
          c.add(obj); _activeShape = obj as unknown as FabricObject
        }
        const move = (e: { scenePoint: { x: number; y: number } }) => {
          if (!_isDown || !_activeShape) return
          const { x, y } = e.scenePoint
          ;(_activeShape as unknown as { set: (p: object) => void }).set({
            left: Math.min(x, _startX), top: Math.min(y, _startY),
            rx: Math.abs(x - _startX) / 2, ry: Math.abs(y - _startY) / 2,
          }); c.renderAll()
        }
        const up = () => {
          _isDown = false
          if (_activeShape) { ;(_activeShape as unknown as { set: (p: object) => void }).set({ selectable: true, evented: true }); c.renderAll() }
          _activeShape = null
        }
        c.on("mouse:down", down as never); c.on("mouse:move", move as never); c.on("mouse:up", up as never)
        _handlers.down = down as (e: unknown) => void; _handlers.move = move as (e: unknown) => void; _handlers.up = up
      }
    })
  }, [tool, strokeColor, strokeWidth, fillColor])

  // Delete selected on Backspace / Delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const canvas = fabricRef.current
      if (!canvas) return
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      if (e.key === "Delete" || e.key === "Backspace") {
        const active = canvas.getActiveObjects()
        if (active.length) {
          active.forEach((obj: FabricObject) => canvas.remove(obj))
          canvas.discardActiveObject()
          canvas.renderAll()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        ;(window as Window & { __designerUndo?: () => void }).__designerUndo?.()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault()
        ;(window as Window & { __designerRedo?: () => void }).__designerRedo?.()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Add text tool click
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || tool !== "text") return

    function handleClick(e: { pointer: { x: number; y: number } }) {
      getFabric().then(({ IText }) => {
        const text = new IText("Escribe aquí", {
          left: e.pointer.x,
          top: e.pointer.y,
          fontSize,
          fill: strokeColor,
          fontFamily: "Inter, sans-serif",
        })
        canvas!.add(text)
        canvas!.setActiveObject(text)
        text.enterEditing()
      })
    }

    canvas.on("mouse:down", handleClick as never)
    return () => { canvas.off("mouse:down", handleClick as never) }
  }, [tool, strokeColor, fontSize])

  // Sync color/fill on selected objects when changed
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObjects()
    if (!active.length) return
    active.forEach((obj: FabricObject) => {
      obj.set({ stroke: strokeColor })
      if (fillColor !== "transparent") obj.set({ fill: fillColor })
    })
    canvas.renderAll()
  }, [strokeColor, fillColor])

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <canvas ref={canvasEl} />
    </div>
  )
}
