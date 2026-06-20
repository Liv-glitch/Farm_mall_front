export type PotatoVariety = "Shangi" | "Sherekea" | "Unica" | "Markies"

export const POTATO_VARIETIES: PotatoVariety[] = ["Shangi", "Sherekea", "Unica", "Markies"]

export type PreproductionPlanStatus = "not_started" | "in_progress" | "completed"

export type PreproductionStepStatus = "done" | "current" | "upcoming" | "past"

export interface PreproductionTask {
  id: string
  stepId: string
  order: number
  title: string
  whatYouNeed: string | null
  whatYouNeedLink: string | null
  expertTip: string | null
  completed: boolean
  dateCompleted: string | null
  cost: number | null
  supplier: string | null
}

export interface PreproductionStep {
  id: string
  planId: string
  order: number
  title: string
  dateRangeStart: string | null
  dateRangeEnd: string | null
  status: PreproductionStepStatus
  tasks?: PreproductionTask[]
}

export interface PreproductionPlan {
  id: string
  userId: string
  name: string
  plantingDate: string
  location: string
  potatoVariety: PotatoVariety
  status: PreproductionPlanStatus
  createdAt: string
  updatedAt: string
  totalSteps: number
  completedSteps: number
  totalTasks: number
  completedTasks: number
  steps: PreproductionStep[]
}

export interface CreatePreproductionPlanRequest {
  name: string
  planting_date: string
  location: string
  potato_variety: PotatoVariety
}

export interface UpdatePreproductionTaskRequest {
  completed?: boolean
  date_completed?: string | null
  cost?: number | null
  supplier?: string | null
}
