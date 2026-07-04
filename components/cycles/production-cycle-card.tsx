"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, MapPin, Calendar, Sprout, Edit, MoreHorizontal, Trash2, Plus, CheckCircle2, Archive } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import type { ProductionCycle, Activity } from "@/lib/types/production"
import { ActivityList } from "./activity-list"
import { EditCycleModal } from "./edit-cycle-modal"
import { AddActivityModal } from "./add-activity-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { getCurrentCropStage } from "@/lib/production/activity-calendar"

const FIELD_IMAGE_URL =
  "https://images.unsplash.com/photo-1625324455604-d75faf4b119b?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.1.0"
const HARVEST_IMAGE_URL =
  "https://images.unsplash.com/photo-1741003132104-cae831b691e8?fm=jpg&q=80&w=1200&auto=format&fit=crop"

interface ProductionCycleCardProps {
  cycle: ProductionCycle
  onUpdate: (cycle: ProductionCycle) => void
  onDelete?: (cycleId: string) => void
  onActivityUpdate: (cycleId: string, activity: Activity) => void
  onActivityAdd: (cycleId: string, activity: Activity) => void
  onActivityDelete?: (cycleId: string, activityId: string) => void
  onDeleteAllActivities?: (cycleId: string) => void
}

export function ProductionCycleCard({ 
  cycle, 
  onUpdate, 
  onDelete,
  onActivityUpdate, 
  onActivityAdd,
  onActivityDelete,
  onDeleteAllActivities 
}: ProductionCycleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getStatusColor = (status: ProductionCycle["status"]) => {
    switch (status) {
      case "active":
        return "bg-primary-100 text-primary-800"
      case "harvested":
        return "bg-amber-100 text-amber-800"
      case "archived":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateProgress = () => {
    const totalDays = differenceInDays(cycle.estimatedHarvestDate, cycle.plantingDate)
    const daysPassed = differenceInDays(new Date(), cycle.plantingDate)
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  }

  const getDaysRemaining = () => {
    const today = new Date()
    const harvestDate = cycle.actualHarvestDate || cycle.estimatedHarvestDate
    return differenceInDays(harvestDate, today)
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()
  const cardImageUrl = cycle.status === "harvested" ? HARVEST_IMAGE_URL : FIELD_IMAGE_URL
  const currentStage = getCurrentCropStage(cycle)
  const canMarkHarvested = cycle.status === "active" && progress >= 75
  const canArchive = cycle.status === "harvested"

  const handleViewDetails = () => {
    router.push(`/dashboard/cycles/${cycle.id}`)
  }

  const handleDeleteCycle = async () => {
    try {
      setLoading(true)
      await apiClient.deleteCycle(cycle.id)
      onDelete?.(cycle.id)
      toast({
        title: "Production cycle deleted",
        description: "The production cycle has been successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete production cycle",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const handleActivityDelete = (cycleId: string, activityId: string) => {
    onActivityDelete?.(cycleId, activityId)
  }

  const handleDeleteAllActivities = (cycleId: string) => {
    onDeleteAllActivities?.(cycleId)
  }

  const handleStatusAction = async (status: "harvested" | "archived") => {
    try {
      setLoading(true)
      const payload =
        status === "harvested"
          ? { id: cycle.id, status, actualHarvestDate: new Date().toISOString().split("T")[0] }
          : { id: cycle.id, status }
      const updatedCycle = await apiClient.updateCycle(payload) as Partial<ProductionCycle>
      onUpdate({ ...cycle, ...updatedCycle, activities: cycle.activities })
      toast({
        title: status === "harvested" ? "Cycle marked harvested" : "Cycle archived",
        description:
          status === "harvested"
            ? "Activity and financial reports have been generated."
            : "The production cycle has been archived.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update production cycle",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card 
        className="group w-full cursor-pointer overflow-hidden border-0 transition-all hover:-translate-y-1 hover:shadow-card"
        onClick={(e) => {
          // Prevent navigation if clicking on dropdown menu or buttons
          if (
            e.target instanceof Element && 
            (e.target.closest('[data-prevent-navigation]') || 
             e.target.closest('button'))
          ) {
            return;
          }
          router.push(`/dashboard/cycles/${cycle.id}`)
        }}
      >
        <div className="photo-card-image m-3 mb-0 aspect-[16/9]">
          <img src={cardImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-primary-950/10 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
            <div className="min-w-0 text-white">
              <div className="text-xs font-bold uppercase tracking-wide text-white/70">Crop tracker</div>
              <div className="truncate text-lg font-extrabold">{cycle.cropVariety?.name || "Unknown Variety"}</div>
            </div>
            <Badge className={`${getStatusColor(cycle.status)} shrink-0 text-xs`}>
              {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="h-4 w-4 text-primary-700 flex-shrink-0" />
                  <h3 className="text-base font-extrabold truncate text-primary-900">
                    {cycle.cropVariety?.name || "Unknown Variety"}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{cycle.farmLocation}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{cycle.landSizeAcres} acres</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2" data-prevent-navigation onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(event) => {
                      event.stopPropagation()
                      setShowEditModal(true)
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit record
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(event) => {
                        event.stopPropagation()
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete record
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Crop Stage */}
            <div className="rounded-lg bg-primary-50 p-3">
              <div className="flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Current crop stage</span>
                  <div className="mt-1 text-sm font-extrabold text-primary-900">{currentStage}</div>
                </div>
                <div className="shrink-0 text-right text-muted-foreground">
                  <div>{format(cycle.plantingDate, "MMM dd, yyyy")}</div>
                  <div>
                    {daysRemaining > 0
                      ? `${daysRemaining} days left`
                      : cycle.status === "harvested"
                        ? "Harvested"
                        : "Ready to harvest"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-2 sm:grid-cols-2" data-prevent-navigation>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-full bg-maize-500 text-primary-950 hover:bg-maize-400 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Activities
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Activities ({cycle.activities?.length || 0})
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddModal(true)
              }}
              className="w-full bg-maize-500 text-primary-950 hover:bg-maize-400 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Activity
            </Button>
          </div>

          {(canMarkHarvested || canArchive) && (
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={(event) => {
                event.stopPropagation()
                void handleStatusAction(canMarkHarvested ? "harvested" : "archived")
              }}
              className="mt-2 w-full bg-maize-500 text-primary-950 hover:bg-maize-400"
              data-prevent-navigation
            >
              {canMarkHarvested ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Harvested
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </Button>
          )}

          {/* Expanded Activities */}
          {isExpanded && cycle.activities && (
            <div className="mt-3 pt-3 border-t" data-prevent-navigation>
              <ActivityList
                activities={cycle.activities}
                cycleId={cycle.id}
                onActivityUpdate={onActivityUpdate}
                onActivityAdd={onActivityAdd}
                onActivityDelete={handleActivityDelete}
                onDeleteAllActivities={handleDeleteAllActivities}
                cycle={cycle}
                compact
                showAddButton={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <EditCycleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        cycle={cycle}
        onUpdate={onUpdate}
      />

      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        cycleId={cycle.id}
        cycle={cycle}
        onActivityAdd={onActivityAdd}
      />

      {/* Delete Production Cycle Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-prevent-navigation onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production cycle? This will also remove its activities and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.stopPropagation()
                void handleDeleteCycle()
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
