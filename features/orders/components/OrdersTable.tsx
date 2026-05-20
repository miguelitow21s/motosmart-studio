"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  Eye, Calendar, Phone, Bike
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getOrders } from "../services/ordersService"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"
import { ROUTES } from "@/lib/constants/routes"
import { ORDER_STATUSES } from "@/lib/constants/order-statuses"
import { WORK_TYPES } from "@/lib/constants/order-statuses"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/types"

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await getOrders({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      setOrders(data)
      setTotal(count)
    } catch {
      toast.error("Error al cargar los pedidos")
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  const workTypeLabel = (wt: string) =>
    WORK_TYPES.find((t) => t.value === wt)?.label ?? wt

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input
            placeholder="Buscar serial o cliente..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9 focus-visible:ring-indigo-500/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44 bg-zinc-900 border-zinc-800 text-zinc-300 h-9">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-zinc-500" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300">Todos los estados</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-zinc-300">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-zinc-600 ml-auto">
          {total} {total === 1 ? "pedido" : "pedidos"}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 bg-zinc-900/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 w-16">Serial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 hidden md:table-cell">Moto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 hidden lg:table-cell">Trabajo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 hidden sm:table-cell">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 hidden xl:table-cell">Entrega</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/40">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full bg-zinc-800/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-zinc-600 text-sm">
                    {search || statusFilter !== "all"
                      ? "Sin resultados para esta búsqueda"
                      : "No hay pedidos aún — crea el primero"}
                  </td>
                </tr>
              ) : (
                orders.map((order, i) => {
                  const isOverdue =
                    order.delivery_date &&
                    new Date(order.delivery_date) < new Date() &&
                    order.status !== "delivered" &&
                    order.status !== "finished"

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "border-b border-zinc-800/40 hover:bg-zinc-900/40 transition-colors group",
                        isOverdue && "bg-red-500/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-zinc-400">
                          #{order.serial}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-zinc-200 font-medium text-sm leading-none">
                            {order.client?.name ?? "—"}
                          </p>
                          {order.client?.phone && (
                            <p className="text-zinc-600 text-xs mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {order.client.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-zinc-400 text-xs flex items-center gap-1.5">
                          <Bike className="w-3 h-3 shrink-0" />
                          {order.motorcycle
                            ? `${order.motorcycle.brand} ${order.motorcycle.model}`
                            : order.motorcycle_custom ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-zinc-500 text-xs">
                          {workTypeLabel(order.work_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <div>
                          <p className="text-zinc-200 text-sm font-medium">
                            {formatCurrency(order.total_price)}
                          </p>
                          {order.balance > 0 && (
                            <p className="text-zinc-600 text-xs">
                              Saldo: {formatCurrency(order.balance)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {order.delivery_date ? (
                          <span
                            className={cn(
                              "text-xs flex items-center gap-1",
                              isOverdue ? "text-red-400" : "text-zinc-500"
                            )}
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatDate(order.delivery_date)}
                          </span>
                        ) : (
                          <span className="text-zinc-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={ROUTES.orders.detail(order.id)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-600">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 w-7 p-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-7 w-7 p-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
