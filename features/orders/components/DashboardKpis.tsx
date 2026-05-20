"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList, Truck, DollarSign, AlertTriangle, TrendingUp } from "lucide-react"
import { getDashboardStats } from "../services/ordersService"
import { formatCurrency } from "@/lib/utils/formatters"
import type { KpiData } from "@/types"

const KPI_CONFIG = [
  {
    key: "activeOrders" as keyof KpiData,
    title: "Pedidos activos",
    icon: ClipboardList,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    format: (v: number) => v.toString(),
    description: "En proceso",
  },
  {
    key: "deliveriesToday" as keyof KpiData,
    title: "Entregas hoy",
    icon: Truck,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    format: (v: number) => v.toString(),
    description: "Programadas",
  },
  {
    key: "weeklyRevenue" as keyof KpiData,
    title: "Ingresos semana",
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    format: (v: number) => formatCurrency(v),
    description: "Esta semana",
  },
  {
    key: "overdueOrders" as keyof KpiData,
    title: "Atrasos",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    format: (v: number) => v.toString(),
    description: "Fuera de fecha",
  },
  {
    key: "weeklyProduction" as keyof KpiData,
    title: "Producción semanal",
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    format: (v: number) => v.toString(),
    description: "Terminados",
  },
]

export function DashboardKpis() {
  const [stats, setStats] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => toast.error("Error al cargar estadísticas del dashboard"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {KPI_CONFIG.map((kpi, i) => {
        const Icon = kpi.icon
        const value = stats?.[kpi.key] ?? 0

        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Card className="bg-[#111113] border-zinc-800/60 hover:border-zinc-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-zinc-500">
                  {kpi.title}
                </CardTitle>
                <div className={`p-1.5 rounded-md ${kpi.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <Skeleton className="h-8 w-16 bg-zinc-800" />
                ) : (
                  <div className={`text-2xl font-bold ${kpi.key === "overdueOrders" && value > 0 ? "text-red-400" : "text-zinc-100"}`}>
                    {kpi.format(value)}
                  </div>
                )}
                <p className="text-xs text-zinc-600 mt-0.5">{kpi.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
