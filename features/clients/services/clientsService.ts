import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]

export interface ClientWithStats extends ClientRow {
  orders_count: number
  total_spent: number
  last_order_date: string | null
}

export async function getClients(search?: string): Promise<ClientWithStats[]> {
  const supabase = createClient()

  let query = supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("name")

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  if (!data || data.length === 0) return []

  // Get order stats per client
  const ids = data.map((c) => c.id)
  const { data: orders } = await supabase
    .from("orders")
    .select("client_id, total_price, created_at")
    .in("client_id", ids)
    .is("deleted_at", null)

  const statsMap: Record<string, { count: number; total: number; last: string | null }> = {}
  for (const o of orders ?? []) {
    if (!statsMap[o.client_id]) {
      statsMap[o.client_id] = { count: 0, total: 0, last: null }
    }
    statsMap[o.client_id].count++
    statsMap[o.client_id].total += o.total_price
    if (!statsMap[o.client_id].last || o.created_at > statsMap[o.client_id].last!) {
      statsMap[o.client_id].last = o.created_at
    }
  }

  return data.map((c) => ({
    ...c,
    orders_count: statsMap[c.id]?.count ?? 0,
    total_spent: statsMap[c.id]?.total ?? 0,
    last_order_date: statsMap[c.id]?.last ?? null,
  }))
}

export async function getClientById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function createClientRecord(payload: ClientInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClient(id: string, payload: Partial<ClientInsert>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClient(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function getClientOrders(clientId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("orders")
    .select(`*, motorcycle:motorcycles(brand, model)`)
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}
