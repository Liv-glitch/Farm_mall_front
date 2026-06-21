"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

interface AdminRouteGuardProps {
  children: ReactNode
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    if (user.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [loading, router, user])

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking admin access...
      </div>
    )
  }

  return <>{children}</>
}
