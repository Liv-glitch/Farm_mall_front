"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, MapPin, Calendar, Sprout, TrendingUp, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import type { ProductionCycle, Activity } from "@/lib/types/production"
import { ActivityList } from "./activity-list"
import { EditCycleModal } from "./edit-cycle-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteWithActivitiesDialog, setShowDeleteWithActivitiesDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    const totalDays = differenceInDays(cycle.estimatedHarvestDate, cycle.plantingDate)
    const daysPassed = differenceInDays(new Date(), cycle.plantingDate)
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  }

  const getDaysRemaining = () => {
    const today = new Date()
    const harvestDate = cycle.actualHarvestDate || cycle.estimatedHarvestDate
    return differenceInDays(harvestDate, today)
  }

  const getNextActivity = () => {
    if (!cycle.activities) return null
    return cycle.activities
      .filter((activity) => activity.status === "in_progress")
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0]
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()
  const nextActivity = getNextActivity()
  const expectedRevenue = (cycle.expectedYield || 0) * (cycle.expectedPricePerKg || 0)
  const actualRevenue = (cycle.actualYield || 0) * (cycle.actualPricePerKg || 0)
  
  // Calculate total cost from all activities
  const totalCost = cycle.activities?.reduce((sum, activity) => {
    let cost = 0
    if (typeof activity.cost === 'string') {
      const parsed = parseFloat(activity.cost)
      cost = isNaN(parsed) ? 0 : parsed
    } else if (typeof activity.cost === 'number') {
      cost = isNaN(activity.cost) ? 0 : activity.cost
    }
    return sum + cost
  }, 0) || 0

  const handleViewDetails = () => {
    router.push(`/dashboard/cycles/${cycle.id}`)
  }

  const handleDeleteCycle = async (deleteActivities: boolean = false) => {
    try {
      setLoading(true)
      if (deleteActivities) {
        await apiClient.deleteAllActivities(cycle.id)
      }
      await apiClient.deleteCycle(cycle.id)
      onDelete?.(cycle.id)
      toast({
        title: "Cycle Deleted",
        description: "The production cycle has been successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cycle",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
      setShowDeleteWithActivitiesDialog(false)
    }
  }

  const handleActivityDelete = (cycleId: string, activityId: string) => {
    onActivityDelete?.(cycleId, activityId)
  }

  const handleDeleteAllActivities = (cycleId: string) => {
    onDeleteAllActivities?.(cycleId)
  }

  return (
    <>
      <Card 
        className="w-full hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
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
        <CardHeader className="pb-3">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="h-4 w-4 text-sage-600 flex-shrink-0" />
                  <h3 className="text-base font-semibold truncate">
                    {cycle.cropVariety?.name || "Unknown Variety"}
                  </h3>
                  <Badge className={`${getStatusColor(cycle.status)} text-xs px-2 py-0.5`}>
                    {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600">
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

              <div className="flex items-center gap-1 ml-2" data-prevent-navigation>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Cycle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (cycle.activities?.length > 0) {
                          setShowDeleteWithActivitiesDialog(true)
                        } else {
                          setShowDeleteDialog(true)
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Cycle
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{format(cycle.plantingDate, "MMM dd, yyyy")}</span>
                <span>
                  {daysRemaining > 0
                    ? `${daysRemaining} days left`
                    : cycle.status === "harvested"
                      ? "Harvested"
                      : "Ready to harvest"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-sage-700">
                KSh {isNaN(totalCost) ? '0' : (totalCost / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-gray-600">Cost</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-sage-700">
                KSh {(() => {
                  const revenue = cycle.status === "harvested" && actualRevenue > 0 ? actualRevenue : expectedRevenue
                  return isNaN(revenue) ? '0' : (revenue / 1000).toFixed(0)
                })()}k
              </div>
              <div className="text-xs text-gray-600">
                {cycle.status === "harvested" && actualRevenue > 0 ? "Revenue" : "Est. Revenue"}
              </div>
            </div>
          </div>

          {/* Next Activity Preview */}
          {nextActivity && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-blue-800">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="font-medium">Next:</span>
                <span className="truncate">{nextActivity.description}</span>
                <span className="ml-auto font-medium">
                  {format(nextActivity.scheduledDate, "MMM dd")}
                </span>
              </div>
            </div>
          )}

          {/* Activities Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when toggling activities
              setIsExpanded(!isExpanded);
            }}
            className="w-full mt-3 text-xs"
            data-prevent-navigation
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

      {/* Delete Cycle Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production cycle? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCycle(false)}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Cycle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Cycle with Activities Dialog */}
      <AlertDialog open={showDeleteWithActivitiesDialog} onOpenChange={setShowDeleteWithActivitiesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Production Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              This cycle has {cycle.activities?.length} activities. Would you like to:
              <ul className="mt-2 space-y-1">
                <li>• Delete all activities first, then delete the cycle</li>
                <li>• Or keep the activities and only delete the cycle</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={loading} className="sm:w-full">Cancel</AlertDialogCancel>
            <div className="flex gap-2 w-full">
              <AlertDialogAction
                onClick={() => handleDeleteCycle(false)}
                className="bg-red-600 hover:bg-red-700 flex-1"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Keep Activities"}
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => handleDeleteCycle(true)}
                className="bg-red-700 hover:bg-red-800 flex-1"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete All"}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
