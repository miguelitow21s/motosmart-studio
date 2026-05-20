"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Eye, Pencil, Trash2, Phone, Mail, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils/formatters"
import { getClients, deleteClient, type ClientWithStats } from "../services/clientsService"
import { ClientFormModal } from "./ClientFormModal"
import { ROUTES } from "@/lib/constants/routes"

export function ClientsTable() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editClient, setEditClient] = useState<ClientWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClientWithStats | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setClients(await getClients(search || undefined))
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  function handleSearch(value: string) {
    setSearch(value)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteClient(deleteTarget.id)
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      toast.success("Cliente eliminado")
    } catch {
      toast.error("Error al eliminar el cliente")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9 focus-visible:ring-indigo-500/50"
          />
        </div>
        <span className="text-xs text-zinc-600 ml-auto">
          {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
        </span>
        <Button
          size="sm"
          onClick={() => { setEditClient(null); setShowForm(true) }}
          className="bg-indigo-500 hover:bg-indigo-600 text-white h-9"
        >
          Nuevo cliente
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 bg-zinc-900/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 hidden md:table-cell">Contacto</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 hidden sm:table-cell">Pedidos</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 hidden lg:table-cell">Total gastado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 hidden xl:table-cell">Último pedido</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/40">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full bg-zinc-800/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-zinc-600 text-sm">
                    {search ? "Sin resultados para esta búsqueda" : "No hay clientes aún"}
                  </td>
                </tr>
              ) : (
                clients.map((client, i) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-zinc-800/40 hover:bg-zinc-900/40 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-medium text-sm">{client.name}</p>
                      {client.notes && (
                        <p className="text-zinc-600 text-xs mt-0.5 truncate max-w-xs">{client.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                          <Phone className="w-2.5 h-2.5 shrink-0" />
                          {client.phone}
                        </p>
                        {client.email && (
                          <p className="text-zinc-600 text-xs flex items-center gap-1.5">
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            {client.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-zinc-400 text-sm">
                        <ShoppingBag className="w-3 h-3 text-zinc-600" />
                        {client.orders_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-zinc-300 text-sm font-medium">
                        {client.total_spent > 0 ? formatCurrency(client.total_spent) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-zinc-600 text-xs">
                        {client.last_order_date
                          ? formatRelativeTime(client.last_order_date)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={ROUTES.clients.detail(client.id)}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setEditClient(client); setShowForm(true) }}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <ClientFormModal
          client={editClient}
          onClose={() => { setShowForm(false); setEditClient(null) }}
          onSaved={() => { setShowForm(false); setEditClient(null); load() }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#111113] border-zinc-800 text-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Eliminar cliente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              Esta acción no se puede deshacer. ¿Eliminar a{" "}
              <strong className="text-zinc-300">{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-400 hover:text-zinc-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
