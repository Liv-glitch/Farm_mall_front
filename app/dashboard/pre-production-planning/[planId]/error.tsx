"use client"

import Link from "next/link"
import { useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PreproductionPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Farm preparation plan page failed", error)
  }, [error])

  return (
    <div className="page-shell lg:max-w-5xl lg:mx-auto">
      <Link
        href="/dashboard/pre-production-planning"
        className="inline-flex items-center gap-1 text-sm text-agri-700 hover:text-agri-900"
      >
        <ChevronLeft className="h-4 w-4" /> All plans
      </Link>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h1 className="text-xl font-extrabold text-primary-900">Could not load this plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong while opening this farm preparation plan. Please try again.
        </p>
        <Button type="button" onClick={reset} className="mt-5">
          Try again
        </Button>
      </div>
    </div>
  )
}
