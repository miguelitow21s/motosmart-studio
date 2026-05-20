"use client"

import { useEffect, useState } from "react"
import { Plus, LayoutTemplate, Power, Trash2, Bike } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getTemplates,
  toggleTemplate,
  deleteTemplate,
  type TemplateWithMoto,
} from "../services/templatesService"
import { NewTemplateModal } from "./NewTemplateModal"

type GroupedTemplates = Record<string, TemplateWithMoto[]>

function groupByMoto(templates: TemplateWithMoto[]): GroupedTemplates {
  return templates.reduce<GroupedTemplates>((acc, t) => {
    const key = t.motorcycle
      ? `${t.motorcycle.brand} ${t.motorcycle.model}`
      : "Sin moto asignada"
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})
}

export function TemplatesGrid() {
  const [templates, setTemplates] = useState<TemplateWithMoto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch {
      toast.error("Error cargando plantillas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggle(t: TemplateWithMoto) {
    setTogglingId(t.id)
    try {
      await toggleTemplate(t.id, !t.is_active)
      setTemplates((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x))
      )
    } catch {
      toast.error("Error actualizando plantilla")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTemplate(id)
      setTemplates((prev) => prev.filter((x) => x.id !== id))
      toast.success("Plantilla eliminada")
    } catch {
      toast.error("Error eliminando plantilla")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-zinc-900/60 animate-pulse" />
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 border border-dashed border-zinc-800 rounded-xl">
        <div className="p-4 rounded-2xl bg-indigo-500/10">
          <LayoutTemplate className="size-8 text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="text-zinc-300 font-medium">Sin plantillas</p>
          <p className="text-zinc-500 text-sm mt-1">Crea la primera plantilla SVG para un modelo de moto</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="size-4 mr-1.5" /> Nueva plantilla
        </Button>
        {showModal && (
          <NewTemplateModal
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); load() }}
          />
        )}
      </div>
    )
  }

  const grouped = groupByMoto(templates)

  return (
    <>
      <div className="space-y-8">
        {Object.entries(grouped).map(([motoKey, items]) => (
          <section key={motoKey}>
            <div className="flex items-center gap-2 mb-3">
              <Bike className="size-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-400">{motoKey}</h3>
              <span className="text-xs text-zinc-600">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isToggling={togglingId === t.id}
                  isDeleting={deletingId === t.id}
                  onToggle={() => handleToggle(t)}
                  onDelete={() => handleDelete(t.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {showModal && (
        <NewTemplateModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </>
  )
}

interface CardProps {
  template: TemplateWithMoto
  isToggling: boolean
  isDeleting: boolean
  onToggle: () => void
  onDelete: () => void
}

function TemplateCard({ template: t, isToggling, isDeleting, onToggle, onDelete }: CardProps) {
  return (
    <div className={`
      relative group rounded-xl border bg-zinc-900/60 overflow-hidden
      transition-colors duration-200
      ${t.is_active ? "border-zinc-800 hover:border-zinc-700" : "border-zinc-800/50 opacity-60"}
    `}>
      {/* SVG preview */}
      <div className="h-28 bg-zinc-950/80 flex items-center justify-center p-4 overflow-hidden">
        {t.preview_url ? (
          <img src={t.preview_url} alt={t.name} className="max-h-full max-w-full object-contain" />
        ) : t.svg_content ? (
          <div
            className="max-h-full max-w-full [&_svg]:max-h-20 [&_svg]:max-w-full text-zinc-300"
            dangerouslySetInnerHTML={{ __html: t.svg_content }}
          />
        ) : (
          <LayoutTemplate className="size-10 text-zinc-700" />
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 py-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{t.name}</p>
          {t.motorcycle && (
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              {t.motorcycle.brand} {t.motorcycle.model}
              {t.motorcycle.displacement && ` · ${t.motorcycle.displacement}`}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] ${
            t.is_active
              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              : "border-zinc-700 text-zinc-500"
          }`}
        >
          {t.is_active ? "Activa" : "Inactiva"}
        </Badge>
      </div>

      {/* Actions overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          disabled={isToggling}
          title={t.is_active ? "Desactivar" : "Activar"}
          className="p-1.5 rounded-lg bg-zinc-800/90 backdrop-blur hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <Power className={`size-3.5 ${t.is_active ? "text-emerald-400" : "text-zinc-400"}`} />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Eliminar"
          className="p-1.5 rounded-lg bg-zinc-800/90 backdrop-blur hover:bg-red-900/60 transition-colors disabled:opacity-50"
        >
          <Trash2 className="size-3.5 text-zinc-400 hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}
