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
  const [formData, setFormData] = useState({
    cropVarietyId: cycle.cropVarietyId,
    landSizeAcres: cycle.landSizeAcres,
    farmLocation: cycle.farmLocation,
    farmCounty: cycle.farmCounty || "",
    farmSubcounty: cycle.farmSubcounty || "",
    farmLocationName: cycle.farmLocationName || "",
    farmLocationLat: cycle.farmLocationLat || 0,
    farmLocationLng: cycle.farmLocationLng || 0,
    plantingDate: cycle.plantingDate ? new Date(cycle.plantingDate).toISOString().split("T")[0] : "",
    estimatedHarvestDate: cycle.estimatedHarvestDate ? new Date(cycle.estimatedHarvestDate).toISOString().split("T")[0] : "",
    actualHarvestDate: cycle.actualHarvestDate ? new Date(cycle.actualHarvestDate).toISOString().split("T")[0] : "",
    status: cycle.status || "active",
    actualYield: cycle.actualYield || 0,
    actualPricePerKg: cycle.actualPricePerKg || 0,
  })

  const selectedVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)

  useEffect(() => {
    setFormData({
      cropVarietyId: cycle.cropVarietyId,
      landSizeAcres: cycle.landSizeAcres,
      farmLocation: cycle.farmLocation,
      farmCounty: cycle.farmCounty || "",
      farmSubcounty: cycle.farmSubcounty || "",
      farmLocationName: cycle.farmLocationName || "",
      farmLocationLat: cycle.farmLocationLat || 0,
      farmLocationLng: cycle.farmLocationLng || 0,
      plantingDate: cycle.plantingDate ? new Date(cycle.plantingDate).toISOString().split("T")[0] : "",
      estimatedHarvestDate: cycle.estimatedHarvestDate ? new Date(cycle.estimatedHarvestDate).toISOString().split("T")[0] : "",
      actualHarvestDate: cycle.actualHarvestDate ? new Date(cycle.actualHarvestDate).toISOString().split("T")[0] : "",
      status: cycle.status || "active",
      actualYield: cycle.actualYield || 0,
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
      .then((varieties) => {
        setCropVarieties(varieties)
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
      const payload = {
        id: cycle.id,
        cropVarietyId: formData.cropVarietyId,
        landSizeAcres: formData.landSizeAcres,
        farmLocation: formData.farmLocation,
        farmCounty: formData.farmCounty || undefined,
        farmSubcounty: formData.farmSubcounty || undefined,
        farmLocationName: formData.farmLocationName || undefined,
        farmLocationLat: formData.farmLocationLat || undefined,
        farmLocationLng: formData.farmLocationLng || undefined,
        plantingDate: new Date(formData.plantingDate).toISOString(),
        estimatedHarvestDate: new Date(formData.estimatedHarvestDate).toISOString(),
        actualHarvestDate: formData.actualHarvestDate ? new Date(formData.actualHarvestDate).toISOString() : undefined,
        status: formData.status,
        actualYield: formData.actualYield,
        actualPricePerKg: formData.actualPricePerKg
      }

      // Call the API to update the record.
      const updatedCycle = await apiClient.updateCycle(payload) as ProductionCycle

      onUpdate(updatedCycle)
      onClose()

      toast({
        title: "Crop tracker record updated",
        description: "The production cycle has been successfully updated",
      })
    } catch (error: any) {
      toast({
        title: "Failed to update record",
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
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="harvested">Harvested</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="farmLocationName">Location Name</Label>
              <Input
                id="farmLocationName"
                placeholder="Field or village name"
                value={formData.farmLocationName}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmLocationName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="farmSubcounty">Subcounty</Label>
              <Input
                id="farmSubcounty"
                placeholder="Njoro"
                value={formData.farmSubcounty}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmSubcounty: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="farmCounty">County</Label>
              <Input
                id="farmCounty"
                placeholder="Nakuru"
                value={formData.farmCounty}
                onChange={(e) => setFormData((prev) => ({ ...prev, farmCounty: e.target.value }))}
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
                  <span className="text-xs text-muted-foreground ml-1">
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

          {formData.status === "harvested" && formData.actualYield > 0 && formData.actualPricePerKg > 0 && (
            <div className="space-y-2 rounded-2xl bg-primary-50 p-4">
              <h4 className="font-extrabold text-primary-900">Harvest Summary</h4>
              <div className="text-sm">
                <span className="text-muted-foreground">Actual Revenue:</span>
                <div className="font-extrabold text-primary-900">
                  KSh {(formData.actualYield * formData.actualPricePerKg).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update record"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
