"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { KanbanCard } from "./KanbanCard"
import type { Order, OrderStatus } from "@/types"

interface StatusConfig {
  value: OrderStatus
  label: string
  color: string
  bgColor: string
}

interface Props {
  status: StatusConfig
  orders: Order[]
}

export function KanbanColumn({ status, orders }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value })

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] w-full">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("inline-block w-2 h-2 rounded-full", status.color.replace("text-", "bg-"))} />
          <span className="text-xs font-medium text-zinc-400">{status.label}</span>
        </div>
        <span className={cn(
          "text-xs font-medium px-1.5 py-0.5 rounded-full",
          status.bgColor,
          status.color
        )}>
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl border-2 border-dashed p-2 min-h-[120px] transition-colors",
          isOver
            ? "border-indigo-500/50 bg-indigo-500/5"
            : "border-zinc-800/60 bg-zinc-900/20"
        )}
      >
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {orders.map((order) => (
              <KanbanCard key={order.id} order={order} />
            ))}
          </div>
        </SortableContext>

        {orders.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-zinc-700">
            Sin pedidos
          </div>
        )}
      </div>
    </div>
  )
}
