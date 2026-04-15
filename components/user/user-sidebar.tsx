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
import { Home, Calculator, Calendar, BarChart3, Settings, TrendingUp, Activity, Brain, User } from "lucide-react"
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
    title: "Farm Intelligence",
    url: "/dashboard/farm-intelligence",
    icon: Brain,
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

export function UserSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarHeader className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Image
            src="https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/WhatsApp_Image_2025-09-07_at_8.31.25_AM-removebg-preview%20%281%29.png"
            alt="Farm Mall Logo"
            width={72}
            height={72}
            className="w-18 h-18"
            style={{ width: '72px', height: '72px' }}
          />
          <span className="text-lg font-bold bg-gradient-to-r from-sage-700 to-warm-600 bg-clip-text text-transparent">
            Farm Mall
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className="h-12 px-4 mb-1 rounded-lg hover:bg-sage-50 data-[active=true]:bg-sage-100 data-[active=true]:text-sage-800 data-[active=true]:border-sage-200 data-[active=true]:border relative z-50"
                  >
                    <Link href={item.url} className="flex items-center gap-3 text-sm font-medium w-full">
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
          <SidebarGroupLabel className="px-4 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className="h-12 px-4 mb-1 rounded-lg hover:bg-warm-50 data-[active=true]:bg-warm-100 data-[active=true]:text-warm-800 data-[active=true]:border-warm-200 data-[active=true]:border relative z-50"
                  >
                    <Link href={item.url} className="flex items-center gap-3 text-sm font-medium w-full">
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

      <SidebarFooter className="bg-white border-t border-gray-100 p-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium">Farm Mall v1.0.0</div>
          <div className="text-xs text-gray-400 mt-1">Made for Kenyan Farmers</div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
