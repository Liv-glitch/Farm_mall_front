// Cost calculator types
export interface CostCalculationRequest {
  cropVarietyId: string
  landSizeAcres: number
  seedSize: 1 | 2
  location?: {
    county: string
    subCounty: string
  }
}

export interface CostCalculationResponse {
  cropVarietyId: string
  cropVarietyName: string
  landSizeAcres: number
  seedSize: number
  seedRequirement: {
    bagsNeeded: number
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
