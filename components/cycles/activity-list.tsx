"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  AlertTriangle,
  DollarSign,
  Edit2,
  MoreHorizontal
} from "lucide-react"
import { format, isPast } from "date-fns"
import type { Activity, ProductionCycle } from "@/lib/types/production"
import { AddActivityModal } from "./add-activity-modal"
import { EditActivityModal } from "./edit-activity-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"

interface ActivityListProps {
  activities: Activity[]
  cycleId: string
  onActivityUpdate: (cycleId: string, activity: Activity) => void
  onActivityAdd: (cycleId: string, activity: Activity) => void
  onActivityDelete?: (cycleId: string, activityId: string) => void
  onDeleteAllActivities?: (cycleId: string) => void
  cycle?: ProductionCycle | null
  compact?: boolean
  showAddButton?: boolean
}

type ActivityStatusWithOverdue = Activity["status"] | "overdue"

// Helper function to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(Number(value))) return "N/A";
  return `KSh ${Number(value).toLocaleString()}`;
};

// Helper function to safely format status text
const formatStatus = (status: ActivityStatusWithOverdue | undefined): string => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").split(" ").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

// Helper function to parse and format inputs
const parseInputs = (inputs: string | any[] | undefined) => {
  if (!inputs) return null;

  try {
    // If it's already an array, return it
    if (Array.isArray(inputs)) return inputs;

    // If it's a string, try to parse it
    if (typeof inputs === 'string') {
      const parsed = JSON.parse(inputs);
      return Array.isArray(parsed) ? parsed : null;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse inputs:', error);
    return null;
  }
};

const getInputNames = (inputs: string | any[] | undefined) => {
  const parsedInputs = parseInputs(inputs)
  if (!parsedInputs || parsedInputs.length === 0) return "-"
  const names = parsedInputs
    .map((input: any) => String(input?.name || "").trim())
    .filter(Boolean)
  return names.length > 0 ? names.join(", ") : "-"
}

export function ActivityList({
  activities,
  cycleId,
  onActivityUpdate,
  onActivityAdd,
  onActivityDelete,
  onDeleteAllActivities,
  cycle,
  compact = false,
  showAddButton = true,
}: ActivityListProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [completingActivityId, setCompletingActivityId] = useState<string | null>(null)

  // Validate activity data before setting it for editing
  const handleEditActivity = (activity: Activity) => {
    // Ensure all required fields are present
    if (!activity.type) {
      console.error("Invalid activity data:", activity)
      return
    }
    setEditingActivity(activity)
  }

  // Helper function to format activity title
  const getActivityTitle = (activity: Activity): string => {
    const type = activity.type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
    return type
  }

  const getStatusColor = (status: ActivityStatusWithOverdue) => {
    switch (status) {
      case "in_progress":
        return "bg-amber-100 text-amber-800"
      case "completed":
        return "bg-primary-100 text-primary-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (activity: Activity) => {
    const isOverdue = activity.status === "in_progress" && isPast(activity.scheduledDate)
    
    if (activity.status === "completed") {
      return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
    }
    if (isOverdue) {
      return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
    }
    return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-maize-600" />
  }

  const handleMarkComplete = async (activity: Activity) => {
    try {
      setCompletingActivityId(activity.id)
      const updatedActivity = await apiClient.updateActivity(cycleId, {
        ...activity,
        id: activity.id,
        productionCycleId: activity.productionCycleId,
        status: "completed",
        completedDate: new Date().toISOString(),
      })
      onActivityUpdate(cycleId, updatedActivity)
      toast({
        title: "Activity completed",
        description: "The activity status has been updated.",
      })
    } catch (error: any) {
      toast({
        title: "Could not complete activity",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setCompletingActivityId(null)
    }
  }

  const completedActivities = activities.filter(a => a.status === "completed").length
  const totalActivities = activities.length
  const completionPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

  const sortedActivities = [...activities].sort((a, b) => {
    // Sort by status priority, then by date
    const statusPriority: Record<Activity["status"], number> = { 
      in_progress: 1, 
      completed: 2
    }
    
    const aPriority = statusPriority[a.status] || 99
    const bPriority = statusPriority[b.status] || 99
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  })

  return (
    <>
      <div className="space-y-4">
        {/* Header with Progress */}
        {!compact && (
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-extrabold text-primary-900">Activities Progress</h4>
              <span className="text-xs sm:text-sm font-bold text-muted-foreground">
                {completedActivities}/{totalActivities} completed
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>
        )}

        {/* Activities List */}
        <div className="space-y-3 pb-16 sm:pb-0">
          {sortedActivities.length === 0 ? (
            <Card className="border-0">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">No activities scheduled yet</p>
                {showAddButton && (
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    size="sm"
                    className="mt-3"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Activity
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            sortedActivities.map((activity) => {
              const isOverdue = activity.status === "in_progress" && isPast(activity.scheduledDate)
              const actualStatus: ActivityStatusWithOverdue = isOverdue ? "overdue" : activity.status

              return (
                <Card key={activity.id} className="border-0 transition-all hover:shadow-card">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(activity)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm sm:text-base font-extrabold truncate text-primary-900">
                              {getActivityTitle(activity)}
                            </h5>
                            {activity.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Badge className={`${getStatusColor(actualStatus)} text-xs`}>
                              {formatStatus(actualStatus)}
                            </Badge>
                            {activity.status !== "completed" && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleMarkComplete(activity)}
                                disabled={completingActivityId === activity.id}
                                className="h-8 bg-maize-500 px-2 text-xs text-primary-950 hover:bg-maize-400"
                              >
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                {completingActivityId === activity.id ? "Saving..." : "Mark complete"}
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit Activity
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(120px,0.7fr)_minmax(0,1fr)_auto] sm:items-center">
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {format(new Date(activity.scheduledDate), "MMM dd, yyyy")}
                            </span>
                          </div>

                          <div className="min-w-0 text-xs text-muted-foreground sm:text-sm">
                            <span className="truncate block">{getInputNames(activity.inputs)}</span>
                          </div>

                          <div className="flex items-center text-xs sm:justify-end sm:text-sm text-muted-foreground">
                            <DollarSign className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{formatCurrency(Number(activity.cost) || 0)}</span>
                          </div>
                        </div>

                        {activity.notes && (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            <strong>Notes:</strong> {activity.notes}
                          </div>
                        )}

                        {activity.completedDate && (
                          <div className="text-xs text-green-600 mt-2">
                            Completed on {format(new Date(activity.completedDate), "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Fixed Add Button on Mobile */}
        {showAddButton && (
        <div className="fixed bottom-5 left-0 right-0 px-5 sm:hidden z-50">
          <Button 
            onClick={() => setShowAddModal(true)} 
            size="lg"
            className="mx-auto flex h-14 w-full max-w-sm shadow-lift"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>
        )}

        {/* Desktop Add Button */}
        {showAddButton && (
        <div className="hidden sm:block">
          <Button 
            onClick={() => setShowAddModal(true)} 
            size="sm"
            className="w-auto ml-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>
        )}
      </div>

      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        cycleId={cycleId}
        cycle={cycle}
        onActivityAdd={onActivityAdd}
      />

      {editingActivity && (
        <EditActivityModal
          isOpen={true}
          onClose={() => setEditingActivity(null)}
          activity={editingActivity}
          onActivityUpdate={(updatedActivity) => {
            onActivityUpdate(cycleId, updatedActivity)
            setEditingActivity(null)
          }}
        />
      )}
    </>
  )
}
