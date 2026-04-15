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
  brand?: string
  supplier?: string
}

export interface Activity {
  id: string
  userId: string
  productionCycleId: string
  type: "soil_preparation" | "planting" | "fertilization" | "irrigation" | "pest_control" | "disease_control" | "weeding" | "harvesting" | "other"
  description: string
  scheduledDate: string | Date
  completedDate?: string | Date | null
  status: "in_progress" | "completed"
  cost: string | number
  laborHours: string | number
  laborType: "manual-family" | "manual-hired" | "mechanized"
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
  farmLocationLat?: number
  farmLocationLng?: number
  plantingDate: Date
  estimatedHarvestDate: Date
  actualHarvestDate?: Date
  status: "active" | "harvested" | "archived"
  cropStage?: "pre_planting" | "planting" | "vegetative" | "flowering" | "fruiting" | "harvesting" | "post_harvest"
  expectedYield: number
  actualYield?: number
  expectedPricePerKg: number
  actualPricePerKg?: number
  totalCost?: number
  activities?: Activity[]
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateProductionCycleRequest {
  cropVarietyId: string
  farmId: string  // Add required farmId
  landSizeAcres: number
  farmLocation: string
  farmLocationLat?: number
  farmLocationLng?: number
  plantingDate: string // ISO date string
  estimatedHarvestDate?: string // ISO date string
  expectedYield: number
  expectedPricePerKg: number
}

export interface UpdateProductionCycleRequest {
  cropVarietyId?: string
  landSizeAcres?: number
  farmLocation?: string
  farmLocationLat?: number
  farmLocationLng?: number
  plantingDate?: string
  estimatedHarvestDate?: string
  actualHarvestDate?: string
  status?: ProductionCycle["status"]
  cropStage?: "pre_planting" | "planting" | "vegetative" | "flowering" | "fruiting" | "harvesting" | "post_harvest"
  expectedYield?: number
  actualYield?: number
  expectedPricePerKg?: number
  actualPricePerKg?: number
}

export interface CreateActivityRequest {
  type: string
  activityType?: string // legacy field
  description?: string
  scheduledDate: Date
  activityDate?: Date // legacy field
  cost?: number
  laborHours?: number
  laborType?: 'manual-hired' | 'manual-family' | 'mechanized'
  laborCost?: number
  inputs?: ActivityInput[]
  notes?: string
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
}
