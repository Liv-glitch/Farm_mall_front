"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp, Loader2 } from "lucide-react"
import type { CropVariety } from "@/lib/types/production"

export function CostCalculatorPublic() {
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [landSize, setLandSize] = useState("")
  const [cropVarietyId, setCropVarietyId] = useState("")
  const [seedSize, setSeedSize] = useState<1 | 2>(1)
  const [showResults, setShowResults] = useState(false)
  const [calculatedCost, setCalculatedCost] = useState(0)
  const [seedRequirement, setSeedRequirement] = useState(0)
  const [costBreakdown, setCostBreakdown] = useState({
    seeds: 0,
    fertilizer: 0,
    herbicides: 0,
    fungicides: 0,
    insecticides: 0,
    labor: 0,
    landPreparation: 0,
    miscellaneous: 0
  })

  useEffect(() => {
    loadCropVarieties()
  }, [])

  const loadCropVarieties = async () => {
    try {
      setLoadingVarieties(true)

      // Hardcoded crop variety data for public calculator
      const hardcodedVarieties = [
        {
          id: "392f993e-3ee5-48fc-9bd3-15d81bc40b88",
          name: "Shangi",
          cropType: "potato",
          maturityPeriodDays: 90,
          seedSize1BagsPerAcre: 16,
          seedSize2BagsPerAcre: 20,
          seedSize1CostPerAcre: 64000.00,
          seedSize2CostPerAcre: 77000.00,
          fertilizerCostPerAcre: 17850.00,
          herbicideCostPerAcre: 4780.00,
          fungicideCostPerAcre: 3950.00,
          insecticideCostPerAcre: 5000.00,
          laborCostPerAcre: 20000.00,
          landPreparationCostPerAcre: 21500.00,
          miscellaneousCostPerAcre: 5000.00,
          averageYieldPerAcre: 8000.00
        },
        {
          id: "8f193b8a-44a1-457d-84b3-c5ef9f9d2c4b",
          name: "Sherekea",
          cropType: "potato",
          maturityPeriodDays: 100,
          seedSize1BagsPerAcre: 16,
          seedSize2BagsPerAcre: 20,
          seedSize1CostPerAcre: 64000.00,
          seedSize2CostPerAcre: 69000.00,
          fertilizerCostPerAcre: 17850.00,
          herbicideCostPerAcre: 4780.00,
          fungicideCostPerAcre: 3950.00,
          insecticideCostPerAcre: 5000.00,
          laborCostPerAcre: 20000.00,
          landPreparationCostPerAcre: 21500.00,
          miscellaneousCostPerAcre: 5000.00,
          averageYieldPerAcre: 9000.00
        },
        {
          id: "a028d425-fa7e-4bfd-9793-855ed4295e40",
          name: "Unica",
          cropType: "potato",
          maturityPeriodDays: 90,
          seedSize1BagsPerAcre: 16,
          seedSize2BagsPerAcre: 20,
          seedSize1CostPerAcre: 64000.00,
          seedSize2CostPerAcre: 69000.00,
          fertilizerCostPerAcre: 17850.00,
          herbicideCostPerAcre: 4780.00,
          fungicideCostPerAcre: 3950.00,
          insecticideCostPerAcre: 5000.00,
          laborCostPerAcre: 20000.00,
          landPreparationCostPerAcre: 21500.00,
          miscellaneousCostPerAcre: 5000.00,
          averageYieldPerAcre: 8000.00
        },
        {
          id: "e5d83493-e74b-4b8b-ad6d-ffbca31d0176",
          name: "Markies",
          cropType: "potato",
          maturityPeriodDays: 120,
          seedSize1BagsPerAcre: 16,
          seedSize2BagsPerAcre: 20,
          seedSize1CostPerAcre: 74400.00,
          seedSize2CostPerAcre: 83000.00,
          fertilizerCostPerAcre: 17850.00,
          herbicideCostPerAcre: 4780.00,
          fungicideCostPerAcre: 3950.00,
          insecticideCostPerAcre: 5000.00,
          laborCostPerAcre: 20000.00,
          landPreparationCostPerAcre: 21500.00,
          miscellaneousCostPerAcre: 5000.00,
          averageYieldPerAcre: 10000.00
        }
      ]

      setCropVarieties(hardcodedVarieties)
    } catch (error: any) {
      console.error('Failed to load crop varieties:', error)
      setCropVarieties([])
    } finally {
      setLoadingVarieties(false)
    }
  }

  const calculateCost = () => {
    const size = Number.parseFloat(landSize) || 0
    const selectedVariety = cropVarieties.find(v => v.id === cropVarietyId)

    if (!selectedVariety) {
      alert("Please select a crop variety")
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
      miscellaneous: selectedVariety.miscellaneousCostPerAcre * size
    }

    const total = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0)
    const seeds = size * bagsPerAcre

    setCalculatedCost(total)
    setSeedRequirement(seeds)
    setCostBreakdown(breakdown)
    setShowResults(true)
  }

  const resetCalculator = () => {
    setLandSize("")
    setCropVarietyId("")
    setSeedSize(1)
    setShowResults(false)
    setCalculatedCost(0)
    setSeedRequirement(0)
    setCostBreakdown({
      seeds: 0,
      fertilizer: 0,
      herbicides: 0,
      fungicides: 0,
      insecticides: 0,
      labor: 0,
      landPreparation: 0,
      miscellaneous: 0
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Production Details */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Card className="h-full border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-sage-700" />
              <span>Calculate Your Costs</span>
            </CardTitle>
            <p className="text-sm text-gray-600">Enter your farm details to get accurate cost estimates</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="cropType">Crop Variety</Label>
              {loadingVarieties ? (
                <div className="h-12 flex items-center justify-center border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Loading varieties...</span>
                </div>
              ) : (
                <Select value={cropVarietyId} onValueChange={setCropVarietyId}>
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
              )}
            </div>

            <div>
              <Label htmlFor="landSize">Farm Size (Acres)</Label>
              <Input
                id="landSize"
                type="number"
                placeholder="Enter acreage"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="seedSize">Seed Size</Label>
              <Select value={seedSize.toString()} onValueChange={(value) => setSeedSize(Number(value) as 1 | 2)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cropVarietyId && (() => {
                    const selectedVariety = cropVarieties.find(v => v.id === cropVarietyId)
                    return selectedVariety ? (
                      <>
                        <SelectItem value="1">Size 1 ({selectedVariety.seedSize1BagsPerAcre} bags per acre)</SelectItem>
                        <SelectItem value="2">Size 2 ({selectedVariety.seedSize2BagsPerAcre} bags per acre)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="1">Size 1</SelectItem>
                        <SelectItem value="2">Size 2</SelectItem>
                      </>
                    )
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
              className="w-full h-12 bg-sage-700 hover:bg-sage-800 text-white"
              disabled={!landSize || !cropVarietyId || loadingVarieties}
            >
              Calculate Costs
            </Button>

            {showResults && (
              <Button onClick={resetCalculator} variant="outline" className="w-full h-12 bg-transparent">
                Reset Calculator
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cost Breakdown */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Card className="h-full border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-warm-600" />
              <span>Cost Breakdown</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              {showResults ? (() => {
                const selectedVariety = cropVarieties.find(v => v.id === cropVarietyId)
                return selectedVariety ? `Estimated costs for ${selectedVariety.name}` : "Cost breakdown"
              })() : "Results will appear here"}
            </p>
          </CardHeader>
          <CardContent>
            {showResults ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-sage-50 to-warm-50 rounded-xl border border-sage-100">
                  <div className="text-sm text-gray-600 mb-1">Total Production Cost</div>
                  <div className="text-3xl font-bold text-sage-700">KSh {calculatedCost.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Cost per acre: KSh {Math.round(calculatedCost / Number.parseFloat(landSize)).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sage-600 rounded-full"></div>
                      <span className="text-sm font-medium">Seeds</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.seeds.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{seedRequirement} bags total</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warm-600 rounded-full"></div>
                      <span className="text-sm font-medium">Fertilizer</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.fertilizer.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sage-600 rounded-full"></div>
                      <span className="text-sm font-medium">Herbicides</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.herbicides.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warm-600 rounded-full"></div>
                      <span className="text-sm font-medium">Fungicides</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.fungicides.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sage-600 rounded-full"></div>
                      <span className="text-sm font-medium">Insecticides</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.insecticides.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warm-600 rounded-full"></div>
                      <span className="text-sm font-medium">Labor</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.labor.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sage-600 rounded-full"></div>
                      <span className="text-sm font-medium">Land Preparation</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.landPreparation.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total cost</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warm-600 rounded-full"></div>
                      <span className="text-sm font-medium">Other Costs</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown.miscellaneous.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Miscellaneous</div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-3">Want detailed breakdown and planning tools?</p>
                  <Button className="bg-sage-700 hover:bg-sage-800 text-white">Sign Up for Full Access</Button>
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
      </motion.div>
    </div>
  )
}
