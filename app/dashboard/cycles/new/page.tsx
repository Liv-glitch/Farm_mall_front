"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Loader2, Sprout } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import type { CropVariety, CreateProductionCycleRequest } from "@/lib/types/production"
import { useAuth } from "@/lib/hooks/use-auth"
import { POTATO_VARIETIES } from "@/lib/data/potato-varieties"
import { AdvancedLocationEntry, type BoundaryPoint } from "@/components/cycles/advanced-location-entry"

interface FarmOption {
  id: string
  name?: string
  location?: string
  sizeAcres?: number
  size?: number
}

export default function NewProductionCyclePage() {
  const router = useRouter()
  const { farm, loading: authLoading, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [loadingFarms, setLoadingFarms] = useState(true)
  const [farms, setFarms] = useState<FarmOption[]>([])
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [advancedLocationOpen, setAdvancedLocationOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    cropVarietyId: "",
    landSizeAcres: 0,
    farmCounty: "",
    farmSubcounty: "",
    farmLocationName: "",
    farmLocation: "",
    farmLocationLat: null as number | null,
    farmLocationLng: null as number | null,
    farmBoundaryCoordinates: [] as BoundaryPoint[],
    plantingDate: new Date().toISOString(),
    selectedFarmId: "",
  })

  useEffect(() => {
    loadCropVarieties()
  }, [])

  useEffect(() => {
    if (!authLoading) {
      loadFarms()
    }
  }, [authLoading])

  const loadCropVarieties = async () => {
    try {
      setLoadingVarieties(true)
      const varieties = await apiClient.getCropVarieties()
      setCropVarieties(varieties)
    } catch (error) {
      console.error("Failed to load crop varieties:", error)
      // Fallback to shared hardcoded varieties so user can still see all options
      setCropVarieties(POTATO_VARIETIES)
    } finally {
      setLoadingVarieties(false)
    }
  }

  const loadFarms = async () => {
    try {
      setLoadingFarms(true)
      const userFarms = await apiClient.getUserFarms()
      const farmOptions = Array.isArray(userFarms) ? userFarms : []
      setFarms(farmOptions)

      if (farmOptions.length > 0) {
        setFormData((prev) => ({ ...prev, selectedFarmId: prev.selectedFarmId || farmOptions[0].id }))
      } else if (farmOptions.length === 0 && farm?.id) {
        setFarms([{
          id: farm.id,
          name: farm.name,
          location: farm.location,
          size: farm.size,
        }])
        setFormData((prev) => ({ ...prev, selectedFarmId: farm.id }))
      } else {
        setFormData((prev) => ({ ...prev, selectedFarmId: "" }))
      }
    } catch (error) {
      console.error("Failed to load farms:", error)
      if (farm?.id) {
        setFarms([{
          id: farm.id,
          name: farm.name,
          location: farm.location,
          size: farm.size,
        }])
        setFormData((prev) => ({ ...prev, selectedFarmId: farm.id }))
      } else {
        setFarms([])
        setFormData((prev) => ({ ...prev, selectedFarmId: "" }))
      }
    } finally {
      setLoadingFarms(false)
    }
  }

  const selectedCropVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)
  const composedFarmLocation = [
    formData.farmLocationName.trim(),
    formData.farmSubcounty.trim(),
    formData.farmCounty.trim(),
  ].filter(Boolean).join(", ")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)

    try {
      // Validate required fields
      if (!formData.cropVarietyId) {
        throw new Error("Please select a crop variety")
      }
      if (farms.length > 1 && !formData.selectedFarmId) {
        throw new Error("Please select the farm for this production cycle")
      }
      if (!formData.landSizeAcres || formData.landSizeAcres <= 0) {
        throw new Error("Please enter a valid land size")
      }
      if (!formData.plantingDate) {
        throw new Error("Please select a planting date")
      }
      if (!formData.farmCounty.trim() || !formData.farmSubcounty.trim() || !formData.farmLocationName.trim()) {
        throw new Error("Please enter farm location")
      }

      const payload: CreateProductionCycleRequest = {
        cropVarietyId: formData.cropVarietyId,
        landSizeAcres: Number(formData.landSizeAcres),
        farmLocation: composedFarmLocation,
        farmCounty: formData.farmCounty.trim(),
        farmSubcounty: formData.farmSubcounty.trim(),
        farmLocationName: formData.farmLocationName.trim(),
        plantingDate: new Date(formData.plantingDate).toISOString().split('T')[0], // Convert to YYYY-MM-DD
      }

      if (formData.selectedFarmId) {
        payload.farmId = formData.selectedFarmId
      }

      // Calculate estimated harvest date based on maturity period
      if (selectedCropVariety) {
        const plantingDate = new Date(formData.plantingDate);
        const estimatedHarvestDate = new Date(plantingDate);
        estimatedHarvestDate.setDate(plantingDate.getDate() + selectedCropVariety.maturityPeriodDays);
        payload.estimatedHarvestDate = estimatedHarvestDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      }

      // Only include coordinates if they are valid numbers
      if (formData.farmLocationLat !== null && !isNaN(Number(formData.farmLocationLat))) {
        const lat = Number(formData.farmLocationLat)
        if (lat >= -90 && lat <= 90) {
          payload.farmLocationLat = lat
        }
      }

      if (formData.farmLocationLng !== null && !isNaN(Number(formData.farmLocationLng))) {
        const lng = Number(formData.farmLocationLng)
        if (lng >= -180 && lng <= 180) {
          payload.farmLocationLng = lng
        }
      }

      if (formData.farmBoundaryCoordinates.length >= 3) {
        payload.farmBoundaryCoordinates = formData.farmBoundaryCoordinates
      }

      const response = await apiClient.createProductionCycle(payload)
      await refreshUser()

      toast({
        title: "Success!",
        description: "Farm preparation record created successfully",
      })

      // Navigate to the production cycles page or to the specific record if we have an ID
      if (response && typeof response === 'object' && 'id' in response && response.id) {
        router.push(`/dashboard/cycles/${response.id}`)
      } else {
        router.push("/dashboard/cycles")
      }
    } catch (error: any) {
      console.error("Error creating this cycle:", error)
      const message = error.message || "Failed to create production cycle. Please try again."
      setSubmitError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingVarieties || loadingFarms || authLoading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{authLoading ? "Loading user data..." : loadingFarms ? "Loading farms..." : "Loading crop varieties..."}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/cycles")} className="text-agri-700 hover:bg-agri-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Production Cycles
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-agri-800">Create New Production Cycle</h1>
            <p className="text-agri-600">Set up the crop, land size, planting date, and farm location.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not create production cycle</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-agri-50 border-agri-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-agri-800">
                    <Sprout className="h-5 w-5 text-agri-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="cropVarietyId">Crop Variety *</Label>
                    <Select
                      value={formData.cropVarietyId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, cropVarietyId: value }))}
                    >
                      <SelectTrigger className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500">
                        <SelectValue placeholder="Select crop variety" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropVarieties.map((variety) => (
                          <SelectItem key={variety.id} value={variety.id}>
                            {variety.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {farms.length > 1 && (
                    <div>
                      <Label htmlFor="selectedFarmId">Farm *</Label>
                      <Select
                        value={formData.selectedFarmId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, selectedFarmId: value }))}
                      >
                        <SelectTrigger className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500">
                          <SelectValue placeholder="Select farm" />
                        </SelectTrigger>
                        <SelectContent>
                          {farms.map((farmOption) => (
                            <SelectItem key={farmOption.id} value={farmOption.id}>
                              {farmOption.name || farmOption.location || "Unnamed farm"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {farms.length === 0 && (
                    <Alert className="border-agri-200 bg-white/80 text-agri-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No farm record is linked to your account yet. We will create one from this cycle's location when you submit.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="landSizeAcres" className="text-agri-700">Land Size (Acres) *</Label>
                      <Input
                        id="landSizeAcres"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.landSizeAcres || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, landSizeAcres: Number.parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="e.g., 2.5"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="plantingDate" className="text-agri-700">Planting Date *</Label>
                      <Input
                        id="plantingDate"
                        type="date"
                        value={new Date(formData.plantingDate).toISOString().split('T')[0]}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          plantingDate: new Date(e.target.value).toISOString()
                        }))}
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="farmCounty" className="text-agri-700">County *</Label>
                      <Input
                        id="farmCounty"
                        value={formData.farmCounty}
                        onChange={(e) => setFormData((prev) => ({ ...prev, farmCounty: e.target.value }))}
                        placeholder="e.g., Meru"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="farmSubcounty" className="text-agri-700">Subcounty *</Label>
                      <Input
                        id="farmSubcounty"
                        value={formData.farmSubcounty}
                        onChange={(e) => setFormData((prev) => ({ ...prev, farmSubcounty: e.target.value }))}
                        placeholder="e.g., Imenti North"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="farmLocationName" className="text-agri-700">Location *</Label>
                      <Input
                        id="farmLocationName"
                        value={formData.farmLocationName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, farmLocationName: e.target.value }))}
                        placeholder="e.g., Gakoromone"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-maize-200 bg-white/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-agri-800">Advanced Location Entry</div>
                        <p className="text-sm text-agri-600">
                          Add exact coordinates or draw the farm boundary on Google Maps.
                        </p>
                        {(formData.farmLocationLat && formData.farmLocationLng) || formData.farmBoundaryCoordinates.length > 0 ? (
                          <p className="mt-1 text-xs font-medium text-agri-700">
                            {formData.farmLocationLat && formData.farmLocationLng
                              ? `Coordinates saved: ${formData.farmLocationLat.toFixed(5)}, ${formData.farmLocationLng.toFixed(5)}`
                              : ""}
                            {formData.farmBoundaryCoordinates.length > 0
                              ? ` · ${formData.farmBoundaryCoordinates.length} boundary points`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-agri-200 text-agri-700 hover:bg-agri-50"
                        onClick={() => setAdvancedLocationOpen(true)}
                      >
                        Open Advanced Location Entry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              {/* Crop Info */}
              {selectedCropVariety && (
                <Card className="bg-maize-50 border-maize-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-agri-800">Crop Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="font-medium text-lg text-agri-800">{selectedCropVariety.name}</div>
                      <div className="text-sm text-agri-600 capitalize">{selectedCropVariety.cropType}</div>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Maturity Period:</span>
                        <span className="font-medium">{selectedCropVariety.maturityPeriodDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seed Cost per Acre:</span>
                        <span className="font-medium">KSh {selectedCropVariety.seedSize1CostPerAcre.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seeds per Acre:</span>
                        <span className="font-medium">{selectedCropVariety.seedSize1BagsPerAcre} bags</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-agri-700 hover:bg-agri-800"
                  disabled={
                    loading ||
                    !formData.cropVarietyId ||
                    (farms.length > 1 && !formData.selectedFarmId) ||
                    !formData.landSizeAcres ||
                    !formData.farmCounty ||
                    !formData.farmSubcounty ||
                    !formData.farmLocationName
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Cycle...
                    </>
                  ) : (
                    "Create Production Cycle"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent border-agri-200 text-agri-700 hover:bg-agri-50"
                  onClick={() => router.push("/dashboard/cycles")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
        <AdvancedLocationEntry
          open={advancedLocationOpen}
          onOpenChange={setAdvancedLocationOpen}
          county={formData.farmCounty}
          subcounty={formData.farmSubcounty}
          locationName={formData.farmLocationName}
          latitude={formData.farmLocationLat}
          longitude={formData.farmLocationLng}
          boundary={formData.farmBoundaryCoordinates}
          onSave={({ latitude, longitude, boundary }) =>
            setFormData((prev) => ({
              ...prev,
              farmLocationLat: latitude,
              farmLocationLng: longitude,
              farmBoundaryCoordinates: boundary,
            }))
          }
        />
      </div>
    </DashboardLayout>
  )
}
