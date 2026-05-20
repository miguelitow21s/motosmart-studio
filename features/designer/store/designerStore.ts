"use client"

import { create } from "zustand"

export type DesignerTool = "select" | "draw" | "line" | "rect" | "ellipse" | "text" | "eraser"

interface DesignerState {
  tool: DesignerTool
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  isSaving: boolean

  setTool: (tool: DesignerTool) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (w: number) => void
  setFontSize: (s: number) => void
  setCanUndo: (v: boolean) => void
  setCanRedo: (v: boolean) => void
  setDirty: (v: boolean) => void
  setSaving: (v: boolean) => void
}

export const useDesignerStore = create<DesignerState>((set) => ({
  tool: "select",
  strokeColor: "#6366f1",
  fillColor: "transparent",
  strokeWidth: 3,
  fontSize: 24,
  canUndo: false,
  canRedo: false,
  isDirty: false,
  isSaving: false,

  setTool: (tool) => set({ tool }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setFontSize: (fontSize) => set({ fontSize }),
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
}))
