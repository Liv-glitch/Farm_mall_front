"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { StatsCard } from "@/components/shared/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Calendar, DollarSign, Activity, Calculator, BarChart3, Leaf, HeartPulse, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CostCalculatorModal } from "@/components/modals/cost-calculator-modal"
import { HarvestForecastModal } from "@/components/modals/harvest-forecast-modal"
import { UserSidebar } from "@/components/user/user-sidebar"
import { PlantAIModal } from "@/components/modals/plant-ai-modal"
import { apiClient } from "@/lib/api/client"
import type { ProductionCycle } from "@/lib/types/production"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [showCostCalculator, setShowCostCalculator] = useState(false)
  const [showHarvestForecast, setShowHarvestForecast] = useState(false)
  const [showPlantIdentify, setShowPlantIdentify] = useState(false)
  const [showPlantHealth, setShowPlantHealth] = useState(false)
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState(0)

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

  // Get the most recent activity
  const mostRecentActivity = cycles
    .flatMap(cycle => cycle.activities || [])
    .sort((a, b) => {
      const dateA = new Date(a.completedDate || a.scheduledDate).getTime();
      const dateB = new Date(b.completedDate || b.scheduledDate).getTime();
      return dateB - dateA;
    })[0];

  // Handle scroll snap
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollLeft;
    const cardWidth = container.offsetWidth;
    const newActiveCard = Math.round(scrollPosition / cardWidth);
    setActiveCard(newActiveCard);
  };

  // Navigate to add activity page
  const handleAddActivity = () => {
    if (cycles.filter(c => c.status === "active").length > 0) {
      router.push("/dashboard/cycles?action=add-activity")
    } else {
      router.push("/dashboard/cycles/new")
    }
  }

  if (!user || loading) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="flex flex-col space-y-4 pb-24 max-w-[100vw] overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col space-y-2 px-4 pt-4 md:px-6 md:pt-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate bg-gradient-to-r from-sage-800 to-sage-600 bg-clip-text text-transparent">
              Welcome back, {user.fullName}!
            </h1>
            <p className="text-sm text-muted-foreground">Here's what's happening with your farm today.</p>
          </div>
        </div>

        {/* Highlight Cards - Scrollable */}
        <div className="relative w-full">
          <div 
            className="flex space-x-4 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x snap-mandatory"
            onScroll={handleScroll}
          >
            {/* Quick Add Activity Card */}
            <Button 
              variant="ghost" 
              className="p-0 h-auto flex-shrink-0 w-[85vw] sm:w-[300px] snap-center group"
              onClick={handleAddActivity}
            >
              <Card className="w-full bg-gradient-to-br from-sage-500 to-sage-600 text-white group-hover:shadow-lg transition-all duration-300 border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="font-semibold text-lg">Quick Add Activity</h3>
                      <p className="text-sm text-white/80">Log your farming activities</p>
                    </div>
                    <div className="p-2 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Button>

            {/* Latest Activity Card */}
            <Button
              variant="ghost"
              className="p-0 h-auto flex-shrink-0 w-[85vw] sm:w-[300px] snap-center group"
              onClick={() => router.push("/dashboard/cycles")}
            >
              <Card className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:shadow-lg transition-all duration-300 border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="font-semibold text-lg">Latest Activity</h3>
                    <p className="text-sm text-white/80">
                      {mostRecentActivity 
                        ? mostRecentActivity.description
                        : "No recent activities"}
                    </p>
                    {mostRecentActivity && (
                      <p className="text-xs text-white/60">
                        {new Date(mostRecentActivity.completedDate || mostRecentActivity.scheduledDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Button>

            {/* Next Harvest Card */}
            <Button
              variant="ghost"
              className="p-0 h-auto flex-shrink-0 w-[85vw] sm:w-[300px] snap-center group"
              onClick={() => setShowHarvestForecast(true)}
            >
              <Card className="w-full bg-gradient-to-br from-amber-500 to-amber-600 text-white group-hover:shadow-lg transition-all duration-300 border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="font-semibold text-lg">Next Harvest</h3>
                    <p className="text-sm text-white/80">
                      {nextHarvest 
                        ? `${nextHarvest.cropVariety?.name} in ${daysToHarvest} days`
                        : "No active harvests"}
                    </p>
                    {nextHarvest && (
                      <p className="text-xs text-white/60">
                        Expected: {new Date(nextHarvest.estimatedHarvestDate!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Button>
          </div>
          {/* Swipe Indicators */}
          <div className="flex justify-center space-x-2 mt-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeCard 
                    ? "w-6 bg-sage-600" 
                    : "w-1.5 bg-sage-600/30"
                }`}
              />
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 px-4 md:px-6">
          <Button
            variant="ghost"
            className="p-0 h-auto w-full group"
            onClick={() => router.push("/dashboard/cycles")}
          >
            <StatsCard 
              title="Active Cycles" 
              value={activeCycles} 
              description="Currently running"
              icon={Activity}
              className="w-full bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/50 dark:to-background/50 group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-300"
            />
          </Button>
          <Button
            variant="ghost"
            className="p-0 h-auto w-full group"
            onClick={() => setShowCostCalculator(true)}
          >
            <StatsCard
              title="Total Investment"
              value={formatLargeNumber(totalInvestment)}
              description="Total cost"
              icon={DollarSign}
              prefix="KSh "
              suffix={totalInvestment >= 1000000 ? "M" : totalInvestment >= 1000 ? "K" : ""}
              className="w-full bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-background/50 group-hover:shadow-lg group-hover:scale-[1.02] transition-all duration-300"
            />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 md:px-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/dashboard/cycles" className="block">
              <Card className="group hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-background/80">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-2 sm:p-3 rounded-full bg-sage-100 dark:bg-sage-900/20 group-hover:scale-110 transition-transform duration-300">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-sage-600" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base">Cycles</h3>
                </CardContent>
              </Card>
            </Link>

            <Button 
              className="p-0 h-auto" 
              variant="ghost"
              onClick={() => setShowCostCalculator(true)}
            >
              <Card className="w-full group hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-background/80">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-2 sm:p-3 rounded-full bg-sage-100 dark:bg-sage-900/20 group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-sage-600" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base">Calculator</h3>
                </CardContent>
              </Card>
            </Button>

            <Button 
              className="p-0 h-auto" 
              variant="ghost"
              onClick={() => setShowHarvestForecast(true)}
            >
              <Card className="w-full group hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-background/80">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-2 sm:p-3 rounded-full bg-warm-100 dark:bg-warm-900/20 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-warm-600" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base">Forecast</h3>
                </CardContent>
              </Card>
            </Button>

            <Button 
              className="p-0 h-auto" 
              variant="ghost"
              onClick={() => setShowPlantIdentify(true)}
            >
              <Card className="w-full group hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-background/80">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-2 sm:p-3 rounded-full bg-green-100 dark:bg-green-900/20 group-hover:scale-110 transition-transform duration-300">
                    <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base">Identify</h3>
                </CardContent>
              </Card>
            </Button>

            <Button 
              className="p-0 h-auto" 
              variant="ghost"
              onClick={() => setShowPlantHealth(true)}
            >
              <Card className="w-full group hover:shadow-lg transition-all duration-300 h-full bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-background/80">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-2 sm:p-3 rounded-full bg-red-100 dark:bg-red-900/20 group-hover:scale-110 transition-transform duration-300">
                    <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base">Health</h3>
                </CardContent>
              </Card>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-background/80">
            <CardContent className="p-2 sm:p-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-background/80 transition-colors duration-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Tomato seeds planted</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-background/80 transition-colors duration-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Fertilizer applied to maize field</p>
                    <p className="text-xs text-muted-foreground">5 days ago</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-background/80 transition-colors duration-200">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Irrigation system checked</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <CostCalculatorModal open={showCostCalculator} onOpenChange={setShowCostCalculator} />
        <HarvestForecastModal open={showHarvestForecast} onOpenChange={setShowHarvestForecast} />
        <PlantAIModal 
          open={showPlantIdentify} 
          onOpenChange={setShowPlantIdentify}
          mode="identify"
        />
        <PlantAIModal 
          open={showPlantHealth} 
          onOpenChange={setShowPlantHealth}
          mode="health"
        />
      </div>
    </DashboardLayout>
  )
}
