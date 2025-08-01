"use client"

import { useState } from "react"
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
import { ProfileModal } from "@/components/modals/profile-modal"
import Link from "next/link"

export function DashboardHeader() {
  const { user, logout, refreshUser } = useAuth()
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleProfileUpdated = async () => {
    await refreshUser()
  }

  // Extract user data from potentially nested structure
  const userData = user?.user || user

  return (
    <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-sm sm:text-lg font-semibold truncate">
              {userData?.role === "admin" ? "Admin Dashboard" : "Farm Dashboard"}
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
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
                  <AvatarImage src={userData?.profilePictureUrl || "/placeholder.svg"} alt={userData?.fullName} />
                  <AvatarFallback className="text-xs">
                    {(userData?.fullName || userData?.name || 'U')
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
                  <p className="font-medium truncate">{userData?.fullName || userData?.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{userData?.email || userData?.phoneNumber}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
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

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          user={user}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </header>
  )
}
