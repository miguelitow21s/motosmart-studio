"use client"

import { Bell, Search, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/authStore"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants/routes"

export function Topbar() {
  const { user } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push(ROUTES.login)
  }

  const initials = user?.full_name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?"

  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-zinc-800/60 bg-[#0a0a0b]/80 backdrop-blur-sm shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm cursor-pointer hover:border-zinc-700 transition-colors">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="text-zinc-500">Buscar pedidos, clientes...</span>
          <kbd className="ml-auto text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* New order CTA */}
        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5" asChild>
          <Link href={ROUTES.orders.new}>
            <Plus className="w-3.5 h-3.5" />
            Nuevo pedido
          </Link>
        </Button>

        {/* Notifications */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-800/60 transition-colors">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs bg-indigo-500/20 text-indigo-400 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {user && (
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-medium text-zinc-200 leading-none">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-zinc-500 leading-none mt-0.5 capitalize">
                    {user.role}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="text-zinc-400 text-xs">Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem asChild className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer">
              <Link href={ROUTES.settings}>Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer"
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
