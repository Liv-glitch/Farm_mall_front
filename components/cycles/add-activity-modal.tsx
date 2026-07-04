"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { Activity, ActivityInput, ActivityPrefill, CreateActivityRequest, ProductionCycle } from "@/lib/types/production"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { getCurrentCropStage } from "@/lib/production/activity-calendar"

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  cycleId: string
  cycle?: ProductionCycle | null
  onActivityAdd: (cycleId: string, activity: Activity) => void
  initialActivity?: ActivityPrefill | null
}

const EMPTY_INPUT: ActivityInput = {
  name: "",
  quantity: 0,
  unit: "kg",
  cost: 0,
  brand: "",
  supplier: "",
}

const CROP_STAGE_OPTIONS = ["Planting", "Emergence", "Vegetative Growth", "Flowering", "Tuber bulking", "Maturity", "Other"]
const UNIT_OPTIONS = ["kg", "litres", "bags", "bottles", "packets", "grams", "ml", "sachets", "bunches"]

function activityTypeForStage(stage: string): Activity["type"] {
  switch (stage) {
    case "Planting":
    case "Emergence":
      return "planting"
    case "Vegetative Growth":
      return "fertilizing"
    case "Flowering":
    case "Tuber bulking":
    case "Maturity":
      return "pest_control"
    default:
      return "other"
  }
}

