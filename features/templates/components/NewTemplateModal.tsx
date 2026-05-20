"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload, Paintbrush, FileImage, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { createTemplate } from "../services/templatesService"
import { FullScreenTemplateEditor } from "./FullScreenTemplateEditor"
import type { Database } from "@/types/database.types"

type MotoRow = Database["public"]["Tables"]["motorcycles"]["Row"]

const schema = z.object({
  motorcycle_id: z.string().min(1, "Selecciona un modelo"),
  name: z.string().min(2, "Mínimo 2 caracteres"),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function NewTemplateModal({ onClose, onSaved }: Props) {
  const [motorcycles, setMotorcycles] = useState<MotoRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [svgContent, setSvgContent] = useState("")
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
  })

  const watchedMotorcycleId = watch("motorcycle_id")
  const watchedName = watch("name")

  useEffect(() => {
    createClient()
      .from("motorcycles")
      .select("*")
      .eq("is_active", true)
      .order("brand")
      .then(({ data }) => setMotorcycles(data ?? []))
  }, [])

  function loadSvgFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
      toast.error("Solo se aceptan archivos .svg")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setSvgContent(text)
      setUploadPreview(text)
      setShowPasteArea(false)
    }
    reader.readAsText(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadSvgFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadSvgFile(file)
  }

  async function onSubmit(data: FormData) {
    if (!svgContent.trim()) {
      toast.error("Sube o pega un archivo SVG")
      return
    }
    setIsSubmitting(true)
    try {
      await createTemplate({
        motorcycle_id: data.motorcycle_id,
        name: data.name,
        svg_content: svgContent,
        is_active: true,
      })
      toast.success("Plantilla creada")
      onSaved()
    } catch {
      toast.error("Error al crear plantilla")
      setIsSubmitting(false)
    }
  }

  // Switch to full-screen drawing mode
  if (isDrawingMode) {
    return (
      <FullScreenTemplateEditor
        onBack={() => setIsDrawingMode(false)}
        onSaved={onSaved}
        initialName={watchedName ?? ""}
        initialMotorcycleId={watchedMotorcycleId ?? ""}
      />
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 p-0 max-w-2xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-zinc-800 shrink-0">
          <DialogTitle className="text-base">Nueva plantilla</DialogTitle>
          <p className="text-sm text-zinc-500 mt-0.5">
            Sube un SVG o dibújalo en pantalla completa.
          </p>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Modelo de moto</Label>
              <Select onValueChange={(v) => setValue("motorcycle_id", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm">
                  <SelectValue placeholder="Seleccionar modelo..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 max-h-64">
                  {motorcycles.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-zinc-100 text-sm focus:bg-zinc-800">
                      {m.brand} {m.model}{m.displacement ? ` (${m.displacement})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.motorcycle_id && <p className="text-xs text-red-400">{errors.motorcycle_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Nombre de la plantilla</Label>
              <Input
                {...register("name")}
                placeholder="Ej: DT 175 — Estándar"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
          </div>

          {/* SVG source options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Upload option */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Subir archivo SVG</p>

              {!uploadPreview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    flex flex-col items-center justify-center gap-2 h-36 rounded-xl
                    border-2 border-dashed cursor-pointer transition-colors
                    ${isDragging
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/40"
                    }
                  `}
                >
                  <div className={`p-2.5 rounded-xl ${isDragging ? "bg-indigo-500/20" : "bg-zinc-800"}`}>
                    <Upload className={`size-5 ${isDragging ? "text-indigo-400" : "text-zinc-500"}`} />
                  </div>
                  <p className="text-sm text-zinc-400 text-center px-4">
                    {isDragging ? "Suelta aquí" : "Arrastra tu SVG o haz clic"}
                  </p>
                  <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" onChange={handleFileInput} className="hidden" />
                </div>
              ) : (
                <div className="relative rounded-xl border border-zinc-700/60 bg-zinc-950 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <FileImage className="size-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400">SVG cargado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSvgContent(""); setUploadPreview(null) }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div
                    className="flex items-center justify-center p-4 min-h-28 max-h-40 overflow-hidden
                               [&_svg]:max-w-full [&_svg]:max-h-32 text-zinc-300"
                    dangerouslySetInnerHTML={{ __html: uploadPreview }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPasteArea((p) => !p)}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
              >
                {showPasteArea ? "Ocultar" : "O pega el código SVG"}
              </button>

              {showPasteArea && (
                <Textarea
                  value={svgContent}
                  onChange={(e) => {
                    setSvgContent(e.target.value)
                    setUploadPreview(e.target.value.trim() ? e.target.value : null)
                  }}
                  rows={4}
                  placeholder="<svg xmlns=...>...</svg>"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs"
                />
              )}
            </div>

            {/* Draw option */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Dibujar</p>
              <button
                type="button"
                onClick={() => setIsDrawingMode(true)}
                className="
                  flex flex-col items-center justify-center gap-3 w-full h-36 rounded-xl
                  border-2 border-dashed border-zinc-700 hover:border-indigo-500/50
                  hover:bg-indigo-500/5 transition-colors group
                "
              >
                <div className="p-2.5 rounded-xl bg-zinc-800 group-hover:bg-indigo-500/20 transition-colors">
                  <Paintbrush className="size-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                    Abrir editor
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Lápiz, figuras, colores — pantalla completa
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-zinc-600 hidden sm:block">
            {svgContent ? "✓ SVG listo para guardar" : "Sube un SVG o usa el editor"}
          </p>
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-indigo-500 hover:bg-indigo-600 text-white h-9"
            >
              {isSubmitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Guardar plantilla
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
