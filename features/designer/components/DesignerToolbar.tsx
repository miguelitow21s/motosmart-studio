"use client"

import {
  MousePointer2, Pencil, Type, Trash2, Undo2, Redo2, Download, Save,
  Loader2, LayoutTemplate, Minus, Square, Circle, Eraser,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useDesignerStore, type DesignerTool } from "../store/designerStore"

interface Props {
  onSave: () => void
  onExportPng: () => void
  onDeleteSelected: () => void
  onOpenTemplatePicker: () => void
}

const TOOLS: { id: DesignerTool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: "select",  icon: MousePointer2, label: "Seleccionar",  shortcut: "S" },
  { id: "draw",    icon: Pencil,        label: "Lápiz libre",  shortcut: "D" },
  { id: "line",    icon: Minus,         label: "Línea",        shortcut: "L" },
  { id: "rect",    icon: Square,        label: "Rectángulo",   shortcut: "R" },
  { id: "ellipse", icon: Circle,        label: "Elipse",       shortcut: "E" },
  { id: "text",    icon: Type,          label: "Texto",        shortcut: "T" },
  { id: "eraser",  icon: Eraser,        label: "Borrador",     shortcut: "X" },
]

const STROKE_WIDTHS = [2, 4, 6, 10]

export function DesignerToolbar({ onSave, onExportPng, onDeleteSelected, onOpenTemplatePicker }: Props) {
  const {
    tool, setTool,
    strokeColor, setStrokeColor,
    fillColor, setFillColor,
    strokeWidth, setStrokeWidth,
    canUndo, canRedo,
    isDirty, isSaving,
  } = useDesignerStore()

  function handleUndo() {
    ;(window as Window & { __designerUndo?: () => void }).__designerUndo?.()
  }
  function handleRedo() {
    ;(window as Window & { __designerRedo?: () => void }).__designerRedo?.()
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#111113] border-b border-zinc-800/60">
        {/* Template loader */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenTemplatePicker}
              className="h-8 px-2.5 text-xs border-zinc-700 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 gap-1.5"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Plantilla</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
            Cargar silueta base
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 bg-zinc-800" />

        {/* Drawing tools */}
        <div className="flex items-center gap-0.5">
          {TOOLS.map((t) => {
            const Icon = t.icon
            return (
              <Tooltip key={t.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setTool(t.id)}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                      tool === t.id
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
                  {t.label} <span className="text-zinc-500 ml-1">{t.shortcut}</span>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        <Separator orientation="vertical" className="h-6 bg-zinc-800" />

        {/* Colors */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="relative cursor-pointer">
                <div
                  className="w-7 h-7 rounded-lg border-2 border-zinc-700 shadow-inner cursor-pointer"
                  style={{ background: strokeColor }}
                />
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
              Color trazo
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <label className="relative cursor-pointer">
                <div
                  className="w-7 h-7 rounded-lg border-2 border-zinc-700 cursor-pointer"
                  style={{
                    background: fillColor === "transparent"
                      ? "repeating-conic-gradient(#3f3f46 0% 25%, transparent 0% 50%) 0 0 / 8px 8px"
                      : fillColor
                  }}
                />
                <input
                  type="color"
                  value={fillColor === "transparent" ? "#ffffff" : fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
              Color relleno
            </TooltipContent>
          </Tooltip>

          <button
            onClick={() => setFillColor("transparent")}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800"
            title="Sin relleno"
          >
            ∅
          </button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-zinc-800" />

        {/* Stroke width */}
        <div className="flex items-center gap-0.5">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                strokeWidth === w
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
              )}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: Math.max(2, w - 1), height: Math.max(2, w - 1) }}
              />
            </button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 bg-zinc-800" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
              Deshacer <span className="text-zinc-500">Ctrl+Z</span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
              Rehacer <span className="text-zinc-500">Ctrl+Y</span>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 bg-zinc-800" />

        {/* Delete selected */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDeleteSelected}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
            Eliminar selección <span className="text-zinc-500">Del</span>
          </TooltipContent>
        </Tooltip>

        {/* Actions — right side */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={onExportPng}
            className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200 gap-1.5"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:block">Exportar PNG</span>
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="h-8 text-xs bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
