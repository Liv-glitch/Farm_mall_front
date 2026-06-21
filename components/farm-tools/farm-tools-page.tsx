"use client"

import { useState } from "react"
import { BarChart3, CalendarDays, Calculator, DollarSign, Target, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
    icon: Calculator,
  },
  {
    id: "harvest",
    title: "Harvest Forecast",
    icon: CalendarDays,
  },
  {
    id: "income",
    title: "Profit & Income Calculator",
    icon: DollarSign,
  },
  {
    id: "investment",
    title: "Investment Calculator",
    icon: Target,
  },
  {
    id: "yield",
    title: "Yield Calculator",
    icon: BarChart3,
  },
] satisfies Array<{
  id: ToolId
  title: string
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            className="cursor-pointer transition-colors hover:border-sage-300 hover:bg-sage-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-700">
                <tool.icon className="h-5 w-5" />
              </div>
              <div className="text-base font-semibold text-gray-900">{tool.title}</div>
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
