"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import { PlantAIModal } from "@/components/modals/plant-ai-modal"
import { SoilAnalysisModal } from "@/components/modals/soil-analysis-modal"
import { YieldCalculatorModal } from "@/components/modals/yield-calculator-modal"
import { AnalysisHistoryView } from "@/components/farm-intelligence/analysis-history-view"
import { 
  Leaf, 
  HeartPulse, 
  Search, 
  TestTube, 
  Brain,
  Camera,
  Upload,
  FileText,
  BarChart3,
  History,
  Calculator,
  TrendingUp,
  Sparkles,
  Clock,
  Database
} from "lucide-react"

export default function FarmIntelligencePage() {
  const [activeTab, setActiveTab] = useState("services")
  const [showPlantIdentify, setShowPlantIdentify] = useState(false)
  const [showPlantHealth, setShowPlantHealth] = useState(false)
  const [showSoilAnalysis, setShowSoilAnalysis] = useState(false)
  const [showYieldCalculator, setShowYieldCalculator] = useState(false)

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-agri-600 via-agri-700 to-agri-800 shadow-lg">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">Farm Intelligence Hub</h1>
                <p className="text-agri-100 mt-1">
                  AI-powered insights for smarter farming decisions with comprehensive history tracking
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Gemini AI Enhanced
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    <Database className="h-3 w-3 mr-1" />
                    Records Stored
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm h-12">
                <TabsTrigger 
                  value="services" 
                  className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 flex items-center space-x-2"
                >
                  <Brain className="h-4 w-4" />
                  <span>AI Services</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 flex items-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>Analysis History</span>
                </TabsTrigger>
              </TabsList>

              {/* AI Services Tab */}
              <TabsContent value="services" className="space-y-8">
                {/* Service Categories */}
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Plant Health Analysis */}
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-red-200 hover:border-red-400 bg-gradient-to-br from-red-50 to-red-100 group"
                    onClick={() => {
                      console.log('🔍 Plant Health card clicked')
                      setShowPlantHealth(true)
                      console.log('🔍 showPlantHealth set to:', true)
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <HeartPulse className="h-10 w-10 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Plant Health</h3>
                      <p className="text-gray-700 mb-4 text-sm">
                        AI-powered disease detection with Kenya-specific treatment plans
                      </p>
                      <div className="space-y-1 text-xs text-gray-600 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Disease Detection</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Treatment Prioritization</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Regional Solutions</span>
                        </div>
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        <Camera className="h-4 w-4 mr-2" />
                        Analyze Health
                      </Button>
                      <Badge variant="outline" className="mt-2 text-xs border-red-300 text-red-700">
                        Auto-Saved Records
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Plant Identification */}
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-green-200 hover:border-green-400 bg-gradient-to-br from-green-50 to-green-100 group"
                    onClick={() => {
                      console.log('🔍 Plant ID card clicked')
                      setShowPlantIdentify(true)
                      console.log('🔍 showPlantIdentify set to:', true)
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <Search className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Plant ID</h3>
                      <p className="text-gray-700 mb-4 text-sm">
                        Instant identification with cultivation tips for Kenyan conditions
                      </p>
                      <div className="space-y-1 text-xs text-gray-600 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Species Recognition</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Local Varieties</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Growing Guidelines</span>
                        </div>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Identify Plant
                      </Button>
                      <Badge variant="outline" className="mt-2 text-xs border-green-300 text-green-700">
                        Instant Results
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Soil Analysis */}
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-amber-200 hover:border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 group"
                    onClick={() => setShowSoilAnalysis(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 bg-amber-100 group-hover:bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <TestTube className="h-10 w-10 text-amber-700" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Soil Analysis</h3>
                      <p className="text-gray-700 mb-4 text-sm">
                        Upload lab reports for AI-powered recommendations
                      </p>
                      <div className="space-y-1 text-xs text-gray-600 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                          <span>PDF Report Analysis</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                          <span>Fertilizer Plans</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                          <span>Crop Suitability</span>
                        </div>
                      </div>
                      <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload Report
                      </Button>
                      <Badge variant="outline" className="mt-2 text-xs border-amber-400 text-amber-700">
                        PDF/Image Support
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Smart Yield Calculator */}
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 group"
                    onClick={() => setShowYieldCalculator(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <Calculator className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Yield Calculator</h3>
                      <p className="text-gray-700 mb-4 text-sm">
                        Advanced yield prediction with economic analysis
                      </p>
                      <div className="space-y-1 text-xs text-gray-600 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Multi-Variable Analysis</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Risk Assessment</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Profit Projections</span>
                        </div>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Calculate Yield
                      </Button>
                      <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-700">
                        Comprehensive Reports
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Features Section */}
                <Card className="bg-gradient-to-r from-agri-50 via-maize-50 to-tea-50 border-agri-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-agri-800">
                      <Sparkles className="h-6 w-6 text-agri-600" />
                      <span>Enhanced AI Capabilities</span>
                    </CardTitle>
                    <CardDescription>
                      Powered by Gemini AI with automatic fallback to Plant.id for maximum reliability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-white/60 rounded-lg">
                        <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Brain className="h-6 w-6 text-agri-700" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Kenya-Specific Insights</h4>
                        <p className="text-sm text-gray-600">
                          Tailored recommendations for Kenyan climate, soil conditions, and farming practices
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white/60 rounded-lg">
                        <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Database className="h-6 w-6 text-agri-700" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Automatic Record Keeping</h4>
                        <p className="text-sm text-gray-600">
                          All analyses are automatically saved with full history tracking and search capability
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white/60 rounded-lg">
                        <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="h-6 w-6 text-agri-700" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Comprehensive Analysis</h4>
                        <p className="text-sm text-gray-600">
                          From identification to yield prediction - complete farm intelligence in one platform
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Processing Times Notice */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Processing Times</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Plant Analysis: ~25 seconds • Soil Analysis: ~30 seconds • Yield Calculator: ~40 seconds
                          <br />
                          <span className="font-medium">All results are automatically saved to your history.</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analysis History Tab */}
              <TabsContent value="history" className="space-y-6">
                <AnalysisHistoryView />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Enhanced Modals */}
        <PlantAIModal 
          open={showPlantIdentify} 
          onOpenChange={setShowPlantIdentify}
          mode="identify"
        />
        <PlantAIModal 
          open={showPlantHealth} 
          onOpenChange={setShowPlantHealth}
          mode="health"
        />
        <SoilAnalysisModal
          open={showSoilAnalysis}
          onOpenChange={setShowSoilAnalysis}
        />
        <YieldCalculatorModal
          open={showYieldCalculator}
          onOpenChange={setShowYieldCalculator}
        />
      </div>
    </DashboardLayout>
  )
}