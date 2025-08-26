"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2 } from "lucide-react"
import type { ProductionCycle, CropVariety } from "@/lib/types/production"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

interface EditCycleModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (cycle: ProductionCycle) => void
  cycle: ProductionCycle
}

export function EditCycleModal({ isOpen, onClose, onUpdate, cycle }: EditCycleModalProps) {
  const [loading, setLoading] = useState(false)
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [loadingVarieties, setLoadingVarieties] = useState(false)
  const [varietiesError, setVarietiesError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    cropVarietyId: cycle.cropVarietyId,
    landSizeAcres: cycle.landSizeAcres,
    farmLocation: cycle.farmLocation,
    farmLocationLat: cycle.farmLocationLat || 0,
    farmLocationLng: cycle.farmLocationLng || 0,
    plantingDate: cycle.plantingDate ? new Date(cycle.plantingDate).toISOString().split("T")[0] : "",
    estimatedHarvestDate: cycle.estimatedHarvestDate ? new Date(cycle.estimatedHarvestDate).toISOString().split("T")[0] : "",
    actualHarvestDate: cycle.actualHarvestDate ? new Date(cycle.actualHarvestDate).toISOString().split("T")[0] : "",
    status: cycle.status || "active",
    cropStage: cycle.cropStage,
    expectedYield: cycle.expectedYield || 0,
    actualYield: cycle.actualYield || 0,
    expectedPricePerKg: cycle.expectedPricePerKg || 0,
    actualPricePerKg: cycle.actualPricePerKg || 0,
  })

  const selectedVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)

  useEffect(() => {
    setFormData({
      cropVarietyId: cycle.cropVarietyId,
      landSizeAcres: cycle.landSizeAcres,
      farmLocation: cycle.farmLocation,
      farmLocationLat: cycle.farmLocationLat || 0,
      farmLocationLng: cycle.farmLocationLng || 0,
      plantingDate: cycle.plantingDate ? new Date(cycle.plantingDate).toISOString().split("T")[0] : "",
      estimatedHarvestDate: cycle.estimatedHarvestDate ? new Date(cycle.estimatedHarvestDate).toISOString().split("T")[0] : "",
      actualHarvestDate: cycle.actualHarvestDate ? new Date(cycle.actualHarvestDate).toISOString().split("T")[0] : "",
      status: cycle.status || "active",
      cropStage: cycle.cropStage,
      expectedYield: cycle.expectedYield || 0,
      actualYield: cycle.actualYield || 0,
      expectedPricePerKg: cycle.expectedPricePerKg || 0,
      actualPricePerKg: cycle.actualPricePerKg || 0,
    })
  }, [cycle])

  // Calculate estimated harvest date when planting date or crop variety changes
  useEffect(() => {
    if (formData.plantingDate && selectedVariety?.maturityPeriodDays) {
      const plantingDate = new Date(formData.plantingDate);
      const harvestDate = new Date(plantingDate);
      harvestDate.setDate(harvestDate.getDate() + selectedVariety.maturityPeriodDays);
      
      setFormData(prev => ({
        ...prev,
        estimatedHarvestDate: harvestDate.toISOString().split("T")[0]
      }));
    }
  }, [formData.plantingDate, selectedVariety]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingVarieties(true)
    setVarietiesError(null)
    apiClient.getCropVarieties()
      .then((response) => {
        let varieties = []
        if (Array.isArray(response)) {
          varieties = response
        } else if (response?.varieties && Array.isArray(response.varieties)) {
          varieties = response.varieties
        } else if (response?.data?.varieties && Array.isArray(response.data.varieties)) {
          varieties = response.data.varieties
        }
        // Convert string values to numbers for seedCostPerBag and parse createdAt
        const processedVarieties = varieties.map((variety: any) => ({
          ...variety,
          seedCostPerBag:
            typeof variety.seedCostPerBag === "string"
              ? Number.parseFloat(variety.seedCostPerBag)
              : variety.seedCostPerBag,
          createdAt: variety.createdAt ? new Date(variety.createdAt) : new Date(),
        }))
        setCropVarieties(processedVarieties)
      })
      .catch((error) => {
        setVarietiesError(error.message || "Failed to load crop varieties")
        setCropVarieties([])
      })
      .finally(() => setLoadingVarieties(false))
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let payload
      if (imageFile) {
        payload = new FormData()
        payload.append("id", cycle.id)
        payload.append("cropVarietyId", formData.cropVarietyId)
        payload.append("landSizeAcres", formData.landSizeAcres.toString())
        payload.append("farmLocation", formData.farmLocation)
        payload.append("farmLocationLat", formData.farmLocationLat.toString())
        payload.append("farmLocationLng", formData.farmLocationLng.toString())
        payload.append("plantingDate", new Date(formData.plantingDate).toISOString())
        payload.append("estimatedHarvestDate", new Date(formData.estimatedHarvestDate).toISOString())
        if (formData.actualHarvestDate) payload.append("actualHarvestDate", new Date(formData.actualHarvestDate).toISOString())
        payload.append("status", formData.status || "planning")
        if (formData.cropStage) payload.append("cropStage", formData.cropStage)
        payload.append("expectedYield", formData.expectedYield.toString())
        payload.append("actualYield", formData.actualYield.toString())
        payload.append("expectedPricePerKg", formData.expectedPricePerKg.toString())
        payload.append("actualPricePerKg", formData.actualPricePerKg.toString())
        payload.append("image", imageFile)
      } else {
        payload = {
          id: cycle.id,
          cropVarietyId: formData.cropVarietyId,
          landSizeAcres: formData.landSizeAcres,
          farmLocation: formData.farmLocation,
          farmLocationLat: formData.farmLocationLat,
          farmLocationLng: formData.farmLocationLng,
          plantingDate: new Date(formData.plantingDate).toISOString(),
          estimatedHarvestDate: new Date(formData.estimatedHarvestDate).toISOString(),
          actualHarvestDate: formData.actualHarvestDate ? new Date(formData.actualHarvestDate).toISOString() : undefined,
          status: formData.status || "planning",
          cropStage: formData.cropStage,
          expectedYield: formData.expectedYield,
          actualYield: formData.actualYield,
          expectedPricePerKg: formData.expectedPricePerKg,
          actualPricePerKg: formData.actualPricePerKg
        }
      }

      // Call the API to update the cycle
      const updatedCycle = await apiClient.updateCycle(payload) as ProductionCycle

      onUpdate(updatedCycle)
      onClose()

      toast({
        title: "Cycle Updated",
        description: "Production cycle has been successfully updated",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Update Cycle",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Production Cycle</DialogTitle>
          <DialogDescription>
            Update the details of your production cycle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="cropVariety">Crop Variety</Label>
            <Select
              value={formData.cropVarietyId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, cropVarietyId: value }))}
              disabled={loadingVarieties || !!varietiesError}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVarieties ? "Loading..." : varietiesError ? varietiesError : "Select crop variety"} />
              </SelectTrigger>
              <SelectContent>
                {cropVarieties.map((variety) => (
                  <SelectItem key={variety.id} value={variety.id}>
                    {variety.name} ({variety.cropType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="landSize">Land Size (Acres)</Label>
              <Input
                id="landSize"
                type="number"
                step="0.1"
                value={formData.landSizeAcres}
                onChange={(e) => setFormData((prev) => ({ ...prev, landSizeAcres: Number(e.target.value) }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ProductionCycle["status"]) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="harvested">Harvested</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cropStage">Crop Stage</Label>
              <Select
                value={formData.cropStage || "pre_planting"}
                onValueChange={(value) => {
                  const cropStage = value as ProductionCycle["cropStage"]
                  setFormData((prev) => ({ ...prev, cropStage }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crop stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_planting">Pre-planting</SelectItem>
                  <SelectItem value="planting">Planting</SelectItem>
                  <SelectItem value="vegetative">Vegetative</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                  <SelectItem value="fruiting">Fruiting</SelectItem>
                  <SelectItem value="harvesting">Harvesting</SelectItem>
                  <SelectItem value="post_harvest">Post-harvest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="farmLocation">Farm Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="farmLocation"
                placeholder="Nakuru, Njoro"
                value={formData.farmLocation}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmLocation: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="farmLocationLat">Latitude</Label>
              <Input
                id="farmLocationLat"
                type="number"
                step="0.000001"
                value={formData.farmLocationLat}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmLocationLat: Number(e.target.value) }))}
                placeholder="-0.2367"
              />
            </div>
            <div>
              <Label htmlFor="farmLocationLng">Longitude</Label>
              <Input
                id="farmLocationLng"
                type="number"
                step="0.000001"
                value={formData.farmLocationLng}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmLocationLng: Number(e.target.value) }))}
                placeholder="37.6531"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plantingDate">Planting Date</Label>
              <Input
                id="plantingDate"
                type="date"
                value={formData.plantingDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, plantingDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="estimatedHarvestDate">
                Estimated Harvest Date
                {selectedVariety?.maturityPeriodDays && (
                  <span className="text-xs text-gray-500 ml-1">
                    (Based on {selectedVariety.maturityPeriodDays} days maturity period)
                  </span>
                )}
              </Label>
              <Input
                id="estimatedHarvestDate"
                type="date"
                value={formData.estimatedHarvestDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimatedHarvestDate: e.target.value }))}
                required
              />
            </div>
          </div>

          {formData.status === "harvested" && (
            <div>
              <Label htmlFor="actualHarvestDate">Actual Harvest Date</Label>
              <Input
                id="actualHarvestDate"
                type="date"
                value={formData.actualHarvestDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, actualHarvestDate: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expectedYield">Expected Yield (kg)</Label>
              <Input
                id="expectedYield"
                type="number"
                value={formData.expectedYield}
                onChange={(e) => setFormData((prev) => ({ ...prev, expectedYield: Number(e.target.value) }))}
                placeholder="8000"
              />
            </div>
            <div>
              <Label htmlFor="expectedPricePerKg">Expected Price per Kg (KSh)</Label>
              <Input
                id="expectedPricePerKg"
                type="number"
                value={formData.expectedPricePerKg}
                onChange={(e) => setFormData((prev) => ({ ...prev, expectedPricePerKg: Number(e.target.value) }))}
                placeholder="45"
              />
            </div>
          </div>

          {formData.status === "harvested" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actualYield">Actual Yield (kg)</Label>
                <Input
                  id="actualYield"
                  type="number"
                  value={formData.actualYield}
                  onChange={(e) => setFormData((prev) => ({ ...prev, actualYield: Number(e.target.value) }))}
                  placeholder="7500"
                />
              </div>
              <div>
                <Label htmlFor="actualPricePerKg">Actual Price per Kg (KSh)</Label>
                <Input
                  id="actualPricePerKg"
                  type="number"
                  value={formData.actualPricePerKg}
                  onChange={(e) => setFormData((prev) => ({ ...prev, actualPricePerKg: Number(e.target.value) }))}
                  placeholder="42"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-medium">Financial Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Expected Revenue:</span>
                <div className="font-medium">
                  KSh {(formData.expectedYield * formData.expectedPricePerKg).toLocaleString()}
                </div>
              </div>
              {formData.status === "harvested" && formData.actualYield > 0 && formData.actualPricePerKg > 0 && (
                <div>
                  <span className="text-gray-600">Actual Revenue:</span>
                  <div className="font-medium">
                    KSh {(formData.actualYield * formData.actualPricePerKg).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Show image preview if available and type allows */}
          {('imageUrl' in cycle) && (cycle as any).imageUrl && (
            <div className="mb-2">
              <img src={(cycle as any).imageUrl} alt="Cycle" className="rounded w-full max-h-48 object-cover" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-sage-700 hover:bg-sage-800">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Cycle"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
