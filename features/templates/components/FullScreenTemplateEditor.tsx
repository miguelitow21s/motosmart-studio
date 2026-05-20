"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, Loader2, Check, FileImage } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { createTemplate } from "../services/templatesService"
import type { Database } from "@/types/database.types"

type MotoRow = Database["public"]["Tables"]["motorcycles"]["Row"]

const TemplateDrawingCanvas = dynamic(
  () => import("./TemplateDrawingCanvas").then((m) => ({ default: m.TemplateDrawingCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl">
        <Loader2 className="size-8 text-zinc-400 animate-spin" />
      </div>
    ),
  }
)

interface Props {
  onBack: () => void
  onSaved: () => void
  initialName?: string
  initialMotorcycleId?: string
}

export function FullScreenTemplateEditor({
  onBack,
  onSaved,
  initialName = "",
  initialMotorcycleId = "",
}: Props) {
  const [motorcycles, setMotorcycles] = useState<MotoRow[]>([])
  const [motorcycleId, setMotorcycleId] = useState(initialMotorcycleId)
  const [name, setName] = useState(initialName)
  const [svgContent, setSvgContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{ motorcycle?: string; name?: string; svg?: string }>({})

  useEffect(() => {
    createClient()
      .from("motorcycles")
      .select("*")
      .eq("is_active", true)
      .order("brand")
      .then(({ data }) => setMotorcycles(data ?? []))
  }, [])

  // Prevent body scroll while editor is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  function validate() {
    const e: typeof errors = {}
    if (!motorcycleId) e.motorcycle = "Selecciona un modelo"
    if (!name.trim() || name.trim().length < 2) e.name = "Mínimo 2 caracteres"
    if (!svgContent.trim()) e.svg = "Dibuja algo primero"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setIsSaving(true)
    try {
      await createTemplate({
        motorcycle_id: motorcycleId,
        name: name.trim(),
        svg_content: svgContent,
        is_active: true,
      })
      toast.success("Plantilla creada")
      onSaved()
    } catch {
      toast.error("Error al guardar la plantilla")
      setIsSaving(false)
    }
  }

  const selectedMoto = motorcycles.find((m) => m.id === motorcycleId)

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0b] flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 h-14 px-4 border-b border-zinc-800/80 shrink-0 bg-[#0a0a0b]">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:block">Volver</span>
        </button>

        <div className="w-px h-5 bg-zinc-800" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-zinc-200 truncate">
            {name.trim() || "Nueva plantilla"}
          </span>
          {selectedMoto && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-sm text-zinc-500 truncate hidden sm:block">
                {selectedMoto.brand} {selectedMoto.model}
              </span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* SVG status pill */}
        {svgContent && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <FileImage className="size-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">SVG listo</span>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5 shrink-0"
        >
          {isSaving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          <span className="hidden sm:block">Guardar plantilla</span>
          <span className="sm:hidden">Guardar</span>
        </Button>
      </header>

      {/* ── Form fields bar ── */}
      <div className="flex flex-wrap gap-3 items-end px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/40 shrink-0">
        <div className="flex flex-col gap-1 min-w-[180px] flex-1 sm:flex-none sm:w-64">
          <Label className="text-xs text-zinc-400">Modelo de moto</Label>
          <Select value={motorcycleId} onValueChange={(v) => { setMotorcycleId(v); setErrors((e) => ({ ...e, motorcycle: undefined })) }}>
            <SelectTrigger className={`bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm ${errors.motorcycle ? "border-red-500/50" : ""}`}>
              <SelectValue placeholder="Seleccionar modelo..." />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 max-h-72">
              {motorcycles.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-zinc-100 text-sm focus:bg-zinc-800">
                  {m.brand} {m.model}{m.displacement ? ` (${m.displacement})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.motorcycle && <p className="text-xs text-red-400">{errors.motorcycle}</p>}
        </div>

        <div className="flex flex-col gap-1 min-w-[180px] flex-1">
          <Label className="text-xs text-zinc-400">Nombre de la plantilla</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })) }}
            placeholder="Ej: DT 175 — Estándar"
            className={`bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm ${errors.name ? "border-red-500/50" : ""}`}
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        {errors.svg && (
          <p className="text-xs text-red-400 self-center">{errors.svg}</p>
        )}
      </div>

      {/* ── Canvas area ── */}
      <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
        <TemplateDrawingCanvas
          onSvgChange={(svg) => {
            setSvgContent(svg)
            setErrors((e) => ({ ...e, svg: undefined }))
          }}
          fillHeight
        />
      </div>
    </div>
  )
}
