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
  done: { label: "Done", className: "bg-agri-100 text-agri-700" },
  current: { label: "Current", className: "bg-[#e87a3b]/15 text-[#c25a22]" },
  upcoming: { label: "Upcoming", className: "bg-muted text-muted-foreground" },
  past: { label: "Past", className: "bg-amber-100 text-amber-700" },
}

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
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/pre-production-planning"
        className="inline-flex items-center gap-1 text-sm text-agri-700 hover:text-agri-900"
      >
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-agri-100 bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-agri-900">{plan.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1.5">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {plan.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Plant by {formatShortDate(plan.plantingDate)}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-agri-100 text-agri-700 hover:bg-agri-100">
            {plan.potatoVariety}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-agri-700">
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
              className="rounded-xl border border-agri-100 bg-card px-4 data-[state=open]:border-agri-200"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div
                    className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.status === "done"
                        ? "bg-agri-600 text-white"
                        : step.status === "current"
                          ? "bg-[#e87a3b] text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.order}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-agri-900 truncate">{step.title}</div>
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
