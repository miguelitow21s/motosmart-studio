"use client"

import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
import type { Database } from "@/types/database.types"

type MotoRow = Database["public"]["Tables"]["motorcycles"]["Row"]

const schema = z.object({
  motorcycle_id: z.string().min(1, "Selecciona un modelo"),
  name: z.string().min(2, "Mínimo 2 caracteres"),
  svg_content: z.string().min(10, "SVG requerido"),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function NewTemplateModal({ onClose, onSaved }: Props) {
  const [motorcycles, setMotorcycles] = useState<MotoRow[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("motorcycles")
      .select("*")
      .eq("is_active", true)
      .order("brand")
      .then(({ data }) => setMotorcycles(data ?? []))
  }, [])

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      await createTemplate({
        motorcycle_id: data.motorcycle_id,
        name: data.name,
        svg_content: data.svg_content,
        is_active: true,
      })
      toast.success("Plantilla creada")
      onSaved()
    } catch {
      toast.error("Error al crear plantilla")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva plantilla</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Modelo de moto</Label>
            <Select onValueChange={(v) => setValue("motorcycle_id", v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="Seleccionar modelo..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {motorcycles.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-zinc-100 focus:bg-zinc-800">
                    {m.brand} {m.model}{m.displacement ? ` (${m.displacement})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.motorcycle_id && (
              <p className="text-xs text-red-400">{errors.motorcycle_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300">Nombre de la plantilla</Label>
            <Input
              {...register("name")}
              placeholder="Ej: DT 175 — Estándar"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300">Contenido SVG</Label>
            <Textarea
              {...register("svg_content")}
              rows={6}
              placeholder="<svg xmlns=...>...</svg>"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs"
            />
            {errors.svg_content && (
              <p className="text-xs text-red-400">{errors.svg_content.message}</p>
            )}
            <p className="text-xs text-zinc-600">
              Pega el SVG de la silueta del sillín. Las zonas editables se definen por ID de path.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Crear plantilla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
