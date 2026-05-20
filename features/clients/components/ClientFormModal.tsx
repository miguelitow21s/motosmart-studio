"use client"

import { useEffect } from "react"
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
import { cn } from "@/lib/utils"
import { createClientRecord, updateClient, type ClientWithStats } from "../services/clientsService"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  client: ClientWithStats | null
  onClose: () => void
  onSaved: () => void
}

export function ClientFormModal({ client, onClose, onSaved }: Props) {
  const isEdit = !!client

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      notes: client?.notes ?? "",
    },
  })

  useEffect(() => {
    reset({
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      notes: client?.notes ?? "",
    })
  }, [client, reset])

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        await updateClient(client.id, {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          notes: data.notes || null,
        })
        toast.success("Cliente actualizado")
      } else {
        await createClientRecord({
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          notes: data.notes || null,
        })
        toast.success("Cliente creado")
      }
      onSaved()
    } catch {
      toast.error("Error al guardar el cliente")
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#111113] border-zinc-800 text-zinc-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Nombre *</Label>
            <Input
              placeholder="Juan Pérez"
              {...register("name")}
              className={cn(
                "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9",
                errors.name && "border-red-500/60"
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Teléfono *</Label>
            <Input
              placeholder="3001234567"
              {...register("phone")}
              className={cn(
                "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9",
                errors.phone && "border-red-500/60"
              )}
            />
            {errors.phone && (
              <p className="text-xs text-red-400">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Email</Label>
            <Input
              type="email"
              placeholder="juan@email.com"
              {...register("email")}
              className={cn(
                "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9",
                errors.email && "border-red-500/60"
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Notas</Label>
            <Textarea
              placeholder="Preferencias, referencias del cliente..."
              {...register("notes")}
              rows={3}
              className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none focus-visible:ring-indigo-500/50"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
