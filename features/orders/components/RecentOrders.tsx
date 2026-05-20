"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getOrders } from "../services/ordersService"
import { formatDate } from "@/lib/utils/formatters"
import { ROUTES } from "@/lib/constants/routes"
import type { Order } from "@/types"

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders({ pageSize: 6 })
      .then(({ data }) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="bg-[#111113] border-zinc-800/60">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Pedidos recientes
        </CardTitle>
        <Link
          href={ROUTES.orders.list}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-zinc-800/60" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
            Sin pedidos aún
          </div>
        ) : (
          <div className="space-y-1">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={ROUTES.orders.detail(order.id)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors group"
              >
                <span className="text-xs font-mono text-zinc-400 w-10 shrink-0">
                  #{order.serial}
                </span>
                <span className="text-sm text-zinc-200 flex-1 truncate">
                  {order.client?.name ?? "—"}
                </span>
                <StatusBadge status={order.status} size="sm" />
                {order.delivery_date && (
                  <span className="text-xs text-zinc-600 shrink-0 hidden sm:block">
                    {formatDate(order.delivery_date)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
