"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sprout,
  TrendingUp,
  Edit,
  DollarSign,
  ActivityIcon,
  Target,
  Clock,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import type { ProductionCycle, Activity } from "@/lib/types/production"
import { ActivityList } from "@/components/cycles/activity-list"
import { EditCycleModal } from "@/components/cycles/edit-cycle-modal"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

export default function CycleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cycle, setCycle] = useState<ProductionCycle | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    async function fetchCycleAndActivities() {
      setLoading(true)
      setError(null)
      try {
        const cycleId = Array.isArray(params.id) ? params.id[0] : params.id;
        const cycleRes = await apiClient.getCycle(cycleId)
        
        // Parse cycle dates
        const parsedCycle = {
          ...cycleRes,
          plantingDate: cycleRes.plantingDate ? new Date(cycleRes.plantingDate).toISOString() : null,
          estimatedHarvestDate: cycleRes.estimatedHarvestDate ? new Date(cycleRes.estimatedHarvestDate).toISOString() : null,
          actualHarvestDate: cycleRes.actualHarvestDate ? new Date(cycleRes.actualHarvestDate).toISOString() : null,
          createdAt: cycleRes.createdAt ? new Date(cycleRes.createdAt).toISOString() : null,
          updatedAt: cycleRes.updatedAt ? new Date(cycleRes.updatedAt).toISOString() : null,
        }
        setCycle(parsedCycle)

        // Fetch and parse activities
        const activitiesRes = await apiClient.getCycleActivities(cycleId)
        const parsedActivities = (Array.isArray(activitiesRes) ? activitiesRes : activitiesRes.data || [])
          .map((activity: Activity) => ({
            ...activity,
            scheduledDate: activity.scheduledDate ? new Date(activity.scheduledDate).toISOString() : null,
            completedDate: activity.completedDate ? new Date(activity.completedDate).toISOString() : null,
            createdAt: activity.createdAt ? new Date(activity.createdAt).toISOString() : null,
            updatedAt: activity.updatedAt ? new Date(activity.updatedAt).toISOString() : null,
          }))
        setActivities(parsedActivities)
      } catch (err: any) {
        console.error('Error fetching cycle data:', err)
        setError(err.message || "Failed to load cycle or activities")
      } finally {
        setLoading(false)
      }
    }
    fetchCycleAndActivities()
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!cycle) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="text-center py-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Cycle not found</h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">The production cycle you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/cycles")} className="mt-4">
            Back to Cycles
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status: ProductionCycle["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "harvested":
        return "bg-purple-100 text-purple-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateProgress = () => {
    if (!cycle.plantingDate || !cycle.estimatedHarvestDate) return 0;
    const plantingDate = new Date(cycle.plantingDate);
    const estimatedHarvestDate = new Date(cycle.estimatedHarvestDate);
    const totalDays = differenceInDays(estimatedHarvestDate, plantingDate);
    if (totalDays <= 0) return 0;
    const daysPassed = differenceInDays(new Date(), plantingDate);
    const progress = (daysPassed / totalDays) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  const getDaysRemaining = () => {
    if (!cycle.estimatedHarvestDate) return 0;
    const today = new Date();
    const harvestDate = cycle.actualHarvestDate ? 
      new Date(cycle.actualHarvestDate) : 
      new Date(cycle.estimatedHarvestDate);
    return differenceInDays(harvestDate, today);
  }

  const getNextActivity = () => {
    if (!activities.length) return null
    return activities
      .filter(activity => activity.status === "in_progress")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()
  const nextActivity = getNextActivity()
  const expectedRevenue = (cycle.expectedYield || 0) * (cycle.expectedPricePerKg || 0)
  const actualRevenue = (cycle.actualYield || 0) * (cycle.actualPricePerKg || 0)
  
  // Calculate total cost from all activities
  const totalCost = activities.reduce((sum, activity) => {
    let cost = 0
    if (typeof activity.cost === 'string') {
      const parsed = parseFloat(activity.cost)
      cost = isNaN(parsed) ? 0 : parsed
    } else if (typeof activity.cost === 'number') {
      cost = isNaN(activity.cost) ? 0 : activity.cost
    }
    return sum + cost
  }, 0)
  const completedActivities = cycle.activities?.filter((a) => a.status === "completed").length || 0
  const totalActivities = cycle.activities?.length || 0

  const handleCycleUpdate = (updatedCycle: ProductionCycle) => {
    setCycle(updatedCycle)
    toast({
      title: "Success",
      description: "Production cycle updated successfully",
    })
  }

  const handleActivityUpdate = (cycleId: string, updatedActivity: Activity) => {
    if (!cycle) return

    const updatedActivities =
      cycle.activities?.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity)) || []

    setCycle({
      ...cycle,
      activities: updatedActivities,
    })
  }

  const handleActivityAdd = (cycleId: string, newActivity: Activity) => {
    if (!cycle) return

    setCycle({
      ...cycle,
      activities: [...(cycle.activities || []), newActivity],
    })
  }

  // Helper function to safely format numbers
  const formatNumber = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(Number(value))) return "N/A";
    return Number(value).toFixed(decimals);
  };

  // Helper function to format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value))) return "N/A";
    return `KSh ${Number(value).toLocaleString()}`;
  };

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-3 min-w-0 flex-1">
                      <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard/cycles")}
            className="w-fit text-agri-700 hover:bg-agri-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cycles
          </Button>
            
            <div className="space-y-2">
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Sprout className="h-5 w-5 sm:h-6 sm:w-6 text-agri-600 flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl font-bold truncate text-agri-800">{cycle.cropVariety?.name || "Unknown Variety"}</h1>
                </div>
                <Badge className={`${getStatusColor(cycle.status)} text-xs px-2 py-1 flex-shrink-0`}>
                  {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                </Badge>
              </div>
              
              <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-agri-600">
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{cycle.farmLocation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{cycle.landSizeAcres} acres</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowEditModal(true)} 
            className="w-full sm:w-auto flex-shrink-0 bg-agri-700 hover:bg-agri-800"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Cycle
          </Button>
        </div>

        {/* Progress Overview */}
        <Card className="bg-agri-50 border-agri-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-agri-800">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-agri-600" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Cycle Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 sm:h-3" />
              <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:space-y-0 text-xs text-gray-500">
                <span>Planted: {cycle.plantingDate ? format(new Date(cycle.plantingDate), "MMM dd, yyyy") : "N/A"}</span>
                <span>
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : cycle.status === "harvested"
                      ? "Harvested"
                      : "Ready to harvest"}
                </span>
              </div>
            </div>

            {nextActivity && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-800 text-xs sm:text-sm">Next Activity</span>
                </div>
                <div className="text-xs sm:text-sm text-blue-700">
                  {nextActivity.description} - {format(new Date(nextActivity.scheduledDate), "MMM dd, yyyy")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Activities & Progress Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ActivityIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sage-600" />
                Activities & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-sage-700">
                    {completedActivities}/{totalActivities}
                  </p>
                  <p className="text-sm text-gray-600">Activities Completed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-xl font-semibold text-sage-600">{Math.round(progress)}%</p>
                  <p className="text-xs text-gray-500">Cycle Progress</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Started: {cycle.plantingDate ? format(new Date(cycle.plantingDate), "MMM dd") : "N/A"}</span>
                  <span>Target: {cycle.estimatedHarvestDate ? format(new Date(cycle.estimatedHarvestDate), "MMM dd") : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-sage-600" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg sm:text-xl font-bold text-red-600">
                    KSh {isNaN(totalCost) ? '0' : (totalCost / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-gray-600">Total Investment</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">
                    KSh {(() => {
                      const revenue = cycle.status === "harvested" && actualRevenue > 0 ? actualRevenue : expectedRevenue
                      return isNaN(revenue) ? '0' : (revenue / 1000).toFixed(0)
                    })()}k
                  </p>
                  <p className="text-xs text-gray-600">
                    {cycle.status === "harvested" && actualRevenue > 0 ? "Actual" : "Expected"} Revenue
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Profit:</span>
                  <span className={`text-lg sm:text-xl font-bold ${
                    (cycle.status === "harvested" && actualRevenue > 0 ? actualRevenue : expectedRevenue) - totalCost > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    KSh {(((cycle.status === "harvested" && actualRevenue > 0 ? actualRevenue : expectedRevenue) - totalCost) / 1000).toFixed(0)}k
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ROI: {totalCost > 0 ? (((cycle.status === "harvested" && actualRevenue > 0 ? actualRevenue : expectedRevenue) / totalCost - 1) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cycle Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-sage-600" />
                Cycle Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planting Date</p>
                  <p className="text-sm">{format(cycle.plantingDate, "MMM dd, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">Expected Harvest</p>
                  <p className="text-sm">
                    {cycle.estimatedHarvestDate ? 
                      format(new Date(cycle.estimatedHarvestDate), "MMM dd, yyyy") : 
                      "Not set"}
                  </p>
                </div>
              </div>
              
              {cycle.actualHarvestDate && (
                <div className="p-2 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Harvested</p>
                  <p className="text-sm text-green-700">{format(cycle.actualHarvestDate, "MMM dd, yyyy")}</p>
                </div>
              )}
              
              <div className="text-center pt-2 border-t">
                <p className="text-lg sm:text-xl font-bold text-sage-700">
                  {daysRemaining > 0 ? `${daysRemaining} days` : "Ready"}
                </p>
                <p className="text-xs text-gray-600">
                  {daysRemaining > 0 ? "remaining" : "to harvest"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Farm Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sprout className="h-4 w-4 sm:h-5 sm:w-5 text-sage-600" />
                Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Crop Variety</p>
                  <p className="text-sm">{cycle.cropVariety?.name}</p>
                  <p className="text-xs text-gray-500">({cycle.cropVariety?.cropType})</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Land Size</p>
                  <p className="text-sm font-semibold">{cycle.landSizeAcres} acres</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <p className="text-sm truncate">{cycle.farmLocation}</p>
                {cycle.farmLocationLat && cycle.farmLocationLng && (
                  <p className="text-xs text-gray-500">
                    {formatNumber(cycle.farmLocationLat, 4)}, {formatNumber(cycle.farmLocationLng, 4)}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected Yield</p>
                  <p className="text-sm font-semibold">{cycle.expectedYield?.toLocaleString() || 0} kg</p>
                </div>
                {cycle.actualYield && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actual Yield</p>
                    <p className="text-sm font-semibold text-green-600">{cycle.actualYield.toLocaleString()} kg</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activities Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityList
              activities={cycle.activities || []}
              cycleId={cycle.id}
              onActivityUpdate={handleActivityUpdate}
              onActivityAdd={handleActivityAdd}
            />
          </CardContent>
        </Card>
      </div>

      <EditCycleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        cycle={cycle}
        onUpdate={handleCycleUpdate}
      />
    </DashboardLayout>
  )
}
