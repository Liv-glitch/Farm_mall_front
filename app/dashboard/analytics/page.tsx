"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  PieChart
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import type { ProductionCycle } from "@/lib/types/production"

export default function AnalyticsPage() {
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.getCycles()
        const cyclesData = Array.isArray(res) ? res : (res?.data ? res.data : [])
        setCycles(cyclesData)
      } catch (err) {
        console.error("Error fetching cycles:", err)
        setCycles([])
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
    const activityCosts = cycle.activities?.reduce((acc, activity) => 
      acc + (typeof activity.cost === 'string' ? parseFloat(activity.cost) : activity.cost || 0), 0) || 0
    return sum + activityCosts
  }, 0)

  const totalRevenue = cycles.reduce((sum, cycle) => {
    if (cycle.status === "harvested" && cycle.actualYield && cycle.actualPricePerKg) {
      return sum + (cycle.actualYield * cycle.actualPricePerKg)
    }
    return sum + ((cycle.expectedYield || 0) * (cycle.expectedPricePerKg || 0))
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
              <TabsList className="grid w-full grid-cols-4 bg-white">
                <TabsTrigger value="overview" className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="profit" className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800">
                  Profit Analysis
                </TabsTrigger>
                <TabsTrigger value="production" className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800">
                  Production Trends
                </TabsTrigger>
                <TabsTrigger value="financial" className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800">
                  Financial Reports
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
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
                          <p className="text-sm font-medium text-gray-600">Active Cycles</p>
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
                        <span className="text-gray-600">Total Cycles</span>
                        <span className="font-semibold">{totalCycles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Cycles</span>
                        <span className="font-semibold text-agri-600">{activeCycles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Harvested Cycles</span>
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

              {/* Production Trends Tab */}
              <TabsContent value="production" className="space-y-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <Activity className="h-5 w-5 text-agri-600" />
                      Production Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-agri-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Cycles</p>
                          <p className="text-xl font-bold text-agri-800">{totalCycles}</p>
                        </div>
                        <div className="text-center p-4 bg-maize-50 rounded-lg">
                          <p className="text-sm text-gray-600">Active Cycles</p>
                          <p className="text-xl font-bold text-maize-800">{activeCycles}</p>
                        </div>
                        <div className="text-center p-4 bg-tea-50 rounded-lg">
                          <p className="text-sm text-gray-600">Harvested</p>
                          <p className="text-xl font-bold text-tea-800">{harvestedCycles}</p>
                        </div>
                      </div>

                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Production trend charts will be displayed here</p>
                        <p className="text-sm">Coming soon with cycle performance over time</p>
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
                    <div className="space-y-6">
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Detailed financial reports will be displayed here</p>
                        <p className="text-sm">Coming soon with detailed breakdowns and exports</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
} 