"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp, Loader2 } from "lucide-react"
import type { CropVariety } from "@/lib/types/production"

// Hardcoded potato variety cost data — mirrors the public Farm Tools calculator.
const HARDCODED_VARIETIES: CropVariety[] = [
  {
    id: "392f993e-3ee5-48fc-9bd3-15d81bc40b88",
    name: "Shangi",
    cropType: "potato",
    maturityPeriodDays: 90,
    seedSize1BagsPerAcre: 16,
    seedSize2BagsPerAcre: 20,
    seedSize1CostPerAcre: 64000.0,
    seedSize2CostPerAcre: 77000.0,
    fertilizerCostPerAcre: 17850.0,
    herbicideCostPerAcre: 4780.0,
    fungicideCostPerAcre: 3950.0,
    insecticideCostPerAcre: 5000.0,
    laborCostPerAcre: 20000.0,
    landPreparationCostPerAcre: 21500.0,
    miscellaneousCostPerAcre: 5000.0,
    averageYieldPerAcre: 8000.0,
  },
  {
    id: "8f193b8a-44a1-457d-84b3-c5ef9f9d2c4b",
    name: "Sherekea",
    cropType: "potato",
    maturityPeriodDays: 100,
    seedSize1BagsPerAcre: 16,
    seedSize2BagsPerAcre: 20,
    seedSize1CostPerAcre: 64000.0,
    seedSize2CostPerAcre: 69000.0,
    fertilizerCostPerAcre: 17850.0,
    herbicideCostPerAcre: 4780.0,
    fungicideCostPerAcre: 3950.0,
    insecticideCostPerAcre: 5000.0,
    laborCostPerAcre: 20000.0,
    landPreparationCostPerAcre: 21500.0,
    miscellaneousCostPerAcre: 5000.0,
    averageYieldPerAcre: 9000.0,
  },
  {
    id: "a028d425-fa7e-4bfd-9793-855ed4295e40",
    name: "Unica",
    cropType: "potato",
    maturityPeriodDays: 90,
    seedSize1BagsPerAcre: 16,
    seedSize2BagsPerAcre: 20,
    seedSize1CostPerAcre: 64000.0,
    seedSize2CostPerAcre: 69000.0,
    fertilizerCostPerAcre: 17850.0,
    herbicideCostPerAcre: 4780.0,
    fungicideCostPerAcre: 3950.0,
    insecticideCostPerAcre: 5000.0,
    laborCostPerAcre: 20000.0,
    landPreparationCostPerAcre: 21500.0,
    miscellaneousCostPerAcre: 5000.0,
    averageYieldPerAcre: 8000.0,
  },
  {
    id: "e5d83493-e74b-4b8b-ad6d-ffbca31d0176",
    name: "Markies",
    cropType: "potato",
    maturityPeriodDays: 120,
    seedSize1BagsPerAcre: 16,
    seedSize2BagsPerAcre: 20,
    seedSize1CostPerAcre: 74400.0,
    seedSize2CostPerAcre: 83000.0,
    fertilizerCostPerAcre: 17850.0,
    herbicideCostPerAcre: 4780.0,
    fungicideCostPerAcre: 3950.0,
    insecticideCostPerAcre: 5000.0,
    laborCostPerAcre: 20000.0,
    landPreparationCostPerAcre: 21500.0,
    miscellaneousCostPerAcre: 5000.0,
    averageYieldPerAcre: 10000.0,
  },
]

export function DashboardCostCalculator() {
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
    miscellaneous: 0,
  })

  useEffect(() => {
    setCropVarieties(HARDCODED_VARIETIES)
    setLoadingVarieties(false)
  }, [])

  const calculateCost = () => {
    const size = Number.parseFloat(landSize) || 0
    const selectedVariety = cropVarieties.find((v) => v.id === cropVarietyId)
    if (!selectedVariety) return

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

    setCalculatedCost(total)
    setSeedRequirement(size * bagsPerAcre)
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
  }

  const breakdownRows: { label: string; key: keyof typeof costBreakdown; note: string }[] = [
    { label: "Seeds", key: "seeds", note: `${seedRequirement} bags total` },
    { label: "Fertilizer", key: "fertilizer", note: "Total cost" },
    { label: "Herbicides", key: "herbicides", note: "Total cost" },
    { label: "Fungicides", key: "fungicides", note: "Total cost" },
    { label: "Insecticides", key: "insecticides", note: "Total cost" },
    { label: "Labor", key: "labor", note: "Total cost" },
    { label: "Land Preparation", key: "landPreparation", note: "Total cost" },
    { label: "Other Costs", key: "miscellaneous", note: "Miscellaneous" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <Card className="h-full border border-agri-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-agri-800">
            <Calculator className="w-5 h-5 text-agri-600" />
            <span>Calculate your costs</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Estimate production costs for your potato crop.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cc-variety">Crop variety</Label>
            {loadingVarieties ? (
              <div className="h-11 flex items-center justify-center border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Loading varieties…</span>
              </div>
            ) : (
              <Select value={cropVarietyId} onValueChange={setCropVarietyId}>
                <SelectTrigger id="cc-variety" className="h-11">
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
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-land">Farm size (acres)</Label>
            <Input
              id="cc-land"
              type="number"
              min="0"
              step="0.1"
              placeholder="Enter acreage"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-seed">Seed size</Label>
            <Select value={seedSize.toString()} onValueChange={(value) => setSeedSize(Number(value) as 1 | 2)}>
              <SelectTrigger id="cc-seed" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const selectedVariety = cropVarieties.find((v) => v.id === cropVarietyId)
                  return (
                    <>
                      <SelectItem value="1">
                        Size 1{selectedVariety ? ` (${selectedVariety.seedSize1BagsPerAcre} bags/acre)` : ""}
                      </SelectItem>
                      <SelectItem value="2">
                        Size 2{selectedVariety ? ` (${selectedVariety.seedSize2BagsPerAcre} bags/acre)` : ""}
                      </SelectItem>
                    </>
                  )
                })()}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={calculateCost}
            className="w-full h-11 bg-agri-600 hover:bg-agri-700 text-white"
            disabled={!landSize || !cropVarietyId}
          >
            Calculate costs
          </Button>

          {showResults && (
            <Button onClick={resetCalculator} variant="outline" className="w-full h-11 bg-transparent">
              Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="h-full border border-agri-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-agri-800">
            <TrendingUp className="w-5 h-5 text-maize-600" />
            <span>Cost breakdown</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {showResults
              ? `Estimated costs for ${cropVarieties.find((v) => v.id === cropVarietyId)?.name ?? "your crop"}`
              : "Results will appear here"}
          </p>
        </CardHeader>
        <CardContent>
          {showResults ? (
            <div className="space-y-5">
              <div className="text-center p-6 bg-gradient-to-br from-agri-50 to-maize-50 rounded-xl border border-agri-100">
                <div className="text-sm text-muted-foreground mb-1">Total production cost</div>
                <div className="text-3xl font-bold text-agri-700">KSh {calculatedCost.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Cost per acre: KSh {Math.round(calculatedCost / (Number.parseFloat(landSize) || 1)).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2.5">
                {breakdownRows.map((row, i) => (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      i % 2 === 0 ? "bg-agri-50" : "bg-maize-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? "bg-agri-600" : "bg-maize-600"}`}
                      />
                      <span className="text-sm font-medium">{row.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">KSh {costBreakdown[row.key].toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{row.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Enter your production details to see cost estimates</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
