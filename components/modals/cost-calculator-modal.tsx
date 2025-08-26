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
      const varieties = await apiClient.getCropVarieties()
      setCropVarieties(varieties)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load crop varieties",
        variant: "destructive",
      })
    } finally {
      setLoadingVarieties(false)
    }
  }

  const calculateCost = async () => {
    if (!formData.cropVarietyId || !formData.landSizeAcres || !formData.location?.county) {
      toast({
        title: "Missing Information",
        description: "Please fill in crop variety, land size, and county",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Ensure subCounty has a default value
      const requestData = {
        ...formData,
        location: {
          county: formData.location?.county || "",
          subCounty: formData.location?.subCounty || "General"
        }
      }
      
      const response = await apiClient.getCostEstimate(requestData)
      // Handle wrapped API response
      const result = (response as any).data || response
      setResult(result as CostCalculationResponse)
      toast({
        title: "Calculation Complete",
        description: "Cost estimate has been calculated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate costs",
        variant: "destructive",
      })
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
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
                    <Label htmlFor="landSize">Land Size (Acres) *</Label>
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
                      onValueChange={(value) => setFormData((prev) => ({ 
                        ...prev, 
                        seedSize: Number(value) === 2 ? 2 : 1 
                      }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select seed size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Size 1 (16 bags/acre)</SelectItem>
                        <SelectItem value="2">Size 2 (20 bags/acre)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="county">County *</Label>
                    <Input
                      id="county"
                      placeholder="Enter your county"
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
                    <Label htmlFor="subCounty">Sub County (Optional)</Label>
                    <Input
                      id="subCounty"
                      placeholder="Sub County (optional)"
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

                  <Button
                    onClick={calculateCost}
                    className="w-full h-12 bg-sage-700 hover:bg-sage-800"
                    disabled={loading || !formData.cropVarietyId || !formData.landSizeAcres || !formData.location?.county}
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
