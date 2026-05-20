"use client"

import { useEffect, useState, useCallback } from "react"
import Dexie, { type Table } from "dexie"
import { createClient } from "@/lib/supabase/client"

interface PendingSync {
  id?: number
  table: string
  operation: "insert" | "update" | "delete"
  data: Record<string, unknown>
  recordId?: string
  timestamp: number
  retries: number
}

class MotoSmartDB extends Dexie {
  pendingSync!: Table<PendingSync>

  constructor() {
    super("motosmart_offline")
    this.version(1).stores({
      pendingSync: "++id, table, operation, timestamp",
    })
  }
}

const db = new MotoSmartDB()

const MAX_RETRIES = 3

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const syncPending = useCallback(async () => {
    if (isSyncing) return
    const pending = await db.pendingSync.toArray()
    if (pending.length === 0) return

    setIsSyncing(true)
    const supabase = createClient()

    for (const item of pending) {
      if (item.retries >= MAX_RETRIES) {
        // Give up after too many retries
        await db.pendingSync.delete(item.id!)
        continue
      }

      try {
        if (item.operation === "insert") {
          const { error } = await (supabase.from(item.table as never) as ReturnType<typeof supabase.from>)
            .insert(item.data as never)
          if (error) throw error
        } else if (item.operation === "update" && item.recordId) {
          const { error } = await (supabase.from(item.table as never) as ReturnType<typeof supabase.from>)
            .update(item.data as never)
            .eq("id", item.recordId)
          if (error) throw error
        } else if (item.operation === "delete" && item.recordId) {
          const { error } = await (supabase.from(item.table as never) as ReturnType<typeof supabase.from>)
            .update({ deleted_at: new Date().toISOString() } as never)
            .eq("id", item.recordId)
          if (error) throw error
        }
        await db.pendingSync.delete(item.id!)
      } catch {
        await db.pendingSync.update(item.id!, { retries: item.retries + 1 })
      }
    }

    const remaining = await db.pendingSync.count()
    setPendingCount(remaining)
    setIsSyncing(false)
  }, [isSyncing])

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      syncPending()
    }
    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    db.pendingSync.count().then(setPendingCount)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const queueOperation = useCallback(
    async (
      table: string,
      operation: "insert" | "update" | "delete",
      data: Record<string, unknown>,
      recordId?: string
    ) => {
      await db.pendingSync.add({
        table,
        operation,
        data,
        recordId,
        timestamp: Date.now(),
        retries: 0,
      })
      const count = await db.pendingSync.count()
      setPendingCount(count)
    },
    []
  )

  return {
    isOnline,
    pendingCount,
    isSyncing,
    queueOperation,
    syncNow: syncPending,
  }
}
