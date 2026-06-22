"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Loader2, ChevronLeft, MapPin, CalendarDays } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { PreproductionPlan, PreproductionStepStatus } from "@/lib/types/preproduction"
import { StepTaskCard } from "./step-task-card"
import { CompletionCta } from "./completion-cta"

function formatShortDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

const STATUS_PILL: Record<PreproductionStepStatus, { label: string; className: string }> = {
  done: { label: "Done", className: "bg-primary-100 text-primary-800" },
  current: { label: "Current", className: "bg-amber-100 text-amber-800" },
  upcoming: { label: "Upcoming", className: "bg-muted text-muted-foreground" },
  past: { label: "Past", className: "bg-amber-100 text-amber-700" },
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

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const data = (await apiClient.getPreproductionPlan(planId)) as PreproductionPlan
        if (active) setPlan(data)
      } catch (error: any) {
        if (active) {
          setNotFound(true)
          toast({
            title: "Could not load plan",
            description: error?.message || "This plan may not exist.",
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
    const current = plan.steps.find((s) => s.status === "current")
    if (current) return [current.id]
    const firstOpen = plan.steps.find((s) => s.status !== "done")
    return firstOpen ? [firstOpen.id] : []
  }, [plan])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading plan…
      </div>
    )
  }

  if (notFound || !plan) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/pre-production-planning"
          className="inline-flex items-center gap-1 text-sm text-agri-700 hover:text-agri-900"
        >
          <ChevronLeft className="h-4 w-4" /> All plans
        </Link>
        <p className="text-muted-foreground">This farm preparation plan could not be found.</p>
      </div>
    )
  }

  const progressPct = plan.totalSteps ? (plan.completedSteps / plan.totalSteps) * 100 : 0

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
            {plan.completedSteps} of {plan.totalSteps} completed
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {plan.status === "completed" && <CompletionCta plan={plan} />}

      {/* Steps */}
      <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-3">
        {plan.steps.map((step) => {
          const pill = STATUS_PILL[step.status]
          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              className="rounded-2xl border-0 bg-card px-4 shadow-soft data-[state=open]:shadow-card"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div
                    className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.status === "done"
                        ? "bg-primary text-white"
                        : step.status === "current"
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.order}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-primary-900 truncate">{step.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatShortDate(step.dateRangeStart)} – {formatShortDate(step.dateRangeEnd)}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full mr-2 shrink-0 ${pill.className}`}>
                  {pill.label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3">
                  {(step.tasks ?? []).map((task) => (
                    <StepTaskCard key={task.id} task={task} onUpdated={setPlan} />
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
