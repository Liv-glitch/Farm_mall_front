"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HarvestForecastModal } from "@/components/modals/harvest-forecast-modal"
import { IncomeCalculatorModal } from "@/components/modals/income-calculator-modal"
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  Clock,
  FileText,
  Target,
  Zap
} from "lucide-react"

export default function FarmToolsPage() {
  const [showHarvestForecast, setShowHarvestForecast] = useState(false)
  const [showIncomeCalculator, setShowIncomeCalculator] = useState(false)

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-agri-100 rounded-lg">
                <Calculator className="h-6 w-6 text-agri-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Farm Tools</h1>
                <p className="text-gray-600">Essential calculators and planning tools for smart farming decisions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              {/* Tools Overview */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Farm Planning Solution</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Get comprehensive income, cost, and profit analysis with investment recommendations - all calculations automated for you.
                </p>
              </div>

              {/* Tools Cards */}
              <div className="max-w-2xl mx-auto mb-8">

                {/* Unified Comprehensive Farm Calculator Card */}
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                    showIncomeCalculator ? 'border-agri-500 bg-agri-50' : 'border-gray-200 hover:border-agri-300'
                  }`}
                  onClick={() => setShowIncomeCalculator(true)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calculator className="h-10 w-10 text-agri-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Expected Income Calculator</h3>
                    <p className="text-gray-600 mb-6 text-lg">
                      Complete farm planning tool - calculate income, costs, profit, and get investment recommendations all in one place
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-agri-500 rounded-full"></span>
                        <span>Income & Cost Analysis</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-agri-500 rounded-full"></span>
                        <span>Automatic Profit Calculation</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-agri-500 rounded-full"></span>
                        <span>Investment-Based Acreage</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-agri-500 rounded-full"></span>
                        <span>ROI & Efficiency Analysis</span>
                      </div>
                    </div>
                    <Button className="w-full h-14 bg-agri-600 hover:bg-agri-700 text-white text-lg">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Start Comprehensive Analysis
                    </Button>
                  </CardContent>
                </Card>

                {/* Harvest Forecast Card - Secondary Tool */}
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 mt-6 ${
                    showHarvestForecast ? 'border-agri-500 bg-agri-50' : 'border-gray-200 hover:border-agri-300'
                  }`}
                  onClick={() => setShowHarvestForecast(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-agri-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Harvest Forecast Tool</h3>
                    <p className="text-gray-600 mb-4">
                      Predict optimal harvest timing with weather insights and growth cycle tracking
                    </p>
                    <Button className="w-full mt-4 bg-agri-600 hover:bg-agri-700 text-white">
                      <Clock className="h-4 w-4 mr-2" />
                      Forecast Harvest
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits Section */}
              <Card className="bg-gradient-to-r from-agri-50 to-maize-50 border-agri-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-agri-700" />
                    <span>Why Use Our Farm Tools?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="h-6 w-6 text-agri-700" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Accurate Planning</h4>
                      <p className="text-sm text-gray-600">Make informed decisions with precise calculations and predictions</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Zap className="h-6 w-6 text-agri-700" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Save Time</h4>
                      <p className="text-sm text-gray-600">Quick calculations and forecasts that would take hours manually</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="h-6 w-6 text-agri-700" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Maximize Profits</h4>
                      <p className="text-sm text-gray-600">Optimize your operations for better financial outcomes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips Section */}
              <Card className="bg-white shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-agri-700" />
                    <span>Quick Tips for Better Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">For Cost Calculator:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-agri-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Include all input costs (seeds, fertilizers, pesticides)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-agri-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Account for labor costs (family and hired workers)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-agri-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Consider machinery and equipment costs</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">For Harvest Forecast:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-agri-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Enter accurate planting dates for better predictions</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-agri-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Consider your specific location and weather patterns</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-agri-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Monitor crop development stages regularly</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Modals */}
        <HarvestForecastModal open={showHarvestForecast} onOpenChange={setShowHarvestForecast} />
        <IncomeCalculatorModal open={showIncomeCalculator} onOpenChange={setShowIncomeCalculator} />
      </div>
    </DashboardLayout>
  )
} 