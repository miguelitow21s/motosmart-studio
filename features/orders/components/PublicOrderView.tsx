"use client"

import { motion } from "framer-motion"
import { Bike, Calendar, CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { ORDER_STATUSES, WORK_TYPES } from "@/lib/constants/order-statuses"
import { formatDate, formatDatetime } from "@/lib/utils/formatters"
import type { OrderStatus } from "@/types"

interface OrderData {
  serial: string
  status: string
  work_type: string
  delivery_date: string | null
  created_at: string
  motorcycle_custom: string | null
  client: { name: string } | null
  motorcycle: { brand: string; model: string } | null
}

interface HistoryEntry {
  status: string
  notes: string | null
  created_at: string
}

interface Props {
  order: OrderData
  history: HistoryEntry[]
}

const STATUS_ORDER = ORDER_STATUSES.map((s) => s.value)

export function PublicOrderView({ order, history }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(order.status as OrderStatus)
  const workLabel = WORK_TYPES.find((t) => t.value === order.work_type)?.label ?? order.work_type
  const statusConfig = ORDER_STATUSES.find((s) => s.value === order.status)

  const isOverdue =
    order.delivery_date &&
    new Date(order.delivery_date) < new Date() &&
    order.status !== "delivered" &&
    order.status !== "finished"

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-start justify-center p-4 pt-10 pb-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <span className="text-indigo-400 font-bold text-xl">#</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Pedido #{order.serial}</h1>
          {order.client && (
            <p className="text-zinc-500 text-sm mt-1">{order.client.name}</p>
          )}
          <div className="mt-3 inline-flex">
            <span className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium",
              statusConfig?.bgColor, statusConfig?.color
            )}>
              {statusConfig?.label ?? order.status}
            </span>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#111113] border border-zinc-800/60 rounded-2xl p-5 mb-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-600 mb-1">Trabajo</p>
              <p className="text-sm text-zinc-300 font-medium">{workLabel}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 mb-1">Motocicleta</p>
              <p className="text-sm text-zinc-300 font-medium flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                {order.motorcycle
                  ? `${order.motorcycle.brand} ${order.motorcycle.model}`
                  : order.motorcycle_custom ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 mb-1">Fecha de recepción</p>
              <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                {formatDate(order.created_at)}
              </p>
            </div>
            {order.delivery_date && (
              <div>
                <p className="text-xs text-zinc-600 mb-1">Entrega estimada</p>
                <p className={cn(
                  "text-sm flex items-center gap-1.5",
                  isOverdue ? "text-red-400" : "text-zinc-400"
                )}>
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {formatDate(order.delivery_date)}
                  {isOverdue && <span className="text-xs">(demorado)</span>}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111113] border border-zinc-800/60 rounded-2xl p-5 mb-4"
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-5">
            Progreso
          </p>
          <div className="relative">
            {/* Track line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-800" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-indigo-500 transition-all duration-500"
              style={{
                width: currentIndex > 0
                  ? `${(currentIndex / (STATUS_ORDER.length - 1)) * (100)}%`
                  : "0%",
              }}
            />
            {/* Steps */}
            <div className="relative flex justify-between">
              {ORDER_STATUSES.map((s, i) => {
                const done = i < currentIndex
                const active = i === currentIndex
                return (
                  <div key={s.value} className="flex flex-col items-center gap-1.5 w-12">
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors z-10",
                      done
                        ? "bg-indigo-500 border-indigo-500"
                        : active
                          ? "bg-indigo-500/20 border-indigo-500"
                          : "bg-zinc-900 border-zinc-700"
                    )}>
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className={cn("w-3.5 h-3.5", active ? "text-indigo-400" : "text-zinc-700")} />
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] text-center leading-tight",
                      active ? "text-indigo-400 font-medium" : done ? "text-zinc-500" : "text-zinc-700"
                    )}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* History */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#111113] border border-zinc-800/60 rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Historial
            </p>
            <div className="space-y-3">
              {[...history].reverse().map((h, i) => {
                const cfg = ORDER_STATUSES.find((s) => s.value === h.status)
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <span className={cn(
                      "inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0",
                      cfg?.bgColor, cfg?.color
                    )}>
                      {cfg?.label ?? h.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      {h.notes && (
                        <p className="text-xs text-zinc-500">{h.notes}</p>
                      )}
                      <p className="text-xs text-zinc-700 mt-0.5">
                        {formatDatetime(h.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-zinc-700 mt-6">
          MotoSmart Studio · Tapicería especializada
        </p>
      </div>
    </div>
  )
}
