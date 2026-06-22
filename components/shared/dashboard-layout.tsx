"use client"

import type { ReactNode } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "./dashboard-header"
import { WhatsAppBackButton } from "./whatsapp-back-button"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="min-w-0">
        <div className="flex min-h-[100dvh] h-[100dvh] min-w-0 flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 min-w-0 relative overflow-y-auto bg-background">
            <div className="h-full p-4 sm:p-5 md:p-7 lg:p-8 pt-5 sm:pt-7 pb-24 sm:pb-8">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </div>
            {/* WhatsApp back button - shows only for users who came from WhatsApp */}
            <WhatsAppBackButton />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
