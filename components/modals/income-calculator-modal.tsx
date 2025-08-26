"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calculator } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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
  recommendations: string[]
}

export function IncomeCalculatorModal({ open, onOpenChange }: IncomeCalculatorModalProps) {
  const [formData, setFormData] = useState({
    acres: 0,
    expectedYield: 0, // kg per acre
    pricePerKg: 0,
  })
  const [result, setResult] = useState<IncomeResult | null>(null)

  const calculateIncome = () => {
    if (!formData.acres || !formData.expectedYield || !formData.pricePerKg) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const totalYield = formData.acres * formData.expectedYield
    const totalIncome = totalYield * formData.pricePerKg
    const incomePerAcre = formData.expectedYield * formData.pricePerKg

    // Generate recommendations based on the calculations
    const recommendations: string[] = []
    
    if (incomePerAcre < 50000) {
      recommendations.push("Consider improving yield through better farming practices or choosing higher-value crops")
    }
    if (formData.pricePerKg < 30) {
      recommendations.push("Look for better market channels or value addition opportunities")
    }
    if (formData.expectedYield < 1000) {
      recommendations.push("Focus on increasing yield through proper fertilization and pest management")
    }
    if (totalIncome > 200000) {
      recommendations.push("Great potential! Consider investing in storage facilities for better market timing")
    }

    setResult({
      acres: formData.acres,
      expectedYield: formData.expectedYield,
      pricePerKg: formData.pricePerKg,
      totalIncome,
      incomePerAcre,
      recommendations,
    })

    toast({
      title: "Calculation Complete",
      description: "Expected income has been calculated successfully",
    })
  }

  const resetCalculator = () => {
    setFormData({
      acres: 0,
      expectedYield: 0,
      pricePerKg: 0,
    })
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Expected Income Calculator</span>
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

              <Button
                onClick={calculateIncome}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                disabled={!formData.acres || !formData.expectedYield || !formData.pricePerKg}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Expected Income
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
                <span>Income Projection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Total Income */}
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Total Expected Income</div>
                    <div className="text-3xl font-bold text-green-700">
                      KSh {result.totalIncome.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      from {result.acres} acres
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Total Yield</span>
                      <div className="text-right">
                        <div className="font-semibold">{(result.acres * result.expectedYield).toLocaleString()} kg</div>
                        <div className="text-xs text-gray-500">{result.expectedYield} kg/acre</div>
                      </div>
                    </div>

                    <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="font-medium">Price per Kg</span>
                      <div className="font-semibold">KSh {result.pricePerKg}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Income per Acre</span>
                      <div className="font-semibold">KSh {result.incomePerAcre.toLocaleString()}</div>
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

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        KSh {Math.round(result.totalIncome / result.acres).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Revenue per acre</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {((result.acres * result.expectedYield) / 1000).toFixed(1)}T
                      </div>
                      <div className="text-xs text-gray-600">Total yield in tonnes</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your farm details to calculate expected income</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}