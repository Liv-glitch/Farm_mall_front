"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus } from "lucide-react"
import type { Activity } from "@/lib/types/production"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  cycleId: string
  onActivityAdd: (cycleId: string, activity: Activity) => void
}

// Activity templates for common farming activities
const activityTemplates = [
  {
    name: "Land Preparation",
    description: "Plowing and harrowing the field",
    type: "soil_preparation" as const,
    cost: 15000,
    laborHours: 8,
    laborType: "hired" as const,
    inputs: "Tractor, fuel",
    notes: "Ensure proper depth for plowing"
  },
  {
    name: "Planting",
    description: "Plant seeds or seedlings",
    type: "planting" as const,
    cost: 25000,
    laborHours: 12,
    laborType: "cooperative" as const,
    inputs: "Seeds, fertilizer",
    notes: "Follow recommended spacing"
  },
  {
    name: "Fertilizer Application",
    description: "Apply base fertilizer",
    type: "fertilization" as const,
    cost: 20000,
    laborHours: 6,
    laborType: "family" as const,
    inputs: "NPK fertilizer",
    notes: "Apply in the morning or evening"
  },
  {
    name: "First Weeding",
    description: "Remove weeds and apply top dressing",
    type: "weeding" as const,
    cost: 8000,
    laborHours: 8,
    laborType: "hired" as const,
    inputs: "Weeding tools, CAN fertilizer",
    notes: "Careful not to damage crop roots"
  },
  {
    name: "Pest Control",
    description: "Apply pesticides to control pests",
    type: "pest_control" as const,
    cost: 12000,
    laborHours: 4,
    laborType: "family" as const,
    inputs: "Pesticides, sprayer",
    notes: "Use protective gear"
  },
  {
    name: "Disease Control",
    description: "Apply fungicides to prevent diseases",
    type: "disease_control" as const,
    cost: 10000,
    laborHours: 4,
    laborType: "family" as const,
    inputs: "Fungicides, sprayer",
    notes: "Apply during dry weather"
  },
  {
    name: "Irrigation",
    description: "Water application to the crop",
    type: "irrigation" as const,
    cost: 6000,
    laborHours: 3,
    laborType: "family" as const,
    inputs: "Water pump, fuel",
    notes: "Check soil moisture first"
  },
  {
    name: "Harvesting",
    description: "Harvest the crop",
    type: "harvesting" as const,
    cost: 15000,
    laborHours: 16,
    laborType: "cooperative" as const,
    inputs: "Harvesting tools, bags",
    notes: "Ensure proper storage conditions"
  },
]

export function AddActivityModal({ isOpen, onClose, cycleId, onActivityAdd }: AddActivityModalProps) {
  const [loading, setLoading] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof activityTemplates)[0] | null>(null)

  // Helper function to format date for input
  const formatDateForInput = (date: string | Date | undefined): string => {
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
    name: "",
    type: "soil_preparation" as Activity["type"],
    description: "",
    scheduledDate: "",
    cost: 0,
    laborHours: 0,
    laborType: "family" as Activity["laborType"],
    inputs: "",
    notes: "",
  })

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

  const handleTemplateSelect = (template: (typeof activityTemplates)[0]) => {
    setSelectedTemplate(template)
    // Only set the type, keep other fields empty but use template values as placeholders
    setFormData({
      name: "",
      type: template.type,
      description: "",
      scheduledDate: "",
      cost: 0,
      laborHours: 0,
      laborType: "family",
      inputs: "",
      notes: "",
    })
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

      const activityData = {
        cycleId,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        scheduledDate: scheduledDate.toISOString(),
        status: "in_progress",
        cost: validatedCost.toFixed(2),
        laborHours: validatedLaborHours.toFixed(1),
        laborType: formData.laborType,
        inputs: formData.inputs,
        notes: formData.notes,
      }

      // Call the API to create the activity
      const newActivity = await apiClient.addActivity(cycleId, activityData)

      onActivityAdd(cycleId, newActivity)
      onClose()

      // Reset form
      setFormData({
        name: "",
        type: "soil_preparation",
        description: "",
        scheduledDate: "",
        cost: 0,
        laborHours: 0,
        laborType: "family",
        inputs: "",
        notes: "",
      })
      setSelectedTemplate(null)

      toast({
        title: "Activity Added",
        description: "New activity has been added to your production cycle",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Add Activity",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 sticky top-0 bg-white border-b">
          <DialogTitle>Add New Activity</DialogTitle>
          <DialogDescription>
            Add a new activity to your production cycle. You can use predefined templates or create a custom activity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
          {/* Template Selection */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <Button
                type="button"
                variant={useTemplate ? "default" : "outline"}
                onClick={() => setUseTemplate(true)}
                className="w-full sm:w-auto"
              >
                Use Template
              </Button>
              <Button
                type="button"
                variant={!useTemplate ? "default" : "outline"}
                onClick={() => setUseTemplate(false)}
                className="w-full sm:w-auto"
              >
                Custom Activity
              </Button>
            </div>

            {useTemplate && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 max-h-[300px] sm:max-h-none overflow-y-auto">
                {activityTemplates.slice(0, 6).map((template) => (
                  <Card
                    key={template.name}
                    className={`cursor-pointer transition-colors hover:bg-muted ${
                      selectedTemplate?.name === template.name ? "border-2 border-sage-600" : ""
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-2 sm:p-3">
                      <h4 className="font-medium text-xs sm:text-sm mb-1 line-clamp-1">{template.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2 hidden sm:block">{template.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Activity Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  placeholder={selectedTemplate ? selectedTemplate.name : "Enter activity name"}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Activity["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] sm:max-h-none overflow-y-auto">
                    <SelectItem value="soil_preparation">Soil Preparation</SelectItem>
                    <SelectItem value="planting">Planting</SelectItem>
                    <SelectItem value="fertilization">Fertilization</SelectItem>
                    <SelectItem value="weeding">Weeding</SelectItem>
                    <SelectItem value="pest_control">Pest Control</SelectItem>
                    <SelectItem value="disease_control">Disease Control</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                placeholder={selectedTemplate ? selectedTemplate.description : "Describe the activity"}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formatDateForInput(formData.scheduledDate)}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborType">Labor Type</Label>
                <Select
                  value={formData.laborType}
                  onValueChange={(value: Activity["laborType"]) => setFormData({ ...formData, laborType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family Labor</SelectItem>
                    <SelectItem value="hired">Hired Labor</SelectItem>
                    <SelectItem value="cooperative">Cooperative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (KSh)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost || ""}
                  placeholder={selectedTemplate ? `e.g., ${selectedTemplate.cost}` : "Enter cost"}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborHours">Labor Hours</Label>
                <Input
                  id="laborHours"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.laborHours || ""}
                  placeholder={selectedTemplate ? `e.g., ${selectedTemplate.laborHours}` : "Enter hours"}
                  onChange={(e) => setFormData({ ...formData, laborHours: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputs">Required Inputs</Label>
              <Input
                id="inputs"
                value={formData.inputs}
                placeholder={selectedTemplate ? selectedTemplate.inputs : "e.g., Seeds, fertilizer, tools"}
                onChange={(e) => setFormData({ ...formData, inputs: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                placeholder={selectedTemplate ? selectedTemplate.notes : "Any additional notes or reminders"}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t p-4 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-8">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Activity...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
