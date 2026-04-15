"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp } from "lucide-react"

interface CostCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CostCalculatorModal({ open, onOpenChange }: CostCalculatorModalProps) {
  const [landSize, setLandSize] = useState("")
  const [unit, setUnit] = useState("acres")
  const [cropType, setCropType] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [calculatedCost, setCalculatedCost] = useState(0)

  const calculateCost = () => {
    const size = Number.parseFloat(landSize) || 0
    let costPerUnit = 0

    switch (cropType) {
      case "markies-potatoes":
        costPerUnit = 153500 // KSh per acre
        break
      case "shangi-potatoes":
        costPerUnit = 175000 // KSh per acre
        break
      case "maize":
        costPerUnit = 45000 // KSh per acre
        break
      default:
        costPerUnit = 100000
    }

    const total = size * costPerUnit
    setCalculatedCost(total)
    setShowResults(true)
  }

  const resetCalculator = () => {
    setLandSize("")
    setCropType("")
    setShowResults(false)
    setCalculatedCost(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span>Cost Calculator</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">Calculate estimated production costs for your crops</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Production Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Details</CardTitle>
              <p className="text-sm text-gray-600">Enter your farm details to get accurate cost estimates</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="landSize">Land Size</Label>
                  <Input
                    id="landSize"
                    type="number"
                    placeholder="Enter size"
                    value={landSize}
                    onChange={(e) => setLandSize(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="hectares">Hectares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cropType">Crop Type</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop variety" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markies-potatoes">Markies Potatoes</SelectItem>
                    <SelectItem value="shangi-potatoes">Shangi Potatoes</SelectItem>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="beans">Beans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={calculateCost} className="w-full" disabled={!landSize || !cropType}>
                Calculate Costs
              </Button>

              {showResults && (
                <Button onClick={resetCalculator} variant="outline" className="w-full bg-transparent">
                  Reset Calculator
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cost Estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Cost Estimate</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                {showResults ? `Estimated costs for ${cropType?.replace("-", " ")}` : "Results will appear here"}
              </p>
            </CardHeader>
            <CardContent>
              {showResults ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Estimated Cost</div>
                    <div className="text-3xl font-bold text-blue-600">KSh {calculatedCost.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      for {landSize} {unit}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Land Size</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {landSize} {unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Crop Chosen</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{cropType?.replace("-", " ")}</div>
                        <div className="text-xs text-gray-500">Potato Variety</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Seed Requirement</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{Math.round(Number.parseFloat(landSize) * 18)} bags</div>
                        <div className="text-xs text-gray-500">Based on 18 bags per acre standard</div>
                      </div>
                    </div>
                  </div>
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

        {showResults && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Costs are based on current market rates and may vary by location</li>
                <li>• Transport costs may vary depending on distance from suppliers</li>
                <li>• Size 1 seeds = 16 bags per acre, Size 2 seeds = 20 bags per acre</li>
                <li>• Prices include certified seeds, fertilizers, and crop protection materials</li>
                <li>• Labor costs may vary based on local rates and availability</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
