"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Loader2 } from "lucide-react"

export default function MarketPage() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to the external market site
    window.location.href = "https://findfarmers.onrender.com"
  }, [])

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-agri-600 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting to Farm Market...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}