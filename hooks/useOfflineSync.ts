"use client"

import { useEffect, useState, useCallback } from "react"
import Dexie, { type Table } from "dexie"

interface PendingSync {
  id?: number
  table: string
  operation: "insert" | "update" | "delete"
  data: Record<string, unknown>
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

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

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
      data: Record<string, unknown>
    ) => {
      await db.pendingSync.add({
        table,
        operation,
        data,
        timestamp: Date.now(),
        retries: 0,
      })
      const count = await db.pendingSync.count()
      setPendingCount(count)
    },
    []
  )

  const syncPending = useCallback(async () => {
    if (isSyncing) return
    const pending = await db.pendingSync.toArray()
    if (pending.length === 0) return

    setIsSyncing(true)
    // La lógica de sync real se implementa en Fase 8 (Offline-First)
    // Por ahora vacía la queue cuando hay conexión
    await db.pendingSync.clear()
    setPendingCount(0)
    setIsSyncing(false)
  }, [isSyncing])

  return {
    isOnline,
    pendingCount,
    isSyncing,
    queueOperation,
    syncNow: syncPending,
  }
}
