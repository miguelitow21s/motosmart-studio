import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { DesignerEditor } from "@/features/designer/components/DesignerEditor"
import { ROUTES } from "@/lib/constants/routes"

interface Props {
  params: Promise<{ id: string }>
}

export default async function DesignerPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, serial, created_by, client:clients(name)")
    .eq("id", id)
    .single()

  if (error || !order) notFound()

  const { data: design } = await supabase
    .from("order_designs")
    .select("id, fabric_json")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const client = order.client as { name: string } | null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <Link
          href={ROUTES.orders.detail(id)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Pedido #{order.serial}
        </Link>
        <span className="text-zinc-700 text-sm">·</span>
        <span className="text-sm text-zinc-500">{client?.name}</span>
        <span className="text-xs text-zinc-700 ml-auto">Diseñador visual</span>
      </div>

      <div className="flex-1 min-h-0">
        <DesignerEditor
          orderId={id}
          createdBy={order.created_by}
          existingDesign={design as { id: string; fabric_json: object } | null}
        />
      </div>
    </div>
  )
}
