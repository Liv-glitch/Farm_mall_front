import { addDays, format, isSameDay, startOfDay } from "date-fns"
import type { Activity, ActivityInput, ActivityPrefill, ProductionCycle } from "@/lib/types/production"

export interface ProductionCalendarItem {
  id: string
  stage: string
  dayOffset: number
  name: string
  type: Activity["type"]
  description: string
  inputs: ActivityInput[]
  date: Date
}

type ScheduleTemplate = Omit<ProductionCalendarItem, "date">

const input = (name: string, unit = "unit"): ActivityInput => ({
  name,
  quantity: 0,
  unit,
  cost: 0,
  brand: "",
  supplier: "",
})

const SCHEDULE: ScheduleTemplate[] = [
  {
    id: "planting-basal-fertilizer",
    stage: "Planting",
    dayOffset: 0,
    name: "Apply basal fertilizer",
    type: "fertilizing",
    description: "Apply basal fertilizer at planting.",
    inputs: [input("Basal fertilizer"), input("Planting tools")],
  },
  {
    id: "planting-pre-emergence-herbicide",
    stage: "Planting",
    dayOffset: 0,
    name: "Pre-emergence herbicide",
    type: "weeding",
    description: "Apply pre-emergence herbicide after planting.",
    inputs: [input("Pre-emergence herbicide", "litre"), input("Sprayer")],
  },
  {
    id: "week-3-first-top-dress",
    stage: "Week 3",
    dayOffset: 21,
    name: "First top-dress",
    type: "fertilizing",
    description: "Apply first top-dressing fertilizer.",
    inputs: [input("CAN fertilizer"), input("Measuring container")],
  },
  {
    id: "week-3-start-fungicide-sprays",
    stage: "Week 3",
    dayOffset: 21,
    name: "Start fungicide sprays",
    type: "pest_control",
    description: "Start preventive fungicide sprays.",
    inputs: [input("Fungicide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-4-insecticide-if-pests",
    stage: "Week 4",
    dayOffset: 28,
    name: "Spray insecticide if pests appear",
    type: "pest_control",
    description: "Scout for pests and spray insecticide only if pests appear.",
    inputs: [input("Insecticide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-6-second-top-dress",
    stage: "Week 6",
    dayOffset: 42,
    name: "Second top-dress",
    type: "fertilizing",
    description: "Apply second top-dressing fertilizer.",
    inputs: [input("CAN fertilizer"), input("Measuring container")],
  },
  {
    id: "week-6-continue-fungicides",
    stage: "Week 6",
    dayOffset: 42,
    name: "Continue fungicides and rotate product",
    type: "pest_control",
    description: "Continue fungicide program and rotate active ingredients.",
    inputs: [input("Rotational fungicide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-8-pest-sprays-if-needed",
    stage: "Week 8",
    dayOffset: 56,
    name: "Pest sprays if needed",
    type: "pest_control",
    description: "Scout for pest pressure and spray only if needed.",
    inputs: [input("Insecticide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-12-stop-nitrogen-continue-sprays",
    stage: "Week 12",
    dayOffset: 84,
    name: "Stop nitrogen fertilizer and continue sprays",
    type: "pest_control",
    description: "Stop nitrogen fertilizer and continue protective sprays as needed.",
    inputs: [input("Fungicide", "litre"), input("Sprayer"), input("PPE")],
  },
]

function asDate(value: Date | string | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getProductionCalendar(cycle: ProductionCycle): ProductionCalendarItem[] {
  const plantingDate = asDate(cycle.plantingDate)
  if (!plantingDate) return []

  const base = startOfDay(plantingDate)
  return SCHEDULE.map((item) => ({
    ...item,
    date: addDays(base, item.dayOffset),
  }))
}

export function getNextCalendarItem(cycle: ProductionCycle, activities: Activity[]) {
  const calendar = getProductionCalendar(cycle)
  const today = startOfDay(new Date())

  const notRecorded = calendar.filter((item) => {
    return !activities.some((activity) => {
      const scheduledDate = asDate(activity.scheduledDate)
      return scheduledDate && isSameDay(scheduledDate, item.date) && activity.description?.trim() === item.description
    })
  })

  return (
    notRecorded.find((item) => startOfDay(item.date) >= today) ||
    notRecorded[0] ||
    null
  )
}

export function calendarItemToActivityPrefill(item: ProductionCalendarItem): ActivityPrefill {
  return {
    name: item.name,
    type: item.type,
    description: item.description,
    scheduledDate: format(item.date, "yyyy-MM-dd"),
    laborHours: 0,
    laborType: "manual-family",
    laborCost: 0,
    notes: `${item.stage} reminder from the production activity calendar.`,
    inputs: item.inputs,
  }
}
