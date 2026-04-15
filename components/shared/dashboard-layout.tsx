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
      <SidebarInset>
        <div className="flex flex-col min-h-[100dvh] h-[100dvh] overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 relative overflow-y-auto">
            <div className="h-full p-3 sm:p-4 md:p-6 lg:p-8 pt-4 sm:pt-6 pb-20 sm:pb-8">
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
