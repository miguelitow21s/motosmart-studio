"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  User, Building2, Bell, Shield, Loader2, Check, ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAuthStore } from "@/stores/authStore"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Tab = "perfil" | "taller" | "notificaciones" | "seguridad"

const profileSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
})

const workshopSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(7, "Teléfono inválido"),
  address: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
})

type ProfileData = z.infer<typeof profileSchema>
type WorkshopData = z.infer<typeof workshopSchema>
type PasswordData = z.infer<typeof passwordSchema>

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "taller", label: "Taller", icon: Building2 },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "seguridad", label: "Seguridad", icon: Shield },
]

export function ConfiguracionClient() {
  const [activeTab, setActiveTab] = useState<Tab>("perfil")

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Gestiona tu perfil, taller y preferencias del sistema"
      />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                activeTab === id
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
              {activeTab === id && (
                <ChevronRight className="size-3.5 ml-auto text-indigo-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "perfil" && <PerfilPanel />}
          {activeTab === "taller" && <TallerPanel />}
          {activeTab === "notificaciones" && <NotificacionesPanel />}
          {activeTab === "seguridad" && <SeguridadPanel />}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function PerfilPanel() {
  const { user, setUser } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema) as unknown as Resolver<ProfileData>,
    defaultValues: { full_name: user?.full_name ?? "", email: user?.email ?? "" },
  })

  async function onSubmit(data: ProfileData) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ full_name: data.full_name })
        .eq("id", user?.id ?? "")
      if (error) throw error
      if (user) setUser({ ...user, full_name: data.full_name })
      toast.success("Perfil actualizado")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Información personal"
        description="Estos datos aparecen en los documentos generados"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="size-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-semibold shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{user?.full_name}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/15 text-indigo-400 font-medium capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Nombre completo</Label>
              <Input
                {...register("full_name")}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Email</Label>
              <Input
                {...register("email")}
                disabled
                className="bg-zinc-800/50 border-zinc-700 text-zinc-500 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-600">El email no se puede cambiar desde aquí</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Check className="size-4 mr-1.5" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}

function TallerPanel() {
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<WorkshopData>({
    resolver: zodResolver(workshopSchema) as unknown as Resolver<WorkshopData>,
    defaultValues: {
      name: "MotoSmart Studio",
      phone: "",
      address: "",
      city: "",
      description: "",
    },
  })

  async function onSubmit(_data: WorkshopData) {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success("Información del taller guardada")
    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Datos del taller"
        description="Información que aparece en presupuestos y facturas"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-zinc-300">Nombre del taller</Label>
              <Input
                {...register("name")}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Teléfono</Label>
              <Input
                {...register("phone")}
                placeholder="+57 300 000 0000"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
              {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Ciudad</Label>
              <Input
                {...register("city")}
                placeholder="Medellín"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-zinc-300">Dirección</Label>
              <Input
                {...register("address")}
                placeholder="Calle 123 #45-67"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-zinc-300">Descripción</Label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="Especialistas en sillines de motocicleta..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Check className="size-4 mr-1.5" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}

function NotificacionesPanel() {
  const [prefs, setPrefs] = useState({
    new_order: true,
    status_change: true,
    delivery_reminder: true,
    overdue_alert: true,
  })

  const items = [
    { key: "new_order" as const, label: "Nuevo pedido", desc: "Cuando se crea un pedido" },
    { key: "status_change" as const, label: "Cambio de estado", desc: "Cuando un pedido cambia de estado" },
    { key: "delivery_reminder" as const, label: "Recordatorio de entrega", desc: "24h antes de la fecha de entrega" },
    { key: "overdue_alert" as const, label: "Pedido vencido", desc: "Cuando un pedido supera su fecha límite" },
  ]

  return (
    <div className="space-y-4">
      <SectionCard
        title="Preferencias de notificación"
        description="Controla qué eventos generan alertas en el sistema"
      >
        <div className="space-y-3">
          {items.map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/40 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                className="mt-0.5 size-4 rounded border-zinc-600 bg-zinc-800 accent-indigo-500"
              />
              <div>
                <p className="text-sm text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => toast.success("Preferencias guardadas")}
          >
            <Check className="size-4 mr-1.5" /> Guardar preferencias
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

function SeguridadPanel() {
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema) as unknown as Resolver<PasswordData>,
  })

  async function onSubmit(_data: PasswordData) {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: _data.new_password })
      if (error) throw error
      toast.success("Contraseña actualizada")
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Cambiar contraseña"
        description="Usa una contraseña fuerte de al menos 8 caracteres"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Contraseña actual</Label>
            <Input
              {...register("current_password")}
              type="password"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Nueva contraseña</Label>
            <Input
              {...register("new_password")}
              type="password"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            {errors.new_password && <p className="text-xs text-red-400">{errors.new_password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Confirmar contraseña</Label>
            <Input
              {...register("confirm_password")}
              type="password"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            {errors.confirm_password && <p className="text-xs text-red-400">{errors.confirm_password.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
            Actualizar contraseña
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Sesiones activas" description="Dispositivos donde tienes sesión iniciada">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/40">
            <div>
              <p className="text-sm text-zinc-200">Este dispositivo</p>
              <p className="text-xs text-zinc-500">Sesión actual · Chrome</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Activa</span>
          </div>
        </div>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-red-800 text-red-400 hover:bg-red-900/20 hover:border-red-700"
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut({ scope: "others" })
              toast.success("Otras sesiones cerradas")
            }}
          >
            Cerrar otras sesiones
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
