"use client"

import { useEffect, useState } from "react"
import { Loader2, LayoutTemplate, Bike } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type TemplateRow = Database["public"]["Tables"]["seat_templates"]["Row"] & {
  motorcycle: Pick<Database["public"]["Tables"]["motorcycles"]["Row"], "brand" | "model" | "displacement"> | null
}

interface Props {
  onClose: () => void
  onSelect: (svgContent: string, mode: "replace" | "add") => void
}

export function TemplatePicker({ onClose, onSelect }: Props) {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TemplateRow | null>(null)

  useEffect(() => {
    createClient()
      .from("seat_templates")
      .select("*, motorcycle:motorcycles(brand, model, displacement)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTemplates((data as TemplateRow[]) ?? [])
        setLoading(false)
      })
  }, [])

  // Group by motorcycle
  const grouped = templates.reduce<Record<string, TemplateRow[]>>((acc, t) => {
    const key = t.motorcycle
      ? `${t.motorcycle.brand} ${t.motorcycle.model}`
      : "Sin moto"
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl w-[95vw] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-zinc-800 shrink-0">
          <DialogTitle className="text-base">Cargar plantilla</DialogTitle>
          <p className="text-sm text-zinc-500 mt-0.5">
            Selecciona una silueta base para el diseño del sillín.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 text-zinc-500 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="p-4 rounded-2xl bg-zinc-800">
                <LayoutTemplate className="size-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium">Sin plantillas disponibles</p>
              <p className="text-sm text-zinc-600">
                Crea plantillas en la sección Plantillas primero.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([motoKey, items]) => (
                <section key={motoKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <Bike className="size-3.5 text-zinc-600" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{motoKey}</span>
                    <span className="text-xs text-zinc-700">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelected(selected?.id === t.id ? null : t)}
                        className={`
                          text-left rounded-xl border overflow-hidden transition-all
                          ${selected?.id === t.id
                            ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/5"
                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/60"
                          }
                        `}
                      >
                        <div className="h-24 bg-white flex items-center justify-center p-3 overflow-hidden">
                          {t.svg_content ? (
                            <div
                              className="max-h-full max-w-full [&_svg]:max-h-20 [&_svg]:max-w-full"
                              dangerouslySetInnerHTML={{ __html: t.svg_content }}
                            />
                          ) : (
                            <LayoutTemplate className="size-8 text-zinc-300" />
                          )}
                        </div>
                        <div className="px-2.5 py-2">
                          <p className="text-xs font-medium text-zinc-300 truncate">{t.name}</p>
                          {t.motorcycle && (
                            <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                              {t.motorcycle.brand} {t.motorcycle.model}
                              {t.motorcycle.displacement ? ` · ${t.motorcycle.displacement}` : ""}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              disabled={!selected}
              onClick={() => selected && onSelect(selected.svg_content ?? "", "add")}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            >
              Agregar al diseño
            </Button>
            <Button
              disabled={!selected}
              onClick={() => selected && onSelect(selected.svg_content ?? "", "replace")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40"
            >
              Usar como base
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
