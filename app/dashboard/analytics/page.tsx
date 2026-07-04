"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target, 
  Activity,
  Sprout,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  FileText,
  ExternalLink
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import type { ProductionCycle, ProductionCycleReportSummary } from "@/lib/types/production"
import { toast } from "@/components/ui/use-toast"

interface HarvestResultForm {
  actualYield: string
  actualPricePerKg: string
  actualHarvestDate: string
}

export default function AnalyticsPage() {
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [savingCycleId, setSavingCycleId] = useState<string | null>(null)
  const [harvestForms, setHarvestForms] = useState<Record<string, HarvestResultForm>>({})
  const [reports, setReports] = useState<ProductionCycleReportSummary[]>([])
  const [selectedHarvestCycle, setSelectedHarvestCycle] = useState<ProductionCycle | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [res, reportsRes] = await Promise.all([
          apiClient.getCycles(),
          apiClient.getCycleReports(),
        ])
        const cyclesData = Array.isArray(res) ? res : (res?.data ? res.data : [])
        setCycles(cyclesData)
        setReports(Array.isArray(reportsRes) ? reportsRes : [])
      } catch (err) {
        console.error("Error fetching cycles:", err)
        setCycles([])
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate analytics data
  const totalCycles = cycles.length
  const activeCycles = cycles.filter(c => c.status === "active").length
  const harvestedCycles = cycles.filter(c => c.status === "harvested").length
  
  // Financial calculations
  const totalInvestment = cycles.reduce((sum, cycle) => {
    const activityCosts = cycle.activities?.reduce((acc, activity) => {
      let cost = 0
      if (typeof activity.cost === 'string') {
        const parsed = parseFloat(activity.cost)
        cost = isNaN(parsed) ? 0 : parsed
      } else if (typeof activity.cost === 'number') {
        cost = isNaN(activity.cost) ? 0 : activity.cost
      }
      return acc + cost
    }, 0) || 0
    return sum + activityCosts
  }, 0)

  const totalRevenue = cycles.reduce((sum, cycle) => {
    const actualYield = Number(cycle.actualYield)
    const actualPrice = Number(cycle.actualPricePerKg)
    if (Number.isFinite(actualYield) && actualYield > 0 && Number.isFinite(actualPrice) && actualPrice > 0) {
      return sum + (actualYield * actualPrice)
    }
    return sum
  }, 0)

  const totalProfit = totalRevenue - totalInvestment
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Area calculations
  const totalArea = Math.round(cycles.reduce((sum, cycle) => {
    let acres = 0
    if (typeof cycle.landSizeAcres === 'number') {
      acres = cycle.landSizeAcres
    } else if (typeof cycle.landSizeAcres === 'string') {
      acres = parseFloat(cycle.landSizeAcres) || 0
    }
    return sum + acres
  }, 0) * 10) / 10

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const needsHarvestResult = (cycle: ProductionCycle) => {
    const actualYield = Number(cycle.actualYield)
    const actualPrice = Number(cycle.actualPricePerKg)
    const hasActuals = Number.isFinite(actualYield) && actualYield > 0 && Number.isFinite(actualPrice) && actualPrice > 0
    if (hasActuals) return false
    if (cycle.status === "harvested") return true
    if (!cycle.estimatedHarvestDate) return false
    const harvestDate = new Date(cycle.estimatedHarvestDate)
    return !Number.isNaN(harvestDate.getTime()) && harvestDate <= new Date()
  }

  const cyclesNeedingHarvestResults = cycles.filter(needsHarvestResult)
  const reportsByCycle = reports.reduce<Record<string, ProductionCycleReportSummary[]>>((groups, report) => {
    groups[report.productionCycleId] = [...(groups[report.productionCycleId] || []), report]
    return groups
  }, {})
  const reportGroups = Object.values(reportsByCycle)

  const getHarvestForm = (cycle: ProductionCycle): HarvestResultForm => {
    return harvestForms[cycle.id] || {
      actualYield: cycle.actualYield ? String(cycle.actualYield) : "",
      actualPricePerKg: cycle.actualPricePerKg ? String(cycle.actualPricePerKg) : "",
      actualHarvestDate: cycle.actualHarvestDate
        ? new Date(cycle.actualHarvestDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    }
  }

  const updateHarvestForm = (cycle: ProductionCycle, patch: Partial<HarvestResultForm>) => {
    setHarvestForms((current) => ({
      ...current,
      [cycle.id]: {
        ...getHarvestForm(cycle),
        ...patch,
      },
    }))
  }

  const saveHarvestResult = async (cycle: ProductionCycle) => {
    const form = getHarvestForm(cycle)
    const actualYield = Number(form.actualYield)
    const actualPricePerKg = Number(form.actualPricePerKg)

    if (!Number.isFinite(actualYield) || actualYield <= 0 || !Number.isFinite(actualPricePerKg) || actualPricePerKg <= 0) {
      toast({
        title: "Harvest result not saved",
        description: "Enter total yield and buying price using numbers greater than zero.",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingCycleId(cycle.id)
      const updatedCycle = await apiClient.updateCycle({
        id: cycle.id,
        actualYield,
        actualPricePerKg,
        actualHarvestDate: form.actualHarvestDate,
        status: cycle.status === "active" ? "harvested" : cycle.status,
      }) as ProductionCycle

      setCycles((current) =>
        current.map((item) =>
          item.id === cycle.id
            ? { ...item, ...updatedCycle, actualYield, actualPricePerKg, actualHarvestDate: new Date(form.actualHarvestDate), status: "harvested" }
            : item
        )
      )
      setHarvestForms((current) => {
        const next = { ...current }
        delete next[cycle.id]
        return next
      })
      setSelectedHarvestCycle(null)
      toast({
        title: "Harvest results recorded",
        description: "Revenue, profit analytics, and completion reports have been updated.",
      })
      const reportsRes = await apiClient.getCycleReports()
      setReports(Array.isArray(reportsRes) ? reportsRes : [])
    } catch (error: any) {
      toast({
        title: "Could not save harvest results",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingCycleId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-700 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-agri-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-agri-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600">Comprehensive farm performance insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="flex w-full justify-start overflow-x-auto rounded-xl bg-white p-1 sm:grid sm:grid-cols-4">
                <TabsTrigger value="overview" className="shrink-0 px-3 text-xs data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="profit" className="shrink-0 px-3 text-xs data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 sm:text-sm">
                  <span className="sm:hidden">Profit</span>
                  <span className="hidden sm:inline">Profit Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="production" className="shrink-0 px-3 text-xs data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 sm:text-sm">
                  <span className="sm:hidden">Production</span>
                  <span className="hidden sm:inline">Production Trends</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="shrink-0 px-3 text-xs data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 sm:text-sm">
                  <span className="sm:hidden">Reports</span>
                  <span className="hidden sm:inline">Financial Reports</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {cyclesNeedingHarvestResults.length > 0 && (
                  <Card className="border-agri-100 bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-agri-800">
                        <Target className="h-5 w-5 text-agri-600" />
                        Record harvest results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cyclesNeedingHarvestResults.map((cycle) => {
                        const form = getHarvestForm(cycle)
                        return (
                          <div key={cycle.id} className="rounded-xl border border-agri-100 bg-agri-50 p-4">
                            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="font-bold text-agri-900">{cycle.cropVariety?.name || "Production cycle"}</div>
                                <div className="text-sm text-muted-foreground">
                                  {cycle.farmLocation || "Location not set"}
                                </div>
                              </div>
                              <Badge className="w-fit bg-amber-100 text-amber-800">Revenue not recorded</Badge>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                              <div className="space-y-2">
                                <Label htmlFor={`actual-yield-${cycle.id}`}>Total yield (kg)</Label>
                                <Input
                                  id={`actual-yield-${cycle.id}`}
                                  type="number"
                                  min="1"
                                  value={form.actualYield}
                                  onChange={(event) => updateHarvestForm(cycle, { actualYield: event.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`actual-price-${cycle.id}`}>Buying price per kg</Label>
                                <Input
                                  id={`actual-price-${cycle.id}`}
                                  type="number"
                                  min="1"
                                  value={form.actualPricePerKg}
                                  onChange={(event) => updateHarvestForm(cycle, { actualPricePerKg: event.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`actual-harvest-${cycle.id}`}>Harvest date</Label>
                                <Input
                                  id={`actual-harvest-${cycle.id}`}
                                  type="date"
                                  value={form.actualHarvestDate}
                                  onChange={(event) => updateHarvestForm(cycle, { actualHarvestDate: event.target.value })}
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => saveHarvestResult(cycle)}
                                disabled={savingCycleId === cycle.id}
                              >
                                {savingCycleId === cycle.id ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-agri-50 border-agri-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-agri-800">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className="p-2 bg-agri-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-agri-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-maize-50 border-maize-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Profit</p>
                          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalProfit)}
                          </p>
                        </div>
                        <div className="p-2 bg-maize-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-maize-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-tea-50 border-tea-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                          <p className="text-2xl font-bold text-agri-800">{profitMargin.toFixed(1)}%</p>
                        </div>
                        <div className="p-2 bg-tea-100 rounded-lg">
                          <PieChart className="h-6 w-6 text-tea-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-agri-50 border-agri-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Preparations</p>
                          <p className="text-2xl font-bold text-agri-800">{activeCycles}</p>
                        </div>
                        <div className="p-2 bg-agri-100 rounded-lg">
                          <Activity className="h-6 w-6 text-agri-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-agri-800">
                        <Sprout className="h-5 w-5 text-agri-600" />
                        Production Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Preparations</span>
                        <span className="font-semibold">{totalCycles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Preparations</span>
                        <span className="font-semibold text-agri-600">{activeCycles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Harvested Preparations</span>
                        <span className="font-semibold text-green-600">{harvestedCycles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Area</span>
                        <span className="font-semibold">{totalArea} Acres</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-agri-800">
                        <DollarSign className="h-5 w-5 text-agri-600" />
                        Financial Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Investment</span>
                        <span className="font-semibold text-red-600">{formatCurrency(totalInvestment)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Revenue</span>
                        <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Net Profit</span>
                        <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(totalProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ROI</span>
                        <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Profit Analysis Tab */}
              <TabsContent value="profit" className="space-y-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <TrendingUp className="h-5 w-5 text-agri-600" />
                      Profit Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Profit Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Investment</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                        </div>
                        <div className={`text-center p-4 rounded-lg ${totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className="text-sm text-gray-600">Net Profit</p>
                          <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalProfit)}
                          </p>
                        </div>
                      </div>

                      {/* Profit Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Profitability Metrics</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Profit Margin</span>
                              <span className="font-semibold">{profitMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">ROI</span>
                              <span className="font-semibold">
                                {totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Revenue per Acre</span>
                              <span className="font-semibold">
                                {totalArea > 0 ? formatCurrency(totalRevenue / totalArea) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Performance Indicators</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Profit Trend</span>
                              <div className="flex items-center gap-1">
                                {totalProfit >= 0 ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {totalProfit >= 0 ? 'Positive' : 'Negative'}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Break-even Point</span>
                              <span className="font-semibold">
                                {totalRevenue > 0 ? ((totalInvestment / totalRevenue) * 100).toFixed(1) : 0}% of Revenue
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Farm Preparation Trends Tab */}
              <TabsContent value="production" className="space-y-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <Activity className="h-5 w-5 text-agri-600" />
                      Farm Preparation Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-agri-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Preparations</p>
                          <p className="text-xl font-bold text-agri-800">{totalCycles}</p>
                        </div>
                        <div className="text-center p-4 bg-maize-50 rounded-lg">
                          <p className="text-sm text-gray-600">Active Preparations</p>
                          <p className="text-xl font-bold text-maize-800">{activeCycles}</p>
                        </div>
                        <div className="text-center p-4 bg-tea-50 rounded-lg">
                          <p className="text-sm text-gray-600">Harvested</p>
                          <p className="text-xl font-bold text-tea-800">{harvestedCycles}</p>
                        </div>
                      </div>

                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Farm preparation trend charts will be displayed here</p>
                        <p className="text-sm">Coming soon with preparation performance over time</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Reports Tab */}
              <TabsContent value="financial" className="space-y-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <DollarSign className="h-5 w-5 text-agri-600" />
                      Financial Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportGroups.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No completed-cycle reports yet</p>
                        <p className="text-sm">Reports will appear here after a cycle is marked harvested.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reportGroups.map((cycleReports) => {
                          const firstReport = cycleReports[0]
                          const activityReport = cycleReports.find((report) => report.type === "activity")
                          const financialReport = cycleReports.find((report) => report.type === "financial")
                          const reportCycle = cycles.find((cycle) => cycle.id === firstReport.productionCycleId)
                          return (
                            <div key={firstReport.productionCycleId} className="rounded-lg border border-agri-100 bg-agri-50 p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <div className="font-bold text-agri-900">{firstReport.cropLabel}</div>
                                  <div className="text-sm text-muted-foreground">{firstReport.farmLabel}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    Generated {new Date(firstReport.generatedAt).toLocaleDateString()}
                                    {firstReport.harvestDate ? ` • Harvested ${new Date(firstReport.harvestDate).toLocaleDateString()}` : ""}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  {activityReport && (
                                    <Button asChild variant="outline" className="bg-white">
                                      <a href={`/dashboard/analytics/reports/${activityReport.id}`} target="_blank" rel="noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Activity Report
                                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                      </a>
                                    </Button>
                                  )}
                                  {financialReport && (
                                    reportCycle && needsHarvestResult(reportCycle) ? (
                                      <Button
                                        type="button"
                                        onClick={() => setSelectedHarvestCycle(reportCycle)}
                                        className="bg-maize-500 text-primary-950 hover:bg-maize-400"
                                      >
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Record Yield & Price
                                      </Button>
                                    ) : (
                                      <Button asChild>
                                        <a href={`/dashboard/analytics/reports/${financialReport.id}`} target="_blank" rel="noreferrer">
                                          <DollarSign className="mr-2 h-4 w-4" />
                                          Financial Report
                                          <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                        </a>
                                      </Button>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Dialog open={!!selectedHarvestCycle} onOpenChange={(open) => !open && setSelectedHarvestCycle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Yield & Price</DialogTitle>
            <DialogDescription>
              Add harvest yield and selling price to complete the financial report.
            </DialogDescription>
          </DialogHeader>
          {selectedHarvestCycle && (() => {
            const form = getHarvestForm(selectedHarvestCycle)
            const actualYield = Number(form.actualYield)
            const actualPrice = Number(form.actualPricePerKg)
            const revenue =
              Number.isFinite(actualYield) && actualYield > 0 && Number.isFinite(actualPrice) && actualPrice > 0
                ? actualYield * actualPrice
                : 0

            return (
              <div className="space-y-4">
                <div className="rounded-lg bg-agri-50 p-3">
                  <div className="font-bold text-agri-900">{selectedHarvestCycle.cropVariety?.name || "Production cycle"}</div>
                  <div className="text-sm text-muted-foreground">{selectedHarvestCycle.farmLocation || "Location not set"}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modal-actual-yield">Total yield (kg)</Label>
                    <Input
                      id="modal-actual-yield"
                      type="number"
                      min="1"
                      value={form.actualYield}
                      onChange={(event) => updateHarvestForm(selectedHarvestCycle, { actualYield: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-actual-price">Selling price per kg</Label>
                    <Input
                      id="modal-actual-price"
                      type="number"
                      min="1"
                      value={form.actualPricePerKg}
                      onChange={(event) => updateHarvestForm(selectedHarvestCycle, { actualPricePerKg: event.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-actual-harvest">Harvest date</Label>
                  <Input
                    id="modal-actual-harvest"
                    type="date"
                    value={form.actualHarvestDate}
                    onChange={(event) => updateHarvestForm(selectedHarvestCycle, { actualHarvestDate: event.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-maize-50 p-3 text-sm">
                  <span className="font-bold text-primary-950">Computed revenue</span>
                  <span className="font-extrabold text-primary-950">{formatCurrency(revenue)}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedHarvestCycle(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => saveHarvestResult(selectedHarvestCycle)}
                    disabled={savingCycleId === selectedHarvestCycle.id}
                    className="bg-maize-500 text-primary-950 hover:bg-maize-400"
                  >
                    {savingCycleId === selectedHarvestCycle.id ? "Saving..." : "Generate Financial Report"}
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
} 
