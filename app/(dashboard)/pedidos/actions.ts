"use server"

import { createAdminClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"

type StatusHistoryInsert = Database["public"]["Tables"]["order_status_history"]["Insert"]

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  createdBy: string,
  notes?: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("orders")
      .update({ status } as Database["public"]["Tables"]["orders"]["Update"])
      .eq("id", orderId)

    if (error) return { error: error.message }

    // History is recorded automatically by the on_order_status_changed DB trigger.
    // Only insert a manual note entry if extra notes were provided.
    if (notes) {
      const historyEntry: StatusHistoryInsert = {
        order_id: orderId,
        status,
        created_by: createdBy,
        notes,
      }
      await supabase.from("order_status_history").insert(historyEntry)
    }

    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}
