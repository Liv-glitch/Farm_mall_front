"use client"

import { CalendarDays, Users } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-agri-900">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage Farm Mall users, content, and events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-agri-100 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-agri-700" />
            </div>
            <div>
              <h2 className="font-semibold text-agri-900">Events</h2>
              <p className="text-sm text-muted-foreground">Create and manage events shown to farmers.</p>
            </div>
            <Button asChild className="bg-agri-600 hover:bg-agri-700">
              <Link href="/admin/events">Manage events</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-warm-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-warm-800" />
            </div>
            <div>
              <h2 className="font-semibold text-agri-900">Users</h2>
              <p className="text-sm text-muted-foreground">Review registered Farm Mall users.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/users">View users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
