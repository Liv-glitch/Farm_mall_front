"use client"

import { useState } from "react"
import { BarChart3, CalendarDays, Calculator, DollarSign, Target, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CostCalculatorModal } from "@/components/modals/cost-calculator-modal"
import { HarvestForecastModal } from "@/components/modals/harvest-forecast-modal"
import { IncomeCalculatorModal } from "@/components/modals/income-calculator-modal"
import { InvestmentCalculatorModal } from "@/components/modals/investment-calculator-modal"
import { YieldCalculatorModal } from "@/components/modals/yield-calculator-modal"

type ToolId = "cost" | "harvest" | "income" | "investment" | "yield"

const farmTools = [
  {
    id: "cost",
    title: "Cost Calculator",
    description: "Estimate seed, fertilizer, labor, spray, machinery, and total production costs before you plant.",
    action: "Launch Cost Calculator",
    icon: Calculator,
  },
  {
    id: "harvest",
    title: "Harvest Forecast",
    description: "Predict harvest timing from planting date, variety maturity, and crop development assumptions.",
    action: "Launch Harvest Forecast",
    icon: CalendarDays,
  },
  {
    id: "income",
    title: "Profit & Income Calculator",
    description: "Model expected income, profit, and margins from your projected yield and market price.",
    action: "Launch Income Calculator",
    icon: DollarSign,
  },
  {
    id: "investment",
    title: "Investment Calculator",
    description: "Compare input budgets, likely returns, and investment needs for a production cycle.",
    action: "Launch Investment Calculator",
    icon: Target,
  },
  {
    id: "yield",
    title: "Yield Calculator",
    description: "Estimate likely yield using crop, field, season, and management details.",
    action: "Launch Yield Calculator",
    icon: BarChart3,
  },
] satisfies Array<{
  id: ToolId
  title: string
  description: string
  action: string
  icon: LucideIcon
}>

export function FarmToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      setActiveTool(null)
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-7">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Farm Tools Suite
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
            A comprehensive toolkit for optimized farm management and decision-making.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          {farmTools.map((tool) => (
            <Card
              key={tool.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTool(tool.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setActiveTool(tool.id)
                }
              }}
              className="group flex cursor-pointer border-agri-100 bg-white transition-all hover:-translate-y-0.5 hover:border-agri-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-500 md:[&:nth-child(5)]:col-span-2 lg:col-span-2 lg:[&:nth-child(4)]:col-start-2 lg:[&:nth-child(5)]:col-span-2"
            >
              <CardContent className="flex h-full w-full flex-col items-center gap-5 px-5 pb-5 pt-10 text-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-agri-50 text-agri-700 ring-1 ring-agri-100 transition-colors group-hover:bg-agri-600 group-hover:text-white group-hover:ring-agri-600">
                  <tool.icon className="h-11 w-11" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-gray-950">{tool.title}</h3>
                  <p className="text-sm leading-6 text-gray-600">{tool.description}</p>
                </div>
                <Button
                  type="button"
                  className="mt-auto w-full rounded-full bg-agri-700 text-white hover:bg-agri-800"
                  onClick={(event) => {
                    event.stopPropagation()
                    setActiveTool(tool.id)
                  }}
                >
                  {tool.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CostCalculatorModal open={activeTool === "cost"} onOpenChange={handleModalOpenChange} />
      <HarvestForecastModal open={activeTool === "harvest"} onOpenChange={handleModalOpenChange} />
      <IncomeCalculatorModal open={activeTool === "income"} onOpenChange={handleModalOpenChange} />
      <InvestmentCalculatorModal open={activeTool === "investment"} onOpenChange={handleModalOpenChange} />
      <YieldCalculatorModal open={activeTool === "yield"} onOpenChange={handleModalOpenChange} />
    </>
  )
}
