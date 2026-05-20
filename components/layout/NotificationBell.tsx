"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils/formatters"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/authStore"
import { useRealtime } from "@/hooks/useRealtime"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database.types"

type NotifRow = Database["public"]["Tables"]["notifications"]["Row"]

export function NotificationBell() {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  async function fetchNotifications() {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [user])

  // New notifications via Realtime
  useRealtime<NotifRow>({
    table: "notifications",
    filter: user ? `user_id=eq.${user.id}` : undefined,
    onInsert: (payload) => {
      if (payload.new && "id" in payload.new) {
        setNotifications((prev) => [payload.new as NotifRow, ...prev])
      }
    },
  })

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  async function markAllRead() {
    if (!user || unreadCount === 0) return
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications() }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-medium text-zinc-200">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <CheckCheck className="size-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-4 animate-spin text-zinc-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="size-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={() => markRead(n.id)}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotifItem({
  notif,
  onRead,
  onClose,
}: {
  notif: NotifRow
  onRead: () => void
  onClose: () => void
}) {
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 transition-colors",
        !notif.read && "bg-indigo-500/5"
      )}
    >
      {!notif.read && (
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
      )}
      <div className={cn("flex-1 min-w-0", notif.read && "pl-4")}>
        <p className="text-xs font-medium text-zinc-200 truncate">{notif.title}</p>
        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-zinc-600">
            {formatRelativeTime(notif.created_at)}
          </span>
          {notif.order_id && (
            <Link
              href={`/pedidos/${notif.order_id}`}
              onClick={() => { onRead(); onClose() }}
              className="flex items-center gap-0.5 text-[10px] text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink className="size-2.5" />
              Ver pedido
            </Link>
          )}
        </div>
      </div>
      {!notif.read && (
        <button
          onClick={onRead}
          className="mt-1 p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-colors shrink-0"
          title="Marcar como leída"
        >
          <Check className="size-3" />
        </button>
      )}
    </div>
  )
}
