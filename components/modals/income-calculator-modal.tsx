"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calculator, Minus, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { CropVariety } from "@/lib/types/production"

interface IncomeCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface IncomeResult {
  acres: number
  expectedYield: number
  pricePerKg: number
  totalIncome: number
  incomePerAcre: number
  totalCost: number
  costPerAcre: number
  totalProfit: number
  profitPerAcre: number
  profitMargin: number
  roi: number
  recommendations: string[]
  costBreakdown: {
    seeds: number
    fertilizer: number
    pesticides: number
    labor: number
    equipment: number
    other: number
  }
  // Investment-based recommendations
  investmentAnalysis?: {
    maxAcreageForBudget: number
    requiredInvestment: number
    suggestedAcreage: number
    efficiencyScore: number
  }
}

export function IncomeCalculatorModal({ open, onOpenChange }: IncomeCalculatorModalProps) {
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [formData, setFormData] = useState({
    cropVarietyId: "",
    acres: 0,
    expectedYield: 0, // kg per acre
    pricePerKg: 0,
    investmentAmount: 0, // Optional: for investment-based recommendations
  })
  const [result, setResult] = useState<IncomeResult | null>(null)

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

  const calculateCosts = (acres: number, cropVariety: CropVariety | undefined) => {
    if (!cropVariety) {
      return {
        seeds: acres * 50000,
        fertilizer: acres * 15000,
        pesticides: acres * 8000,
        labor: acres * 25000,
        equipment: acres * 12000,
        other: acres * 5000,
      }
    }

    // Use crop variety data for more accurate cost calculation
    const seedCost = cropVariety.seedCostPerBag * cropVariety.seedSize1BagsPerAcre * acres
    
    return {
      seeds: seedCost,
      fertilizer: acres * 15000, // Base fertilizer cost per acre
      pesticides: acres * 8000,  // Base pesticide cost per acre
      labor: acres * 25000,      // Base labor cost per acre
      equipment: acres * 12000,  // Base equipment cost per acre
      other: acres * 5000,       // Other miscellaneous costs per acre
    }
  }

  const calculateIncome = () => {
    if (!formData.acres || !formData.expectedYield || !formData.pricePerKg) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const selectedCrop = cropVarieties.find(c => c.id === formData.cropVarietyId)
    const costBreakdown = calculateCosts(formData.acres, selectedCrop)
    const totalCost = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0)
    const costPerAcre = totalCost / formData.acres

    const totalYield = formData.acres * formData.expectedYield
    const totalIncome = totalYield * formData.pricePerKg
    const incomePerAcre = formData.expectedYield * formData.pricePerKg
    
    const totalProfit = totalIncome - totalCost
    const profitPerAcre = totalProfit / formData.acres
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
    const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    // Generate recommendations based on the calculations
    const recommendations: string[] = []
    
    if (profitMargin < 20) {
      recommendations.push("Low profit margin. Consider reducing costs or finding better market prices")
    }
    if (roi < 30) {
      recommendations.push("Low return on investment. Look for ways to increase yield or reduce input costs")
    }
    if (totalProfit < 0) {
      recommendations.push("This investment shows a loss. Reconsider your farming strategy or crop choice")
    }
    if (profitPerAcre > 50000) {
      recommendations.push("Excellent profit potential! Consider expanding your operation")
    }
    if (formData.pricePerKg < 30) {
      recommendations.push("Look for better market channels or value addition opportunities")
    }
    if (formData.expectedYield < 1000) {
      recommendations.push("Focus on increasing yield through proper fertilization and pest management")
    }

    // Investment-based analysis (optional)
    let investmentAnalysis = undefined
    if (formData.investmentAmount > 0) {
      const maxAcreageForBudget = formData.investmentAmount / costPerAcre
      const requiredInvestment = formData.acres * costPerAcre
      const suggestedAcreage = Math.min(maxAcreageForBudget, formData.acres)
      const efficiencyScore = formData.investmentAmount > 0 ? (totalProfit / formData.investmentAmount) * 100 : 0

      investmentAnalysis = {
        maxAcreageForBudget,
        requiredInvestment,
        suggestedAcreage,
        efficiencyScore,
      }

      // Add investment-specific recommendations
      if (formData.investmentAmount < requiredInvestment) {
        recommendations.push(`Consider reducing acreage to ${maxAcreageForBudget.toFixed(1)} acres to match your budget of KSh ${formData.investmentAmount.toLocaleString()}`)
      }
      if (efficiencyScore > 50) {
        recommendations.push("Excellent investment efficiency! Your funds are well allocated for this farming operation")
      } else if (efficiencyScore < 20) {
        recommendations.push("Low investment efficiency. Consider higher-value crops or reducing costs")
      }
    }

    setResult({
      acres: formData.acres,
      expectedYield: formData.expectedYield,
      pricePerKg: formData.pricePerKg,
      totalIncome,
      incomePerAcre,
      totalCost,
      costPerAcre,
      totalProfit,
      profitPerAcre,
      profitMargin,
      roi,
      costBreakdown,
      recommendations,
      investmentAnalysis,
    })

    toast({
      title: "Calculation Complete",
      description: "Income, costs, and profit analysis completed successfully",
    })
  }

  const resetCalculator = () => {
    setFormData({
      cropVarietyId: "",
      acres: 0,
      expectedYield: 0,
      pricePerKg: 0,
      investmentAmount: 0,
    })
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Profit & Income Calculator</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farm Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="crop">Crop Variety *</Label>
                <Select
                  value={formData.cropVarietyId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, cropVarietyId: value }))
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={loadingVarieties ? "Loading varieties..." : "Select crop variety"} />
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
                <Label htmlFor="acres">Land Size (Acres) *</Label>
                <Input
                  id="acres"
                  type="number"
                  step="0.1"
                  placeholder="Enter acreage"
                  value={formData.acres || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      acres: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="yield">Expected Yield per Acre (Kg) *</Label>
                <Input
                  id="yield"
                  type="number"
                  step="10"
                  placeholder="Expected kg per acre"
                  value={formData.expectedYield || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedYield: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: Potatoes typically yield 800-1500 kg per acre
                </p>
              </div>

              <div>
                <Label htmlFor="price">Expected Price per Kg (KSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  placeholder="Price per kg in KSh"
                  value={formData.pricePerKg || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerKg: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current market price or expected selling price
                </p>
              </div>

              <div>
                <Label htmlFor="investment">Available Investment (KSh) - Optional</Label>
                <Input
                  id="investment"
                  type="number"
                  step="1000"
                  placeholder="Your available budget (optional)"
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
                  Enter your budget to get investment-based acreage recommendations
                </p>
              </div>

              <Button
                onClick={calculateIncome}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                disabled={!formData.acres || !formData.expectedYield || !formData.pricePerKg || loadingVarieties}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Profit & Income
              </Button>

              {result && (
                <Button onClick={resetCalculator} variant="outline" className="w-full h-12">
                  Reset Calculator
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Profit & Income Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Profit Summary */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Total Profit */}
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Total Expected Profit</div>
                      <div className={`text-3xl font-bold ${result.totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        KSh {result.totalProfit.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        from {result.acres} acres ({result.profitMargin.toFixed(1)}% margin)
                      </div>
                    </div>
                    
                    {/* Income vs Costs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Total Income</div>
                        <div className="text-xl font-bold text-blue-700">
                          KSh {result.totalIncome.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Total Costs</div>
                        <div className="text-xl font-bold text-orange-700">
                          KSh {result.totalCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Cost Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>Seeds</span>
                        <span>KSh {result.costBreakdown.seeds.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>Fertilizer</span>
                        <span>KSh {result.costBreakdown.fertilizer.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>Pesticides</span>
                        <span>KSh {result.costBreakdown.pesticides.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>Labor</span>
                        <span>KSh {result.costBreakdown.labor.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>Equipment</span>
                        <span>KSh {result.costBreakdown.equipment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>Other</span>
                        <span>KSh {result.costBreakdown.other.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Per Acre Analysis */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Per Acre Analysis</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-sm">Income/Acre</span>
                        <div className="font-semibold">KSh {result.incomePerAcre.toLocaleString()}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium text-sm">Cost/Acre</span>
                        <div className="font-semibold">KSh {result.costPerAcre.toLocaleString()}</div>
                      </div>
                      <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-sm">Profit/Acre</span>
                        <div className={`font-semibold ${result.profitPerAcre >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          KSh {result.profitPerAcre.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium text-sm">ROI</span>
                        <div className={`font-semibold ${result.roi >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
                          {result.roi.toFixed(1)}%
                        </div>
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
                            <span className="text-green-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Investment Analysis */}
                  {result.investmentAnalysis && (
                    <div className="space-y-3 mt-6">
                      <h4 className="font-medium text-gray-900">Investment Analysis</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Max Acreage for Budget</div>
                          <div className="font-semibold text-blue-700">
                            {result.investmentAnalysis.maxAcreageForBudget.toFixed(1)} acres
                          </div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Required Investment</div>
                          <div className="font-semibold text-orange-700">
                            KSh {result.investmentAnalysis.requiredInvestment.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Investment Efficiency</div>
                          <div className={`font-semibold ${result.investmentAnalysis.efficiencyScore >= 30 ? 'text-purple-700' : 'text-red-600'}`}>
                            {result.investmentAnalysis.efficiencyScore.toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Suggested Acreage</div>
                          <div className="font-semibold text-green-700">
                            {result.investmentAnalysis.suggestedAcreage.toFixed(1)} acres
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Production Summary */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {((result.acres * result.expectedYield) / 1000).toFixed(1)}T
                      </div>
                      <div className="text-xs text-gray-600">Total yield in tonnes</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        KSh {result.pricePerKg}
                      </div>
                      <div className="text-xs text-gray-600">Price per kg</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your farm details to calculate profit and income</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}