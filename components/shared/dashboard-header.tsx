"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, Settings, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-between min-w-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-semibold truncate">
            {user?.role === "admin" ? "Admin Dashboard" : "Farm Dashboard"}
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePictureUrl || "/placeholder.svg"} alt={user?.fullName} />
                  <AvatarFallback className="text-xs">
                    {user?.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none min-w-0">
                  <p className="font-medium truncate">{user?.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">{user?.email || user?.phoneNumber}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <div className="sm:hidden">
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Theme Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
