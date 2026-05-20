import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Palette } from "lucide-react"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/PageHeader"
import { OrderDetail } from "@/features/orders/components/OrderDetail"
import { OrderActions } from "@/features/orders/components/OrderActions"
import { OrderFiles } from "@/features/orders/components/OrderFiles"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants/routes"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(`*, client:clients(*), motorcycle:motorcycles(*)`)
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error || !order) notFound()

  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <PageHeader
        title={`Pedido #${order.serial}`}
        description={order.client?.name ?? "Sin cliente"}
      >
        <div className="flex items-center gap-2">
          <OrderActions order={order as never} />
          <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5" asChild>
            <Link href={ROUTES.orders.designer(id)}>
              <Palette className="w-3.5 h-3.5" />
              Diseñar
            </Link>
          </Button>
          <Link
            href={ROUTES.orders.list}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </Link>
        </div>
      </PageHeader>
      <div className="space-y-4">
        <OrderDetail order={order as never} history={history ?? []} />
        <OrderFiles orderId={id} />
      </div>
    </div>
  )
}
