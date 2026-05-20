import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { OrdersTable } from "@/features/orders/components/OrdersTable"
import { ROUTES } from "@/lib/constants/routes"

export default function PedidosPage() {
  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Gestiona todos los pedidos del taller"
      >
        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5" asChild>
          <Link href={ROUTES.orders.new}>
            <Plus className="w-3.5 h-3.5" />
            Nuevo pedido
          </Link>
        </Button>
      </PageHeader>
      <OrdersTable />
    </div>
  )
}
