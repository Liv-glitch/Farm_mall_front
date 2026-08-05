"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileWarning, ArrowLeft } from "lucide-react"
import { useDecisionReport } from "@/lib/hooks/use-decision-report"

export default function DecisionReportPreviewPage() {
  const router = useRouter()
  const { report } = useDecisionReport()

  if (!report) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center">
        <FileWarning className="h-10 w-10 text-slate-400" />
        <div>
          <h1 className="text-lg font-bold text-slate-900">No report to show</h1>
          <p className="mt-1 max-w-sm text-sm text-slate-600">
            Decision reports aren&apos;t saved, so refreshing this page loses it. Head back to Farm Preparations to
            generate a new one.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/pre-production-planning")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Farm Preparations
        </Button>
      </main>
    )
  }

  return (
    <iframe
      srcDoc={report.html}
      title="Farm Decision Report"
      className="h-screen w-screen border-0"
    />
  )
}
