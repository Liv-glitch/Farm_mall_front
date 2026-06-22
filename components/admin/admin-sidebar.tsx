"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Home, Users, BarChart3, Settings, Database, Shield, FileText, CalendarDays } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Overview",
    url: "/admin",
    icon: Home,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Content Management",
    url: "/admin/content",
    icon: FileText,
  },
  {
    title: "Manage Events",
    url: "/admin/events",
    icon: CalendarDays,
  },
]

const systemItems = [
  {
    title: "Database",
    url: "/admin/database",
    icon: Database,
  },
  {
    title: "Security",
    url: "/admin/security",
    icon: Shield,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (url: string) => {
    if (url === "/admin/events") {
      return pathname?.startsWith("/admin/events") === true
    }
    return pathname === url
  }

  return (
    <Sidebar className="border-r-0 bg-primary-950 text-white shadow-lift">
      <SidebarHeader className="bg-primary-950 border-b border-white/10">
        <div className="flex items-center space-x-3 px-2">
          <Image
            src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/WhatsApp_Image_2025-09-07_at_8.31.25_AM-removebg-preview%20%281%29.png"
            alt="Farm Mall Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
          <span className="text-lg font-extrabold text-white">
            Admin Panel
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-primary-950">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="mb-1 h-12 rounded-2xl text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-primary data-[active=true]:text-white">
                    <Link href={item.url} className="text-white/80 hover:text-white">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="mb-1 h-12 rounded-2xl text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-primary data-[active=true]:text-white">
                    <Link href={item.url} className="text-white/80 hover:text-white">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-primary-950 border-t border-white/10">
        <div className="p-4 text-center">
          <div className="text-xs text-white/60">Admin Panel v1.0.0</div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
