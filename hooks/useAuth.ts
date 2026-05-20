"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/authStore"
import type { User } from "@/types"

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser(profile as unknown as User)
            setLoading(false)
          })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
