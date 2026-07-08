import { addDays, differenceInDays, format, isSameDay, startOfDay } from "date-fns"
import type { Activity, ActivityInput, ActivityPrefill, ProductionCycle } from "@/lib/types/production"

export const MARKETPLACE_BASE_URL = "https://inputs.farmmall.co.ke/marketplace"

export interface ProductionCalendarItem {
  id: string
  stage: string
  weekStart: number
  weekEnd: number
  dayOffset: number
  name: string
  type: Activity["type"]
  description: string
  advice: string
  inputsLink: string
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
    weekStart: 0,
    weekEnd: 0,
    dayOffset: 0,
    name: "Apply basal fertilizer",
    type: "fertilizing",
    description: "Apply basal fertilizer at planting.",
    advice:
      "Plant seed potatoes in well-drained, loose soil at a depth of 10-15cm. Space rows 75-90cm apart and tubers 25-30cm apart within the row for good canopy development. Place basal fertilizer in the planting furrow, not directly touching the seed piece, to avoid burning it. Ensure soil moisture is adequate at planting to trigger even sprouting.",
    inputsLink: "?stage=planting",
    inputs: [input("Basal fertilizer"), input("Planting tools")],
  },
  {
    id: "planting-pre-emergence-herbicide",
    stage: "Planting",
    weekStart: 0,
    weekEnd: 0,
    dayOffset: 0,
    name: "Pre-emergence herbicide",
    type: "weeding",
    description: "Apply pre-emergence herbicide after planting.",
    advice:
      "Plant seed potatoes in well-drained, loose soil at a depth of 10-15cm. Space rows 75-90cm apart and tubers 25-30cm apart within the row for good canopy development. Place basal fertilizer in the planting furrow, not directly touching the seed piece, to avoid burning it. Ensure soil moisture is adequate at planting to trigger even sprouting.",
    inputsLink: "?stage=planting",
    inputs: [input("Pre-emergence herbicide", "litre"), input("Sprayer")],
  },
  {
    id: "week-1-monitor-germination",
    stage: "Emergence",
    weekStart: 1,
    weekEnd: 2,
    dayOffset: 7,
    name: "Monitor germination",
    type: "other",
    description: "Monitor germination and early crop establishment.",
    advice:
      "Check the field regularly for uneven or poor germination and note any gaps for replanting. Avoid waterlogging at this stage, as young sprouts are highly sensitive to excess moisture and can rot. Keep the field weed-free early, since weeds compete strongly with emerging seedlings. Light, frequent watering is better than heavy irrigation if rainfall is low.",
    inputsLink: "?stage=planting",
    inputs: [input("Field notebook"), input("Water", "litre")],
  },
  {
    id: "week-3-first-top-dress",
    stage: "Vegetative Growth",
    weekStart: 3,
    weekEnd: 4,
    dayOffset: 21,
    name: "First top-dress",
    type: "fertilizing",
    description: "Apply first top-dressing fertilizer.",
    advice:
      "This is the main leaf and stem growth phase, so nitrogen top-dressing now boosts canopy size, which drives yield later. Apply fertilizer when soil is moist and avoid contact with leaves to prevent scorching. Begin scouting for early blight symptoms, as dense, humid canopies are prone to fungal disease. Start earthing up (hilling) soil around the stems to support tuber formation and protect developing tubers from light.",
    inputsLink: "?stage=top-dressing",
    inputs: [input("CAN fertilizer"), input("Measuring container")],
  },
  {
    id: "week-3-start-fungicide-sprays",
    stage: "Vegetative Growth",
    weekStart: 3,
    weekEnd: 4,
    dayOffset: 21,
    name: "Start fungicide sprays",
    type: "pest_control",
    description: "Start preventive fungicide sprays.",
    advice:
      "This is the main leaf and stem growth phase, so nitrogen top-dressing now boosts canopy size, which drives yield later. Apply fertilizer when soil is moist and avoid contact with leaves to prevent scorching. Begin scouting for early blight symptoms, as dense, humid canopies are prone to fungal disease. Start earthing up (hilling) soil around the stems to support tuber formation and protect developing tubers from light.",
    inputsLink: "?stage=crop-protection",
    inputs: [input("Fungicide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-4-insecticide-if-pests",
    stage: "Flowering",
    weekStart: 4,
    weekEnd: 5,
    dayOffset: 28,
    name: "Spray insecticide if pests appear",
    type: "pest_control",
    description: "Scout for pests and spray insecticide only if pests appear.",
    advice:
      "Flowering signals the start of tuber initiation, so keep soil consistently moist to avoid stress that can reduce tuber numbers. Scout the underside of leaves for aphids and other pests before spraying, rather than spraying on a fixed schedule. Complete earthing up before flowers open fully, since new tubers form near the surface and need soil cover. Wear PPE when spraying and avoid treatment during peak flowering to protect pollinators.",
    inputsLink: "?stage=crop-protection",
    inputs: [input("Insecticide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-6-second-top-dress",
    stage: "Flowering",
    weekStart: 6,
    weekEnd: 7,
    dayOffset: 42,
    name: "Second top-dress",
    type: "fertilizing",
    description: "Apply second top-dressing fertilizer.",
    advice:
      "Flowering signals the start of tuber initiation, so keep soil consistently moist to avoid stress that can reduce tuber numbers. Scout the underside of leaves for aphids and other pests before spraying, rather than spraying on a fixed schedule. Complete earthing up before flowers open fully, since new tubers form near the surface and need soil cover. Wear PPE when spraying and avoid treatment during peak flowering to protect pollinators.",
    inputsLink: "?stage=top-dressing",
    inputs: [input("CAN fertilizer"), input("Measuring container")],
  },
  {
    id: "week-6-continue-fungicides",
    stage: "Tuber bulking",
    weekStart: 6,
    weekEnd: 10,
    dayOffset: 42,
    name: "Continue fungicides and rotate product",
    type: "pest_control",
    description: "Continue fungicide program and rotate active ingredients.",
    advice:
      "Tuber bulking is the most water-sensitive stage; irregular watering now causes misshapen or cracked tubers, so aim for steady, even moisture. Rotate fungicide active ingredients rather than repeating the same product, to prevent disease resistance from building up. Keep monitoring for late blight, especially during cool, wet weather, as it can spread quickly and devastate yield. Maintain the hilled ridge to keep tubers fully covered and protected from greening and pests.",
    inputsLink: "?stage=crop-protection",
    inputs: [input("Rotational fungicide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-8-pest-sprays-if-needed",
    stage: "Tuber bulking",
    weekStart: 8,
    weekEnd: 12,
    dayOffset: 56,
    name: "Pest sprays if needed",
    type: "pest_control",
    description: "Scout for pest pressure and spray only if needed.",
    advice:
      "Tuber bulking is the most water-sensitive stage; irregular watering now causes misshapen or cracked tubers, so aim for steady, even moisture. Rotate fungicide active ingredients rather than repeating the same product, to prevent disease resistance from building up. Keep monitoring for late blight, especially during cool, wet weather, as it can spread quickly and devastate yield. Maintain the hilled ridge to keep tubers fully covered and protected from greening and pests.",
    inputsLink: "?stage=crop-protection",
    inputs: [input("Insecticide", "litre"), input("Sprayer"), input("PPE")],
  },
  {
    id: "week-12-stop-nitrogen-continue-sprays",
    stage: "Maturity",
    weekStart: 12,
    weekEnd: 14,
    dayOffset: 84,
    name: "Stop nitrogen fertilizer and continue sprays",
    type: "pest_control",
    description: "Stop nitrogen fertilizer and continue protective sprays as needed.",
    advice:
      "Stop nitrogen application now, as too much late nitrogen delays maturity and lowers tuber quality and storability. Reduce irrigation gradually as vines begin to yellow and die back, since this helps the skins set properly. Continue disease scouting until harvest, as blight can still damage tubers even as the crop matures. Stop irrigation about 2 weeks before harvest to allow the field to dry and reduce rot risk during storage.",
    inputsLink: "?stage=foliar-feeding",
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

export function getWeeksSincePlanting(cycle: ProductionCycle) {
  const plantingDate = asDate(cycle.plantingDate)
  if (!plantingDate) return null
  return Math.max(0, Math.floor(differenceInDays(startOfDay(new Date()), startOfDay(plantingDate)) / 7))
}

export function getCurrentCalendarItems(cycle: ProductionCycle) {
  const currentWeek = getWeeksSincePlanting(cycle)
  if (currentWeek === null) return []
  return getProductionCalendar(cycle).filter((item) => currentWeek >= item.weekStart && currentWeek <= item.weekEnd)
}

export function getCurrentCropStage(cycle: ProductionCycle) {
  const currentItems = getCurrentCalendarItems(cycle)
  return currentItems[0]?.stage || "Outside calendar"
}

export function getMarketplaceUrl(item: Pick<ProductionCalendarItem, "inputsLink">) {
  return `${MARKETPLACE_BASE_URL}${item.inputsLink}`
}

export function getNextCalendarItem(cycle: ProductionCycle, activities: Activity[]) {
  const currentItems = getCurrentCalendarItems(cycle)
  if (currentItems.length > 0) return currentItems[0]

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

export function getNextCalendarItemAfter(cycle: ProductionCycle, activities: Activity[], afterDate: Date) {
  const calendar = getProductionCalendar(cycle)
  const after = startOfDay(afterDate).getTime()

  const notRecorded = calendar.filter((item) => {
    return !activities.some((activity) => {
      const scheduledDate = asDate(activity.scheduledDate)
      return scheduledDate && isSameDay(scheduledDate, item.date) && activity.description?.trim() === item.description
    })
  })

  return notRecorded.find((item) => startOfDay(item.date).getTime() > after) || null
}

export function calendarItemToActivityPrefill(item: ProductionCalendarItem): ActivityPrefill {
  return {
    name: item.name,
    type: item.type,
    cropStage: item.stage,
    description: item.description,
    scheduledDate: format(item.date, "yyyy-MM-dd"),
    laborHours: 0,
    laborType: "manual-family",
    laborCost: 0,
    notes: `${item.stage} reminder from the production activity calendar.`,
    inputs: item.inputs,
  }
}
