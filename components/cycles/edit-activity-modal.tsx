"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import type { Activity } from "@/lib/types/production"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

interface EditActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity
  onActivityUpdate: (activity: Activity) => void
}

export function EditActivityModal({ isOpen, onClose, activity, onActivityUpdate }: EditActivityModalProps) {
  const [loading, setLoading] = useState(false)

  // Helper function to format date for input
  const formatDateForInput = (date: string | Date | null | undefined): string => {
    if (!date) return ""
    if (date instanceof Date) {
      return date.toISOString().split("T")[0]
    }
    // If it's already a string, try to parse it as a date first
    try {
      const parsedDate = new Date(date)
      return parsedDate.toISOString().split("T")[0]
    } catch (e) {
      // If parsing fails, try to use the string directly if it's in YYYY-MM-DD format
      if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        return date.split("T")[0]
      }
      return ""
    }
  }

  const [formData, setFormData] = useState({
    type: activity.type,
    description: activity.description || "",
    scheduledDate: formatDateForInput(activity.scheduledDate),
    completedDate: formatDateForInput(activity.completedDate),
    status: activity.status,
    cost: Number(activity.cost),
    laborHours: Number(activity.laborHours),
    laborType: activity.laborType,
    inputs: activity.inputs || "",
    notes: activity.notes || "",
  })

  useEffect(() => {
    setFormData({
      type: activity.type,
      description: activity.description || "",
      scheduledDate: formatDateForInput(activity.scheduledDate),
      completedDate: formatDateForInput(activity.completedDate),
      status: activity.status,
      cost: Number(activity.cost),
      laborHours: Number(activity.laborHours),
      laborType: activity.laborType,
      inputs: activity.inputs || "",
      notes: activity.notes || "",
    })
  }, [activity])

  // Add validation for numeric fields
  const validateNumericField = (value: number, fieldName: string) => {
    // PostgreSQL numeric/decimal limits
    const MAX_SAFE_VALUE = 999999999999.99 // Common PostgreSQL numeric limit
    const MIN_SAFE_VALUE = 0

    if (value > MAX_SAFE_VALUE) {
      throw new Error(`${fieldName} value is too large. Maximum allowed is ${MAX_SAFE_VALUE}`)
    }
    if (value < MIN_SAFE_VALUE) {
      throw new Error(`${fieldName} cannot be negative`)
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate numeric fields
      const validatedCost = validateNumericField(formData.cost, "Cost")
      const validatedLaborHours = validateNumericField(formData.laborHours, "Labor hours")

      // Validate dates
      const scheduledDate = new Date(formData.scheduledDate)
      if (isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduled date")
      }

      let completedDate: Date | undefined = undefined
      if (formData.completedDate) {
        const date = new Date(formData.completedDate)
        if (isNaN(date.getTime())) {
          throw new Error("Invalid completed date")
        }
        completedDate = date
      }

      const activityData = {
        id: activity.id,
        productionCycleId: activity.productionCycleId, // API uses productionCycleId instead of cycleId
        userId: activity.userId,
        type: formData.type,
        description: formData.description,
        scheduledDate: scheduledDate.toISOString(),
        completedDate: completedDate?.toISOString() || null,
        status: formData.status,
        cost: validatedCost.toFixed(2), // Format as string with 2 decimal places
        laborHours: validatedLaborHours.toFixed(1), // Format as string with 1 decimal place
        laborType: formData.laborType,
        inputs: formData.inputs,
        notes: formData.notes,
        weather: activity.weather,
      }

      // Call the API to update the activity
      const updatedActivity = await apiClient.updateActivity(activity.productionCycleId, activityData)

      onActivityUpdate(updatedActivity)
      onClose()

      toast({
        title: "Activity Updated",
        description: "Activity has been successfully updated",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Update Activity",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh] md:max-h-[80vh]">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <DialogTitle>Edit {formData.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</DialogTitle>
          <DialogDescription>
            Update the details of this activity in your production cycle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="type">Activity Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: Activity["type"]) => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soil_preparation">Soil Preparation</SelectItem>
                <SelectItem value="planting">Planting</SelectItem>
                <SelectItem value="fertilization">Fertilization</SelectItem>
                <SelectItem value="irrigation">Irrigation</SelectItem>
                <SelectItem value="pest_control">Pest Control</SelectItem>
                <SelectItem value="disease_control">Disease Control</SelectItem>
                <SelectItem value="weeding">Weeding</SelectItem>
                <SelectItem value="harvesting">Harvesting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                required
              />
            </div>
            {formData.status === "completed" && (
              <div>
                <Label htmlFor="completedDate">Completed Date</Label>
                <Input
                  id="completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, completedDate: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Activity["status"]) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="laborType">Labor Type</Label>
              <Select
                value={formData.laborType}
                onValueChange={(value: Activity["laborType"]) => setFormData((prev) => ({ ...prev, laborType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual-family">Manual - Family</SelectItem>
                  <SelectItem value="manual-hired">Manual - Hired</SelectItem>
                  <SelectItem value="mechanized">Mechanized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Cost (KSh)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  try {
                    validateNumericField(value, "Cost")
                    setFormData((prev) => ({ ...prev, cost: value }))
                  } catch (error: any) {
                    toast({
                      title: "Invalid Input",
                      description: error.message,
                      variant: "destructive",
                    })
                  }
                }}
                placeholder="15000"
                min="0"
                max="999999999999.99"
                step="0.01"
                required
              />
            </div>
            <div>
              <Label htmlFor="laborHours">Labor Hours</Label>
              <Input
                id="laborHours"
                type="number"
                value={formData.laborHours}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  try {
                    validateNumericField(value, "Labor hours")
                    setFormData((prev) => ({ ...prev, laborHours: value }))
                  } catch (error: any) {
                    toast({
                      title: "Invalid Input",
                      description: error.message,
                      variant: "destructive",
                    })
                  }
                }}
                placeholder="8"
                min="0"
                max="999999999999.99"
                step="0.5"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="inputs">Required Inputs</Label>
            <Textarea
              id="inputs"
              value={formData.inputs}
              onChange={(e) => setFormData((prev) => ({ ...prev, inputs: e.target.value }))}
              placeholder="List any required materials, equipment, or inputs..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or instructions..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-sage-700 hover:bg-sage-800">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