export function AddActivityModal({ isOpen, onClose, cycleId, cycle, onActivityAdd, initialActivity }: AddActivityModalProps) {
  const [loading, setLoading] = useState(false)

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
    cropStage: "",
    description: "",
    scheduledDate: "",
    laborHours: 0,
    laborType: "manual-family" as Activity["laborType"],
    laborCost: 0,
    notes: "",
  })

  const [inputs, setInputs] = useState<ActivityInput[]>([{ ...EMPTY_INPUT }])

  const resetForm = (prefill?: ActivityPrefill | null) => {
    const defaultStage = prefill?.cropStage || (cycle ? getCurrentCropStage(cycle) : "Planting")
    setFormData({
      name: prefill?.name || "",
      type: prefill?.type || activityTypeForStage(defaultStage),
      cropStage: defaultStage,
      description: prefill?.description || "",
      scheduledDate: formatDateForInput(prefill?.scheduledDate),
      laborHours: prefill?.laborHours || 0,
      laborType: prefill?.laborType || "manual-family",
      laborCost: prefill?.laborCost || 0,
      notes: prefill?.notes || "",
    })
    setInputs(prefill?.inputs?.length ? prefill.inputs : [{ ...EMPTY_INPUT }])
  }

  useEffect(() => {
    if (isOpen) {
      resetForm(initialActivity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialActivity])

  const addInput = () => {
    setInputs([...inputs, { ...EMPTY_INPUT }])
  }

  const updateInput = (index: number, field: keyof ActivityInput, value: string | number | boolean) => {
    const updatedInputs = [...inputs]
    updatedInputs[index] = { ...updatedInputs[index], [field]: value }
    setInputs(updatedInputs)
  }

  const setInputReusingStock = (index: number, reusing: boolean) => {
    const updatedInputs = [...inputs]
    updatedInputs[index] = {
      ...updatedInputs[index],
      reusedExistingStock: reusing,
      cost: reusing ? 0 : updatedInputs[index].cost,
    }
    setInputs(updatedInputs)
  }

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index))
    }
  }

  const calculateTotalCost = () => {
    const inputsCost = inputs.reduce((sum, input) => sum + (input.reusedExistingStock ? 0 : input.quantity * input.cost), 0)
    const laborCost = formData.laborCost || 0
    return inputsCost + laborCost
  }

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
      const validatedLaborHours = validateNumericField(formData.laborHours, "Labor hours")
      const validatedLaborCost = validateNumericField(formData.laborCost || 0, "Labor cost")

      // Validate dates
      const scheduledDate = new Date(formData.scheduledDate)
      if (isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduled date")
      }

      // Filter out empty inputs (inputs are now optional)
      const validatedInputs = inputs
        .filter(input => input.name.trim() !== "")
        .map((input) => ({
          ...input,
          cost: input.reusedExistingStock ? 0 : input.cost,
        }))

      const totalCost = calculateTotalCost()

      const activityData: CreateActivityRequest = {
        type: formData.type,
        cropStage: formData.cropStage,
        description: formData.description,
        scheduledDate: scheduledDate,
        cost: totalCost,
        laborHours: validatedLaborHours,
        laborType: formData.laborType,
        laborCost: validatedLaborCost,
        inputs: validatedInputs.length > 0 ? validatedInputs : undefined, // Only include if there are inputs
        notes: formData.notes,
      }

      // Call the API to create the activity
      const newActivity = await apiClient.addActivity(cycleId, {
        ...activityData,
        cycleId,
        name: formData.name,
        status: "in_progress",
        scheduledDate: scheduledDate.toISOString(),
        cost: totalCost.toFixed(2),
        laborHours: validatedLaborHours.toFixed(1),
        inputs: validatedInputs.length > 0 ? JSON.stringify(validatedInputs) : undefined, // Only include if there are inputs
      })

      onActivityAdd(cycleId, newActivity)
      onClose()

      // Reset form
      resetForm(null)

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
        <DialogHeader className="sticky top-0 z-10 bg-background/95 p-4 backdrop-blur sm:p-6">
          <DialogTitle>Add New Activity</DialogTitle>
          <DialogDescription>
            Add an activity to your production cycle and record any inputs or labor costs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-primary-900">Activity Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Activity Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  placeholder="Enter activity name"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cropStage">Crop Stage</Label>
                <Select
                  value={formData.cropStage}
                  onValueChange={(value) => setFormData({ ...formData, cropStage: value, type: activityTypeForStage(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] sm:max-h-none overflow-y-auto">
                    {CROP_STAGE_OPTIONS.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date</Label>
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
                  value={formData.laborType || "manual-family"}
                  onValueChange={(value) => setFormData({ ...formData, laborType: value as Activity["laborType"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual-hired">Manual - Hired</SelectItem>
                    <SelectItem value="manual-family">Manual - Family</SelectItem>
                    <SelectItem value="mechanized">Mechanized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCost">Labor Cost (KSh)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.laborCost || ""}
                  placeholder="Enter labor cost"
                  onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  placeholder="Additional notes about this activity..."
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            {/* Inputs Used */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-primary-900">Inputs Used</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInput}
                  className="text-xs"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Input
                </Button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {inputs.map((input, index) => (
                  <Card key={index} className="border-0 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-sm text-primary-900">Input #{index + 1}</h4>
                      {inputs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInput(index)}
                          className="text-red-500 hover:text-red-700 p-1 h-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-medium">Item Name</Label>
                        <Input
                          placeholder="e.g., NPK Fertilizer"
                          value={input.name}
                          onChange={(e) => updateInput(index, "name", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={input.quantity || ""}
                            onChange={(e) => updateInput(index, "quantity", parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                        <Label className="text-xs font-medium">Quantity Unit</Label>
                        <Select
                          value={UNIT_OPTIONS.includes(input.unit) ? input.unit : "custom"}
                          onValueChange={(value) => updateInput(index, "unit", value === "custom" ? "" : value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        </div>
                      </div>
                      {!UNIT_OPTIONS.includes(input.unit) && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-xs font-medium">Custom Unit</Label>
                          <Input
                            placeholder="Enter unit"
                            value={input.unit}
                            onChange={(e) => updateInput(index, "unit", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                      <div className="flex items-start gap-2 rounded-lg bg-primary-50 p-3 sm:col-span-2">
                        <Checkbox
                          id={`reuse-stock-${index}`}
                          checked={!!input.reusedExistingStock}
                          onCheckedChange={(checked) => setInputReusingStock(index, checked === true)}
                        />
                        <div className="space-y-1">
                          <Label htmlFor={`reuse-stock-${index}`} className="text-xs font-bold text-primary-900">
                            Reusing existing stock
                          </Label>
                          {input.reusedExistingStock && (
                            <p className="text-xs text-muted-foreground">
                              No cost will be recorded since you're using existing stock.
                            </p>
                          )}
                        </div>
                      </div>
                      {!input.reusedExistingStock && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Unit Cost (KSh)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Cost per unit"
                            value={input.cost || ""}
                            onChange={(e) => updateInput(index, "cost", parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Brand (Optional)</Label>
                        <Input
                          placeholder="Brand name"
                          value={input.brand || ""}
                          onChange={(e) => updateInput(index, "brand", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-medium">Supplier (Optional)</Label>
                        <Input
                          placeholder="Supplier name"
                          value={input.supplier || ""}
                          onChange={(e) => updateInput(index, "supplier", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between rounded-2xl bg-primary-50 p-4 text-lg font-extrabold text-primary-900">
                  <span>Total Cost:</span>
                  <span>KSh {calculateTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="sticky bottom-0 -mx-4 -mb-4 mt-8 bg-background/95 p-4 backdrop-blur sm:-mx-6 sm:-mb-6">
            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Activity...
                  </>
                ) : (
                  "Add Activity"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
