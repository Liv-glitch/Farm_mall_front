"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { CropVariety } from "@/lib/types/production"
import { POTATO_VARIETIES } from "@/lib/data/potato-varieties"

interface CostCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CostResult {
  cropVarietyName: string
  landSizeAcres: number
  seedRequirement: number
  estimatedTotalCost: number
  costBreakdown: {
    seeds: number
    fertilizer: number
    herbicides: number
    fungicides: number
    insecticides: number
    labor: number
    landPreparation: number
    miscellaneous: number
  }
}

export function CostCalculatorModal({ open, onOpenChange }: CostCalculatorModalProps) {
  const [cropVarietyId, setCropVarietyId] = useState("")
  const [landSize, setLandSize] = useState("")
  const [seedSize, setSeedSize] = useState<1 | 2>(1)
  const [result, setResult] = useState<CostResult | null>(null)

  const cropVarieties: CropVariety[] = POTATO_VARIETIES

  const calculateCost = () => {
    if (!cropVarietyId || !landSize) {
      toast({
        title: "Missing Information",
        description: "Please fill in crop variety and land size",
        variant: "destructive",
      })
      return
    }

    const size = Number.parseFloat(landSize) || 0
    const selectedVariety = cropVarieties.find(v => v.id === cropVarietyId)

    if (!selectedVariety) {
      toast({ title: "Error", description: "Please select a crop variety", variant: "destructive" })
      return
    }

    const bagsPerAcre = seedSize === 1 ? selectedVariety.seedSize1BagsPerAcre : selectedVariety.seedSize2BagsPerAcre
    const seedCostPerAcre = seedSize === 1 ? selectedVariety.seedSize1CostPerAcre : selectedVariety.seedSize2CostPerAcre

    const breakdown = {
      seeds: seedCostPerAcre * size,
      fertilizer: selectedVariety.fertilizerCostPerAcre * size,
      herbicides: selectedVariety.herbicideCostPerAcre * size,
      fungicides: selectedVariety.fungicideCostPerAcre * size,
      insecticides: selectedVariety.insecticideCostPerAcre * size,
      labor: selectedVariety.laborCostPerAcre * size,
      landPreparation: selectedVariety.landPreparationCostPerAcre * size,
      miscellaneous: selectedVariety.miscellaneousCostPerAcre * size,
    }

    const total = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0)

    setResult({
      cropVarietyName: selectedVariety.name,
      landSizeAcres: size,
      seedRequirement: size * bagsPerAcre,
      estimatedTotalCost: total,
      costBreakdown: breakdown,
    })

    toast({ title: "Calculation Complete", description: "Cost estimate has been calculated successfully" })
  }

  const resetCalculator = () => {
    setCropVarietyId("")
    setLandSize("")
    setSeedSize(1)
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
              <div>
                <Label htmlFor="cropVariety">Crop Variety *</Label>
                <Select value={cropVarietyId} onValueChange={setCropVarietyId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select crop variety" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropVarieties.map((variety) => (
                      <SelectItem key={variety.id} value={variety.id}>
                        {variety.name}
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
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="seedSize">Seed Size</Label>
                <Select
                  value={seedSize.toString()}
                  onValueChange={(value) => setSeedSize(Number(value) as 1 | 2)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select seed size" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropVarietyId && (() => {
                      const selectedVariety = cropVarieties.find(v => v.id === cropVarietyId)
                      return selectedVariety ? (
                        <>
                          <SelectItem value="1">Size 1 ({selectedVariety.seedSize1BagsPerAcre} bags per acre)</SelectItem>
                          <SelectItem value="2">Size 2 ({selectedVariety.seedSize2BagsPerAcre} bags per acre)</SelectItem>
                        </>
                      ) : null
                    })() || (
                      <>
                        <SelectItem value="1">Size 1</SelectItem>
                        <SelectItem value="2">Size 2</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={calculateCost}
                className="w-full h-12 bg-sage-700 hover:bg-sage-800"
                disabled={!cropVarietyId || !landSize}
              >
                Calculate Costs
              </Button>

              {result && (
                <Button onClick={resetCalculator} variant="outline" className="w-full h-12 bg-transparent">
                  Reset Calculator
                </Button>
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
                  <div className="text-center p-6 bg-gradient-to-br from-sage-50 to-warm-50 rounded-xl border border-sage-100">
                    <div className="text-sm text-gray-600 mb-1">Total Production Cost</div>
                    <div className="text-3xl font-bold text-sage-700">
                      KSh {result.estimatedTotalCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      for {result.landSizeAcres} acres of {result.cropVarietyName}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Cost per acre: KSh {Math.round(result.estimatedTotalCost / result.landSizeAcres).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Seeds</span>
                      <div className="text-right">
                        <div className="font-semibold">KSh {result.costBreakdown.seeds.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{result.seedRequirement} bags total</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Fertilizer</span>
                      <div className="font-semibold">KSh {result.costBreakdown.fertilizer.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Herbicides</span>
                      <div className="font-semibold">KSh {result.costBreakdown.herbicides.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Fungicides</span>
                      <div className="font-semibold">KSh {result.costBreakdown.fungicides.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Insecticides</span>
                      <div className="font-semibold">KSh {result.costBreakdown.insecticides.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Labor</span>
                      <div className="font-semibold">KSh {result.costBreakdown.labor.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Land Preparation</span>
                      <div className="font-semibold">KSh {result.costBreakdown.landPreparation.toLocaleString()}</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Other Costs</span>
                      <div className="font-semibold">KSh {result.costBreakdown.miscellaneous.toLocaleString()}</div>
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
      </DialogContent>
    </Dialog>
  )
}
