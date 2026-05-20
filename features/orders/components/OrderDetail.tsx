"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Phone, Bike, Wrench, Calendar, DollarSign,
  Clock, ChevronDown, Loader2, FileText, User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { cn } from "@/lib/utils"
import { ORDER_STATUSES, WORK_TYPES } from "@/lib/constants/order-statuses"
import { formatCurrency, formatDate, formatDatetime, formatRelativeTime } from "@/lib/utils/formatters"
import { updateOrderStatusAction } from "@/app/(dashboard)/pedidos/actions"
import { useAuthStore } from "@/stores/authStore"
import type { OrderStatus } from "@/types"
import type { Database } from "@/types/database.types"

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"] | null
  motorcycle: Database["public"]["Tables"]["motorcycles"]["Row"] | null
}
type HistoryRow = Database["public"]["Tables"]["order_status_history"]["Row"]

interface Props {
  order: OrderRow
  history: HistoryRow[]
}

export function OrderDetail({ order, history }: Props) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [currentStatus, setCurrentStatus] = useState(order.status as OrderStatus)
  const [updating, setUpdating] = useState(false)

  const workTypeLabel = WORK_TYPES.find((t) => t.value === order.work_type)?.label ?? order.work_type

  const isOverdue =
    order.delivery_date &&
    new Date(order.delivery_date) < new Date() &&
    currentStatus !== "delivered" &&
    currentStatus !== "finished"

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setUpdating(true)
    try {
      const result = await updateOrderStatusAction(order.id, newStatus, user?.id ?? "")
      if (result.error) throw new Error(result.error)
      setCurrentStatus(newStatus as OrderStatus)
      toast.success("Estado actualizado")
      router.refresh()
    } catch {
      toast.error("Error al actualizar el estado")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main info */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-zinc-500">#{order.serial}</span>
                <StatusBadge status={currentStatus} />
                {isOverdue && (
                  <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                    Atrasado
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {order.client?.name ?? "Sin cliente"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {updating && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={updating}>
                <SelectTrigger className="w-44 bg-zinc-900 border-zinc-800 text-zinc-300 h-9 gap-1">
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-zinc-300">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Details grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5"
        >
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Detalles del pedido
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={User}
              label="Cliente"
              value={order.client?.name ?? "—"}
              sub={order.client?.phone}
            />
            <InfoRow
              icon={Bike}
              label="Motocicleta"
              value={
                order.motorcycle
                  ? `${order.motorcycle.brand} ${order.motorcycle.model}`
                  : order.motorcycle_custom ?? "—"
              }
              sub={order.motorcycle?.displacement ?? undefined}
            />
            <InfoRow
              icon={Wrench}
              label="Tipo de trabajo"
              value={workTypeLabel}
            />
            <InfoRow
              icon={Calendar}
              label="Fecha de entrega"
              value={order.delivery_date ? formatDate(order.delivery_date) : "Sin fecha"}
              valueClass={isOverdue ? "text-red-400" : undefined}
            />
            <InfoRow
              icon={Clock}
              label="Creado"
              value={formatDate(order.created_at)}
              sub={formatRelativeTime(order.created_at)}
            />
            {order.notes && (
              <InfoRow
                icon={FileText}
                label="Notas"
                value={order.notes}
                className="sm:col-span-2"
              />
            )}
          </div>
        </motion.div>

        {/* Notes */}
        {order.notes && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5"
          >
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Notas internas
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{order.notes}</p>
          </motion.div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5"
        >
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Pagos
          </h3>
          <div className="space-y-3">
            <PriceRow label="Total" value={formatCurrency(order.total_price)} />
            <PriceRow label="Abono" value={formatCurrency(order.deposit)} dimmed />
            <div className="border-t border-zinc-800 pt-3">
              <PriceRow
                label="Saldo"
                value={formatCurrency(order.balance)}
                highlight={order.balance > 0}
              />
            </div>
          </div>
        </motion.div>

        {/* Status history */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5"
        >
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Historial
          </h3>
          {history.length === 0 ? (
            <p className="text-xs text-zinc-700 text-center py-4">Sin historial aún</p>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      i === 0 ? "bg-indigo-400" : "bg-zinc-700"
                    )} />
                    {i < history.length - 1 && (
                      <div className="w-px flex-1 bg-zinc-800 min-h-4" />
                    )}
                  </div>
                  <div className="pb-2">
                    <StatusBadge status={h.status as OrderStatus} size="sm" />
                    {h.notes && (
                      <p className="text-xs text-zinc-600 mt-1">{h.notes}</p>
                    )}
                    <p className="text-xs text-zinc-700 mt-1">
                      {formatDatetime(h.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  sub,
  valueClass,
  className,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  valueClass?: string
  className?: string
}) {
  return (
    <div className={cn("flex gap-3", className)}>
      <div className="p-1.5 rounded-md bg-zinc-800/60 h-fit">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
      </div>
      <div>
        <p className="text-xs text-zinc-600">{label}</p>
        <p className={cn("text-sm text-zinc-300 font-medium", valueClass)}>{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-0.5" suppressHydrationWarning>{sub}</p>}
      </div>
    </div>
  )
}

function PriceRow({
  label,
  value,
  dimmed,
  highlight,
}: {
  label: string
  value: string
  dimmed?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", dimmed ? "text-zinc-600" : "text-zinc-400")}>{label}</span>
      <span className={cn(
        "text-sm font-medium",
        highlight ? "text-amber-400" : dimmed ? "text-zinc-600" : "text-zinc-200"
      )}>
        {value}
      </span>
    </div>
  )
}
