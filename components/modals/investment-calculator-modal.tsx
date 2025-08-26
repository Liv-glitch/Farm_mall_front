"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, TrendingUp, Calculator, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { CropVariety } from "@/lib/types/production"

interface InvestmentCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface InvestmentResult {
  cropVarietyName: string
  investmentAmount: number
  maxAcreage: number
  estimatedYield: number
  totalYield: number
  potentialRevenue: number
  profitMargin: number
  roi: number
  recommendations: string[]
}

export function InvestmentCalculatorModal({ open, onOpenChange }: InvestmentCalculatorModalProps) {
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [formData, setFormData] = useState({
    cropVarietyId: "",
    investmentAmount: 0,
    expectedPricePerKg: 0,
  })
  const [result, setResult] = useState<InvestmentResult | null>(null)

  useEffect(() => {
    if (open) {
      loadCropVarieties()
    }
  }, [open])

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

  const calculateInvestment = () => {
    if (!formData.cropVarietyId || !formData.investmentAmount || !formData.expectedPricePerKg) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const selectedVariety = cropVarieties.find(v => v.id === formData.cropVarietyId)
    if (!selectedVariety) return

    // Rough estimates based on typical Kenyan farming costs
    // These would ideally come from a cost calculation API
    const estimatedCostPerAcre = {
      'potato': 80000,
      'maize': 45000,
      'beans': 35000,
      'cabbage': 60000,
      'tomato': 90000,
      'onion': 70000,
    }

    const cropType = selectedVariety.cropType.toLowerCase()
    const baseCostPerAcre = estimatedCostPerAcre[cropType as keyof typeof estimatedCostPerAcre] || 50000
    
    // Calculate maximum acreage based on investment
    const maxAcreage = formData.investmentAmount / baseCostPerAcre

    // Estimate yield per acre based on crop type
    const yieldPerAcre = {
      'potato': 1200,
      'maize': 800,
      'beans': 600,
      'cabbage': 2000,
      'tomato': 1500,
      'onion': 1000,
    }

    const estimatedYieldPerAcre = yieldPerAcre[cropType as keyof typeof yieldPerAcre] || 800
    const totalYield = maxAcreage * estimatedYieldPerAcre
    const potentialRevenue = totalYield * formData.expectedPricePerKg
    const profitMargin = potentialRevenue - formData.investmentAmount
    const roi = ((profitMargin / formData.investmentAmount) * 100)

    // Generate recommendations
    const recommendations: string[] = []
    
    if (maxAcreage < 0.5) {
      recommendations.push("Consider increasing your investment amount or choosing a lower-cost crop")
    }
    if (roi < 20) {
      recommendations.push("Low ROI predicted. Consider higher-value crops or better market prices")
    } else if (roi > 100) {
      recommendations.push("Excellent ROI potential! Ensure you have good farming practices to achieve projected yields")
    }
    if (maxAcreage > 5) {
      recommendations.push("Large scale farming detected. Consider mechanization and bulk purchasing for better margins")
    }
    if (formData.expectedPricePerKg < 30) {
      recommendations.push("Price seems low. Research market opportunities and value addition options")
    }

    setResult({
      cropVarietyName: selectedVariety.name,
      investmentAmount: formData.investmentAmount,
      maxAcreage,
      estimatedYield: estimatedYieldPerAcre,
      totalYield,
      potentialRevenue,
      profitMargin,
      roi,
      recommendations,
    })

    toast({
      title: "Calculation Complete",
      description: "Investment analysis has been calculated successfully",
    })
  }

  const resetCalculator = () => {
    setFormData({
      cropVarietyId: "",
      investmentAmount: 0,
      expectedPricePerKg: 0,
    })
    setResult(null)
  }

  const selectedVariety = cropVarieties.find(v => v.id === formData.cropVarietyId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Investment-Based Acreage Calculator</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Details</CardTitle>
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
                    <Label htmlFor="investment">Investment Amount (KSh) *</Label>
                    <Input
                      id="investment"
                      type="number"
                      step="1000"
                      placeholder="Total amount to invest"
                      value={formData.investmentAmount || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          investmentAmount: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total capital available for farming operations
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="expectedPrice">Expected Selling Price per Kg (KSh) *</Label>
                    <Input
                      id="expectedPrice"
                      type="number"
                      step="1"
                      placeholder="Expected market price"
                      value={formData.expectedPricePerKg || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          expectedPricePerKg: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Target selling price at harvest time
                    </p>
                  </div>

                  {selectedVariety && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Selected Variety Info</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>Maturity Period: {selectedVariety.maturityPeriodDays} days</div>
                        <div>Seed Cost: KSh {selectedVariety.seedCostPerBag}/bag</div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={calculateInvestment}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    disabled={!formData.cropVarietyId || !formData.investmentAmount || !formData.expectedPricePerKg}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Optimal Acreage
                  </Button>

                  {result && (
                    <Button onClick={resetCalculator} variant="outline" className="w-full h-12">
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
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Investment Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Main Results */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Maximum Farmable Area</div>
                    <div className="text-3xl font-bold text-blue-700">
                      {result.maxAcreage.toFixed(1)} acres
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      with KSh {result.investmentAmount.toLocaleString()} investment
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {result.roi.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">Expected ROI</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {(result.totalYield / 1000).toFixed(1)}T
                      </div>
                      <div className="text-xs text-gray-600">Total Yield</div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Crop Variety</span>
                      <div className="font-semibold">{result.cropVarietyName}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-indigo-50 rounded-lg">
                      <span className="font-medium">Yield per Acre</span>
                      <div className="font-semibold">{result.estimatedYield.toLocaleString()} kg</div>
                    </div>

                    <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Total Yield</span>
                      <div className="font-semibold">{result.totalYield.toLocaleString()} kg</div>
                    </div>

                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Potential Revenue</span>
                      <div className="font-semibold">KSh {result.potentialRevenue.toLocaleString()}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="font-medium">Expected Profit</span>
                      <div className={`font-semibold ${result.profitMargin > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        KSh {result.profitMargin.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 text-gray-900">Recommendations</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 text-gray-900">Financial Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Investment:</span>
                        <div className="font-semibold">KSh {result.investmentAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <div className="font-semibold">KSh {result.potentialRevenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit:</span>
                        <div className={`font-semibold ${result.profitMargin > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          KSh {result.profitMargin.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <div className={`font-semibold ${result.roi > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {result.roi.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your investment details to calculate optimal acreage</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}