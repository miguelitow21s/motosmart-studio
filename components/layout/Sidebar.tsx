"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Kanban,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Zap,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants/routes"
import { useUIStore } from "@/stores/uiStore"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const NAV_ITEMS = [
  { label: "Dashboard",    href: ROUTES.dashboard,     icon: LayoutDashboard, exact: true },
  { label: "Pedidos",      href: ROUTES.orders.list,   icon: ClipboardList },
  { label: "Clientes",     href: ROUTES.clients.list,  icon: Users },
  { label: "Producción",   href: ROUTES.production,    icon: Kanban },
  { label: "Plantillas",   href: ROUTES.templates,     icon: Layers },
  { label: "Configuración",href: ROUTES.settings,      icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

function NavItems({ pathname, expanded, onNavClick }: { pathname: string; expanded: boolean; onNavClick?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, item.exact)
        const Icon = item.icon
        return expanded ? (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-indigo-500/15 text-indigo-400"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {active && (
              <motion.div layoutId="sidebar-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </Link>
        ) : (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-colors",
                  active
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                )}
              >
                <Icon className="w-4 h-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname, setMobileSidebarOpen])

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── DESKTOP sidebar (hidden on mobile) ─────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex relative flex-col h-full bg-[#111113] border-r border-zinc-800/60 shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 shrink-0">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <span className="font-bold text-sm text-zinc-100 whitespace-nowrap tracking-tight">MotoSmart</span>
                  <span className="ml-1 text-xs font-medium text-indigo-400 whitespace-nowrap">Studio</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavItems pathname={pathname} expanded={sidebarOpen} />
        </nav>

        {/* Version */}
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pb-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Zap className="w-3 h-3" />
              <span>v1.0.0</span>
            </div>
          </motion.div>
        )}

        {/* Collapse toggle */}
        <div className="p-2 border-t border-zinc-800/60">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-8 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* ── MOBILE drawer + backdrop ──────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-[#111113] border-r border-zinc-800/60 overflow-hidden md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500 shrink-0">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm text-zinc-100 tracking-tight">MotoSmart</span>
                  <span className="text-xs font-medium text-indigo-400">Studio</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                <NavItems
                  pathname={pathname}
                  expanded
                  onNavClick={() => setMobileSidebarOpen(false)}
                />
              </nav>

              {/* Version */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <Zap className="w-3 h-3" />
                  <span>v1.0.0</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
