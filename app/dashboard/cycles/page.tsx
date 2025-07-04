"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, TrendingUp, Sprout, DollarSign, BarChart3 } from "lucide-react"
import type { ProductionCycle, Activity } from "@/lib/types/production"
import { ProductionCycleCard } from "@/components/cycles/production-cycle-card"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { StatsCard } from "@/components/shared/stats-card"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

export default function CyclesPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  useEffect(() => {
    async function fetchCycles() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiClient.getCycles() as { data: ProductionCycle[] } | ProductionCycle[]
        setCycles(Array.isArray(res) ? res : res.data || [])
      } catch (err: any) {
        setError("Failed to load cycles")
        console.error("Error fetching cycles:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchCycles()
  }, [])

  // Filter and sort cycles
  const filteredCycles = cycles
    .filter((cycle) => {
      const matchesSearch =
        cycle.cropVariety?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cycle.farmLocation.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || cycle.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case "oldest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "harvest_date":
          return new Date(a.estimatedHarvestDate || 0).getTime() - new Date(b.estimatedHarvestDate || 0).getTime()
        case "land_size":
          return b.landSizeAcres - a.landSizeAcres
        default:
          return 0
      }
    })

  // Calculate summary statistics
  const totalCycles = cycles.length
  const activeCycles = cycles.filter((c) => c.status === "active").length
  
  // Calculate total investment (sum of all activities' costs)
  const totalInvestment = cycles.reduce((sum, cycle) => {
    const activityCosts = cycle.activities?.reduce((acc, activity) => 
      acc + (typeof activity.cost === 'string' ? parseFloat(activity.cost) : activity.cost || 0), 0) || 0;
    return sum + activityCosts;
  }, 0);

  // Calculate expected revenue
  const expectedRevenue = cycles.reduce((sum, cycle) => {
    const cycleRevenue = cycle.status === "harvested" && cycle.actualYield && cycle.actualPricePerKg
      ? cycle.actualYield * cycle.actualPricePerKg
      : (cycle.expectedYield || 0) * (cycle.expectedPricePerKg || 0);
    return sum + cycleRevenue;
  }, 0);

  // Format large numbers to K/M format
  const formatLargeNumber = (num: number): number => {
    if (num >= 1000000) {
      return Number((num / 1000000).toFixed(1));
    }
    if (num >= 1000) {
      return Number((num / 1000).toFixed(1));
    }
    return Number(num.toFixed(0));
  };

  // Format date safely
  const formatDate = (date: Date | string | undefined): Date => {
    if (!date) return new Date();
    return typeof date === 'string' ? new Date(date) : date;
  };

  const handleCycleUpdate = (updatedCycle: ProductionCycle) => {
    setCycles(prevCycles => 
      prevCycles.map(cycle => 
        cycle.id === updatedCycle.id ? updatedCycle : cycle
      )
    )
  }

  const handleCycleDelete = (cycleId: string) => {
    setCycles(prevCycles => prevCycles.filter(cycle => cycle.id !== cycleId))
  }

  const handleActivityUpdate = (cycleId: string, updatedActivity: Activity) => {
    setCycles(prevCycles => 
      prevCycles.map(cycle => {
        if (cycle.id !== cycleId) return cycle
        return {
          ...cycle,
          activities: cycle.activities?.map(activity =>
            activity.id === updatedActivity.id ? updatedActivity : activity
          )
        }
      })
    )
  }

  const handleActivityAdd = (cycleId: string, newActivity: Activity) => {
    setCycles(prevCycles => 
      prevCycles.map(cycle => {
        if (cycle.id !== cycleId) return cycle
        return {
          ...cycle,
          activities: [...(cycle.activities || []), newActivity]
        }
      })
    )
  }

  const handleActivityDelete = (cycleId: string, activityId: string) => {
    setCycles(prevCycles => 
      prevCycles.map(cycle => {
        if (cycle.id !== cycleId) return cycle
        return {
          ...cycle,
          activities: cycle.activities?.filter(activity => activity.id !== activityId)
        }
      })
    )
  }

  const handleDeleteAllActivities = (cycleId: string) => {
    setCycles(prevCycles => 
      prevCycles.map(cycle => {
        if (cycle.id !== cycleId) return cycle
        return {
          ...cycle,
          activities: []
        }
      })
    )
  }

  const handleViewDetails = (cycleId: string) => {
    router.push(`/dashboard/cycles/${cycleId}`)
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Stats */}
        <div className="grid gap-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Production Cycles</h1>
              <p className="text-sm text-muted-foreground sm:text-base">Manage your farming cycles and track progress</p>
            </div>
            <Button 
              onClick={() => router.push("/dashboard/cycles/new")} 
              className="bg-sage-700 hover:bg-sage-800 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Cycle
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatsCard
              title="Total Cycles"
              value={totalCycles}
              description="All production cycles"
              icon={Sprout}
              className="bg-white"
            />
            <StatsCard
              title="Active Cycles"
              value={activeCycles}
              description="Currently running"
              icon={TrendingUp}
              className="bg-white"
            />
            <StatsCard
              title="Total Investment"
              value={formatLargeNumber(totalInvestment)}
              suffix={totalInvestment >= 1000000 ? "M" : totalInvestment >= 1000 ? "K" : ""}
              prefix="KSh "
              description="Across all cycles"
              icon={DollarSign}
              className="bg-white"
            />
            <StatsCard
              title="Expected Revenue"
              value={formatLargeNumber(expectedRevenue)}
              suffix={expectedRevenue >= 1000000 ? "M" : expectedRevenue >= 1000 ? "K" : ""}
              prefix="KSh "
              description="Projected earnings"
              icon={BarChart3}
              className="bg-white"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cycles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="harvest_date">Harvest Date</SelectItem>
                <SelectItem value="land_size">Land Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cycles Grid */}
        <div className="grid gap-4">
          {error && (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-red-600">
                <p>{error}</p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
              </CardContent>
            </Card>
          ) : filteredCycles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                <Sprout className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">No production cycles found</h3>
                <p className="text-gray-600 text-center mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first production cycle"}
                </p>
                <Button onClick={() => router.push("/dashboard/cycles/new")} className="bg-sage-700 hover:bg-sage-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Cycle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCycles.map((cycle) => (
                <ProductionCycleCard
                  key={cycle.id}
                  cycle={cycle}
                  onUpdate={handleCycleUpdate}
                  onDelete={handleCycleDelete}
                  onActivityUpdate={handleActivityUpdate}
                  onActivityAdd={handleActivityAdd}
                  onActivityDelete={handleActivityDelete}
                  onDeleteAllActivities={handleDeleteAllActivities}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
