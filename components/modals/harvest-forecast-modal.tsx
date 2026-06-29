"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CloudRain, CloudSun, Loader2, Sprout, Sun, ThermometerSun } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import type { HarvestPredictionRequest, HarvestPredictionResponse } from "@/lib/types/calculator"
import type { CropVariety } from "@/lib/types/production"
import { POTATO_VARIETIES } from "@/lib/data/potato-varieties"
import { useAuth } from "@/lib/hooks/use-auth"

interface HarvestForecastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HarvestForecastModal({ open, onOpenChange }: HarvestForecastModalProps) {
  const { farm } = useAuth()
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [formData, setFormData] = useState<HarvestPredictionRequest>({
    cropVarietyId: "",
    plantingDate: new Date().toISOString().split("T")[0],
    landSizeAcres: 0,
    location: {
      latitude: 0,
      longitude: 0,
    },
  })
  const [locationName, setLocationName] = useState("")
  const [result, setResult] = useState<HarvestPredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingVarieties, setLoadingVarieties] = useState(true)

  useEffect(() => {
    if (open) {
      loadCropVarieties()
      setLocationName(farm?.location || "")
      if (typeof farm?.locationLat === "number" && typeof farm?.locationLng === "number") {
        setFormData((prev) => ({
          ...prev,
          location: {
            latitude: farm.locationLat!,
            longitude: farm.locationLng!,
          },
        }))
      }
    }
  }, [farm?.location, farm?.locationLat, farm?.locationLng, open])

  const loadCropVarieties = async () => {
    try {
      setLoadingVarieties(true)
      const varieties = await apiClient.getCropVarieties()
      setCropVarieties(varieties)
    } catch (error: any) {
      console.error("Failed to load crop varieties:", error)
      setCropVarieties(POTATO_VARIETIES)
      toast({
        title: "Using saved crop varieties",
        description: error.message
          ? `Could not load live crop varieties: ${error.message}`
          : "Could not load live crop varieties. Using saved potato varieties.",
      })
    } finally {
      setLoadingVarieties(false)
    }
  }

  const predictHarvest = async () => {
    if (!formData.cropVarietyId || !formData.plantingDate) {
      toast({
        title: "Missing Information",
        description: "Please select a crop variety and planting date",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.getHarvestPrediction(formData)
      setResult(response as HarvestPredictionResponse)
      toast({
        title: "Success",
        description: "Harvest prediction calculated successfully",
      })
    } catch (error: any) {
      console.error("Failed to predict harvest:", error)

      // Fallback to mock data for demo
      const selectedVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)

      if (selectedVariety) {
        const plantingDate = new Date(formData.plantingDate)
        const harvestDate = new Date(plantingDate)
        harvestDate.setDate(harvestDate.getDate() + selectedVariety.maturityPeriodDays)

        const startWindow = new Date(harvestDate)
        startWindow.setDate(startWindow.getDate() - 7)
        const endWindow = new Date(harvestDate)
        endWindow.setDate(endWindow.getDate() + 7)

        const mockResult: HarvestPredictionResponse = {
          cropVarietyId: selectedVariety.id,
          cropVarietyName: selectedVariety.name,
          plantingDate: formData.plantingDate,
          estimatedHarvestDate: harvestDate.toISOString().split("T")[0],
          harvestWindow: {
            startDate: startWindow.toISOString().split("T")[0],
            endDate: endWindow.toISOString().split("T")[0],
          },
          estimatedYield: {
            totalKg: (formData.landSizeAcres || 1) * selectedVariety.averageYieldPerAcre,
            yieldPerAcre: selectedVariety.averageYieldPerAcre,
          },
          climateConditions: {
            averageTemperature: 22,
            expectedRainfall: 800,
            humidity: 65,
          },
          recommendations: [
            "Monitor soil moisture levels regularly",
            "Apply fertilizer at 4-6 weeks after planting",
            "Watch for early blight symptoms",
            "Harvest when tubers reach desired size",
          ],
        }
        setResult(mockResult)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForecast = () => {
    setFormData({
      cropVarietyId: "",
      plantingDate: new Date().toISOString().split("T")[0],
      landSizeAcres: 0,
      location: {
        latitude: farm?.locationLat || 0,
        longitude: farm?.locationLng || 0,
      },
    })
    setLocationName(farm?.location || "")
    setResult(null)
  }

  const planningConditions = result
    ? getMonthlyPlanningConditions(
        result.plantingDate,
        result.estimatedHarvestDate,
        locationName
      )
    : []


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-sage-600" />
            <span>Harvest Forecast</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingVarieties ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading crop varieties...</span>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="cropVariety">Crop Variety *</Label>
                    <Select
                      value={formData.cropVarietyId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, cropVarietyId: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select crop variety" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropVarieties.length > 0 ? (
                          cropVarieties.map((variety) => (
                            <SelectItem key={variety.id} value={variety.id}>
                              {variety.name} ({variety.cropType})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-varieties" disabled>
                            No varieties available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="plantingDate">Planting Date *</Label>
                    <Input
                      id="plantingDate"
                      type="date"
                      value={formData.plantingDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, plantingDate: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="landSize">Land Size (Acres)</Label>
                    <Input
                      id="landSize"
                      type="number"
                      step="0.1"
                      placeholder="Enter acreage"
                      value={formData.landSizeAcres || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          landSizeAcres: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="forecastLocation">Farm Location</Label>
                    <Input
                      id="forecastLocation"
                      placeholder="e.g., Meru, Imenti North"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="h-12"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for location-specific planning conditions.
                    </p>
                  </div>

                  {formData.cropVarietyId && (() => {
                    const selectedCrop = cropVarieties.find(c => c.id === formData.cropVarietyId)
                    return selectedCrop ? (
                      <div className="p-3 bg-sage-50 rounded-lg">
                        <h4 className="font-medium text-sage-900 mb-2">Estimated Yield (from crop data)</h4>
                        <div className="text-lg font-bold text-sage-800">
                          {selectedCrop.averageYieldPerAcre.toLocaleString()} kg/acre
                        </div>
                        <div className="text-sm text-sage-700 mt-1">
                          Based on {selectedCrop.name} variety data
                        </div>
                      </div>
                    ) : null
                  })()}

                  <Button
                    onClick={predictHarvest}
                    className="w-full h-12 bg-sage-700 hover:bg-sage-800"
                    disabled={loading || !formData.cropVarietyId || !formData.plantingDate}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Predicting...
                      </>
                    ) : (
                      "Predict Harvest"
                    )}
                  </Button>

                  {result && (
                    <Button onClick={resetForecast} variant="outline" className="w-full h-12 bg-transparent">
                      Reset Forecast
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-sage-600">Harvest Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-sage-50 to-warm-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Estimated Harvest Date</div>
                    <div className="text-2xl font-bold text-sage-700 mb-1">
                      {new Date(result.estimatedHarvestDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Growing Period</span>
                      <div className="font-semibold">
                        {Math.ceil(
                          (new Date(result.estimatedHarvestDate).getTime() - new Date(result.plantingDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Planning weather conditions</h4>
                    <div className="space-y-2">
                      {planningConditions.map((item) => (
                        <div key={item.month} className={`flex items-start gap-3 rounded-lg p-3 ${getConditionStyle(item.category).card}`}>
                          {(() => {
                            const style = getConditionStyle(item.category)
                            const Icon = style.icon
                            return <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
                          })()}
                          <div>
                            <div className={`font-semibold ${getConditionStyle(item.category).title}`}>{item.month}</div>
                            <div className={`text-sm ${getConditionStyle(item.category).body}`}>{item.condition}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter planting details to see harvest forecast</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type PlanningConditionCategory = "rainy" | "cool" | "dry" | "transition" | "mild"

function getConditionStyle(category: PlanningConditionCategory) {
  switch (category) {
    case "rainy":
      return { card: "bg-sky-50", title: "text-sky-950", body: "text-sky-800", iconClass: "text-sky-600", icon: CloudRain }
    case "cool":
      return { card: "bg-teal-50", title: "text-teal-950", body: "text-teal-800", iconClass: "text-teal-600", icon: CloudSun }
    case "dry":
      return { card: "bg-amber-50", title: "text-amber-950", body: "text-amber-800", iconClass: "text-amber-600", icon: Sun }
    case "transition":
      return { card: "bg-orange-50", title: "text-orange-950", body: "text-orange-800", iconClass: "text-orange-600", icon: ThermometerSun }
    default:
      return { card: "bg-emerald-50", title: "text-emerald-950", body: "text-emerald-800", iconClass: "text-emerald-600", icon: Sprout }
  }
}

function getMonthlyPlanningConditions(startDate: string, endDate: string, locationName: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []

  const highlandLocation = /(meru|nyandarua|nakuru|kiambu|nyeri|embu|elgeyo|uasin|kericho|bomet|nandi)/i.test(locationName)
  const conditions: Array<{ month: string; condition: string; category: PlanningConditionCategory }> = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= last && conditions.length < 12) {
    const month = cursor.toLocaleDateString("en-GB", { month: "long" })
    const monthIndex = cursor.getMonth()
    let condition = "Mild conditions likely; monitor local rainfall and soil moisture."
    let category: PlanningConditionCategory = "mild"

    if ([2, 3, 4].includes(monthIndex)) {
      category = "rainy"
      condition = highlandLocation
        ? "Long rains likely; plan drainage and watch for fungal disease pressure."
        : "Rainy conditions likely; protect young crops from waterlogging."
    } else if ([5, 6, 7].includes(monthIndex)) {
      category = "cool"
      condition = highlandLocation
        ? "Cool conditions; monitor late blight risk during misty or wet spells."
        : "Cool to dry conditions; check soil moisture before fertilizer applications."
    } else if (monthIndex === 8) {
      category = "transition"
      condition = "Mostly dry transition period; plan irrigation if rains delay."
    } else if ([9, 10, 11].includes(monthIndex)) {
      category = "rainy"
      condition = "Short rains possible; plan spray timing around wet days."
    } else {
      category = "dry"
      condition = "Warmer and drier conditions; conserve moisture and schedule irrigation early."
    }

    conditions.push({ month, condition, category })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return conditions
}
