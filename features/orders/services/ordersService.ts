import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"
import type { Order, KpiData, PaginatedResponse } from "@/types"

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"]
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]
type StatusHistoryInsert = Database["public"]["Tables"]["order_status_history"]["Insert"]

export async function getDashboardStats(): Promise<KpiData> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("get_dashboard_stats")
  if (error) throw error
  return data as unknown as KpiData
}

export interface OrderFilters {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getOrders(
  filters: OrderFilters = {}
): Promise<PaginatedResponse<Order>> {
  const supabase = createClient()
  const { page = 1, pageSize = 20, status, search } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      client:clients(id, name, phone),
      motorcycle:motorcycles(id, brand, model)
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status) query = query.eq("status", status)
  if (search) {
    query = query.or(
      `serial.ilike.%${search}%,clients.name.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data as unknown as Order[]) ?? [],
    count: count ?? 0,
    page,
    pageSize,
  }
}

export async function getOrderById(id: string): Promise<Order> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("orders")
    .select(`*, client:clients(*), motorcycle:motorcycles(*)`)
    .eq("id", id)
    .single()
  if (error) throw error
  return data as unknown as Order
}

export async function createOrder(payload: OrderInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
  createdBy: string,
  notes?: string
) {
  const supabase = createClient()
  const { error } = await supabase
    .from("orders")
    .update({ status } as Database["public"]["Tables"]["orders"]["Update"])
    .eq("id", orderId)
  if (error) throw error

  const historyEntry: StatusHistoryInsert = {
    order_id: orderId,
    status,
    created_by: createdBy,
    notes: notes ?? null,
  }
  await supabase.from("order_status_history").insert(historyEntry)
}

export async function getClients() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, phone")
    .is("deleted_at", null)
    .order("name")
  if (error) throw error
  return data ?? []
}

export async function createClient_(payload: ClientInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export interface DayStats {
  day: string
  date: string
  creados: number
  terminados: number
  ingresos: number
}

export async function getWeeklyChartData(): Promise<DayStats[]> {
  const supabase = createClient()
  const days: DayStats[] = []
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    days.push({
      day: dayNames[d.getDay()],
      date: dateStr,
      creados: 0,
      terminados: 0,
      ingresos: 0,
    })
  }

  const since = days[0].date
  const { data } = await supabase
    .from("orders")
    .select("created_at, status, total_price, updated_at")
    .is("deleted_at", null)
    .gte("created_at", `${since}T00:00:00`)

  for (const order of data ?? []) {
    const createdDay = order.created_at.split("T")[0]
    const entry = days.find((d) => d.date === createdDay)
    if (entry) {
      entry.creados++
      entry.ingresos += order.total_price
    }
    if (order.status === "finished" || order.status === "delivered") {
      const updatedDay = order.updated_at.split("T")[0]
      const finEntry = days.find((d) => d.date === updatedDay)
      if (finEntry) finEntry.terminados++
    }
  }

  return days
}

export async function getMotorcycles() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("motorcycles")
    .select("id, brand, model, displacement")
    .eq("is_active", true)
    .order("brand")
  if (error) throw error
  return data ?? []
}
