"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type RealtimeTable = "orders" | "notifications" | "order_status_history" | "order_designs"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UseRealtimeOptions<T extends Record<string, any>> {
  table: RealtimeTable
  filter?: string
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtime<T extends Record<string, any>>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  const supabase = createClient()

  const subscribe = useCallback(() => {
    const channel = supabase
      .channel(`realtime:${table}${filter ? `:${filter}` : ""}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => onInsert?.(payload as RealtimePostgresChangesPayload<T>)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => onUpdate?.(payload as RealtimePostgresChangesPayload<T>)
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => onDelete?.(payload as RealtimePostgresChangesPayload<T>)
      )
      .subscribe()

    return channel
  }, [table, filter])

  useEffect(() => {
    const channel = subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [subscribe])
}
