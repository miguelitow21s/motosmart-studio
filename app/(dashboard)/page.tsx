import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DashboardKpis } from "@/features/orders/components/DashboardKpis"
import { RecentOrders } from "@/features/orders/components/RecentOrders"
import { ProductionChart } from "@/features/orders/components/ProductionChart"
import { ROUTES } from "@/lib/constants/routes"

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del taller">
        <Button
          size="sm"
          className="bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5"
          asChild
        >
          <Link href={ROUTES.orders.new}>
            <Plus className="w-3.5 h-3.5" />
            Nuevo pedido
          </Link>
        </Button>
      </PageHeader>

      <DashboardKpis />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#111113] border border-zinc-800/60 rounded-xl p-4">
          <p className="text-sm font-medium text-zinc-400 mb-3">
            Producción semanal
          </p>
          <ProductionChart />
        </div>
        <RecentOrders />
      </div>
    </div>
  )
}
