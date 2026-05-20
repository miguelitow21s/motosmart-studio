"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { Phone, Bike, Calendar, DollarSign, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"
import { ROUTES } from "@/lib/constants/routes"
import type { Order } from "@/types"

interface Props {
  order: Order
  isOverlay?: boolean
}

export function KanbanCard({ order, isOverlay }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { order } })

  const isOverdue =
    order.delivery_date &&
    new Date(order.delivery_date) < new Date() &&
    order.status !== "delivered" &&
    order.status !== "finished"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-[#18181b] border border-zinc-800/60 rounded-lg p-3 group",
        "hover:border-zinc-700 transition-colors cursor-default select-none",
        isDragging && "opacity-40",
        isOverlay && "rotate-1 shadow-2xl border-zinc-700 opacity-100",
        isOverdue && "border-red-500/30 bg-red-500/5"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors shrink-0"
          tabIndex={-1}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-zinc-500">#{order.serial}</span>
            {isOverdue && (
              <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full shrink-0">
                Atraso
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-200 font-medium leading-tight mt-0.5 truncate">
            {order.client?.name ?? "—"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="ml-5 space-y-1">
        {order.client?.phone && (
          <p className="text-xs text-zinc-600 flex items-center gap-1.5">
            <Phone className="w-2.5 h-2.5 shrink-0" />
            {order.client.phone}
          </p>
        )}
        <p className="text-xs text-zinc-600 flex items-center gap-1.5 truncate">
          <Bike className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">
            {order.motorcycle
              ? `${order.motorcycle.brand} ${order.motorcycle.model}`
              : order.motorcycle_custom ?? "—"}
          </span>
        </p>
        {order.delivery_date && (
          <p className={cn(
            "text-xs flex items-center gap-1.5",
            isOverdue ? "text-red-400" : "text-zinc-600"
          )}>
            <Calendar className="w-2.5 h-2.5 shrink-0" />
            {formatDate(order.delivery_date)}
          </p>
        )}
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <DollarSign className="w-2.5 h-2.5 shrink-0" />
          {formatCurrency(order.total_price)}
          {order.balance > 0 && (
            <span className="text-amber-500/70"> · saldo {formatCurrency(order.balance)}</span>
          )}
        </p>
      </div>

      {/* Footer link */}
      <div className="ml-5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={ROUTES.orders.detail(order.id)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  )
}
