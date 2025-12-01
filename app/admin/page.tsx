"use client"

import { useEffect, useState } from "react"
//import { DashboardLayout } from "@/components/shared/dashboard-layout"
//import { AdminSidebar } from "@/components/admin/admin-sidebar"
//import { StatsCard } from "@/components/shared/stats-card"
//import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
//import { Button } from "@/components/ui/button"
//import { Badge } from "@/components/ui/badge"
import { Users, Activity, TrendingUp, DollarSign, Eye, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiClient } from "@/lib/api/client"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  totalCycles: number
  activeCycles: number
  upcomingActivities: number
}

interface RecentUser {
  id: string
  fullName: string
  email?: string
  county: string
  subscriptionType: "free" | "premium"
  createdAt: Date
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        // Fetch stats using apiClient
        const statsRes = await apiClient.getDashboardStats() as Record<string, any>
        console.log('📊 Full statsRes:', statsRes)
        setStats({
          totalUsers: statsRes.totalUsers || 0,
          activeUsers: statsRes.activeUsers || 0,
          totalRevenue: statsRes.totalActualRevenue || 0,
          totalCycles: statsRes.totalCycles || 0,
          activeCycles: statsRes.activeCycles || 0,
          upcomingActivities: statsRes.upcomingActivities || 0,
        })
        // Fetch users using apiClient (remove sort param)
        const usersArr = await apiClient.getUsers({ limit: 5 }) as any[]
        // Sort by createdAt descending in JS, then take top 5
        const users = usersArr
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            county: u.county,
            subscriptionType: u.subscriptionType,
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          }))
        setRecentUsers(users)
      } catch (err: any) {
        setError(err.message || "Failed to load admin dashboard data.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div>Loading...</div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="text-red-600 p-4">{error}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="text-muted-foreground">Monitor and manage the Farm Mall platform.</p>
          </div>
          <Button className="bg-sage-700 hover:bg-sage-800">Generate Report</Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            description="Total registered users on the platform"
          />
          <StatsCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Activity}
            description="Users active in the last 30 days"
          />
          <StatsCard
            title="Total Revenue"
            value={stats?.totalRevenue || 0}
            prefix="KSh "
            icon={DollarSign}
            description="Total revenue generated from all users"
          />
          <StatsCard
            title="Production Cycles"
            value={stats?.totalCycles || 0}
            icon={TrendingUp}
            description="Total number of farming cycles created"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-sage-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{user.fullName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email} • {user.county}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={user.subscriptionType === "premium" ? "default" : "secondary"}>
                        {user.subscriptionType}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <Badge className="bg-yellow-100 text-yellow-800">75% Used</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache</span>
                <Badge className="bg-green-100 text-green-800">Optimal</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
