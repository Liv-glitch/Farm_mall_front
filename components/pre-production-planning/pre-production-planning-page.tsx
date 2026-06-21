"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, Plus, MapPin, CalendarDays, ListChecks, Calculator, Sprout } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { PreproductionPlan } from "@/lib/types/preproduction"
import { NewPlanModal } from "./new-plan-modal"
import { DashboardCostCalculator } from "./dashboard-cost-calculator"

function formatShortDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export function PreproductionPlanningPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<PreproductionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const loadPlans = async () => {
    setLoading(true)
    try {
      const data = (await apiClient.getPreproductionPlans()) as PreproductionPlan[]
      setPlans(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast({
        title: "Failed to load plans",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload when the modal closes so a freshly-created plan shows up on return.
  const handleModalClose = () => {
    setModalOpen(false)
    loadPlans()
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-agri-900">Farm Preparations</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          A clear checklist of everything to do before planting day — from picking the field to placing the first
          tuber in the ground.
        </p>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Plans
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Cost Calculator
          </TabsTrigger>
        </TabsList>

        {/* Plans tab */}
        <TabsContent value="plans" className="mt-6 space-y-5">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div>
              <h2 className="text-lg font-semibold text-agri-900">Your plans</h2>
              <p className="text-sm text-muted-foreground">Create one plan per field or planting season.</p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="bg-agri-600 hover:bg-agri-700 w-full sm:w-auto">
              <Plus className="mr-1.5 h-4 w-4" /> New plan
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading plans…
            </div>
          ) : plans.length === 0 ? (
            <Card className="border-dashed border-2 border-agri-200 bg-agri-50/40">
              <CardContent className="flex flex-col items-center text-center py-14 px-6">
                <div className="h-14 w-14 rounded-full bg-agri-100 flex items-center justify-center mb-4">
                  <Sprout className="h-7 w-7 text-agri-600" />
                </div>
                <h3 className="font-semibold text-agri-900">No plans yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs">
                  Set up your first farm preparation checklist to get step-by-step guidance before planting.
                </p>
                <Button onClick={() => setModalOpen(true)} className="bg-agri-600 hover:bg-agri-700">
                  Create your first plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Link key={plan.id} href={`/dashboard/pre-production-planning/${plan.id}`} className="group">
                  <Card className="h-full border border-agri-100 hover:border-agri-300 hover:shadow-md transition-all">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-9 w-9 shrink-0 rounded-lg bg-agri-100 flex items-center justify-center">
                            <Sprout className="h-5 w-5 text-agri-600" />
                          </div>
                          <h3 className="font-semibold text-agri-900 truncate group-hover:text-agri-700">
                            {plan.name}
                          </h3>
                        </div>
                        <Badge variant="secondary" className="bg-agri-100 text-agri-700 hover:bg-agri-100 shrink-0">
                          {plan.potatoVariety}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{plan.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> Plant by {formatShortDate(plan.plantingDate)}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-agri-700">{plan.completedSteps} of {plan.totalSteps} completed</span>
                          {plan.status === "completed" && (
                            <span className="text-agri-600">Done</span>
                          )}
                        </div>
                        <Progress
                          value={plan.totalSteps ? (plan.completedSteps / plan.totalSteps) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cost calculator tab */}
        <TabsContent value="calculator" className="mt-6">
          <DashboardCostCalculator />
        </TabsContent>
      </Tabs>

      <NewPlanModal isOpen={modalOpen} onClose={handleModalClose} />
    </div>
  )
}
