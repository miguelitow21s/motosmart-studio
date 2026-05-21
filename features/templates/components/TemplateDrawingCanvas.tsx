"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Canvas as FabricCanvas } from "fabric"
import {
  MousePointer2, Pencil, Minus, Square, Circle, Eraser, Type, Hand,
  Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize2,
  ImagePlus, Copy, ArrowUpToLine, ArrowDownToLine,
} from "lucide-react"

interface Props {
  onSvgChange: (svg: string) => void
  /** If true, the component stretches to fill its parent height (for full-screen use) */
  fillHeight?: boolean
}

type Tool = "select" | "pencil" | "line" | "rect" | "ellipse" | "text" | "eraser" | "hand"

let fabricModule: typeof import("fabric") | null = null
async function getFabric() {
  if (!fabricModule) fabricModule = await import("fabric")
  return fabricModule
}

const HISTORY_LIMIT = 30

export function TemplateDrawingCanvas({ onSvgChange, fillHeight = false }: Props) {
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const [tool, setTool] = useState<Tool>("pencil")
  const [strokeColor, setStrokeColor] = useState("#1e1b4b")
  const [fillColor, setFillColor] = useState("transparent")
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)

  const historyRef = useRef<string[]>([])
  const historyPosRef = useRef(-1)
  const isRestoringRef = useRef(false)
  const isDownRef = useRef(false)
  const startPointRef = useRef({ x: 0, y: 0 })
  const activeShapeRef = useRef<ReturnType<FabricCanvas["getActiveObject"]>>(null)
  const handlersRef = useRef<{
    down?: (e: unknown) => void
    move?: (e: unknown) => void
    up?: (e: unknown) => void
  }>({})
  // Pan state
  const isPanningRef = useRef(false)
  const panLastRef = useRef({ x: 0, y: 0 })

  function handleZoom(direction: "in" | "out" | "reset") {
    const canvas = fabricRef.current
    if (!canvas) return
    if (direction === "reset") {
      canvas.setZoom(1)
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    } else {
      const factor = direction === "in" ? 1.2 : 1 / 1.2
      const newZoom = Math.min(Math.max(canvas.getZoom() * factor, 0.1), 8)
      canvas.setZoom(newZoom)
    }
    canvas.renderAll()
  }

  const emitSvg = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    onSvgChange(canvas.toSVG())
  }, [onSvgChange])

  const pushHistory = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || isRestoringRef.current) return
    const json = JSON.stringify(canvas.toJSON())
    const hist = historyRef.current
    const pos = historyPosRef.current
    hist.splice(pos + 1)
    hist.push(json)
    if (hist.length > HISTORY_LIMIT) hist.shift()
    historyPosRef.current = hist.length - 1
    setCanUndo(historyPosRef.current > 0)
    setCanRedo(false)
    emitSvg()
  }, [emitSvg])

  useEffect(() => {
    if (!canvasEl.current || !containerRef.current) return
    let destroyed = false

    getFabric().then(async ({ Canvas, PencilBrush }) => {
      if (destroyed || !canvasEl.current || !containerRef.current) return

      const container = containerRef.current
      const w = container.clientWidth
      const h = fillHeight ? Math.max(container.clientHeight, 200) : 360

      const canvas = new Canvas(canvasEl.current, {
        width: w,
        height: h,
        backgroundColor: "#ffffff",
      })

      canvas.freeDrawingBrush = new PencilBrush(canvas)
      canvas.freeDrawingBrush.color = "#1e1b4b"
      canvas.freeDrawingBrush.width = 3
      canvas.isDrawingMode = true

      const snap = JSON.stringify(canvas.toJSON())
      historyRef.current = [snap]
      historyPosRef.current = 0

      canvas.on("object:added", pushHistory)
      canvas.on("object:modified", pushHistory)
      canvas.on("object:removed", pushHistory)
      canvas.on("selection:created", () => setHasSelection(true))
      canvas.on("selection:updated", () => setHasSelection(true))
      canvas.on("selection:cleared", () => setHasSelection(false))

      fabricRef.current = canvas

      const ro = new ResizeObserver(() => {
        if (!containerRef.current || !fabricRef.current) return
        const newW = containerRef.current.clientWidth
        const newH = fillHeight ? Math.max(containerRef.current.clientHeight, 200) : undefined
        const dims: { width: number; height?: number } = { width: newW }
        if (newH) dims.height = newH
        fabricRef.current.setDimensions(dims)
        fabricRef.current.renderAll()
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

  // Sync tool + color + stroke
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    if (handlersRef.current.down) canvas.off("mouse:down", handlersRef.current.down as never)
    if (handlersRef.current.move) canvas.off("mouse:move", handlersRef.current.move as never)
    if (handlersRef.current.up) canvas.off("mouse:up", handlersRef.current.up as never)
    handlersRef.current = {}
    isDownRef.current = false
    activeShapeRef.current = null

    getFabric().then(({ PencilBrush, Rect, Ellipse, Line }) => {
      const c = fabricRef.current
      if (!c) return

      if (tool === "pencil") {
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
        handlersRef.current.down = down as (e: unknown) => void
        return
      }

      if (tool === "text") {
        c.selection = false
        c.defaultCursor = "text"
        const down = async (e: { scenePoint: { x: number; y: number } }) => {
          const { IText } = await import("fabric")
          const text = new IText("Texto", {
            left: e.scenePoint.x,
            top: e.scenePoint.y,
            fontSize: 24,
            fill: strokeColor,
            fontFamily: "sans-serif",
          })
          c.add(text)
          c.setActiveObject(text)
          text.enterEditing()
          c.renderAll()
        }
        c.on("mouse:down", down as never)
        handlersRef.current.down = down as (e: unknown) => void
        return
      }

      if (tool === "hand") {
        c.isDrawingMode = false
        c.selection = false
        c.defaultCursor = "grab"
        const down = (e: { e: MouseEvent }) => {
          isPanningRef.current = true
          panLastRef.current = { x: e.e.clientX, y: e.e.clientY }
          c.defaultCursor = "grabbing"
        }
        const move = (e: { e: MouseEvent }) => {
          if (!isPanningRef.current) return
          const vpt = c.viewportTransform!
          vpt[4] += e.e.clientX - panLastRef.current.x
          vpt[5] += e.e.clientY - panLastRef.current.y
          panLastRef.current = { x: e.e.clientX, y: e.e.clientY }
          c.requestRenderAll()
        }
        const up = () => {
          isPanningRef.current = false
          c.defaultCursor = "grab"
        }
        c.on("mouse:down", down as never)
        c.on("mouse:move", move as never)
        c.on("mouse:up", up as never)
        handlersRef.current = { down: down as (e: unknown) => void, move: move as (e: unknown) => void, up }
        return
      }

      c.selection = false
      c.defaultCursor = "crosshair"

      if (tool === "line") {
        const down = (e: { scenePoint: { x: number; y: number } }) => {
          isDownRef.current = true
          startPointRef.current = { x: e.scenePoint.x, y: e.scenePoint.y }
          const obj = new Line(
            [e.scenePoint.x, e.scenePoint.y, e.scenePoint.x, e.scenePoint.y],
            { stroke: strokeColor, strokeWidth, selectable: false, evented: false }
          )
          c.add(obj)
          activeShapeRef.current = obj as unknown as ReturnType<FabricCanvas["getActiveObject"]>
        }
        const move = (e: { scenePoint: { x: number; y: number } }) => {
          if (!isDownRef.current || !activeShapeRef.current) return
          ;(activeShapeRef.current as unknown as { set: (p: object) => void }).set({
            x2: e.scenePoint.x, y2: e.scenePoint.y,
          })
          c.renderAll()
        }
        const up = () => {
          isDownRef.current = false
          if (activeShapeRef.current) {
            ;(activeShapeRef.current as unknown as { set: (p: object) => void }).set({ selectable: true, evented: true })
            c.renderAll()
          }
          activeShapeRef.current = null
        }
        c.on("mouse:down", down as never)
        c.on("mouse:move", move as never)
        c.on("mouse:up", up as never)
        handlersRef.current = { down: down as (e: unknown) => void, move: move as (e: unknown) => void, up }
        return
      }

      if (tool === "rect") {
        const down = (e: { scenePoint: { x: number; y: number } }) => {
          isDownRef.current = true
          startPointRef.current = { x: e.scenePoint.x, y: e.scenePoint.y }
          const obj = new Rect({
            left: e.scenePoint.x, top: e.scenePoint.y, width: 0, height: 0,
            stroke: strokeColor, strokeWidth,
            fill: fillColor === "transparent" ? "transparent" : fillColor,
            selectable: false, evented: false,
          })
          c.add(obj)
          activeShapeRef.current = obj as unknown as ReturnType<FabricCanvas["getActiveObject"]>
        }
        const move = (e: { scenePoint: { x: number; y: number } }) => {
          if (!isDownRef.current || !activeShapeRef.current) return
          const { x: sx, y: sy } = startPointRef.current
          const { x, y } = e.scenePoint
          ;(activeShapeRef.current as unknown as { set: (p: object) => void }).set({
            left: Math.min(x, sx), top: Math.min(y, sy),
            width: Math.abs(x - sx), height: Math.abs(y - sy),
          })
          c.renderAll()
        }
        const up = () => {
          isDownRef.current = false
          if (activeShapeRef.current) {
            ;(activeShapeRef.current as unknown as { set: (p: object) => void }).set({ selectable: true, evented: true })
            c.renderAll()
          }
          activeShapeRef.current = null
        }
        c.on("mouse:down", down as never)
        c.on("mouse:move", move as never)
        c.on("mouse:up", up as never)
        handlersRef.current = { down: down as (e: unknown) => void, move: move as (e: unknown) => void, up }
        return
      }

      if (tool === "ellipse") {
        const down = (e: { scenePoint: { x: number; y: number } }) => {
          isDownRef.current = true
          startPointRef.current = { x: e.scenePoint.x, y: e.scenePoint.y }
          const obj = new Ellipse({
            left: e.scenePoint.x, top: e.scenePoint.y, rx: 0, ry: 0,
            stroke: strokeColor, strokeWidth,
            fill: fillColor === "transparent" ? "transparent" : fillColor,
            selectable: false, evented: false,
          })
          c.add(obj)
          activeShapeRef.current = obj as unknown as ReturnType<FabricCanvas["getActiveObject"]>
        }
        const move = (e: { scenePoint: { x: number; y: number } }) => {
          if (!isDownRef.current || !activeShapeRef.current) return
          const { x: sx, y: sy } = startPointRef.current
          const { x, y } = e.scenePoint
          ;(activeShapeRef.current as unknown as { set: (p: object) => void }).set({
            left: Math.min(x, sx), top: Math.min(y, sy),
            rx: Math.abs(x - sx) / 2, ry: Math.abs(y - sy) / 2,
          })
          c.renderAll()
        }
        const up = () => {
          isDownRef.current = false
          if (activeShapeRef.current) {
            ;(activeShapeRef.current as unknown as { set: (p: object) => void }).set({ selectable: true, evented: true })
            c.renderAll()
          }
          activeShapeRef.current = null
        }
        c.on("mouse:down", down as never)
        c.on("mouse:move", move as never)
        c.on("mouse:up", up as never)
        handlersRef.current = { down: down as (e: unknown) => void, move: move as (e: unknown) => void, up }
      }
    })
  }, [tool, strokeColor, strokeWidth, fillColor])

  function handleUndo() {
    const canvas = fabricRef.current
    if (!canvas || historyPosRef.current <= 0) return
    isRestoringRef.current = true
    historyPosRef.current -= 1
    canvas.loadFromJSON(JSON.parse(historyRef.current[historyPosRef.current])).then(() => {
      canvas.renderAll()
      isRestoringRef.current = false
      setCanUndo(historyPosRef.current > 0)
      setCanRedo(true)
      emitSvg()
    })
  }

  function handleRedo() {
    const canvas = fabricRef.current
    const hist = historyRef.current
    if (!canvas || historyPosRef.current >= hist.length - 1) return
    isRestoringRef.current = true
    historyPosRef.current += 1
    canvas.loadFromJSON(JSON.parse(hist[historyPosRef.current])).then(() => {
      canvas.renderAll()
      isRestoringRef.current = false
      setCanUndo(true)
      setCanRedo(historyPosRef.current < hist.length - 1)
      emitSvg()
    })
  }

  function handleClear() {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.clear()
    canvas.backgroundColor = "#ffffff"
    canvas.renderAll()
    pushHistory()
  }

  async function handleDuplicate() {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObjects()
    if (!active.length) return
    canvas.discardActiveObject()
    const clones: ReturnType<FabricCanvas["getActiveObject"]>[] = []
    for (const obj of active) {
      const cloned = await (obj as unknown as { clone: () => Promise<ReturnType<FabricCanvas["getActiveObject"]>> }).clone()
      ;(cloned as unknown as { left: number; top: number }).left += 20
      ;(cloned as unknown as { left: number; top: number }).top += 20
      canvas.add(cloned as Parameters<FabricCanvas["add"]>[0])
      clones.push(cloned)
    }
    if (clones.length === 1) {
      canvas.setActiveObject(clones[0] as Parameters<FabricCanvas["setActiveObject"]>[0])
    } else {
      const { ActiveSelection } = await getFabric()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sel = new (ActiveSelection as any)(clones, { canvas })
      canvas.setActiveObject(sel as Parameters<FabricCanvas["setActiveObject"]>[0])
    }
    canvas.renderAll()
  }

  function handleBringToFront() {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.getActiveObjects().forEach((obj) => canvas.bringObjectToFront(obj))
    canvas.renderAll()
  }

  function handleSendToBack() {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.getActiveObjects().forEach((obj) => canvas.sendObjectToBack(obj))
    canvas.renderAll()
  }

  function handleSetOpacity(opacity: number) {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.getActiveObjects().forEach((obj) => obj.set({ opacity }))
    canvas.renderAll()
  }

  async function handleImageFile(file: File) {
    const canvas = fabricRef.current
    if (!canvas) return
    const { FabricImage } = await getFabric()
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target!.result as string)
      reader.readAsDataURL(file)
    })
    const img = await FabricImage.fromURL(dataUrl)
    const maxW = (canvas.width ?? 800) * 0.5
    if ((img.width ?? 0) > maxW) {
      img.scale(maxW / (img.width ?? maxW))
    }
    canvas.add(img as Parameters<FabricCanvas["add"]>[0])
    canvas.viewportCenterObject(img as Parameters<FabricCanvas["viewportCenterObject"]>[0])
    canvas.setActiveObject(img as Parameters<FabricCanvas["setActiveObject"]>[0])
    canvas.renderAll()
    pushHistory()
  }

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+D duplicate, Delete
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault(); handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault(); void handleDuplicate()
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = fabricRef.current
        if (!canvas) return
        canvas.getActiveObjects().forEach((o) => canvas.remove(o))
        canvas.discardActiveObject()
        canvas.renderAll()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const TOOLS: { id: Tool; icon: React.ElementType; label: string }[] = [
    { id: "select",  icon: MousePointer2, label: "Seleccionar" },
    { id: "pencil",  icon: Pencil,        label: "Lápiz libre" },
    { id: "line",    icon: Minus,         label: "Línea" },
    { id: "rect",    icon: Square,        label: "Rectángulo" },
    { id: "ellipse", icon: Circle,        label: "Elipse" },
    { id: "text",    icon: Type,          label: "Texto" },
    { id: "eraser",  icon: Eraser,        label: "Borrador" },
    { id: "hand",    icon: Hand,          label: "Mover vista (pan)" },
  ]

  return (
    <div className={`flex flex-col gap-2 ${fillHeight ? "h-full" : ""}`}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 bg-zinc-800/60 rounded-xl border border-zinc-700/50 shrink-0">
        {/* Drawing tools */}
        <div className="flex items-center gap-0.5">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => setTool(id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                tool === id
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden lg:block text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-0.5" />

        {/* Colors */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 cursor-pointer" title="Color del trazo">
            <span className="text-xs text-zinc-500">Trazo</span>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-600 bg-zinc-800 p-0.5"
            />
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer" title="Color del relleno">
            <span className="text-xs text-zinc-500">Relleno</span>
            <div className="relative w-8 h-8 rounded-lg border border-zinc-600 overflow-hidden cursor-pointer shrink-0">
              <input
                type="color"
                value={fillColor === "transparent" ? "#ffffff" : fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div className="w-full h-full" style={{ backgroundColor: fillColor === "transparent" ? "white" : fillColor }} />
              {fillColor === "transparent" && (
                <div className="absolute inset-0" style={{
                  background: "linear-gradient(135deg, transparent 43%, #ef4444 43%, #ef4444 57%, transparent 57%)",
                }} />
              )}
            </div>
          </label>

          <button
            type="button"
            onClick={() => setFillColor("transparent")}
            title="Sin relleno"
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
              fillColor === "transparent"
                ? "border-indigo-500/50 text-indigo-400 bg-indigo-500/10"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            sin relleno
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-0.5" />

        {/* Stroke width */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Grosor</span>
          <input
            type="range" min={1} max={20} value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <span className="text-xs text-zinc-400 w-4 tabular-nums">{strokeWidth}</span>
        </div>

        <div className="flex-1 min-w-0" />

        {/* History */}
        <div className="flex items-center gap-0.5">
          <button type="button" title="Deshacer (Ctrl+Z)" onClick={handleUndo} disabled={!canUndo}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <Undo2 className="size-4" />
          </button>
          <button type="button" title="Rehacer (Ctrl+Y)" onClick={handleRedo} disabled={!canRedo}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <Redo2 className="size-4" />
          </button>
          <button type="button" title="Limpiar todo" onClick={handleClear}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-0.5" />

        {/* Image + Object actions */}
        <div className="flex items-center gap-0.5">
          <label
            title="Subir imagen"
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <ImagePlus className="size-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) { void handleImageFile(file); e.target.value = "" }
              }}
            />
          </label>
          <button
            type="button"
            title="Duplicar (Ctrl+D)"
            onClick={() => void handleDuplicate()}
            disabled={!hasSelection}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <Copy className="size-4" />
          </button>
          <button
            type="button"
            title="Traer al frente"
            onClick={handleBringToFront}
            disabled={!hasSelection}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <ArrowUpToLine className="size-4" />
          </button>
          <button
            type="button"
            title="Enviar atrás"
            onClick={handleSendToBack}
            disabled={!hasSelection}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <ArrowDownToLine className="size-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-0.5" />

        {/* Opacity presets */}
        <div className="flex items-center gap-0.5">
          {[100, 75, 50, 25].map((v) => (
            <button
              key={v}
              type="button"
              title={`Opacidad ${v}%`}
              onClick={() => handleSetOpacity(v / 100)}
              disabled={!hasSelection}
              className="text-[10px] px-1.5 py-1 rounded-lg text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors tabular-nums"
            >
              {v}%
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-0.5" />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <button type="button" title="Acercar" onClick={() => handleZoom("in")}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
          >
            <ZoomIn className="size-4" />
          </button>
          <button type="button" title="Alejar" onClick={() => handleZoom("out")}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
          >
            <ZoomOut className="size-4" />
          </button>
          <button type="button" title="Restablecer zoom" onClick={() => handleZoom("reset")}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className={`w-full rounded-xl overflow-hidden border border-zinc-700/40 bg-white ${fillHeight ? "flex-1 min-h-0" : ""}`}
        style={!fillHeight ? { height: 360 } : undefined}
      >
        <canvas ref={canvasEl} className="block" />
      </div>

      {!fillHeight && (
        <p className="text-[11px] text-zinc-600 shrink-0">
          Dibuja la silueta del sillín. Lápiz libre para formas orgánicas · Ctrl+Z para deshacer
        </p>
      )}
    </div>
  )
}
