import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type TemplateRow = Database["public"]["Tables"]["seat_templates"]["Row"]
type TemplateInsert = Database["public"]["Tables"]["seat_templates"]["Insert"]
type MotorcycleRow = Database["public"]["Tables"]["motorcycles"]["Row"]

export interface TemplateWithMoto extends TemplateRow {
  motorcycle: Pick<MotorcycleRow, "id" | "brand" | "model" | "displacement"> | null
}

export async function getTemplates(): Promise<TemplateWithMoto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("seat_templates")
    .select(`*, motorcycle:motorcycles(id, brand, model, displacement)`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as TemplateWithMoto[]
}

export async function createTemplate(payload: TemplateInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("seat_templates")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleTemplate(id: string, isActive: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from("seat_templates")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) throw error
}

export async function deleteTemplate(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("seat_templates")
    .update({ is_active: false })
    .eq("id", id)
  if (error) throw error
}
