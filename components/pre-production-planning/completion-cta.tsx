"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PartyPopper, ArrowRight } from "lucide-react"
import type { PreproductionPlan } from "@/lib/types/preproduction"

interface CompletionCtaProps {
  plan: PreproductionPlan
}

export function CompletionCta({ plan }: CompletionCtaProps) {
  // Hand the plan's details to Crop Tracker so it can prefill a new record.
  const params = new URLSearchParams({
    sourcePlanId: plan.id,
    variety: plan.potatoVariety,
    plantingDate: plan.plantingDate,
    location: plan.location,
  })
  const href = `/dashboard/cycles/new?${params.toString()}`

  return (
    <Card className="border-0 bg-gradient-to-br from-primary-50 to-amber-50">
      <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary-100 flex items-center justify-center">
          <PartyPopper className="h-6 w-6 text-primary-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-extrabold text-primary-900">You&apos;re ready to plant!</h3>
          <p className="text-sm text-muted-foreground">
            Every farm preparation step is complete. Start a crop tracker record, pre-filled with this plan&apos;s details.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={href}>
            Start crop tracker record <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
