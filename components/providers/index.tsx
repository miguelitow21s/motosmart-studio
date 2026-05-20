"use client"

import { AuthProvider } from "./AuthProvider"
import { ServiceWorkerProvider } from "./ServiceWorkerProvider"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ServiceWorkerProvider />
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-zinc-900 border-zinc-800 text-zinc-100",
            title: "text-zinc-100",
            description: "text-zinc-400",
            actionButton: "bg-indigo-500 text-white",
            cancelButton: "bg-zinc-800 text-zinc-400",
            error: "bg-red-900/20 border-red-500/30 text-red-300",
            success: "bg-emerald-900/20 border-emerald-500/30 text-emerald-300",
          },
        }}
      />
    </AuthProvider>
  )
}
