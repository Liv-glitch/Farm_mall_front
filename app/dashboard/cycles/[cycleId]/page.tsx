"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  Sprout,
  Edit,
  ActivityIcon,
  Bell,
  Package,
  Plus,
  ReceiptText,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import type { Activity, ActivityPrefill, ProductionCycle } from "@/lib/types/production"
import { ActivityList } from "@/components/cycles/activity-list"
import { AddActivityModal } from "@/components/cycles/add-activity-modal"
import { EditCycleModal } from "@/components/cycles/edit-cycle-modal"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { calendarItemToActivityPrefill, getNextCalendarItem } from "@/lib/production/activity-calendar"

export default function CycleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cycle, setCycle] = useState<ProductionCycle | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddActivityModal, setShowAddActivityModal] = useState(false)
  const [activityPrefill, setActivityPrefill] = useState<ActivityPrefill | null>(null)

  useEffect(() => {
    async function fetchCycleAndActivities() {
      setLoading(true)
      setError(null)
      try {
        const cycleId = Array.isArray(params.cycleId) ? params.cycleId[0] : params.cycleId
        const cycleRes = await apiClient.getCycle(cycleId)

        const parsedCycle = {
          ...cycleRes,
          plantingDate: cycleRes.plantingDate ? new Date(cycleRes.plantingDate).toISOString() : null,
          estimatedHarvestDate: cycleRes.estimatedHarvestDate ? new Date(cycleRes.estimatedHarvestDate).toISOString() : null,
          actualHarvestDate: cycleRes.actualHarvestDate ? new Date(cycleRes.actualHarvestDate).toISOString() : null,
          createdAt: cycleRes.createdAt ? new Date(cycleRes.createdAt).toISOString() : null,
          updatedAt: cycleRes.updatedAt ? new Date(cycleRes.updatedAt).toISOString() : null,
        }
        setCycle(parsedCycle)

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
        console.error("Error fetching cycle data:", err)
        setError(err.message || "Failed to load cycle or activities")
      } finally {
        setLoading(false)
      }
    }
    fetchCycleAndActivities()
  }, [params.cycleId])

  if (loading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!cycle) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="py-12 text-center">
          <h2 className="text-xl font-extrabold text-primary-900 sm:text-2xl">Production cycle not found</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {error || "The production cycle you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/dashboard/cycles")} className="mt-4">
            Back to Production Cycles
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status: ProductionCycle["status"]) => {
    switch (status) {
      case "active":
        return "bg-primary-100 text-primary-800"
      case "harvested":
        return "bg-amber-100 text-amber-800"
      case "archived":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const calculateProgress = () => {
    if (!cycle.plantingDate || !cycle.estimatedHarvestDate) return 0
    const plantingDate = new Date(cycle.plantingDate)
    const estimatedHarvestDate = new Date(cycle.estimatedHarvestDate)
    const totalDays = differenceInDays(estimatedHarvestDate, plantingDate)
    if (totalDays <= 0) return 0
    const daysPassed = differenceInDays(new Date(), plantingDate)
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  }

  const getDaysRemaining = () => {
    if (!cycle.estimatedHarvestDate) return null
    const harvestDate = cycle.actualHarvestDate ? new Date(cycle.actualHarvestDate) : new Date(cycle.estimatedHarvestDate)
    return differenceInDays(harvestDate, new Date())
  }

  const toNumber = (value: number | string | null | undefined) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const progress = calculateProgress()
  const actualYield = toNumber(cycle.actualYield)
  const actualPricePerKg = toNumber(cycle.actualPricePerKg)
  const actualRevenue =
    actualYield != null && actualYield > 0 && actualPricePerKg != null && actualPricePerKg > 0
      ? actualYield * actualPricePerKg
      : null
  const completedActivities = activities.filter((activity) => activity.status === "completed").length
  const totalActivities = activities.length
  const locationParts = [cycle.farmLocationName, cycle.farmSubcounty, cycle.farmCounty]
    .map((part) => part?.trim())
    .filter(Boolean)
  const displayLocation = locationParts.length > 0 ? locationParts.join(", ") : cycle.farmLocation || "Location not set"
  const displayCounty =
    cycle.farmCounty?.trim() ||
    cycle.farmLocation
      ?.split(",")
      .map((part) => part.trim())
      .find((part) => /county/i.test(part)) ||
    displayLocation

  const totalCost = activities.reduce((sum, activity) => {
    const parsed = Number(activity.cost)
    return sum + (Number.isFinite(parsed) ? parsed : 0)
  }, 0)
  const nextCalendarItem = getNextCalendarItem(cycle, activities)

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
    return `KSh ${Number(value).toLocaleString()}`
  }

  const handleCycleUpdate = (updatedCycle: ProductionCycle) => {
    setCycle(updatedCycle)
    toast({
      title: "Success",
      description: "Production cycle updated successfully",
    })
  }

  const handleActivityUpdate = (cycleId: string, updatedActivity: Activity) => {
    const updatedActivities = activities.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity))
    setActivities(updatedActivities)
    setCycle((prev) => (prev ? { ...prev, activities: updatedActivities } : prev))
  }

  const handleActivityAdd = (cycleId: string, newActivity: Activity) => {
    const updatedActivities = [...activities, newActivity]
    setActivities(updatedActivities)
    setCycle((prev) => (prev ? { ...prev, activities: updatedActivities } : prev))
  }

  const handleAddCalendarActivity = () => {
    if (!nextCalendarItem) return
    setActivityPrefill(calendarItemToActivityPrefill(nextCalendarItem))
    setShowAddActivityModal(true)
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="page-shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/cycles")}
            className="w-fit text-agri-700 hover:bg-agri-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Production Cycles
          </Button>

        </div>

        <Card className="overflow-hidden border-0 bg-primary-900 text-white shadow-card">
          <CardContent className="p-5 sm:p-7">
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Edit cycle"
                onClick={() => setShowEditModal(true)}
                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-4 lg:max-w-md">
                <Badge className={`${getStatusColor(cycle.status)} w-fit text-xs`}>
                  {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                </Badge>
                <div className="flex min-w-0 items-center gap-2">
                  <Sprout className="h-6 w-6 flex-shrink-0 text-primary-100" />
                  <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-4xl">
                    {cycle.cropVariety?.name || "Unknown Variety"}
                  </h1>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/10 p-4">
                  {nextCalendarItem ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary-100" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase text-primary-100">Next activity reminder</div>
                          <h2 className="mt-1 text-lg font-extrabold text-white">{nextCalendarItem.name}</h2>
                          <p className="mt-1 text-sm text-primary-50">
                            {nextCalendarItem.stage} • {format(nextCalendarItem.date, "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {nextCalendarItem.inputs.map((item) => (
                          <span key={item.name} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-primary-50">
                            {item.name}
                          </span>
                        ))}
                      </div>
                      <Button type="button" onClick={handleAddCalendarActivity} className="bg-white text-primary-900 hover:bg-primary-50">
                        <Plus className="mr-2 h-4 w-4" />
                        Add as activity
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary-100" />
                      <div>
                        <div className="text-xs font-bold uppercase text-primary-100">Activity calendar</div>
                        <p className="mt-1 text-sm text-primary-50">All suggested calendar activities have been added.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-xs text-primary-100">Crop Variety</div>
                  <div className="mt-1 truncate text-sm font-bold">{cycle.cropVariety?.name || "Not set"}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-xs text-primary-100">County</div>
                  <div className="mt-1 truncate text-sm font-bold">{displayCounty}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-xs text-primary-100">Land Size</div>
                  <div className="mt-1 text-sm font-bold">{cycle.landSizeAcres} acres</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-xs text-primary-100">Total Investment</div>
                  <div className="mt-1 text-sm font-bold">{formatCurrency(totalCost) || "Not added"}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-xs text-primary-100">Revenue</div>
                  <div className="mt-1 text-sm font-bold">{actualRevenue != null ? formatCurrency(actualRevenue) : "Not recorded"}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <div className="text-xs text-primary-100">Actual Yield</div>
                  <div className="mt-1 text-sm font-bold">{actualYield != null ? `${actualYield.toLocaleString()} kg` : "Not recorded"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-0 bg-white shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ActivityIcon className="h-5 w-5 text-primary-700" />
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 rounded-lg bg-primary-50 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-primary-950">Cycle progress</span>
                    <span className="font-bold text-primary-900">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="text-sm">
                  <div className="font-bold text-primary-950">{completedActivities}/{totalActivities}</div>
                  <div className="text-xs text-muted-foreground">Activities completed</div>
                </div>
                <div className="text-sm">
                  <div className="font-bold text-primary-950">{nextCalendarItem?.name || "Calendar complete"}</div>
                  <div className="text-xs text-muted-foreground">Next calendar activity</div>
                </div>
              </div>

              <ActivityList
                activities={activities}
                cycleId={cycle.id}
                onActivityUpdate={handleActivityUpdate}
                onActivityAdd={handleActivityAdd}
              />
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-5 w-5 text-primary-700" />
                Cost History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                {activities.filter((activity) => Number(activity.cost) > 0).length === 0 ? (
                  <div className="rounded-lg bg-primary-50 p-4 text-sm text-muted-foreground">
                    No activity costs have been recorded yet.
                  </div>
                ) : (
                  activities
                    .filter((activity) => Number(activity.cost) > 0)
                    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                    .map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-primary-100 bg-primary-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-primary-950">
                              {activity.description || activity.type.replace(/_/g, " ")}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Package className="h-3.5 w-3.5" />
                              <span className="truncate">{activity.type.replace(/_/g, " ")}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-sm font-extrabold text-primary-900">
                            {formatCurrency(Number(activity.cost))}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                <span className="font-bold text-primary-950">Total</span>
                <span className="font-extrabold text-primary-900">{formatCurrency(totalCost) || "KSh 0"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditCycleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        cycle={cycle}
        onUpdate={handleCycleUpdate}
      />
      <AddActivityModal
        isOpen={showAddActivityModal}
        onClose={() => {
          setShowAddActivityModal(false)
          setActivityPrefill(null)
        }}
        cycleId={cycle.id}
        onActivityAdd={handleActivityAdd}
        initialActivity={activityPrefill}
      />
    </DashboardLayout>
  )
}
