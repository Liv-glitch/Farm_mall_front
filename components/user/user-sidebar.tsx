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
import {
  Home,
  Calculator,
  BarChart3,
  Settings,
  Activity,
  Stethoscope,
  User,
  Sprout,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Production Cycles",
    url: "/dashboard/cycles",
    icon: Activity,
  },
  {
    title: "Pre-production Planning",
    url: "/dashboard/pre-production-planning",
    icon: Sprout,
  },
  {
    title: "Diagnosis",
    url: "/dashboard/diagnosis",
    icon: Stethoscope,
  },
  {
    title: "Farm Tools",
    url: "/dashboard/farm-tools",
    icon: Calculator,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
]

const toolsItems = [
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

// Dark forest-green base for the sidebar surfaces (matches the new design).
const SIDEBAR_BG = "bg-[#1f3a23]"

export function UserSidebar() {
  const pathname = usePathname()

  // The Diagnosis route is reached both at /dashboard/diagnosis and the legacy
  // /dashboard/farm-intelligence path. Treat both as active for the menu item.
  const isActive = (url: string) => {
    if (url === "/dashboard/diagnosis") {
      return (
        pathname === "/dashboard/diagnosis" ||
        pathname?.startsWith("/dashboard/farm-intelligence") === true
      )
    }
    if (url === "/dashboard/pre-production-planning") {
      return pathname?.startsWith("/dashboard/pre-production-planning") === true
    }
    return pathname === url
  }

  return (
    <Sidebar className={`${SIDEBAR_BG} border-r-0 text-white`}>
      <SidebarHeader className={`${SIDEBAR_BG} border-b border-white/10 p-4`}>
        <div className="flex items-center space-x-3">
          <Image
            src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/WhatsApp_Image_2025-09-07_at_8.31.25_AM-removebg-preview%20%281%29.png"
            alt="Farm Mall Logo"
            width={72}
            height={72}
            className="w-18 h-18"
            style={{ width: "72px", height: "72px" }}
          />
          <span className="text-lg font-bold bg-gradient-to-r from-sage-700 to-warm-600 bg-clip-text text-transparent">
            Farm Mall
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className={SIDEBAR_BG}>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-12 px-4 mb-1 rounded-lg text-white/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#e87a3b] data-[active=true]:text-white data-[active=true]:hover:bg-[#d96b2d] data-[active=true]:hover:text-white relative z-50"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 text-sm font-medium w-full"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-12 px-4 mb-1 rounded-lg text-white/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#e87a3b] data-[active=true]:text-white data-[active=true]:hover:bg-[#d96b2d] data-[active=true]:hover:text-white relative z-50"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 text-sm font-medium w-full"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`${SIDEBAR_BG} border-t border-white/10 p-4`}>
        <div className="text-center">
          <div className="text-xs text-white/70 font-medium">Farm Mall v2.0</div>
          <div className="text-xs text-white/50 mt-1">Made for Kenyan Farmers</div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
