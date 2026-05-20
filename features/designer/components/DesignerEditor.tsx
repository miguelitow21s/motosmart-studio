"use client"

import { useRef, useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import type { Canvas as FabricCanvas, FabricObject } from "fabric"
import { DesignerToolbar } from "./DesignerToolbar"
import { useDesignerStore } from "../store/designerStore"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

// SSR:false — Fabric.js necesita window/document
const DesignerCanvas = dynamic(
  () => import("./DesignerCanvas").then((m) => ({ default: m.DesignerCanvas })),
  { ssr: false, loading: () => <CanvasPlaceholder /> }
)

function CanvasPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-700 text-sm">
      Cargando canvas...
    </div>
  )
}

type DesignInsert = Database["public"]["Tables"]["order_designs"]["Insert"]

interface Props {
  orderId: string
  createdBy: string
  existingDesign?: { id: string; fabric_json: object } | null
}

export function DesignerEditor({ orderId, createdBy, existingDesign }: Props) {
  const canvasRef = useRef<FabricCanvas | null>(null)
  const { setSaving, setDirty } = useDesignerStore()
  const [designId, setDesignId] = useState(existingDesign?.id ?? null)

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    canvasRef.current = canvas
  }, [])

  const handleDeleteSelected = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const active = canvas.getActiveObjects()
    if (!active.length) return
    active.forEach((obj: FabricObject) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [])

  const handleExportPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2 })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `diseno-${orderId}.png`
    a.click()
  }, [orderId])

  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)
    try {
      const supabase = createClient()
      const fabricJson = canvas.toJSON()
      const previewDataUrl = canvas.toDataURL({ format: "png", multiplier: 1 })

      // Upload preview image to Storage
      const blob = await fetch(previewDataUrl).then((r) => r.blob())
      const path = `orders/${orderId}/preview_${Date.now()}.png`
      const { data: uploadData } = await supabase.storage
        .from("designs")
        .upload(path, blob, { contentType: "image/png", upsert: true })

      const previewUrl = uploadData?.path
        ? supabase.storage.from("designs").getPublicUrl(uploadData.path).data.publicUrl
        : null

      if (designId) {
        // Update existing
        await supabase
          .from("order_designs")
          .update({ fabric_json: fabricJson as never, preview_url: previewUrl } as never)
          .eq("id", designId)
      } else {
        // Create new
        const payload: DesignInsert = {
          order_id: orderId,
          fabric_json: fabricJson as never,
          preview_url: previewUrl,
          created_by: createdBy,
        }
        const { data } = await supabase
          .from("order_designs")
          .insert(payload)
          .select("id")
          .single()
        if (data) setDesignId(data.id)
      }

      setDirty(false)
      toast.success("Diseño guardado")
    } catch {
      toast.error("Error al guardar el diseño")
    } finally {
      setSaving(false)
    }
  }, [orderId, createdBy, designId, setSaving, setDirty])

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-[#0a0a0b] rounded-xl border border-zinc-800/60 overflow-hidden">
      <DesignerToolbar
        onSave={handleSave}
        onExportPng={handleExportPng}
        onDeleteSelected={handleDeleteSelected}
      />
      <div className="flex-1 relative">
        <DesignerCanvas
          initialJson={existingDesign?.fabric_json ?? null}
          onCanvasReady={handleCanvasReady}
        />
      </div>
    </div>
  )
}
