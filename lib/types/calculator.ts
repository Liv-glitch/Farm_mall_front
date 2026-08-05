// Cost calculator types
export interface CropVariety {
  id: string
  name: string
  cropType: string
  maturityPeriodDays: number
  seedSize1BagsPerAcre: number
  seedSize2BagsPerAcre: number
  // New per-acre cost fields replacing seedCostPerBag
  seedSize1CostPerAcre: number
  seedSize2CostPerAcre: number
  fertilizerCostPerAcre: number
  herbicideCostPerAcre: number
  fungicideCostPerAcre: number
  insecticideCostPerAcre: number
  laborCostPerAcre: number
  landPreparationCostPerAcre: number
  miscellaneousCostPerAcre: number
  averageYieldPerAcre: number
  costDataUpdatedAt?: Date
  createdAt: Date
}

export interface CostCalculationRequest {
  cropVarietyId: string
  landSizeAcres: number
  seedSize: 1 | 2
  location?: {
    county: string | undefined
    subCounty: string | undefined
  }
  selectedInputs?: Partial<Record<CalculatorInputCategory, CalculatorSelectedInput>>
}

export type CalculatorInputCategory = "seeds" | "fertilizer" | "pesticides"

export interface CalculatorSelectedInput {
  listingId: string
  name: string
  price: number
  unit?: string | null
  sellerName?: string | null
}

export interface CalculatorInputPriceSource extends CalculatorSelectedInput {
  category: CalculatorInputCategory
  appliedCost: number
}

export interface InputsMarketplaceListingCard {
  id: string
  category: CalculatorInputCategory
  name: string
  description?: string | null
  price: number
  unit?: string | null
  imageUrl?: string | null
  quantity?: number | null
  inStock: boolean
  soldOut: boolean
  sellerName?: string | null
  sellerCounty?: string | null
  sellerLocation?: string | null
  marketplaceUrl: string
}

export interface InputsMarketplaceListingsResponse {
  listings: Record<CalculatorInputCategory, InputsMarketplaceListingCard[]>
  filters: {
    cropVarietyName?: string
    cropType?: string
    county?: string
    landSizeAcres?: number
    seedSize?: 1 | 2
  }
  source: "marketplace" | "unavailable"
  message?: string
}

export interface CostCalculationResponse {
  cropVarietyId: string
  cropVarietyName: string
  landSizeAcres: number
  seedSize: number
  seedRequirement: {
    bags?: number
    bagsNeeded?: number
    totalCost: number
  }
  estimatedTotalCost: number
  costBreakdown: {
    seeds: number
    labor: number
    fertilizer: number
    pesticides: number
    other: number
  }
  marketplacePriceSources?: Partial<Record<CalculatorInputCategory, CalculatorInputPriceSource>>
  recommendations: string[]
}

// Harvest prediction types
export interface HarvestPredictionRequest {
  cropVarietyId: string
  plantingDate: string // ISO date string
  landSizeAcres: number
  location?: {
    latitude: number
    longitude: number
  }
}

export interface HarvestPredictionResponse {
  cropVarietyId: string
  cropVarietyName: string
  plantingDate: string
  estimatedHarvestDate: string
  harvestWindow: {
    startDate: string
    endDate: string
  }
  estimatedYield: {
    totalKg: number
    yieldPerAcre: number
  }
  climateConditions: {
    averageTemperature: number
    expectedRainfall: number
    humidity: number
  }
  recommendations: string[]
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
