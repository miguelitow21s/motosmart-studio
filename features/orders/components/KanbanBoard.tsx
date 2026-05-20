"use client"

import { useEffect, useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanCard } from "./KanbanCard"
import { getOrders, updateOrderStatus } from "../services/ordersService"
import { ORDER_STATUSES } from "@/lib/constants/order-statuses"
import { useAuthStore } from "@/stores/authStore"
import type { Order, OrderStatus } from "@/types"

const KANBAN_STATUSES = ORDER_STATUSES.filter((s) => s.value !== "delivered")

type ColumnMap = Record<OrderStatus, Order[]>

function buildColumnMap(orders: Order[]): ColumnMap {
  const map = {} as ColumnMap
  for (const s of ORDER_STATUSES) {
    map[s.value] = []
  }
  for (const o of orders) {
    if (map[o.status as OrderStatus]) {
      map[o.status as OrderStatus].push(o)
    }
  }
  return map
}

export function KanbanBoard() {
  const user = useAuthStore((s) => s.user)
  const [columns, setColumns] = useState<ColumnMap>({} as ColumnMap)
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getOrders({ pageSize: 200, status: undefined })
      setColumns(buildColumnMap(data))
    } catch {
      toast.error("Error al cargar pedidos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function findOrderColumn(orderId: string): OrderStatus | null {
    for (const [status, orders] of Object.entries(columns)) {
      if (orders.find((o) => o.id === orderId)) {
        return status as OrderStatus
      }
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    const order = event.active.data.current?.order as Order | undefined
    setActiveOrder(order ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeColumn = findOrderColumn(activeId)
    // overId can be a column id (OrderStatus) or an order id
    const overColumn = (columns[overId as OrderStatus]
      ? overId
      : findOrderColumn(overId)) as OrderStatus | null

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    setColumns((prev) => {
      const activeItems = [...prev[activeColumn]]
      const overItems = [...prev[overColumn]]
      const activeIndex = activeItems.findIndex((o) => o.id === activeId)
      const movedOrder = { ...activeItems[activeIndex], status: overColumn }
      activeItems.splice(activeIndex, 1)
      const overIndex = overItems.findIndex((o) => o.id === overId)
      const insertAt = overIndex >= 0 ? overIndex : overItems.length
      overItems.splice(insertAt, 0, movedOrder)
      return { ...prev, [activeColumn]: activeItems, [overColumn]: overItems }
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveOrder(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeColumn = findOrderColumn(activeId)
    if (!activeColumn) return

    // Reorder within same column
    const overColumn = (columns[overId as OrderStatus]
      ? overId
      : findOrderColumn(overId)) as OrderStatus | null

    if (!overColumn) return

    if (activeColumn === overColumn) {
      const items = columns[activeColumn]
      const oldIndex = items.findIndex((o) => o.id === activeId)
      const newIndex = items.findIndex((o) => o.id === overId)
      if (oldIndex !== newIndex) {
        setColumns((prev) => ({
          ...prev,
          [activeColumn]: arrayMove(items, oldIndex, newIndex),
        }))
      }
      return
    }

    // Persist status change to Supabase
    try {
      await updateOrderStatus(activeId, activeColumn, user?.id ?? "")
    } catch {
      toast.error("Error al actualizar el estado")
      load() // revert
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STATUSES.map((s) => (
          <div key={s.value} className="min-w-[260px]">
            <Skeleton className="h-6 w-24 bg-zinc-800 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full bg-zinc-800/60 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-zinc-600">
          {Object.values(columns).reduce((a, c) => a + c.length, 0)} pedidos activos
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          className="h-7 text-xs text-zinc-500 hover:text-zinc-300 gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          Actualizar
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6">
          {KANBAN_STATUSES.map((status, i) => (
            <motion.div
              key={status.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <KanbanColumn
                status={status}
                orders={columns[status.value] ?? []}
              />
            </motion.div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeOrder && <KanbanCard order={activeOrder} isOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
