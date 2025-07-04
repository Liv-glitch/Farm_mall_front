"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { StatsCard } from "@/components/shared/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Calendar, DollarSign, Activity, Calculator, BarChart3, Leaf, HeartPulse } from "lucide-react"
import Link from "next/link"
import { CostCalculatorModal } from "@/components/modals/cost-calculator-modal"
import { HarvestForecastModal } from "@/components/modals/harvest-forecast-modal"
import { UserSidebar } from "@/components/user/user-sidebar"
import { PlantAIModal } from "@/components/modals/plant-ai-modal"
import { apiClient } from "@/lib/api/client"
import type { ProductionCycle } from "@/lib/types/production"

export default function DashboardPage() {
  const { user } = useAuth()
  const [showCostCalculator, setShowCostCalculator] = useState(false)
  const [showHarvestForecast, setShowHarvestForecast] = useState(false)
  const [showPlantIdentify, setShowPlantIdentify] = useState(false)
  const [showPlantHealth, setShowPlantHealth] = useState(false)
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.getProductionCycles()
        console.log('🔍 Raw API Response:', JSON.stringify(res, null, 2))
        const cyclesData = Array.isArray(res) ? res : []
        console.log('🔄 Cycles Data Structure:', cyclesData.map((c: ProductionCycle) => ({
          id: c.id,
          status: c.status,
          cropName: c.cropVariety?.name
        })))
        console.log('📊 Total Cycles:', cyclesData.length)
        setCycles(cyclesData)
      } catch (err) {
        console.error("Error fetching cycles:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate stats
  const activeCycles = cycles.filter(c => c.status === "active").length
  console.log('🎯 Active Cycles:', activeCycles)
  console.log('🔄 All Cycles Statuses:', cycles.map(c => c.status))
  
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

  // Get next harvest date and crop
  const nextHarvest = cycles
    .filter(c => c.status === "active" && c.estimatedHarvestDate)
    .sort((a, b) => new Date(a.estimatedHarvestDate!).getTime() - new Date(b.estimatedHarvestDate!).getTime())[0];

  const daysToHarvest = nextHarvest
    ? Math.max(0, Math.ceil((new Date(nextHarvest.estimatedHarvestDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (!user || loading) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Welcome back, {user.fullName}!</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Here's what's happening with your farm today.</p>
          </div>
          <Link href="/dashboard/cycles/new" className="flex-shrink-0">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:hidden">New Cycle</span>
              <span className="hidden sm:inline">New Production Cycle</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Active Cycles" 
            value={activeCycles} 
            description="Currently running"
            icon={Activity} 
          />
          <StatsCard
            title="Total Investment"
            value={formatLargeNumber(totalInvestment)}
            description="Total cost of all activities"
            icon={DollarSign}
            prefix="KSh "
            suffix={totalInvestment >= 1000000 ? "M" : totalInvestment >= 1000 ? "K" : ""}
          />
          <StatsCard 
            title="Expected Revenue" 
            value={formatLargeNumber(expectedRevenue)} 
            description="Projected revenue from all cycles"
            icon={TrendingUp}
            prefix="KSh "
            suffix={expectedRevenue >= 1000000 ? "M" : expectedRevenue >= 1000 ? "K" : ""}
          />
          <StatsCard 
            title="Days to Harvest" 
            value={daysToHarvest} 
            description={nextHarvest ? `Next: ${nextHarvest.cropVariety?.name || 'Unknown crop'}` : 'No active cycles'}
            icon={Calendar} 
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Production Cycles</CardTitle>
              <CardDescription className="text-sm">Manage your crop production cycles</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/cycles">
                <Button className="w-full">View All Cycles</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-sage-600" />
                <span>Cost Calculator</span>
              </CardTitle>
              <CardDescription className="text-sm">Calculate production costs for your crops</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-sage-700 hover:bg-sage-800 text-white" 
                onClick={() => setShowCostCalculator(true)}
              >
                Open Calculator
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-warm-600" />
                <span>Harvest Forecast</span>
              </CardTitle>
              <CardDescription className="text-sm">Predict your harvest yields and timing</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-warm-600 hover:bg-warm-700 text-white"
                onClick={() => setShowHarvestForecast(true)}
              >
                View Forecast
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span>Identify Plant</span>
              </CardTitle>
              <CardDescription className="text-sm">Upload a plant image to identify its species</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowPlantIdentify(true)}>
                Identify Plant
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <span>Assess Plant Health</span>
              </CardTitle>
              <CardDescription className="text-sm">Upload a plant image to assess health or disease</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowPlantHealth(true)}>
                Assess Health
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-sm">Your latest farming activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Tomato seeds planted</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Fertilizer applied to maize field</p>
                  <p className="text-xs text-muted-foreground">5 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Irrigation system checked</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculator Modals */}
      <CostCalculatorModal 
        open={showCostCalculator} 
        onOpenChange={setShowCostCalculator} 
      />
      <HarvestForecastModal 
        open={showHarvestForecast} 
        onOpenChange={setShowHarvestForecast} 
      />
      <PlantAIModal open={showPlantIdentify} onOpenChange={setShowPlantIdentify} mode="identify" />
      <PlantAIModal open={showPlantHealth} onOpenChange={setShowPlantHealth} mode="health" />
    </DashboardLayout>
  )
}
