// Types for the Farm Decision Report feature. The report is generated
// on-demand by POST /decision-reports/generate and is never persisted —
// the frontend keeps it only in memory for the current session.

export type WaterSource = "rainfed" | "irrigated"
export type SeedSource = "certified" | "farm_saved" | "unknown"
export type FarmingPriority = "yield" | "disease_resistance" | "cost" | "balanced"

export interface DecisionReportFormOptionVariety {
  id: string
  name: string
  maturityPeriodDays: number
  averageYieldPerAcre: number
}

export interface DecisionReportFormOptions {
  counties: string[]
  varieties: DecisionReportFormOptionVariety[]
  waterSources: WaterSource[]
  seedSources: SeedSource[]
  priorities: FarmingPriority[]
}

export interface DecisionReportRequest {
  county: string
  subCounty: string
  locationName?: string
  gpsLat?: number
  gpsLng?: number
  fieldSizeAcres: number
  waterSource: WaterSource
  plantingDate: string
  previousCrop?: string
  seedSource: SeedSource
  cropVarietyIds: string[]
  priority: FarmingPriority
  soilTestId?: string
}

export interface DecisionReportGenerateResponse {
  reportId: string
  generatedAt: string
  html: string
}

export const WATER_SOURCE_LABELS: Record<WaterSource, string> = {
  rainfed: "Rain-fed",
  irrigated: "Irrigated",
}

export const SEED_SOURCE_LABELS: Record<SeedSource, string> = {
  certified: "Certified seed",
  farm_saved: "Farm-saved seed",
  unknown: "Not sure",
}

export const FARMING_PRIORITY_LABELS: Record<FarmingPriority, string> = {
  yield: "Maximise yield",
  disease_resistance: "Disease resistance",
  cost: "Minimise cost",
  balanced: "Balanced",
}
