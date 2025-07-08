"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Cloud, Sun, CloudRain, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import type { HarvestPredictionRequest, HarvestPredictionResponse, CropVariety } from "@/lib/types/calculator"

interface HarvestForecastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HarvestForecastModal({ open, onOpenChange }: HarvestForecastModalProps) {
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
  const [result, setResult] = useState<HarvestPredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingVarieties, setLoadingVarieties] = useState(true)

  useEffect(() => {
    if (open) {
      loadCropVarieties()
    }
  }, [open])

  const loadCropVarieties = async () => {
    try {
      setLoadingVarieties(true)
      console.log("🌱 Loading crop varieties for forecast...")

      const response = await apiClient.getCropVarieties()
      console.log("🌱 Raw API response:", response)

      // Handle different response structures
      let varieties = []
      if (Array.isArray(response)) {
        varieties = response
      } else if (response?.varieties && Array.isArray(response.varieties)) {
        varieties = response.varieties
      } else if (response?.data?.varieties && Array.isArray(response.data.varieties)) {
        varieties = response.data.varieties
      }

      console.log("🌱 Processed varieties:", varieties)
      console.log("🌱 Varieties count:", varieties.length)

      // Convert string values to numbers for seedCostPerBag
      const processedVarieties = varieties.map((variety: any) => ({
        ...variety,
        seedCostPerBag:
          typeof variety.seedCostPerBag === "string"
            ? Number.parseFloat(variety.seedCostPerBag)
            : variety.seedCostPerBag,
        createdAt: new Date(variety.createdAt),
      }))

      setCropVarieties(processedVarieties)
      console.log("🌱 Final processed varieties:", processedVarieties)
    } catch (error: any) {
      console.error("Failed to load crop varieties:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load crop varieties",
        variant: "destructive",
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
            totalKg: formData.landSizeAcres * 18000, // 18 tons per acre average
            yieldPerAcre: 18000,
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
      location: { latitude: 0, longitude: 0 },
    })
    setResult(null)
  }

  const handleLocationChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setFormData((prev) => ({
      ...prev,
      location: {
        latitude: field === 'latitude' ? numValue : (prev.location?.latitude ?? 0),
        longitude: field === 'longitude' ? numValue : (prev.location?.longitude ?? 0),
      }
    }))
  }

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
                        {cropVarieties.map((variety) => (
                          <SelectItem key={variety.id} value={variety.id}>
                            {variety.name} ({variety.cropType})
                          </SelectItem>
                        ))}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude (Optional)</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.0001"
                        placeholder="-0.4031"
                        value={formData.location?.latitude ?? ""}
                        onChange={(e) => handleLocationChange('latitude', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude (Optional)</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.0001"
                        placeholder="36.9378"
                        value={formData.location?.longitude ?? ""}
                        onChange={(e) => handleLocationChange('longitude', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

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
                    <div className="text-sm text-gray-600 mb-1">Expected Harvest Date</div>
                    <div className="text-2xl font-bold text-sage-700 mb-1">
                      {new Date(result.estimatedHarvestDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-sm text-warm-600">
                      Harvest Window: {new Date(result.harvestWindow.startDate).toLocaleDateString()} -{" "}
                      {new Date(result.harvestWindow.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Expected Yield</span>
                      <div className="text-right">
                        <div className="font-semibold">{(result.estimatedYield.totalKg / 1000).toFixed(1)} tons</div>
                        <div className="text-xs text-gray-500">
                          {(result.estimatedYield.yieldPerAcre / 1000).toFixed(1)} tons/acre
                        </div>
                      </div>
                    </div>

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

                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Avg Temperature</span>
                      <div className="font-semibold">{result.climateConditions.averageTemperature}°C</div>
                    </div>

                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Expected Rainfall</span>
                      <div className="font-semibold">{result.climateConditions.expectedRainfall}mm</div>
                    </div>

                    <div className="flex justify-between p-3 bg-cyan-50 rounded-lg">
                      <span className="font-medium">Humidity</span>
                      <div className="font-semibold">{result.climateConditions.humidity}%</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Weather Pattern</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-xs font-medium">Sunny</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Cloud className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                        <div className="text-xs font-medium">Cloudy</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <CloudRain className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-xs font-medium">Rainy</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-xs font-medium">Clear</div>
                      </div>
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recommendations</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-sage-600">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
