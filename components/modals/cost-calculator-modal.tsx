"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import type { CostCalculationRequest, CostCalculationResponse, CropVariety } from "@/lib/types/calculator"

interface CostCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CostCalculatorModal({ open, onOpenChange }: CostCalculatorModalProps) {
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [formData, setFormData] = useState<CostCalculationRequest>({
    cropVarietyId: "",
    landSizeAcres: 0,
    seedSize: 1,
    location: {
      county: "",
      subCounty: "",
    },
  })
  const [result, setResult] = useState<CostCalculationResponse | null>(null)
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
      console.log("🌱 Loading crop varieties...")

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
      const processedVarieties = varieties.map((variety) => ({
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
      console.error("🚨 Failed to load crop varieties:", error)
      toast({
        title: "Failed to load crop varieties",
        description: error.message,
        variant: "destructive",
      })
      // Fallback to mock data as array
      setCropVarieties([
        {
          id: "shangi-1",
          name: "Shangi",
          cropType: "Potato",
          maturityPeriodDays: 85,
          seedSize1BagsPerAcre: 16,
          seedSize2BagsPerAcre: 20,
          seedCostPerBag: 2500,
          createdAt: new Date(),
        },
        {
          id: "markies-1",
          name: "Markies",
          cropType: "Potato",
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

  const calculateCost = async () => {
    if (!formData.cropVarietyId || !formData.landSizeAcres) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("💰 Sending cost calculation request:", formData)
      const response = await apiClient.getCostEstimate(formData)
      console.log("💰 Cost calculation response:", response)

      setResult(response)
      toast({
        title: "Calculation Complete",
        description: "Cost estimate has been calculated successfully",
      })
    } catch (error: any) {
      console.error("💥 Cost calculation failed:", error)
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate costs",
        variant: "destructive",
      })

      // Fallback calculation for demo
      const selectedVariety = cropVarieties.find((v) => v.id === formData.cropVarietyId)
      if (selectedVariety) {
        const bagsNeeded =
          formData.seedSize === 1
            ? selectedVariety.seedSize1BagsPerAcre * formData.landSizeAcres
            : selectedVariety.seedSize2BagsPerAcre * formData.landSizeAcres

        const seedCost = bagsNeeded * selectedVariety.seedCostPerBag
        const laborCost = formData.landSizeAcres * 15000
        const fertilizerCost = formData.landSizeAcres * 25000
        const pesticideCost = formData.landSizeAcres * 8000
        const otherCost = formData.landSizeAcres * 5000

        const mockResult: CostCalculationResponse = {
          cropVarietyId: selectedVariety.id,
          cropVarietyName: selectedVariety.name,
          landSizeAcres: formData.landSizeAcres,
          seedSize: formData.seedSize,
          seedRequirement: {
            bagsNeeded: bagsNeeded,
            totalCost: seedCost,
          },
          estimatedTotalCost: seedCost + laborCost + fertilizerCost + pesticideCost + otherCost,
          costBreakdown: {
            seeds: seedCost,
            labor: laborCost,
            fertilizer: fertilizerCost,
            pesticides: pesticideCost,
            other: otherCost,
          },
          recommendations: [
            "Consider bulk purchasing for seed cost savings",
            "Plan labor activities during optimal weather conditions",
            "Use certified seeds for better yields",
          ],
        }
        setResult(mockResult)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetCalculator = () => {
    setFormData({
      cropVarietyId: "",
      landSizeAcres: 0,
      seedSize: 1,
      location: { county: "", subCounty: "" },
    })
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-sage-600" />
            <span>Cost Calculator</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Details</CardTitle>
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
                    <Label htmlFor="cropVariety">Crop Variety</Label>
                    <Select
                      value={formData.cropVarietyId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, cropVarietyId: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select crop variety" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(cropVarieties) &&
                          cropVarieties.map((variety) => (
                            <SelectItem key={variety.id} value={variety.id}>
                              {variety.name} ({variety.maturityPeriodDays} days)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="seedSize">Seed Size</Label>
                    <Select
                      value={formData.seedSize.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          seedSize: Number.parseInt(value) as 1 | 2,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Size 1</SelectItem>
                        <SelectItem value="2">Size 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        placeholder="County"
                        value={formData.location?.county || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: { ...prev.location, county: e.target.value },
                          }))
                        }
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subCounty">Sub County</Label>
                      <Input
                        id="subCounty"
                        placeholder="Sub County"
                        value={formData.location?.subCounty || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: { ...prev.location, subCounty: e.target.value },
                          }))
                        }
                        className="h-12"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateCost}
                    className="w-full h-12 bg-sage-700 hover:bg-sage-800"
                    disabled={loading || !formData.cropVarietyId || !formData.landSizeAcres}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      "Calculate Costs"
                    )}
                  </Button>

                  {result && (
                    <Button onClick={resetCalculator} variant="outline" className="w-full h-12 bg-transparent">
                      Reset Calculator
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-warm-600" />
                <span>Cost Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-sage-50 to-warm-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Total Estimated Cost</div>
                    <div className="text-3xl font-bold text-sage-700">
                      KSh {result.estimatedTotalCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      for {result.landSizeAcres} acres of {result.cropVarietyName}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Seeds</span>
                      <div className="text-right">
                        <div className="font-semibold">KSh {result.costBreakdown.seeds.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{result.seedRequirement.bagsNeeded} bags</div>
                      </div>
                    </div>

                    <div className="flex justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Labor</span>
                      <div className="font-semibold">KSh {result.costBreakdown.labor.toLocaleString()}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Fertilizer</span>
                      <div className="font-semibold">KSh {result.costBreakdown.fertilizer.toLocaleString()}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Pesticides</span>
                      <div className="font-semibold">KSh {result.costBreakdown.pesticides.toLocaleString()}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Other Costs</span>
                      <div className="font-semibold">KSh {result.costBreakdown.other.toLocaleString()}</div>
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div className="mt-6">
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
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your production details to see cost estimates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
