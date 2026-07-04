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
  createdAt?: Date
}

export interface ActivityInput {
  name: string
  quantity: number
  unit: string
  cost: number
  reusedExistingStock?: boolean
  brand?: string
  supplier?: string
}

export interface Activity {
  id: string
  userId: string
  productionCycleId: string
  type: "soil_preparation" | "planting" | "fertilizing" | "fertilization" | "irrigation" | "pest_control" | "disease_control" | "weeding" | "harvesting" | "other"
  cropStage?: string | null
  description: string
  scheduledDate: string | Date
  completedDate?: string | Date | null
  status: "in_progress" | "completed"
  cost: string | number
  laborHours: string | number
  laborType?: "manual-family" | "manual-hired" | "mechanized" | null
  laborCost?: number
  inputs: string | ActivityInput[]
  notes: string
  weather?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface ProductionCycle {
  id: string
  userId: string
  cropVarietyId: string
  cropVariety?: CropVariety
  landSizeAcres: number
  farmLocation: string
  farmCounty?: string
  farmSubcounty?: string
  farmLocationName?: string
  farmLocationLat?: number
  farmLocationLng?: number
  farmBoundaryCoordinates?: Array<{ lat: number; lng: number }>
  plantingDate: Date
  estimatedHarvestDate: Date
  actualHarvestDate?: Date
  status: "planning" | "active" | "harvested" | "archived"
  cropStage?: "pre_planting" | "planting" | "vegetative" | "flowering" | "fruiting" | "harvesting" | "post_harvest"
  expectedYield?: number | null
  actualYield?: number
  expectedPricePerKg?: number | null
  actualPricePerKg?: number
  totalCost?: number
  activities?: Activity[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateProductionCycleRequest {
  cropVarietyId: string
  farmId?: string
  landSizeAcres: number
  farmLocation: string
  farmCounty?: string
  farmSubcounty?: string
  farmLocationName?: string
  farmLocationLat?: number
  farmLocationLng?: number
  farmBoundaryCoordinates?: Array<{ lat: number; lng: number }>
  plantingDate: string // ISO date string
  estimatedHarvestDate?: string // ISO date string
  expectedYield?: number | null
  expectedPricePerKg?: number | null
}

export interface UpdateProductionCycleRequest {
  cropVarietyId?: string
  landSizeAcres?: number
  farmLocation?: string
  farmCounty?: string
  farmSubcounty?: string
  farmLocationName?: string
  farmLocationLat?: number
  farmLocationLng?: number
  farmBoundaryCoordinates?: Array<{ lat: number; lng: number }>
  plantingDate?: string
  estimatedHarvestDate?: string
  actualHarvestDate?: string
  status?: ProductionCycle["status"]
  cropStage?: "pre_planting" | "planting" | "vegetative" | "flowering" | "fruiting" | "harvesting" | "post_harvest"
  expectedYield?: number | null
  actualYield?: number
  expectedPricePerKg?: number | null
  actualPricePerKg?: number
}

export interface CreateActivityRequest {
  type: string
  activityType?: string // legacy field
  cropStage?: string
  description?: string
  scheduledDate: Date
  activityDate?: Date // legacy field
  cost?: number
  laborHours?: number
  laborType?: 'manual-hired' | 'manual-family' | 'mechanized' | null
  laborCost?: number
  inputs?: ActivityInput[]
  notes?: string
}

export interface ActivityPrefill {
  name?: string
  type?: Activity["type"]
  cropStage?: string
  description?: string
  scheduledDate?: string | Date
  laborHours?: number
  laborType?: Activity["laborType"]
  laborCost?: number
  notes?: string
  inputs?: ActivityInput[]
}

export type ProductionCycleReportType = "activity" | "financial"

export interface ProductionCycleReportSummary {
  id: string
  productionCycleId: string
  type: ProductionCycleReportType
  snapshotVersion: number
  generatedAt: string | Date
  cropLabel: string
  farmLabel: string
  harvestDate?: string | Date | null
}

export interface ProductionCycleReportDetail extends ProductionCycleReportSummary {
  snapshotData: ProductionCycleReportSnapshot
}

export interface ProductionCycleReportSnapshot {
  reportType: ProductionCycleReportType
  generatedAt: string
  cycle: {
    id: string
    cropVariety: string
    cropType?: string | null
    farmName?: string | null
    farmLocation?: string | null
    county?: string | null
    subcounty?: string | null
    landSizeAcres?: number | null
    plantingDate?: string | null
    estimatedHarvestDate?: string | null
    actualHarvestDate?: string | null
    status: ProductionCycle["status"]
  }
  activities: Array<{
    id: string
    type: string
    cropStage?: string | null
    description: string
    status: string
    scheduledDate?: string | null
    completedDate?: string | null
    durationDays?: number | null
    daysSincePreviousActivity?: number | null
    laborHours?: number | null
    laborType?: string | null
    notes?: string | null
    cost?: number
    inputs?: Array<{
      name: string
      quantity: number
      unit: string
      cost?: number
      brand?: string | null
      supplier?: string | null
    }>
  }>
  activitySummary: {
    totalActivities: number
    completedActivities: number
    cycleDurationDays?: number | null
  }
  financialSummary?: {
    activityCostTotal: number
    inputCostTotal: number
    totalCost: number
    actualYield?: number | null
    actualPricePerKg?: number | null
    actualRevenue?: number | null
    profit?: number | null
  }
}

export interface ApiClient {
  // ... existing methods ...
  
  // Production cycles
  getCycles(): Promise<ProductionCycle[]>
  getCycle(cycleId: string): Promise<ProductionCycle>
  createProductionCycle(data: CreateProductionCycleRequest): Promise<ProductionCycle>
  updateCycle(cycleId: string, data: UpdateProductionCycleRequest): Promise<ProductionCycle>
  deleteCycle(cycleId: string): Promise<void>

  // Activities
  getCycleActivities(cycleId: string): Promise<Activity[]>
  addActivity(cycleId: string, activityOrFormData: any): Promise<Activity>
  updateActivity(cycleId: string, activityOrFormData: any): Promise<Activity>
  deleteActivity(cycleId: string, activityId: string): Promise<void>
  deleteAllActivities(cycleId: string): Promise<void>
  getCycleReports(): Promise<ProductionCycleReportSummary[]>
  getCycleReport(reportId: string): Promise<ProductionCycleReportDetail>
}
