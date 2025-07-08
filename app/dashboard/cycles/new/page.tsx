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

export default function NewProductionCyclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [loadingFarms, setLoadingFarms] = useState(true)
  const [farms, setFarms] = useState<any[]>([])

  const [formData, setFormData] = useState({
    cropVarietyId: "",
    farmId: "",  // Add farmId to form data
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
    loadFarms()
  }, [])

  const loadFarms = async () => {
    try {
      setLoadingFarms(true)
      const response = await apiClient.getFarms()
      setFarms(Array.isArray(response) ? response : response.farms || [])
    } catch (error) {
      console.error("Failed to load farms:", error)
      toast({
        title: "Error",
        description: "Failed to load farms. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingFarms(false)
    }
  }

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
        seedCostPerBag:
          typeof variety.seedCostPerBag === "string"
            ? Number.parseFloat(variety.seedCostPerBag)
            : variety.seedCostPerBag,
        createdAt: variety.createdAt ? new Date(variety.createdAt) : new Date(),
      }))

      setCropVarieties(processedVarieties)
    } catch (error) {
      console.error("Failed to load crop varieties:", error)
      // Fallback crop varieties
      setCropVarieties([
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Shangi",
          cropType: "potato",
          maturityPeriodDays: 75,
          seedSize1BagsPerAcre: 20,
          seedSize2BagsPerAcre: 16,
          seedCostPerBag: 4500,
          createdAt: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Markies",
          cropType: "potato",
          maturityPeriodDays: 90,
          seedSize1BagsPerAcre: 16,
          seedSize2BagsPerAcre: 20,
          seedCostPerBag: 2800,
          createdAt: new Date(),
        },
      ])
    } finally {
      setLoadingVarieties(false)
    }
  }

  const selectedCropVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)
  const seedCost = selectedCropVariety
    ? selectedCropVariety.seedSize1BagsPerAcre * formData.landSizeAcres * selectedCropVariety.seedCostPerBag
    : 0
  const totalEstimatedCost = seedCost
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
      if (!formData.farmId) {
        throw new Error("Please select a farm")
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
        farmId: formData.farmId,  // Add farmId to payload
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
      console.error("Error creating cycle:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create production cycle. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingVarieties || loadingFarms) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/cycles")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cycles
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Production Cycle</h1>
            <p className="text-muted-foreground">Set up a new farming cycle with activities and projections</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="farmId">Farm *</Label>
                    <Select
                      value={formData.farmId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, farmId: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cropVarietyId">Crop Variety *</Label>
                    <Select
                      value={formData.cropVarietyId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, cropVarietyId: value }))}
                    >
                      <SelectTrigger className="mt-2">
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
                      <Label htmlFor="landSizeAcres">Land Size (Acres) *</Label>
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
                        className="mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="plantingDate">Planting Date *</Label>
                      <Input
                        id="plantingDate"
                        type="date"
                        value={new Date(formData.plantingDate).toISOString().split('T')[0]}
                        onChange={(e) => setFormData((prev) => ({ 
                          ...prev, 
                          plantingDate: new Date(e.target.value).toISOString() 
                        }))}
                        className="mt-2"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Farm Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="farmLocation">Farm Location *</Label>
                    <Input
                      id="farmLocation"
                      value={formData.farmLocation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, farmLocation: e.target.value }))}
                      placeholder="e.g., Meru County, Kenya"
                      className="mt-2"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="farmLocationLat">Latitude (Optional)</Label>
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
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Range: -90 to 90 degrees</p>
                    </div>
                    <div>
                      <Label htmlFor="farmLocationLng">Longitude (Optional)</Label>
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
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Range: -180 to 180 degrees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yield & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Yield & Pricing Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedYield">Expected Yield (kg) *</Label>
                      <Input
                        id="expectedYield"
                        type="number"
                        min="1"
                        value={formData.expectedYield || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expectedYield: Number.parseInt(e.target.value) || 0 }))
                        }
                        placeholder="e.g., 8000"
                        className="mt-2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedPricePerKg">Expected Price per Kg (KSh) *</Label>
                      <Input
                        id="expectedPricePerKg"
                        type="number"
                        min="1"
                        value={formData.expectedPricePerKg || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, expectedPricePerKg: Number.parseInt(e.target.value) || 0 }))
                        }
                        placeholder="e.g., 45"
                        className="mt-2"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              {/* Crop Info */}
              {selectedCropVariety && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Crop Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="font-medium text-lg">{selectedCropVariety.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{selectedCropVariety.cropType}</div>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Maturity Period:</span>
                        <span className="font-medium">{selectedCropVariety.maturityPeriodDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seed Cost per Bag:</span>
                        <span className="font-medium">KSh {selectedCropVariety.seedCostPerBag.toLocaleString()}</span>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
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
                      <span className="text-sm">Seed Cost:</span>
                      <span className="font-medium">KSh {seedCost.toLocaleString()}</span>
                    </div>
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
                  className="w-full bg-sage-700 hover:bg-sage-800"
                  disabled={
                    loading ||
                    !formData.cropVarietyId ||
                    !formData.farmId ||
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
                  className="w-full bg-transparent"
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
