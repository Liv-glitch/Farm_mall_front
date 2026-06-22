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
    action: "Select cost calculator",
    icon: Calculator,
  },
  {
    id: "harvest",
    title: "Harvest Forecast",
    description: "Predict harvest timing from planting date, variety maturity, and crop development assumptions.",
    action: "Select harvest forecast",
    icon: CalendarDays,
  },
  {
    id: "income",
    title: "Profit & Income Calculator",
    description: "Model expected income, profit, and margins from your projected yield and market price.",
    action: "Select income calculator",
    icon: DollarSign,
  },
  {
    id: "investment",
    title: "Investment Calculator",
    description: "Compare input budgets, likely returns, and investment needs for a production cycle.",
    action: "Select investment calculator",
    icon: Target,
  },
  {
    id: "yield",
    title: "Yield Calculator",
    description: "Estimate likely yield using crop, field, season, and management details.",
    action: "Select yield calculator",
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
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
            className="group flex h-full cursor-pointer border-agri-100 transition-all hover:-translate-y-0.5 hover:border-agri-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agri-500"
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-agri-100 text-agri-700 transition-colors group-hover:bg-agri-600 group-hover:text-white">
                <tool.icon className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-950">{tool.title}</h3>
                <p className="text-sm leading-6 text-gray-600">{tool.description}</p>
              </div>
              <Button
                type="button"
                className="mt-6 w-full bg-agri-700 text-white hover:bg-agri-800"
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

      <CostCalculatorModal open={activeTool === "cost"} onOpenChange={handleModalOpenChange} />
      <HarvestForecastModal open={activeTool === "harvest"} onOpenChange={handleModalOpenChange} />
      <IncomeCalculatorModal open={activeTool === "income"} onOpenChange={handleModalOpenChange} />
      <InvestmentCalculatorModal open={activeTool === "investment"} onOpenChange={handleModalOpenChange} />
      <YieldCalculatorModal open={activeTool === "yield"} onOpenChange={handleModalOpenChange} />
    </>
  )
}
