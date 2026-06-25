"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sprout,
  Edit,
  ActivityIcon,
  Clock,
  ShoppingBag,
  Target,
  Loader2,
  AlertCircle,
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
  const [expectedYieldInput, setExpectedYieldInput] = useState("")
  const [expectedPriceInput, setExpectedPriceInput] = useState("")
  const [savingProjection, setSavingProjection] = useState(false)
  const [projectionError, setProjectionError] = useState<string | null>(null)

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
        setExpectedYieldInput(parsedCycle.expectedYield ? String(parsedCycle.expectedYield) : "")
        setExpectedPriceInput(parsedCycle.expectedPricePerKg ? String(parsedCycle.expectedPricePerKg) : "")

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

  const getNextActivity = () => {
    if (!activities.length) return null
    return activities
      .filter((activity) => activity.status === "in_progress")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
  }

  const toNumber = (value: number | string | null | undefined) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()
  const nextActivity = getNextActivity()
  const expectedYield = toNumber(cycle.expectedYield)
  const expectedPricePerKg = toNumber(cycle.expectedPricePerKg)
  const hasProjection = expectedYield != null && expectedYield > 0 && expectedPricePerKg != null && expectedPricePerKg > 0
  const expectedRevenue = hasProjection ? expectedYield * expectedPricePerKg : null
  const actualRevenue = cycle.actualYield && cycle.actualPricePerKg ? cycle.actualYield * cycle.actualPricePerKg : null
  const displayedRevenue = cycle.status === "harvested" && actualRevenue ? actualRevenue : expectedRevenue
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

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
    return `KSh ${Number(value).toLocaleString()}`
  }

  const handleCycleUpdate = (updatedCycle: ProductionCycle) => {
    setCycle(updatedCycle)
    setExpectedYieldInput(updatedCycle.expectedYield ? String(updatedCycle.expectedYield) : "")
    setExpectedPriceInput(updatedCycle.expectedPricePerKg ? String(updatedCycle.expectedPricePerKg) : "")
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

  const handleProjectionSave = async () => {
    setProjectionError(null)
    const nextYield = Number(expectedYieldInput)
    const nextPrice = Number(expectedPriceInput)

    if (!Number.isFinite(nextYield) || nextYield <= 0 || !Number.isFinite(nextPrice) || nextPrice <= 0) {
      setProjectionError("Enter expected yield and expected price using numbers greater than zero.")
      return
    }

    try {
      setSavingProjection(true)
      const updatedCycle = await apiClient.updateCycle({
        id: cycle.id,
        expectedYield: nextYield,
        expectedPricePerKg: nextPrice,
      }) as ProductionCycle
      setCycle((prev) => prev ? { ...prev, ...updatedCycle, expectedYield: nextYield, expectedPricePerKg: nextPrice } : updatedCycle)
      toast({
        title: "Projection saved",
        description: "Expected yield and price have been added to this cycle.",
      })
    } catch (err: any) {
      const message = err.message || "Could not save the expected yield and price."
      setProjectionError(message)
      toast({
        title: "Projection not saved",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSavingProjection(false)
    }
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

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={() => window.open("https://findfarmers.onrender.com/#/register-farmer", "_blank")}
              className="w-full bg-blue-600 text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg sm:w-auto"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Find Market
            </Button>
          </div>
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
              <div className="min-w-0 space-y-4">
                <Badge className={`${getStatusColor(cycle.status)} w-fit text-xs`}>
                  {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                </Badge>
                <div className="flex min-w-0 items-center gap-2">
                  <Sprout className="h-6 w-6 flex-shrink-0 text-primary-100" />
                  <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-4xl">
                    {cycle.cropVariety?.name || "Unknown Variety"}
                  </h1>
                </div>
                <div className="flex flex-col gap-2 text-sm text-primary-50 sm:flex-row sm:flex-wrap sm:gap-4">
                  <span className="flex min-w-0 items-center gap-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{displayLocation}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    {cycle.landSizeAcres} acres
                  </span>
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
                {hasProjection && (
                  <div className="rounded-lg bg-white/10 p-3">
                    <div className="text-xs text-primary-100">Expected Yield</div>
                    <div className="mt-1 text-sm font-bold">{expectedYield.toLocaleString()} kg</div>
                  </div>
                )}
                {displayedRevenue != null && (
                  <div className="rounded-lg bg-white/10 p-3">
                    <div className="text-xs text-primary-100">Expected Revenue</div>
                    <div className="mt-1 text-sm font-bold">{formatCurrency(displayedRevenue)}</div>
                  </div>
                )}
              </div>
            </div>

            {!hasProjection && (
              <div className="mt-5 rounded-lg border border-white/15 bg-white/10 p-4">
                <div className="flex items-start gap-2 text-sm text-primary-50">
                  <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>Add expected yield and price to calculate projected revenue.</p>
                </div>
                {projectionError && (
                  <Alert variant="destructive" className="mt-3 bg-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{projectionError}</AlertDescription>
                  </Alert>
                )}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div>
                    <Label htmlFor="expectedYield" className="text-primary-50">Enter expected yield(kg)</Label>
                    <Input
                      id="expectedYield"
                      type="number"
                      min="1"
                      value={expectedYieldInput}
                      onChange={(event) => setExpectedYieldInput(event.target.value)}
                      className="mt-2 bg-white text-primary-950"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedPricePerKg" className="text-primary-50">Enter expected price per kg (ksh)</Label>
                    <Input
                      id="expectedPricePerKg"
                      type="number"
                      min="1"
                      value={expectedPriceInput}
                      onChange={(event) => setExpectedPriceInput(event.target.value)}
                      className="mt-2 bg-white text-primary-950"
                    />
                  </div>
                  <Button type="button" onClick={handleProjectionSave} disabled={savingProjection} className="bg-white text-primary-900 hover:bg-primary-50">
                    {savingProjection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>
            )}
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
                  <div className="font-bold text-primary-950">{nextActivity?.description || "No activity in progress"}</div>
                  <div className="text-xs text-muted-foreground">Next activity</div>
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
                <Calendar className="h-5 w-5 text-primary-700" />
                Cycle Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-bold text-muted-foreground">Planting Date</div>
                  <div>{cycle.plantingDate ? format(new Date(cycle.plantingDate), "MMM dd, yyyy") : "Not set"}</div>
                </div>
                <div>
                  <div className="font-bold text-muted-foreground">Estimated Harvest</div>
                  <div>{cycle.estimatedHarvestDate ? format(new Date(cycle.estimatedHarvestDate), "MMM dd, yyyy") : "Not set"}</div>
                </div>
                {cycle.actualHarvestDate && (
                  <div className="rounded-lg bg-primary-50 p-3">
                    <div className="font-medium text-green-800">Harvested</div>
                    <div className="text-green-700">{format(new Date(cycle.actualHarvestDate), "MMM dd, yyyy")}</div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 text-center">
                <Clock className="mx-auto mb-2 h-5 w-5 text-primary-700" />
                <div className="text-xl font-extrabold text-primary-900">
                  {daysRemaining == null
                    ? "Not set"
                    : daysRemaining > 0
                      ? `${daysRemaining} days`
                      : cycle.status === "harvested"
                        ? "Harvested"
                        : "Ready"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysRemaining != null && daysRemaining > 0 ? "remaining" : "timeline status"}
                </div>
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
    </DashboardLayout>
  )
}
