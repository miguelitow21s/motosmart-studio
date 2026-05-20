"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check, ChevronsUpDown, Plus, User, Bike, Loader2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { WORK_TYPES } from "@/lib/constants/order-statuses"
import { ROUTES } from "@/lib/constants/routes"
import { createOrder, createClient_, getClients, getMotorcycles } from "../services/ordersService"
import { useAuthStore } from "@/stores/authStore"
import type { Database } from "@/types/database.types"
import type { Client } from "@/types"

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"]
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]

const orderSchema = z.object({
  client_id: z.string().min(1, "Selecciona un cliente"),
  motorcycle_id: z.string().optional(),
  motorcycle_custom: z.string().optional(),
  work_type: z.enum(["cover", "foam", "embroidery", "design", "full_custom", "repair"]),
  total_price: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  deposit: z.coerce.number().min(0).default(0),
  delivery_date: z.string().optional(),
  notes: z.string().optional(),
})

const clientSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>
type ClientFormData = z.infer<typeof clientSchema>
type MotorcycleOption = { id: string; brand: string; model: string; displacement?: string }

export function NewOrderForm() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [clients, setClients] = useState<Pick<Client, "id" | "name" | "phone">[]>([])
  const [motorcycles, setMotorcycles] = useState<MotorcycleOption[]>([])
  const [clientOpen, setClientOpen] = useState(false)
  const [motoOpen, setMotoOpen] = useState(false)
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [useCustomMoto, setUseCustomMoto] = useState(false)

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema) as unknown as Resolver<OrderFormData>,
    defaultValues: { deposit: 0, work_type: "cover" },
  })

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as unknown as Resolver<ClientFormData>,
  })

  const watchedClientId = form.watch("client_id")
  const watchedMotoId = form.watch("motorcycle_id")
  const watchedTotal = form.watch("total_price") || 0
  const watchedDeposit = form.watch("deposit") || 0
  const balance = Math.max(0, Number(watchedTotal) - Number(watchedDeposit))

  useEffect(() => {
    Promise.all([getClients(), getMotorcycles()]).then(([c, m]) => {
      setClients(c)
      setMotorcycles(m as MotorcycleOption[])
    }).catch(() => toast.error("Error al cargar clientes y motos"))
  }, [])

  const selectedClient = clients.find((c) => c.id === watchedClientId)
  const selectedMoto = motorcycles.find((m) => m.id === watchedMotoId)

  async function handleCreateClient(data: ClientFormData) {
    setCreatingClient(true)
    try {
      const created = await createClient_({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        notes: data.notes || null,
      } satisfies ClientInsert)
      setClients((prev) => [...prev, created as Pick<Client, "id" | "name" | "phone">])
      form.setValue("client_id", created.id)
      setNewClientOpen(false)
      clientForm.reset()
      toast.success("Cliente creado")
    } catch {
      toast.error("Error al crear el cliente")
    } finally {
      setCreatingClient(false)
    }
  }

  async function onSubmit(data: OrderFormData) {
    setSubmitting(true)
    try {
      const payload: OrderInsert = {
        client_id: data.client_id,
        motorcycle_id: data.motorcycle_id ?? null,
        motorcycle_custom: useCustomMoto ? (data.motorcycle_custom ?? null) : null,
        work_type: data.work_type,
        total_price: Number(data.total_price),
        deposit: Number(data.deposit) || 0,
        delivery_date: data.delivery_date || null,
        notes: data.notes || null,
        status: "received",
        created_by: user?.id ?? "",
      }
      const order = await createOrder(payload)
      toast.success(`Pedido #${order.serial} creado`)
      router.push(ROUTES.orders.detail(order.id))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear el pedido"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        {/* Cliente */}
        <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Cliente
          </h2>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Seleccionar cliente *</Label>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between bg-zinc-900 border-zinc-800 text-sm h-9",
                    !watchedClientId && "text-zinc-500",
                    form.formState.errors.client_id && "border-red-500/60"
                  )}
                >
                  {selectedClient
                    ? <span>{selectedClient.name} <span className="text-zinc-600 text-xs ml-1">{selectedClient.phone}</span></span>
                    : "Buscar cliente..."}
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-zinc-800" align="start">
                <Command className="bg-transparent">
                  <CommandInput
                    placeholder="Buscar por nombre..."
                    className="h-9 text-sm text-zinc-200 placeholder:text-zinc-600"
                  />
                  <CommandList>
                    <CommandEmpty className="py-4 text-center text-sm text-zinc-600">
                      Sin resultados
                    </CommandEmpty>
                    <CommandGroup>
                      {clients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.name} ${c.phone}`}
                          onSelect={() => {
                            form.setValue("client_id", c.id, { shouldValidate: true })
                            setClientOpen(false)
                          }}
                          className="text-zinc-300 aria-selected:bg-zinc-800"
                        >
                          <Check className={cn("mr-2 h-3.5 w-3.5", watchedClientId === c.id ? "opacity-100 text-indigo-400" : "opacity-0")} />
                          <span>{c.name}</span>
                          <span className="ml-auto text-xs text-zinc-600">{c.phone}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator className="bg-zinc-800" />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => { setClientOpen(false); setNewClientOpen(true) }}
                        className="text-indigo-400 aria-selected:bg-zinc-800"
                      >
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Crear nuevo cliente
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.client_id && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {form.formState.errors.client_id.message}
              </p>
            )}
          </div>
        </div>

        {/* Moto */}
        <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Bike className="w-4 h-4 text-indigo-400" />
            Motocicleta
          </h2>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <button
              type="button"
              onClick={() => { setUseCustomMoto(false); form.setValue("motorcycle_custom", "") }}
              className={cn("px-3 py-1.5 rounded-md border transition-colors",
                !useCustomMoto
                  ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-400"
                  : "border-zinc-800 text-zinc-600 hover:text-zinc-400"
              )}
            >
              Del catálogo
            </button>
            <button
              type="button"
              onClick={() => { setUseCustomMoto(true); form.setValue("motorcycle_id", undefined) }}
              className={cn("px-3 py-1.5 rounded-md border transition-colors",
                useCustomMoto
                  ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-400"
                  : "border-zinc-800 text-zinc-600 hover:text-zinc-400"
              )}
            >
              Escribir manualmente
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!useCustomMoto ? (
              <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Popover open={motoOpen} onOpenChange={setMotoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between bg-zinc-900 border-zinc-800 text-sm h-9",
                        !watchedMotoId && "text-zinc-500"
                      )}
                    >
                      {selectedMoto
                        ? `${selectedMoto.brand} ${selectedMoto.model}${selectedMoto.displacement ? ` ${selectedMoto.displacement}` : ""}`
                        : "Seleccionar moto..."}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-zinc-800" align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Buscar moto..." className="h-9 text-sm text-zinc-200 placeholder:text-zinc-600" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-center text-sm text-zinc-600">Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {motorcycles.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={`${m.brand} ${m.model} ${m.displacement ?? ""}`}
                              onSelect={() => {
                                form.setValue("motorcycle_id", m.id)
                                setMotoOpen(false)
                              }}
                              className="text-zinc-300 aria-selected:bg-zinc-800"
                            >
                              <Check className={cn("mr-2 h-3.5 w-3.5", watchedMotoId === m.id ? "opacity-100 text-indigo-400" : "opacity-0")} />
                              <span>{m.brand} {m.model}</span>
                              {m.displacement && <span className="ml-auto text-xs text-zinc-600">{m.displacement}</span>}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </motion.div>
            ) : (
              <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Input
                  placeholder="Ej: Honda CB190 2021"
                  {...form.register("motorcycle_custom")}
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trabajo y precios */}
        <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Trabajo y precios</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Tipo de trabajo *</Label>
              <Select
                value={form.watch("work_type")}
                onValueChange={(v) => form.setValue("work_type", v as OrderFormData["work_type"], { shouldValidate: true })}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {WORK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-zinc-300">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Fecha de entrega</Label>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...form.register("delivery_date")}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Precio total *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  {...form.register("total_price")}
                  className={cn(
                    "pl-7 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9",
                    form.formState.errors.total_price && "border-red-500/60"
                  )}
                />
              </div>
              {form.formState.errors.total_price && (
                <p className="text-xs text-red-400">{form.formState.errors.total_price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Abono</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">$</span>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  {...form.register("deposit")}
                  className="pl-7 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Saldo pendiente</Label>
              <div className="flex items-center h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-md">
                <span className="text-zinc-600 text-xs mr-1">$</span>
                <span className={cn("text-sm font-medium", balance > 0 ? "text-amber-400" : "text-emerald-400")}>
                  {balance.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Notas internas</h2>
          <Textarea
            placeholder="Especificaciones, referencias de diseño, preferencias del cliente..."
            {...form.register("notes")}
            rows={3}
            className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none focus-visible:ring-indigo-500/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2 px-6"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitting ? "Creando..." : "Crear pedido"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </Button>
        </div>
      </motion.form>

      {/* Modal nuevo cliente */}
      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="bg-[#111113] border-zinc-800 text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Nuevo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={clientForm.handleSubmit(handleCreateClient)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Nombre *</Label>
              <Input
                placeholder="Juan Pérez"
                {...clientForm.register("name")}
                className={cn(
                  "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9",
                  clientForm.formState.errors.name && "border-red-500/60"
                )}
              />
              {clientForm.formState.errors.name && (
                <p className="text-xs text-red-400">{clientForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Teléfono *</Label>
              <Input
                placeholder="3001234567"
                {...clientForm.register("phone")}
                className={cn(
                  "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9",
                  clientForm.formState.errors.phone && "border-red-500/60"
                )}
              />
              {clientForm.formState.errors.phone && (
                <p className="text-xs text-red-400">{clientForm.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Email</Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                {...clientForm.register("email")}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500">Notas</Label>
              <Textarea
                placeholder="Preferencias, referencias..."
                {...clientForm.register("notes")}
                rows={2}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={creatingClient}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
              >
                {creatingClient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Crear cliente
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewClientOpen(false)}
                className="border-zinc-800 text-zinc-400"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
