"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2, Bike, Layers } from "lucide-react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database.types"

type MotoRow = Database["public"]["Tables"]["motorcycles"]["Row"]
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"]

// ── Schemas ────────────────────────────────────────────────────
const motoSchema = z.object({
  brand: z.string().min(1, "Requerido"),
  model: z.string().min(1, "Requerido"),
  year: z.coerce.number().int().min(1900).max(2099).optional().or(z.literal("")),
  displacement: z.string().optional(),
  notes: z.string().optional(),
})
const materialSchema = z.object({
  name: z.string().min(1, "Requerido"),
  type: z.string().min(1, "Requerido"),
  color_hex: z.string().optional(),
})

type MotoForm = z.infer<typeof motoSchema>
type MaterialForm = z.infer<typeof materialSchema>

type CatTab = "motos" | "materiales"

export function CatalogosPanel() {
  const [tab, setTab] = useState<CatTab>("motos")

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg bg-zinc-800/60 w-fit">
        {(["motos", "materiales"] as CatTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
              tab === t
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {t === "motos" ? <Bike className="size-3.5" /> : <Layers className="size-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === "motos" ? <MotosManager /> : <MaterialesManager />}
    </div>
  )
}

// ── Motos ──────────────────────────────────────────────────────
function MotosManager() {
  const [motos, setMotos] = useState<MotoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MotoRow | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from("motorcycles")
      .select("*")
      .order("brand")
    setMotos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("motorcycles").update({ is_active: false }).eq("id", id)
    setMotos((prev) => prev.filter((m) => m.id !== id))
    toast.success("Moto eliminada")
    setDeletingId(null)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Catálogo de motos</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Modelos disponibles para asignar a pedidos</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-3.5 mr-1" /> Nueva
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-4 animate-spin text-zinc-600" /></div>
      ) : motos.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-6">Sin motos en el catálogo</p>
      ) : (
        <div className="space-y-1.5">
          {motos.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 group transition-colors">
              <Bike className="size-4 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-zinc-200">{m.brand} {m.model}</span>
                {(m.year || m.displacement) && (
                  <span className="text-xs text-zinc-500 ml-2">
                    {m.year}{m.year && m.displacement ? " · " : ""}{m.displacement}
                  </span>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditing(m)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="p-1.5 rounded hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  {deletingId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <MotoModal
          moto={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function MotoModal({ moto, onClose, onSaved }: { moto: MotoRow | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<MotoForm>({
    resolver: zodResolver(motoSchema) as unknown as Resolver<MotoForm>,
    defaultValues: moto ? {
      brand: moto.brand, model: moto.model,
      year: moto.year ?? undefined, displacement: moto.displacement ?? "",
      notes: moto.notes ?? "",
    } : {},
  })

  async function onSubmit(data: MotoForm) {
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        brand: data.brand,
        model: data.model,
        year: data.year ? Number(data.year) : null,
        displacement: data.displacement || null,
        notes: data.notes || null,
        is_active: true,
      }
      if (moto) {
        await supabase.from("motorcycles").update(payload).eq("id", moto.id)
      } else {
        await supabase.from("motorcycles").insert(payload)
      }
      toast.success(moto ? "Moto actualizada" : "Moto creada")
      onSaved()
    } catch {
      toast.error("Error al guardar")
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>{moto ? "Editar moto" : "Nueva moto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs">Marca</Label>
              <Input {...register("brand")} placeholder="Yamaha" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-sm" />
              {errors.brand && <p className="text-[10px] text-red-400">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs">Modelo</Label>
              <Input {...register("model")} placeholder="DT 175" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-sm" />
              {errors.model && <p className="text-[10px] text-red-400">{errors.model.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs">Año</Label>
              <Input {...register("year")} type="number" placeholder="2020" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-xs">Cilindraje</Label>
              <Input {...register("displacement")} placeholder="175cc" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Materiales ────────────────────────────────────────────────
const MATERIAL_TYPES = [
  { value: "vinyl", label: "Vinilo" },
  { value: "leather", label: "Cuero" },
  { value: "neoprene", label: "Neoprene" },
  { value: "fabric", label: "Tela" },
  { value: "other", label: "Otro" },
]

function MaterialesManager() {
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MaterialRow | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from("materials").select("*").order("type").order("name")
    setMaterials(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("materials").update({ is_active: false }).eq("id", id)
    setMaterials((prev) => prev.filter((m) => m.id !== id))
    toast.success("Material eliminado")
    setDeletingId(null)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Catálogo de materiales</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Vinil, cuero, neoprene y otros materiales</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-3.5 mr-1" /> Nuevo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="size-4 animate-spin text-zinc-600" /></div>
      ) : materials.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-6">Sin materiales en el catálogo</p>
      ) : (
        <div className="space-y-1.5">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 group transition-colors">
              {m.color_hex ? (
                <span className="size-4 rounded-full border border-zinc-600 shrink-0" style={{ background: m.color_hex }} />
              ) : (
                <span className="size-4 rounded-full border border-dashed border-zinc-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-zinc-200">{m.name}</span>
                <span className="text-xs text-zinc-500 ml-2">
                  {MATERIAL_TYPES.find((t) => t.value === m.type)?.label ?? m.type}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditing(m)} className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="p-1.5 rounded hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  {deletingId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <MaterialModal
          material={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function MaterialModal({ material, onClose, onSaved }: { material: MaterialRow | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema) as unknown as Resolver<MaterialForm>,
    defaultValues: material ? { name: material.name, type: material.type, color_hex: material.color_hex ?? "" } : { type: "vinyl" },
  })

  async function onSubmit(data: MaterialForm) {
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = { name: data.name, type: data.type, color_hex: data.color_hex || null, is_active: true }
      if (material) {
        await supabase.from("materials").update(payload).eq("id", material.id)
      } else {
        await supabase.from("materials").insert(payload)
      }
      toast.success(material ? "Material actualizado" : "Material creado")
      onSaved()
    } catch {
      toast.error("Error al guardar")
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-xs">
        <DialogHeader>
          <DialogTitle>{material ? "Editar material" : "Nuevo material"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-xs">Nombre</Label>
            <Input {...register("name")} placeholder="Vinilo negro mate" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-sm" />
            {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-xs">Tipo</Label>
            <select {...register("type")} className="w-full h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-2 focus:outline-none focus:border-indigo-500">
              {MATERIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-xs">Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" {...register("color_hex")} defaultValue={material?.color_hex ?? "#6366f1"} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
              <Input {...register("color_hex")} placeholder="#000000" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
