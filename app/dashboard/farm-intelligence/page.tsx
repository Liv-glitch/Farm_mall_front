"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import { PlantAIModal } from "@/components/modals/plant-ai-modal"
import { SoilAnalysisModal } from "@/components/modals/soil-analysis-modal"
import { YieldCalculatorModal } from "@/components/modals/yield-calculator-modal"
import { AnalysisHistoryView } from "@/components/farm-intelligence/analysis-history-view"
import { apiClient } from "@/lib/api/client"
import { 
  Leaf, 
  HeartPulse, 
  Search, 
  TestTube, 
  Brain,
  BarChart3,
  History,
  Calculator,
  TrendingUp,
  Clock,
  Database,
  CheckCircle
} from "lucide-react"

export default function FarmIntelligencePage() {
  const [activeTab, setActiveTab] = useState("services")
  const [showPlantIdentify, setShowPlantIdentify] = useState(false)
  const [showPlantHealth, setShowPlantHealth] = useState(false)
  const [showSoilAnalysis, setShowSoilAnalysis] = useState(false)
  const [showYieldCalculator, setShowYieldCalculator] = useState(false)
  
  // Analysis history state - preloaded for better UX
  const [analysisData, setAnalysisData] = useState({
    records: [],
    loading: true,
    error: null,
    total: 0,
    hasMore: false
  })

  // Preload analysis history data on page mount
  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  const loadAnalysisHistory = async (reset = true) => {
    try {
      if (reset) {
        setAnalysisData(prev => ({ ...prev, loading: true, error: null }))
      }
      
      const response = await apiClient.getAnalysisHistory({
        limit: 20,
        offset: reset ? 0 : analysisData.records.length
      })
      
      console.log('🔍 Preloaded Analysis History:', response?.success, response?.data?.length)
      
      if (response.success) {
        const rawRecords = response.data || []
        
        // Transform API records to match UI expectations
        const newRecords = rawRecords.map((record: any) => ({
          id: record.id,
          type: record.type,
          title: generateTitle(record),
          description: generateDescription(record),
          confidence: record.result?.healthStatus?.confidence || record.confidence,
          status: "completed",
          isHealthy: record.isHealthy || record.result?.healthStatus?.isHealthy,
          createdAt: record.createdAt || record.created_at || new Date().toISOString(),
          result: record.result || record.analysis || record,
          media: record.media || record.mediaUrls,
          location: record.location || record.metadata?.location,
          cropType: record.cropType || record.crop_type || record.metadata?.cropType
        }))
        
        setAnalysisData({
          records: reset ? newRecords : [...analysisData.records, ...newRecords],
          loading: false,
          error: null,
          total: response.total || 0,
          hasMore: newRecords.length === 20
        })
      } else {
        setAnalysisData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load analysis history',
          records: reset ? [] : prev.records
        }))
      }
    } catch (error) {
      console.error('Failed to preload analysis history:', error)
      setAnalysisData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Connection error',
        records: reset ? [] : prev.records
      }))
    }
  }

  // Helper functions for generating titles and descriptions
  const generateTitle = (record: any) => {
    switch (record.type) {
      case 'plant_health':
        if (record.result?.healthStatus?.overall) {
          return `Plant Health Analysis - ${record.result.healthStatus.overall}`
        }
        if (record.result?.diseases?.[0]?.name) {
          return `Plant Health - ${record.result.diseases[0].name} detected`
        }
        return "Plant Health Analysis"
      case 'plant_identification':
        if (record.result?.plants?.[0]?.commonName) {
          const commonName = typeof record.result.plants[0].commonName === 'string' 
            ? record.result.plants[0].commonName 
            : record.result.plants[0].commonName?.commonName || record.result.plants[0].commonName
          return `Plant ID - ${commonName}`
        }
        if (record.result?.primaryIdentification) {
          return `Plant ID - ${record.result.primaryIdentification}`
        }
        return "Plant Identification"
      case 'soil_analysis':
        if (record.result?.soilHealth?.category) {
          return `Soil Analysis - ${record.result.soilHealth.category} health`
        }
        if (record.result?.basicProperties?.ph) {
          return `Soil Analysis - pH ${record.result.basicProperties.ph}`
        }
        return "Soil Analysis"
      case 'yield_calculation':
        if (record.result?.estimatedYield?.quantity) {
          return `Yield Calculator - ${record.result.estimatedYield.quantity}${record.result.estimatedYield.unit || 'kg'} projected`
        }
        return "Yield Calculation"
      default:
        return "Analysis"
    }
  }

  const generateDescription = (record: any) => {
    const analysis = record.result || record.analysis || record
    
    switch (record.type) {
      case 'plant_health':
        if (analysis?.healthStatus?.healthScore) {
          return `Health Score: ${analysis.healthStatus.healthScore}%, ${analysis?.primaryConcerns?.[0] || 'Analysis completed'}`
        }
        if (analysis?.healthStatus?.assessment) {
          return analysis.healthStatus.assessment.substring(0, 100) + "..."
        }
        return record.isHealthy ? "Plant appears healthy" : "Issues detected in plant health"
      case 'plant_identification':
        if (analysis?.plants?.[0]) {
          const plant = analysis.plants[0]
          const scientificName = plant.scientificName || plant.species || plant.name
          const commonName = typeof plant.commonName === 'string' 
            ? plant.commonName 
            : plant.commonName?.commonName || plant.commonName || plant.common_name
          return `${commonName || scientificName || 'Unknown species'} identified`
        }
        if (analysis?.primaryIdentification) {
          return `${analysis.primaryIdentification} identified with high confidence`
        }
        return "Plant species identification completed"
      case 'soil_analysis':
        if (analysis?.basicProperties?.ph) {
          return `pH ${analysis.basicProperties.ph}, ${analysis?.soilHealth?.category || 'analyzed'}`
        }
        if (analysis?.soilHealth?.overallScore) {
          return `Overall soil score: ${analysis.soilHealth.overallScore}%`
        }
        return "Soil composition and health analysis completed"
      case 'yield_calculation':
        if (analysis?.economicProjection?.roi) {
          return `ROI ${analysis.economicProjection.roi}%, yield projection completed`
        }
        if (analysis?.estimatedYield?.quantity) {
          return `Estimated yield: ${analysis.estimatedYield.quantity} ${analysis.estimatedYield.unit || 'kg'}`
        }
        return "Yield and economic projection completed"
      default:
        return "Analysis completed successfully"
    }
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-agri-50">
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-agri-600 rounded-lg flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Farm Intelligence</h1>
                  <p className="text-sm text-gray-600">AI-powered farming insights</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                All Systems Active
              </Badge>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: BarChart3, label: "Active Analyses", value: "12", color: "blue" },
              { icon: Clock, label: "Avg Processing", value: "28s", color: "green" },
              { icon: TrendingUp, label: "Yield Increase", value: "+23%", color: "yellow" },
              { icon: Database, label: "Records Stored", value: "1.2K", color: "purple" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs for Services/History */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="services" 
                className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-agri-700 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200 rounded-md py-3"
              >
                <Brain className="h-4 w-4" />
                <span className="font-medium">AI Tools</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-agri-700 data-[state=active]:shadow-sm text-gray-600 hover:text-gray-900 transition-all duration-200 rounded-md py-3"
              >
                <History className="h-4 w-4" />
                <span className="font-medium">History</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Services Tab */}
            <TabsContent value="services" className="space-y-6">
              {/* Section Header */}
              <div className="bg-agri-50 border border-agri-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-agri-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-agri-900">AI Analysis Tools</h3>
                    <p className="text-sm text-agri-700">Choose a tool to analyze your farm data</p>
                  </div>
                </div>
              </div>

              {/* Service Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plant Health */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200 hover:shadow-md hover:border-green-300 transition-all">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <HeartPulse className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">Plant Health Oracle</h4>
                        <p className="text-gray-600 text-sm">
                          Like a wise farmer reading the signs, detect plant diseases and get treatment recommendations
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white w-full"
                      onClick={() => setShowPlantHealth(true)}
                    >
                      <HeartPulse className="w-4 h-4 mr-2" />
                      Diagnose Plants
                    </Button>
                  </div>
                </div>

                {/* Plant ID */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200 hover:shadow-md hover:border-blue-300 transition-all">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Search className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">Species Sage</h4>
                        <p className="text-gray-600 text-sm">
                          Instantly recognize any plant species with cultivation tips for Kenya's diverse climate zones
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                      onClick={() => setShowPlantIdentify(true)}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Identify Species
                    </Button>
                  </div>
                </div>

                {/* Soil Analysis */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-yellow-200 hover:shadow-md hover:border-yellow-300 transition-all">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TestTube className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">Soil Whisperer</h4>
                        <p className="text-gray-600 text-sm">
                          Upload soil reports and receive AI-powered recommendations for Kenyan soils
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                      onClick={() => setShowSoilAnalysis(true)}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Analyze Soil
                    </Button>
                  </div>
                </div>

                {/* Yield Calculator */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-200 hover:shadow-md hover:border-purple-300 transition-all">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calculator className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">Harvest Prophet</h4>
                        <p className="text-gray-600 text-sm">
                          Predict yields with AI that considers weather patterns and market trends specific to Kenya
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                      onClick={() => setShowYieldCalculator(true)}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Yield
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analysis History Tab */}
            <TabsContent value="history" className="space-y-6">
              {/* Section Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <History className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Analysis History</h3>
                    <p className="text-sm text-blue-700">View your past analysis results and insights</p>
                  </div>
                </div>
              </div>

              <AnalysisHistoryView 
                preloadedData={analysisData}
                onLoadMore={() => loadAnalysisHistory(false)}
                onRefresh={() => loadAnalysisHistory(true)}
              />
            </TabsContent>
          </Tabs>
        </div>

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