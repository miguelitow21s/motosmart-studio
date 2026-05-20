"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Wrench, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ROUTES } from "@/lib/constants/routes"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.")
      return
    }

    window.location.href = ROUTES.dashboard
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500 mb-4 shadow-lg shadow-indigo-500/25">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            MotoSmart Studio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Sistema de gestión de tapicería
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-200 mb-1">
            Iniciar sesión
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@motosmart.app"
                autoComplete="email"
                className={cn(
                  "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600",
                  "focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500",
                  errors.email && "border-red-500/50 focus-visible:border-red-500"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-300 text-sm">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600",
                  "focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500",
                  errors.password && "border-red-500/50 focus-visible:border-red-500"
                )}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium h-10 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          MotoSmart Studio © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  )
}
