"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api/client"
import type { ProductionCycleReportDetail, ProductionCycleReportSnapshot } from "@/lib/types/production"
import { DollarSign, FileText, Printer } from "lucide-react"

const FARM_MALL_LOGO_URL =
  "https://xnrlzezteajvrhlq.public.blob.vercel-storage.com/farmmall/WhatsApp_Image_2025-09-07_at_8.31.25_AM-removebg-preview%20%281%29.png"

function formatDate(value?: string | Date | null) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not recorded"
  return date.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Not recorded"
  return Number(value).toLocaleString()
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Not recorded"
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function activityTypeLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function CycleReportPage() {
  const params = useParams()
  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId
  const [report, setReport] = useState<ProductionCycleReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true)
        setError(null)
        const reportData = await apiClient.getCycleReport(reportId)
        setReport(reportData)
      } catch (err: any) {
        setError(err?.message || "Could not load report")
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="text-sm text-slate-600">Loading report...</div>
      </main>
    )
  }

  if (error || !report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-6 text-sm text-red-700 shadow-sm">{error || "Report not found"}</div>
      </main>
    )
  }

  const snapshot = report.snapshotData as ProductionCycleReportSnapshot
  const isFinancial = report.type === "financial"

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:px-0 print:py-0">
      <style jsx global>{`
        @media print {
          .print-hidden {
            display: none !important;
          }

          .report-page {
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="print-hidden mx-auto mb-4 flex max-w-5xl justify-end">
        <Button type="button" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <article className="report-page mx-auto max-w-5xl bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex justify-center">
          <img src={FARM_MALL_LOGO_URL} alt="Farm Mall Logo" className="h-14 w-14 object-contain" />
        </div>
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase text-agri-700">
                {isFinancial ? <DollarSign className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {isFinancial ? "Financial Report" : "Activity Report"}
              </div>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-950">{snapshot.cycle.cropVariety}</h1>
              <p className="mt-1 text-sm text-slate-600">{snapshot.cycle.farmLocation || "Farm location not recorded"}</p>
            </div>
            <Badge className="w-fit bg-agri-100 text-agri-800">Frozen snapshot</Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs uppercase text-slate-500">Generated</div>
              <div className="font-semibold">{formatDate(snapshot.generatedAt)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Planting Date</div>
              <div className="font-semibold">{formatDate(snapshot.cycle.plantingDate)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Harvest Date</div>
              <div className="font-semibold">{formatDate(snapshot.cycle.actualHarvestDate)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Land Size</div>
              <div className="font-semibold">{formatNumber(snapshot.cycle.landSizeAcres)} acres</div>
            </div>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-extrabold text-slate-950">Cycle Summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-500">Activities</div>
              <div className="mt-1 text-2xl font-extrabold">{snapshot.activitySummary.totalActivities}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-500">Completed</div>
              <div className="mt-1 text-2xl font-extrabold">{snapshot.activitySummary.completedActivities}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="text-xs uppercase text-slate-500">Duration</div>
              <div className="mt-1 text-2xl font-extrabold">
                {snapshot.activitySummary.cycleDurationDays ?? "N/A"} days
              </div>
            </div>
          </div>
        </section>

        {isFinancial && snapshot.financialSummary && (
          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-slate-950">Financial Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs uppercase text-slate-500">Total Cost</div>
                <div className="mt-1 font-bold">{formatCurrency(snapshot.financialSummary.totalCost)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs uppercase text-slate-500">Revenue</div>
                <div className="mt-1 font-bold">{formatCurrency(snapshot.financialSummary.actualRevenue)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs uppercase text-slate-500">Profit</div>
                <div className="mt-1 font-bold">{formatCurrency(snapshot.financialSummary.profit)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs uppercase text-slate-500">Yield</div>
                <div className="mt-1 font-bold">{formatNumber(snapshot.financialSummary.actualYield)} kg</div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-extrabold text-slate-950">Activities</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-3 pr-3 font-bold">Activity</th>
                  <th className="py-3 pr-3 font-bold">Scheduled</th>
                  <th className="py-3 pr-3 font-bold">Completed</th>
                  <th className="py-3 pr-3 font-bold">Duration</th>
                  {isFinancial && <th className="py-3 pr-3 text-right font-bold">Cost</th>}
                </tr>
              </thead>
              <tbody>
                {snapshot.activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3">
                      <div className="font-semibold">{activity.description}</div>
                      <div className="text-xs text-slate-500">{activityTypeLabel(activity.type)}</div>
                      {activity.inputs && activity.inputs.length > 0 && (
                        <div className="mt-2 text-xs text-slate-600">
                          Inputs: {activity.inputs.map((input) => input.name).filter(Boolean).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3">{formatDate(activity.scheduledDate)}</td>
                    <td className="py-3 pr-3">{formatDate(activity.completedDate)}</td>
                    <td className="py-3 pr-3">
                      {activity.durationDays === null || activity.durationDays === undefined ? "N/A" : `${activity.durationDays} days`}
                    </td>
                    {isFinancial && <td className="py-3 pr-3 text-right">{formatCurrency(activity.cost)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
          This report is a frozen snapshot generated when the production cycle was marked harvested. Later activity or cost edits are not reflected here.
        </footer>
      </article>
    </main>
  )
}
