"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Phone, Mail, FileText, Calendar, DollarSign,
  ShoppingBag, Eye, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ClientFormModal } from "./ClientFormModal"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils/formatters"
import { ROUTES } from "@/lib/constants/routes"
import { WORK_TYPES } from "@/lib/constants/order-statuses"
import type { Database } from "@/types/database.types"
import type { OrderStatus } from "@/types"

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]
type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  motorcycle: { brand: string; model: string } | null
}

interface Props {
  client: ClientRow
  orders: OrderRow[]
}

export function ClientDetail({ client, orders }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [currentClient, setCurrentClient] = useState(client)

  const totalSpent = orders.reduce((sum, o) => sum + o.total_price, 0)
  const pendingBalance = orders.reduce((sum, o) => sum + o.balance, 0)
  const activeOrders = orders.filter((o) => o.status !== "delivered" && o.status !== "finished")

  const workTypeLabel = (wt: string) =>
    WORK_TYPES.find((t) => t.value === wt)?.label ?? wt

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info del cliente */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400">
                {currentClient.name.charAt(0).toUpperCase()}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEdit(true)}
                className="h-7 text-xs border-zinc-800 text-zinc-500 hover:text-zinc-200 gap-1"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </Button>
            </div>

            <h2 className="text-lg font-semibold text-zinc-100 mb-3">{currentClient.name}</h2>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                {currentClient.phone}
              </div>
              {currentClient.email && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  {currentClient.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Cliente desde {formatDate(currentClient.created_at)}
              </div>
              {currentClient.notes && (
                <div className="flex gap-2 text-xs text-zinc-600 pt-1 border-t border-zinc-800/60">
                  <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{currentClient.notes}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5 space-y-3"
          >
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Resumen
            </h3>
            <StatRow
              icon={ShoppingBag}
              label="Total pedidos"
              value={orders.length.toString()}
            />
            <StatRow
              icon={ShoppingBag}
              label="Pedidos activos"
              value={activeOrders.length.toString()}
              highlight={activeOrders.length > 0}
            />
            <StatRow
              icon={DollarSign}
              label="Total gastado"
              value={formatCurrency(totalSpent)}
            />
            {pendingBalance > 0 && (
              <StatRow
                icon={DollarSign}
                label="Saldo pendiente"
                value={formatCurrency(pendingBalance)}
                warn
              />
            )}
          </motion.div>
        </div>

        {/* Historial de pedidos */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-[#111113] border border-zinc-800/60 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-zinc-800/60">
              <h3 className="text-sm font-medium text-zinc-300">Historial de pedidos</h3>
            </div>

            {orders.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
                Sin pedidos aún
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/40 bg-zinc-900/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-600">Serial</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-600 hidden sm:table-cell">Trabajo</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-600">Estado</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-600 hidden md:table-cell">Total</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-600 hidden lg:table-cell">Fecha</th>
                    <th className="px-4 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-zinc-500">#{order.serial}</span>
                        {order.motorcycle && (
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {order.motorcycle.brand} {order.motorcycle.model}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-zinc-500">{workTypeLabel(order.work_type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status as OrderStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <div>
                          <p className="text-zinc-300 text-sm font-medium">
                            {formatCurrency(order.total_price)}
                          </p>
                          {order.balance > 0 && (
                            <p className="text-amber-500/70 text-xs">
                              Saldo: {formatCurrency(order.balance)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-zinc-600">{formatDate(order.created_at)}</p>
                        <p className="text-xs text-zinc-700" suppressHydrationWarning>{formatRelativeTime(order.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={ROUTES.orders.detail(order.id)}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </div>
      </div>

      {showEdit && (
        <ClientFormModal
          client={{ ...currentClient, orders_count: orders.length, total_spent: totalSpent, last_order_date: null }}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            // Refresh data via router would require useRouter + router.refresh()
            // For now the name update is reflected on next navigation
          }}
        />
      )}
    </>
  )
}

function StatRow({
  icon: Icon,
  label,
  value,
  highlight,
  warn,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {label}
      </div>
      <span className={cn(
        "text-sm font-medium",
        highlight ? "text-indigo-400" : warn ? "text-amber-400" : "text-zinc-300"
      )}>
        {value}
      </span>
    </div>
  )
}
