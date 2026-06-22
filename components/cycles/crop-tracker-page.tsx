"use client"

import { useEffect, useState } from "react"
import { Activity, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { Activity as CropActivity, ProductionCycle } from "@/lib/types/production"
import { ProductionCycleCard } from "./production-cycle-card"

const HARVEST_IMAGE_URL =
  "https://images.unsplash.com/photo-1741003132104-cae831b691e8?fm=jpg&q=80&w=1200&auto=format&fit=crop"

function normalizeCycle(cycle: ProductionCycle): ProductionCycle {
  return {
    ...cycle,
    plantingDate: new Date(cycle.plantingDate),
    estimatedHarvestDate: new Date(cycle.estimatedHarvestDate),
    actualHarvestDate: cycle.actualHarvestDate ? new Date(cycle.actualHarvestDate) : undefined,
    activities: (cycle.activities || []).map((activity) => ({
      ...activity,
      scheduledDate: new Date(activity.scheduledDate),
      completedDate: activity.completedDate ? new Date(activity.completedDate) : activity.completedDate,
    })),
  }
}

export function CropTrackerPage() {
  const { toast } = useToast()
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)

  const loadCycles = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getCycles()
      setCycles(Array.isArray(data) ? data.map(normalizeCycle) : [])
    } catch (error: any) {
      toast({
        title: "Failed to load production cycles",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCycles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateCycle = (updatedCycle: ProductionCycle) => {
    setCycles((current) => current.map((cycle) => (cycle.id === updatedCycle.id ? updatedCycle : cycle)))
  }

  const removeCycle = (cycleId: string) => {
    setCycles((current) => current.filter((cycle) => cycle.id !== cycleId))
  }

  const updateActivity = (cycleId: string, activity: CropActivity) => {
    setCycles((current) =>
      current.map((cycle) =>
        cycle.id === cycleId
          ? {
              ...cycle,
              activities: (cycle.activities || []).map((item) => (item.id === activity.id ? activity : item)),
            }
          : cycle
      )
    )
  }

  const addActivity = (cycleId: string, activity: CropActivity) => {
    setCycles((current) =>
      current.map((cycle) =>
        cycle.id === cycleId ? { ...cycle, activities: [...(cycle.activities || []), activity] } : cycle
      )
    )
  }

  const removeActivity = (cycleId: string, activityId: string) => {
    setCycles((current) =>
      current.map((cycle) =>
        cycle.id === cycleId
          ? { ...cycle, activities: (cycle.activities || []).filter((activity) => activity.id !== activityId) }
          : cycle
      )
    )
  }

  const removeAllActivities = (cycleId: string) => {
    setCycles((current) =>
      current.map((cycle) => (cycle.id === cycleId ? { ...cycle, activities: [] } : cycle))
    )
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">Production Cycles</h1>
          <p className="page-subtitle">
            Track crop progress, field activities, costs, and harvest timing.
          </p>
        </div>
        <Button className="sm:w-auto" disabled>
          New record
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Loading production cycles...
        </div>
      ) : cycles.length === 0 ? (
        <Card className="border-0 bg-white">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-5 h-28 w-full max-w-sm overflow-hidden rounded-2xl shadow-card">
              <img src={HARVEST_IMAGE_URL} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
              <Activity className="h-7 w-7 text-primary-700" />
            </div>
            <h3 className="font-extrabold text-primary-900">No production cycles yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start a production cycle from a completed farm preparation plan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cycles.map((cycle) => (
            <ProductionCycleCard
              key={cycle.id}
              cycle={cycle}
              onUpdate={updateCycle}
              onDelete={removeCycle}
              onActivityUpdate={updateActivity}
              onActivityAdd={addActivity}
              onActivityDelete={removeActivity}
              onDeleteAllActivities={removeAllActivities}
            />
          ))}
        </div>
      )}
    </div>
  )
}
