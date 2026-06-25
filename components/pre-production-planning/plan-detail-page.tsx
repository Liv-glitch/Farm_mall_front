"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Loader2, ChevronLeft, MapPin, CalendarDays } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { PreproductionPlan } from "@/lib/types/preproduction"
import { StepTaskCard } from "./step-task-card"
import { CompletionCta } from "./completion-cta"

const TIMING_GUIDANCE: Record<string, { ideal: string; recommendation: string }> = {
  "Land Selection": {
    ideal: "6–8 weeks before planting.",
    recommendation: "Review the field and rotation history early so there is enough time to choose a better field if needed.",
  },
  "Soil Testing": {
    ideal: "3–6 weeks before planting.",
    recommendation: "Complete soil testing as soon as possible to improve fertilizer recommendations.",
  },
  "Land Preparation": {
    ideal: "1–4 weeks before planting, with first plowing ideally 3–4 weeks before planting.",
    recommendation: "Work through the field operations in sequence so the seedbed is loose, level, and ready before planting.",
  },
  "Soil Fertility Management": {
    ideal: "After receiving soil test results and before planting.",
    recommendation: "Use your soil test results to buy and apply the right nutrients and amendments.",
  },
}

function formatShortDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function formatCurrentSituation(plantingDate: string | null): string {
  if (!plantingDate) return "Add your planting date to receive timing guidance."
  const target = new Date(plantingDate)
  if (Number.isNaN(target.getTime())) return "Add your planting date to receive timing guidance."

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  const daysUntilPlanting = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const absDays = Math.abs(daysUntilPlanting)
  const weeks = Math.round(absDays / 7)

  if (daysUntilPlanting === 0) return "You are planning to plant today."
  if (absDays >= 14) {
    const label = weeks === 1 ? "week" : "weeks"
    return daysUntilPlanting > 0
      ? `You are planning to plant in ${weeks} ${label}.`
      : `Your planting date was about ${weeks} ${label} ago.`
  }

  const label = absDays === 1 ? "day" : "days"
  return daysUntilPlanting > 0
    ? `You are planning to plant in ${absDays} ${label}.`
    : `Your planting date was ${absDays} ${label} ago.`
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

function normalizePreproductionPlan(raw: any): PreproductionPlan {
  if (!raw || typeof raw !== "object" || !raw.id) {
    console.error("Invalid preproduction plan response", raw)
    throw new Error("Invalid preproduction plan response")
  }

  if (!Array.isArray(raw.steps)) {
    console.warn("Preproduction plan steps were not an array", {
      planId: raw.id,
      steps: raw.steps,
    })
  }

  const steps = asArray<any>(raw.steps).map((step) => ({
    ...step,
    tasks: asArray<any>(step?.tasks).map((task) => ({
      ...task,
      recommendations: asArray(task?.recommendations),
      serviceLinks: asArray(task?.serviceLinks),
    })),
  }))

  const totalTasks =
    typeof raw.totalTasks === "number"
      ? raw.totalTasks
      : steps.reduce(
          (count, step) => count + step.tasks.filter((task: any) => task.activityType === "task").length,
          0
        )
  const completedTasks =
    typeof raw.completedTasks === "number"
      ? raw.completedTasks
      : steps.reduce(
          (count, step) =>
            count + step.tasks.filter((task: any) => task.activityType === "task" && task.completed).length,
          0
        )

  return {
    ...raw,
    steps,
    totalSteps: typeof raw.totalSteps === "number" ? raw.totalSteps : steps.length,
    completedSteps: typeof raw.completedSteps === "number" ? raw.completedSteps : 0,
    totalTasks,
    completedTasks,
  } as PreproductionPlan
}

function TimingGuidance({ title, plantingDate }: { title: string; plantingDate: string | null }) {
  const guidance = TIMING_GUIDANCE[title] ?? {
    ideal: "Before planting.",
    recommendation: "Review this preparation area and complete any tasks that apply to your field.",
  }

  return (
    <div className="rounded-2xl bg-primary-50 p-4 text-sm shadow-soft">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="font-semibold text-primary-900">Current Situation</div>
          <p className="mt-1 text-muted-foreground">{formatCurrentSituation(plantingDate)}</p>
        </div>
        <div>
          <div className="font-semibold text-primary-900">Ideal Timing for {title}</div>
          <p className="mt-1 text-muted-foreground">{guidance.ideal}</p>
        </div>
        <div>
          <div className="font-semibold text-primary-900">Recommendation</div>
          <p className="mt-1 text-muted-foreground">{guidance.recommendation}</p>
        </div>
      </div>
    </div>
  )
}

const PREPARATION_IMAGE_URL =
  "https://images.unsplash.com/photo-1625324455604-d75faf4b119b?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.1.0"

interface PlanDetailPageProps {
  planId: string
}

export function PlanDetailPage({ planId }: PlanDetailPageProps) {
  const { toast } = useToast()
  const [plan, setPlan] = useState<PreproductionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setNotFound(false)
      setLoadError(false)
      try {
        const data = await apiClient.getPreproductionPlan(planId)
        if (active) setPlan(normalizePreproductionPlan(data))
      } catch (error: any) {
        if (active) {
          const isNotFound = error?.status === 404
          setNotFound(isNotFound)
          setLoadError(!isNotFound)
          console.error("Could not load preproduction plan", {
            planId,
            error,
          })
          toast({
            title: "Could not load plan",
            description: isNotFound ? "This plan may not exist." : "Please try again in a moment.",
            variant: "destructive",
          })
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [planId, toast])

  // Expand the current (or first incomplete) step by default.
  const defaultOpen = useMemo(() => {
    if (!plan) return [] as string[]
    const current = plan.steps.find(
      (s) => s.status === "current" && (s.tasks ?? []).some((task) => task.activityType === "task" && !task.completed)
    )
    if (current) return [current.id]
    const firstOpen = plan.steps.find((s) =>
      (s.tasks ?? []).some((task) => task.activityType === "task" && !task.completed)
    )
    return firstOpen ? [firstOpen.id] : []
  }, [plan])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading plan…
      </div>
    )
  }

  if (notFound || loadError || !plan) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/pre-production-planning"
          className="inline-flex items-center gap-1 text-sm text-agri-700 hover:text-agri-900"
        >
          <ChevronLeft className="h-4 w-4" /> All plans
        </Link>
        <p className="text-muted-foreground">
          {notFound
            ? "This farm preparation plan could not be found."
            : "We could not load this farm preparation plan right now. Please try again."}
        </p>
      </div>
    )
  }

  const progressPct = plan.totalTasks ? (plan.completedTasks / plan.totalTasks) * 100 : 0

  return (
    <div className="page-shell lg:max-w-5xl lg:mx-auto">
      <Link
        href="/dashboard/pre-production-planning"
        className="inline-flex items-center gap-1 text-sm text-agri-700 hover:text-agri-900"
      >
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="relative min-h-44">
          <img src={PREPARATION_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/85 via-primary-900/45 to-primary-700/20" />
          <div className="relative flex h-full min-h-44 flex-col justify-end p-5 text-white sm:p-7">
            <Badge className="mb-4 w-fit bg-white/90 text-primary-900 hover:bg-white">{plan.potatoVariety}</Badge>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{plan.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {plan.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Plant by {formatShortDate(plan.plantingDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-5 sm:p-6">
          <div className="flex items-center justify-between text-xs font-bold text-primary-700">
            <span>Preparation progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {plan.completedTasks} of {plan.totalTasks} tasks completed
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {plan.status === "completed" && <CompletionCta plan={plan} />}

      {/* Steps */}
      <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-3">
        {plan.steps.map((step) => {
          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="rounded-2xl border-0 bg-card px-4 shadow-soft data-[state=open]:shadow-card"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-900">
                    {step.order}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-primary-900 truncate">{step.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatShortDate(step.dateRangeStart)} – {formatShortDate(step.dateRangeEnd)}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3">
                  <TimingGuidance title={step.title} plantingDate={plan.plantingDate} />
                  {(step.tasks ?? []).map((task) => (
                    <StepTaskCard key={task.id} task={task} onUpdated={(nextPlan) => setPlan(normalizePreproductionPlan(nextPlan))} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
