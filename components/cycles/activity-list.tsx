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
import type { Activity } from "@/lib/types/production"
import { AddActivityModal } from "./add-activity-modal"
import { EditActivityModal } from "./edit-activity-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ActivityListProps {
  activities: Activity[]
  cycleId: string
  onActivityUpdate: (cycleId: string, activity: Activity) => void
  onActivityAdd: (cycleId: string, activity: Activity) => void
  onActivityDelete?: (cycleId: string, activityId: string) => void
  onDeleteAllActivities?: (cycleId: string) => void
}

type ActivityStatusWithOverdue = Activity["status"] | "overdue"

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

// Helper function to safely format status text
const formatStatus = (status: ActivityStatusWithOverdue | undefined): string => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").split(" ").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
};

// Helper function to format labor type
const formatLaborType = (laborType: string | undefined): string => {
  if (!laborType) return "N/A";
  
  // Handle new labor type format
  switch (laborType) {
    case "manual-family":
      return "Manual - Family";
    case "manual-hired":
      return "Manual - Hired";
    case "mechanized":
      return "Mechanized";
    // Legacy format fallback
    case "family":
      return "Manual - Family";
    case "hired":
      return "Manual - Hired";
    case "cooperative":
      return "Mechanized";
    default:
      return laborType.split("-").map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" - ");
  }
};

export function ActivityList({ activities, cycleId, onActivityUpdate, onActivityAdd, onActivityDelete, onDeleteAllActivities }: ActivityListProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

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
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
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
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-medium">Activities Progress</h4>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {completedActivities}/{totalActivities} completed
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-3 pb-16 sm:pb-0">
          {sortedActivities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">No activities scheduled yet</p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  size="sm"
                  className="mt-3 bg-sage-700 hover:bg-sage-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Activity
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedActivities.map((activity) => {
              const isOverdue = activity.status === "in_progress" && isPast(activity.scheduledDate)
              const actualStatus: ActivityStatusWithOverdue = isOverdue ? "overdue" : activity.status

              return (
                <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(activity)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm sm:text-base font-medium truncate">
                              {getActivityTitle(activity)}
                            </h5>
                            {activity.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Badge className={`${getStatusColor(actualStatus)} text-xs px-2 py-1`}>
                              {formatStatus(actualStatus)}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8">
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

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {format(new Date(activity.scheduledDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {formatNumber(Number(activity.laborHours), 1)} hours • {formatLaborType(activity.laborType)}
                            </span>
                          </div>

                          {Number(activity.cost) > 0 && (
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                              <DollarSign className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{formatCurrency(Number(activity.cost))}</span>
                            </div>
                          )}
                        </div>

                        {activity.inputs && (
                          <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                            <strong>Inputs:</strong> {activity.inputs}
                          </div>
                        )}

                        {activity.notes && (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            <strong>Notes:</strong> {activity.notes}
                          </div>
                        )}

                        {activity.completedDate && (
                          <div className="text-xs text-green-600 mt-2">
                            ✓ Completed on {format(new Date(activity.completedDate), "MMM dd, yyyy")}
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
        <div className="fixed bottom-4 left-0 right-0 px-4 sm:hidden z-50">
          <Button 
            onClick={() => setShowAddModal(true)} 
            size="lg"
            className="w-full bg-sage-700 hover:bg-sage-800 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>

        {/* Desktop Add Button */}
        <div className="hidden sm:block">
          <Button 
            onClick={() => setShowAddModal(true)} 
            size="sm"
            className="bg-sage-700 hover:bg-sage-800 w-auto ml-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </div>

      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        cycleId={cycleId}
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
