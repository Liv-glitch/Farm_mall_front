"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, TrendingUp, Loader2, PackageCheck } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import type {
  CalculatorInputCategory,
  CalculatorSelectedInput,
  CostCalculationRequest,
  CostCalculationResponse,
  InputsMarketplaceListingCard,
  InputsMarketplaceListingsResponse,
} from "@/lib/types/calculator"
import type { CropVariety, ProductionCycle } from "@/lib/types/production"
import { POTATO_VARIETIES } from "@/lib/data/potato-varieties"

interface CostCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CostCalculatorModal({ open, onOpenChange }: CostCalculatorModalProps) {
  const [cropVarieties, setCropVarieties] = useState<CropVariety[]>([])
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState("none")
  const [formData, setFormData] = useState<CostCalculationRequest>({
    cropVarietyId: "",
    landSizeAcres: 0,
    seedSize: 1,
  })
  const [result, setResult] = useState<CostCalculationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInputs, setLoadingInputs] = useState(false)
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [inputSelectionOpen, setInputSelectionOpen] = useState(false)
  const [marketplaceInputs, setMarketplaceInputs] = useState<InputsMarketplaceListingsResponse | null>(null)
  const [selectedInputs, setSelectedInputs] = useState<Partial<Record<CalculatorInputCategory, InputsMarketplaceListingCard>>>({})

  useEffect(() => {
    if (open) {
      loadCropVarieties()
      loadCycles()
    }
  }, [open])

  const loadCropVarieties = async () => {
    try {
      setLoadingVarieties(true)
      const varieties = await apiClient.getCropVarieties()
      setCropVarieties(varieties)
    } catch (error: any) {
      setCropVarieties(POTATO_VARIETIES)
      toast({
        title: "Using saved crop varieties",
        description: error.message
          ? `Could not load live crop varieties: ${error.message}`
          : "Could not load live crop varieties. Using saved potato varieties.",
      })
    } finally {
      setLoadingVarieties(false)
    }
  }

  const loadCycles = async () => {
    try {
      const data = await apiClient.getCycles()
      setCycles(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load production cycles for calculator:", error)
      setCycles([])
    }
  }

  const openInputSelection = async () => {
    if (!formData.cropVarietyId || !formData.landSizeAcres) {
      toast({
        title: "Missing Information",
        description: "Please fill in crop variety and land size",
        variant: "destructive",
      })
      return
    }

    setLoadingInputs(true)
    try {
      const selectedVariety = cropVarieties.find((variety) => variety.id === formData.cropVarietyId)
      const response = await apiClient.getInputPrices({
        cropVarietyId: formData.cropVarietyId,
        cropType: selectedVariety?.cropType,
        county: selectedCycle?.farmCounty,
        landSizeAcres: formData.landSizeAcres,
        seedSize: formData.seedSize,
      })
      setMarketplaceInputs(response)
      setSelectedInputs({})
      setInputSelectionOpen(true)
      if (response.source === "unavailable") {
        toast({
          title: "Live prices unavailable",
          description: response.message || "You can continue with the default calculator prices.",
        })
      }
    } catch (error: any) {
      setMarketplaceInputs({
        listings: { seeds: [], fertilizer: [], pesticides: [] },
        filters: {},
        source: "unavailable",
        message: error.message || "Could not load live marketplace prices.",
      })
      setSelectedInputs({})
      setInputSelectionOpen(true)
      toast({
        title: "Live prices unavailable",
        description: "You can continue with the default calculator prices.",
      })
    } finally {
      setLoadingInputs(false)
    }
  }

  const calculateCost = async (inputs: Partial<Record<CalculatorInputCategory, InputsMarketplaceListingCard>> = selectedInputs) => {
    setLoading(true)
    try {
      const selectedInputPayload = Object.entries(inputs).reduce((acc, [category, listing]) => {
        if (!listing) return acc
        acc[category as CalculatorInputCategory] = {
          listingId: listing.id,
          name: listing.name,
          price: listing.price,
          unit: listing.unit,
          sellerName: listing.sellerName,
        }
        return acc
      }, {} as Partial<Record<CalculatorInputCategory, CalculatorSelectedInput>>)

      const requestData = {
        cropVarietyId: formData.cropVarietyId,
        landSizeAcres: formData.landSizeAcres,
        seedSize: formData.seedSize,
        selectedInputs: selectedInputPayload,
      }
      
      const response = await apiClient.getCostEstimate(requestData)
      // Handle wrapped API response
      const result = (response as any).data || response
      setResult(result as CostCalculationResponse)
      setInputSelectionOpen(false)
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
    })
    setSelectedCycleId("none")
    setResult(null)
    setMarketplaceInputs(null)
    setSelectedInputs({})
  }

  const handleCycleSelect = (cycleId: string) => {
    setSelectedCycleId(cycleId)
    if (cycleId === "none") {
      setFormData((prev) => ({ ...prev, cropVarietyId: "", landSizeAcres: 0 }))
      setResult(null)
      return
    }

    const cycle = cycles.find((item) => item.id === cycleId)
    if (!cycle) return
    setFormData((prev) => ({
      ...prev,
      cropVarietyId: cycle.cropVarietyId,
      landSizeAcres: Number(cycle.landSizeAcres) || 0,
    }))
    setResult(null)
  }

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId)
  const categoryLabels: Record<CalculatorInputCategory, string> = {
    seeds: "Seeds",
    fertilizer: "Fertilizer",
    pesticides: "Pesticides",
  }
  const categoryOrder: CalculatorInputCategory[] = ["seeds", "fertilizer", "pesticides"]
  const selectedVariety = cropVarieties.find((variety) => variety.id === formData.cropVarietyId)
  const seedBags = result?.seedRequirement.bagsNeeded ?? result?.seedRequirement.bags ?? 0

  return (
    <>
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
                    <Label htmlFor="productionCycle">Production Cycle (Optional)</Label>
                    <Select value={selectedCycleId} onValueChange={handleCycleSelect}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose a cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No production cycle</SelectItem>
                        {cycles.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id}>
                            {cycle.cropVariety?.name || "Production cycle"} - {cycle.landSizeAcres} acres
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCycle ? (
                    <div className="rounded-xl bg-sage-50 p-4 text-sm">
                      <div className="font-semibold text-sage-900">{selectedCycle.cropVariety?.name || "Selected cycle"}</div>
                      <div className="mt-1 text-sage-700">{selectedCycle.landSizeAcres} acres</div>
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
                    </>
                  )}

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

                  <Button
                    onClick={openInputSelection}
                    className="w-full h-12 bg-sage-700 hover:bg-sage-800"
                    disabled={loading || loadingInputs || !formData.cropVarietyId || !formData.landSizeAcres}
                  >
                    {loadingInputs ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding live prices...
                      </>
                    ) : (
                      "Find Prices & Calculate"
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
                        <div className="text-xs text-gray-500">{seedBags} bags</div>
                        {result.marketplacePriceSources?.seeds && (
                          <div className="text-xs text-sage-700">{result.marketplacePriceSources.seeds.name}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Labor</span>
                      <div className="font-semibold">KSh {result.costBreakdown.labor.toLocaleString()}</div>
                    </div>

                    <div className="flex justify-between p-3 bg-sage-50 rounded-lg">
                      <span className="font-medium">Fertilizer</span>
                      <div className="text-right">
                        <div className="font-semibold">KSh {result.costBreakdown.fertilizer.toLocaleString()}</div>
                        {result.marketplacePriceSources?.fertilizer && (
                          <div className="text-xs text-sage-700">{result.marketplacePriceSources.fertilizer.name}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="font-medium">Pesticides</span>
                      <div className="text-right">
                        <div className="font-semibold">KSh {result.costBreakdown.pesticides.toLocaleString()}</div>
                        {result.marketplacePriceSources?.pesticides && (
                          <div className="text-xs text-sage-700">{result.marketplacePriceSources.pesticides.name}</div>
                        )}
                      </div>
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
    <Dialog open={inputSelectionOpen} onOpenChange={setInputSelectionOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-sage-700" />
            Select marketplace inputs
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border bg-sage-50 p-3 text-sm text-sage-900">
          <div className="font-semibold">Filters</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sage-700">
            <span>Variety: {selectedVariety?.name || marketplaceInputs?.filters.cropVarietyName || "Selected crop"}</span>
            <span>Land: {formData.landSizeAcres} acres</span>
            <span>Seed size: {formData.seedSize}</span>
            <span>County: {selectedCycle?.farmCounty || marketplaceInputs?.filters.county || "All counties"}</span>
          </div>
          {marketplaceInputs?.message && <p className="mt-2 text-sage-700">{marketplaceInputs.message}</p>}
        </div>

        <div className="space-y-6">
          {categoryOrder.map((category) => {
            const listings = marketplaceInputs?.listings[category] || []
            const selected = selectedInputs[category]

            return (
              <section key={category} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-950">{categoryLabels[category]}</h3>
                    <p className="text-sm text-gray-500">
                      {selected ? `Using ${selected.name}` : "Skip to use the calculator default."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={selected ? "outline" : "secondary"}
                    onClick={() => setSelectedInputs((prev) => {
                      const next = { ...prev }
                      delete next[category]
                      return next
                    })}
                  >
                    Use default
                  </Button>
                </div>

                {listings.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {listings.map((listing) => {
                      const active = selected?.id === listing.id
                      return (
                        <button
                          key={listing.id}
                          type="button"
                          onClick={() => setSelectedInputs((prev) => ({ ...prev, [category]: listing }))}
                          className={`rounded-lg border p-3 text-left transition ${
                            active ? "border-sage-700 bg-sage-50 shadow-sm" : "border-gray-200 bg-white hover:border-sage-300"
                          }`}
                        >
                          <div className="flex gap-3">
                            {listing.imageUrl ? (
                              <img src={listing.imageUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-sage-100">
                                <PackageCheck className="h-5 w-5 text-sage-700" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-2 font-semibold text-gray-950">{listing.name}</div>
                              <div className="mt-1 text-sm font-semibold text-sage-700">
                                KSh {listing.price.toLocaleString()} {listing.unit ? `/ ${listing.unit}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {[listing.sellerName, listing.sellerCounty].filter(Boolean).join(" • ") || "Marketplace seller"}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                    No live {categoryLabels[category].toLowerCase()} listings found for these filters.
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setInputSelectionOpen(false)} disabled={loading}>
            Back
          </Button>
          <Button type="button" onClick={() => calculateCost({})} variant="secondary" disabled={loading}>
            Use all defaults
          </Button>
          <Button type="button" onClick={() => calculateCost()} className="bg-sage-700 hover:bg-sage-800" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Calculate costs"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
