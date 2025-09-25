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
import { ArrowLeft, Loader2, Sprout, MapPin, Target, DollarSign } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import type { CropVariety, CreateProductionCycleRequest } from "@/lib/types/production"
import { useAuth } from "@/lib/hooks/use-auth"

export default function NewProductionCyclePage() {
  const router = useRouter()
  const { farm, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])



  const [formData, setFormData] = useState({
    cropVarietyId: "",
    landSizeAcres: 0,
    farmLocation: "",
    farmLocationLat: null as number | null,
    farmLocationLng: null as number | null,
    plantingDate: new Date().toISOString(),
    expectedYield: 0,
    expectedPricePerKg: 0,
  })

  useEffect(() => {
    loadCropVarieties()
  }, [])

  const loadCropVarieties = async () => {
    try {
      setLoadingVarieties(true)
      const response = await apiClient.getCropVarieties()

      let varieties = []
      if (Array.isArray(response)) {
        varieties = response
      } else if (response?.varieties && Array.isArray(response.varieties)) {
        varieties = response.varieties
      } else if (response?.data?.varieties && Array.isArray(response.data.varieties)) {
        varieties = response.data.varieties
      }

      const processedVarieties = varieties.map((variety: any) => ({
        ...variety,
        // Process all the new per-acre cost fields
        seedSize1CostPerAcre: typeof variety.seedSize1CostPerAcre === "string"
          ? Number.parseFloat(variety.seedSize1CostPerAcre)
          : variety.seedSize1CostPerAcre,
        seedSize2CostPerAcre: typeof variety.seedSize2CostPerAcre === "string"
          ? Number.parseFloat(variety.seedSize2CostPerAcre)
          : variety.seedSize2CostPerAcre,
        fertilizerCostPerAcre: typeof variety.fertilizerCostPerAcre === "string"
          ? Number.parseFloat(variety.fertilizerCostPerAcre)
          : variety.fertilizerCostPerAcre,
        herbicideCostPerAcre: typeof variety.herbicideCostPerAcre === "string"
          ? Number.parseFloat(variety.herbicideCostPerAcre)
          : variety.herbicideCostPerAcre,
        fungicideCostPerAcre: typeof variety.fungicideCostPerAcre === "string"
          ? Number.parseFloat(variety.fungicideCostPerAcre)
          : variety.fungicideCostPerAcre,
        insecticideCostPerAcre: typeof variety.insecticideCostPerAcre === "string"
          ? Number.parseFloat(variety.insecticideCostPerAcre)
          : variety.insecticideCostPerAcre,
        laborCostPerAcre: typeof variety.laborCostPerAcre === "string"
          ? Number.parseFloat(variety.laborCostPerAcre)
          : variety.laborCostPerAcre,
        landPreparationCostPerAcre: typeof variety.landPreparationCostPerAcre === "string"
          ? Number.parseFloat(variety.landPreparationCostPerAcre)
          : variety.landPreparationCostPerAcre,
        miscellaneousCostPerAcre: typeof variety.miscellaneousCostPerAcre === "string"
          ? Number.parseFloat(variety.miscellaneousCostPerAcre)
          : variety.miscellaneousCostPerAcre,
        averageYieldPerAcre: typeof variety.averageYieldPerAcre === "string"
          ? Number.parseFloat(variety.averageYieldPerAcre)
          : variety.averageYieldPerAcre,
        createdAt: variety.createdAt ? new Date(variety.createdAt) : new Date(),
      }))

      setCropVarieties(processedVarieties)
    } catch (error) {
      console.error("Failed to load crop varieties:", error)
      setCropVarieties([]) // No fallback data - API only
    } finally {
      setLoadingVarieties(false)
    }
  }

  const selectedCropVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)

  // Calculate total cost per acre using new cost structure
  const costPerAcre = selectedCropVariety ? (
    selectedCropVariety.seedSize1CostPerAcre +
    selectedCropVariety.fertilizerCostPerAcre +
    selectedCropVariety.herbicideCostPerAcre +
    selectedCropVariety.fungicideCostPerAcre +
    selectedCropVariety.insecticideCostPerAcre +
    selectedCropVariety.laborCostPerAcre +
    selectedCropVariety.landPreparationCostPerAcre +
    selectedCropVariety.miscellaneousCostPerAcre
  ) : 0

  const totalEstimatedCost = costPerAcre * formData.landSizeAcres
  const expectedRevenue = formData.expectedYield * formData.expectedPricePerKg
  const expectedProfit = expectedRevenue - totalEstimatedCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.cropVarietyId) {
        throw new Error("Please select a crop variety")
      }
      if (!farm?.id) {
        throw new Error("No farm found. Please contact support.")
      }
      if (!formData.landSizeAcres || formData.landSizeAcres <= 0) {
        throw new Error("Please enter a valid land size")
      }
      if (!formData.plantingDate) {
        throw new Error("Please select a planting date")
      }
      if (!formData.farmLocation.trim()) {
        throw new Error("Please enter farm location")
      }
      if (!formData.expectedYield || formData.expectedYield <= 0) {
        throw new Error("Please enter expected yield")
      }
      if (!formData.expectedPricePerKg || formData.expectedPricePerKg <= 0) {
        throw new Error("Please enter expected price per kg")
      }

      const payload: CreateProductionCycleRequest = {
        cropVarietyId: formData.cropVarietyId,
        farmId: farm.id,
        landSizeAcres: Number(formData.landSizeAcres),
        farmLocation: formData.farmLocation.trim(),
        plantingDate: new Date(formData.plantingDate).toISOString().split('T')[0], // Convert to YYYY-MM-DD
        expectedYield: Number(formData.expectedYield),
        expectedPricePerKg: Number(formData.expectedPricePerKg),
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

      const response = await apiClient.createProductionCycle(payload)

      toast({
        title: "Success!",
        description: "Production cycle created successfully",
      })

      // Navigate to the cycles page or to the specific cycle if we have an ID
      if (response && typeof response === 'object' && 'id' in response && response.id) {
        router.push(`/dashboard/cycles/${response.id}`)
      } else {
        router.push("/dashboard/cycles")
      }
    } catch (error: any) {
      console.error("Error creating this cycle:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create production cycle. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingVarieties || authLoading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{authLoading ? "Loading user data..." : "Loading crop varieties..."}</p>
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
            Back to Cycles
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-agri-800">Create New Production Cycle</h1>
            <p className="text-agri-600">Set up a new farming cycle with activities and projections</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                            {variety.name} ({variety.cropType} - {variety.maturityPeriodDays} days)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="bg-maize-50 border-maize-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-agri-800">
                    <MapPin className="h-5 w-5 text-agri-600" />
                    Farm Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="farmLocation" className="text-agri-700">Farm Location *</Label>
                    <Input
                      id="farmLocation"
                      value={formData.farmLocation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, farmLocation: e.target.value }))}
                      placeholder="e.g., Meru County, Kenya"
                      className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farmLocationLat" className="text-agri-700">Latitude (Optional)</Label>
                      <Input
                        id="farmLocationLat"
                        type="number"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={formData.farmLocationLat || ""}
                        onChange={(e) => {
                          const value = e.target.value.trim()
                          setFormData((prev) => ({ 
                            ...prev, 
                            farmLocationLat: value === "" ? null : Number.parseFloat(value) || null 
                          }))
                        }}
                        placeholder="e.g., -0.2367"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                      />
                      <p className="text-xs text-agri-500 mt-1">Range: -90 to 90 degrees</p>
                    </div>
                    <div>
                      <Label htmlFor="farmLocationLng" className="text-agri-700">Longitude (Optional)</Label>
                      <Input
                        id="farmLocationLng"
                        type="number"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={formData.farmLocationLng || ""}
                        onChange={(e) => {
                          const value = e.target.value.trim()
                          setFormData((prev) => ({ 
                            ...prev, 
                            farmLocationLng: value === "" ? null : Number.parseFloat(value) || null 
                          }))
                        }}
                        placeholder="e.g., 37.6531"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                      />
                      <p className="text-xs text-agri-500 mt-1">Range: -180 to 180 degrees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yield & Pricing */}
              <Card className="bg-tea-50 border-tea-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-agri-800">
                    <Target className="h-5 w-5 text-agri-600" />
                    Yield & Pricing Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedYield" className="text-agri-700">Expected Yield (kg) *</Label>
                      <Input
                        id="expectedYield"
                        type="number"
                        min="1"
                        value={formData.expectedYield || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expectedYield: Number.parseInt(e.target.value) || 0 }))
                        }
                        placeholder="e.g., 8000"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedPricePerKg" className="text-agri-700">Expected Price per Kg (KSh) *</Label>
                      <Input
                        id="expectedPricePerKg"
                        type="number"
                        min="1"
                        value={formData.expectedPricePerKg || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expectedPricePerKg: Number.parseInt(e.target.value) || 0 }))
                        }
                        placeholder="e.g., 45"
                        className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              {/* Farm Info */}
              {farm && (
                <Card className="bg-agri-50 border-agri-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-agri-800">Farm Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="font-medium text-lg text-agri-800">{farm.name}</div>
                      <div className="text-sm text-agri-600">{farm.location}</div>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span className="font-medium">{farm.size} acres</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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

              {/* Financial Summary */}
              <Card className="bg-tea-50 border-tea-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-agri-800">
                    <DollarSign className="h-5 w-5 text-agri-600" />
                    Financial Projection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Land Size:</span>
                      <span className="font-medium">{formData.landSizeAcres} acres</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm">Estimated Total Cost:</span>
                      <span className="font-medium">KSh {totalEstimatedCost.toLocaleString()}</span>
                    </div>
                    <Separator />
                    {formData.expectedYield > 0 && formData.expectedPricePerKg > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">Expected Revenue:</span>
                          <span className="font-medium text-green-600">KSh {expectedRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Expected Profit:</span>
                          <span className={`font-medium ${expectedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            KSh {expectedProfit.toLocaleString()}
                          </span>
                        </div>
                        {expectedRevenue > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm">Profit Margin:</span>
                            <span className="font-medium">{Math.round((expectedProfit / expectedRevenue) * 100)}%</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-agri-700 hover:bg-agri-800"
                  disabled={
                    loading ||
                    !formData.cropVarietyId ||
                    !formData.landSizeAcres ||
                    !formData.expectedYield ||
                    !formData.expectedPricePerKg
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
      </div>
    </DashboardLayout>
  )
}
