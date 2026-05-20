import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { PublicOrderView } from "@/features/orders/components/PublicOrderView"

interface Props {
  params: Promise<{ serial: string }>
}

export default async function PublicOrderPage({ params }: Props) {
  const { serial } = await params
  const supabase = await createAdminClient()

  const { data: order } = await supabase
    .from("orders")
    .select(`id, serial, status, work_type, delivery_date, created_at, motorcycle_custom,
      client:clients(name),
      motorcycle:motorcycles(brand, model)
    `)
    .eq("serial", serial)
    .is("deleted_at", null)
    .single()

  if (!order) notFound()

  const { data: history } = await supabase
    .from("order_status_history")
    .select("status, notes, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true })

  return <PublicOrderView order={order as never} history={history ?? []} />
}
