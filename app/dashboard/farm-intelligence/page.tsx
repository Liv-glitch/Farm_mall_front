"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
  CheckCircle,
  Zap,
  Shield,
  Target,
  Droplets,
  Sun,
  Wind
} from "lucide-react"

export default function FarmIntelligencePage() {
  const [activeTab, setActiveTab] = useState("services")
  const [showPlantIdentify, setShowPlantIdentify] = useState(false)
  const [showPlantHealth, setShowPlantHealth] = useState(false)
  const [showSoilAnalysis, setShowSoilAnalysis] = useState(false)
  const [showYieldCalculator, setShowYieldCalculator] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
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
    setIsVisible(true)
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
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-agri-50 to-tea-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-agri-200/20 rounded-full animate-pulse"></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 bg-tea-200/20 rounded-full animate-bounce"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 left-1/4 w-40 h-40 bg-sage-200/20 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-20 right-1/3 w-28 h-28 bg-maize-200/20 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        {/* Enhanced Header */}
        <header className="relative bg-gradient-to-r from-agri-800 via-agri-700 to-sage-700 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-agri-800/90 to-sage-700/90 backdrop-blur-sm"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-tea-400 to-maize-500 rounded-2xl flex items-center justify-center transform rotate-12 shadow-lg">
                    <Leaf className="w-8 h-8 text-white transform -rotate-12" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-agri-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Farm Intelligence Hub</h1>
                  <p className="text-agri-100 font-medium">Where nature meets technology</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="bg-agri-500/20 text-agri-100 border-agri-400/30 backdrop-blur-sm">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All Systems Thriving
                </Badge>
                <Button className="bg-gradient-to-r from-tea-500 to-maize-500 hover:from-tea-600 hover:to-maize-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Analysis
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section with organic shape */}
          <div
            className={`relative mb-16 transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-agri-600 via-sage-600 to-tea-600"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-agri-900/20 via-transparent to-tea-900/20"></div>
              <div className="relative p-12 flex items-center min-h-[320px]">
                <div className="max-w-3xl">
                  <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                    Cultivate Intelligence,
                    <span className="text-tea-300"> Harvest Success</span>
                  </h2>
                  <p className="text-xl text-agri-100 mb-8 leading-relaxed">
                    Harness the power of AI to understand your land like never before. From soil whispers to plant songs, we translate nature's language into actionable insights.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      className="bg-white text-agri-800 hover:bg-agri-50 shadow-lg transform hover:scale-105 transition-all duration-300"
                      onClick={() => setActiveTab("services")}
                    >
                      <Leaf className="w-5 h-5 mr-2" />
                      Begin Journey
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white/10 bg-transparent backdrop-blur-sm"
                      onClick={() => setActiveTab("history")}
                    >
                      <Database className="w-5 h-5 mr-2" />
                      Explore History
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organic Stats Cards */}
          <div
            className={`grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 transform transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            {[
              {
                icon: BarChart3,
                label: "Active Analyses",
                value: "12",
                color: "agri",
                bgPattern: "from-agri-400 to-sage-500",
              },
              { icon: Clock, label: "Avg Processing", value: "28s", color: "tea", bgPattern: "from-tea-400 to-maize-500" },
              {
                icon: TrendingUp,
                label: "Yield Increase",
                value: "+23%",
                color: "maize",
                bgPattern: "from-maize-400 to-tea-500",
              },
              {
                icon: Database,
                label: "Records Stored",
                value: "1.2K",
                color: "sage",
                bgPattern: "from-sage-400 to-agri-500",
              },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="group relative transform hover:scale-105 transition-all duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hexagonal background */}
                <div className="absolute inset-0 transform rotate-6 group-hover:rotate-12 transition-transform duration-500">
                  <div className={`w-full h-full bg-gradient-to-br ${stat.bgPattern} rounded-3xl opacity-10`}></div>
                </div>

                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${stat.bgPattern} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                  <div
                    className={`h-1 bg-gradient-to-r ${stat.bgPattern} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs for Services/History */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg h-14 rounded-2xl border border-white/20">
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 flex items-center space-x-2 rounded-2xl"
              >
                <Brain className="h-4 w-4" />
                <span>Nature's AI Toolkit</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-agri-100 data-[state=active]:text-agri-800 flex items-center space-x-2 rounded-2xl"
              >
                <History className="h-4 w-4" />
                <span>Analysis History</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Services Tab */}
            <TabsContent value="services" className="space-y-8">
              {/* Nature-inspired Service Cards */}
              <div
                className={`mb-16 transform transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                <div className="text-center mb-12">
                  <h3 className="text-4xl font-bold bg-gradient-to-r from-agri-800 to-sage-700 bg-clip-text text-transparent mb-4">
                    Nature's AI Toolkit
                  </h3>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    Each tool is crafted to work in harmony with Kenya's unique ecosystem and farming traditions
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Plant Health - Organic Shape */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-agri-400/20 to-sage-500/20 transform rotate-3 group-hover:rotate-6 transition-transform duration-700 rounded-[2rem]"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-[2rem] p-8 shadow-2xl border border-agri-100 transform group-hover:-translate-y-2 transition-all duration-500">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-agri-500 to-sage-600 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <HeartPulse className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-agri-400 rounded-full flex items-center justify-center">
                            <Droplets className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-800 mb-3">Plant Health Oracle</h4>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Like a wise farmer reading the signs, our AI detects plant diseases and suggests treatments rooted in Kenyan agricultural wisdom.
                          </p>
                          <div className="space-y-3 mb-6">
                            {["Disease Detection", "Treatment Plans", "Progress Tracking"].map((feature, i) => (
                              <div key={feature} className="flex items-center text-sm text-gray-700">
                                <div
                                  className="w-2 h-2 bg-agri-500 rounded-full mr-3 animate-pulse"
                                  style={{ animationDelay: `${i * 200}ms` }}
                                ></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                          <Button 
                            className="bg-gradient-to-r from-agri-500 to-sage-600 hover:from-agri-600 hover:to-sage-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                            onClick={() => {
                              console.log('🔍 Plant Health card clicked')
                              setShowPlantHealth(true)
                              console.log('🔍 showPlantHealth set to:', true)
                            }}
                          >
                            Diagnose Plants
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plant ID - Eye Shape */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-tea-400/20 to-maize-500/20 transform -rotate-3 group-hover:-rotate-6 transition-transform duration-700 rounded-[2rem]"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-[2rem] p-8 shadow-2xl border border-tea-100 transform group-hover:-translate-y-2 transition-all duration-500">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-tea-500 to-maize-600 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                            <Search className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-tea-400 rounded-full flex items-center justify-center">
                            <Sun className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-800 mb-3">Plant Identifier</h4>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Instantly recognize any plant species with cultivation tips tailored for Kenya's diverse climate zones and growing conditions.
                          </p>
                          <div className="space-y-3 mb-6">
                            {["Species Recognition", "Local Varieties", "Growing Guidelines"].map((feature, i) => (
                              <div key={feature} className="flex items-center text-sm text-gray-700">
                                <div
                                  className="w-2 h-2 bg-tea-500 rounded-full mr-3 animate-pulse"
                                  style={{ animationDelay: `${i * 200}ms` }}
                                ></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                          <Button 
                            className="bg-gradient-to-r from-tea-500 to-maize-600 hover:from-tea-600 hover:to-maize-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                            onClick={() => {
                              console.log('🔍 Plant ID card clicked')
                              setShowPlantIdentify(true)
                              console.log('🔍 showPlantIdentify set to:', true)
                            }}
                          >
                            Identify Species
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Soil Analysis - Organic Blob */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-maize-400/20 to-tea-500/20 transform rotate-2 group-hover:rotate-5 transition-transform duration-700 rounded-[2rem]"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-[2rem] p-8 shadow-2xl border border-maize-100 transform group-hover:-translate-y-2 transition-all duration-500">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-maize-500 to-tea-600 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <TestTube className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-maize-400 rounded-full flex items-center justify-center">
                            <Wind className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-800 mb-3">Soil Whisperer</h4>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Upload your soil reports and receive AI-powered recommendations that understand the unique characteristics of Kenyan soils.
                          </p>
                          <div className="space-y-3 mb-6">
                            {["PDF Report Analysis", "Fertilizer Plans", "Crop Suitability"].map((feature, i) => (
                              <div key={feature} className="flex items-center text-sm text-gray-700">
                                <div
                                  className="w-2 h-2 bg-maize-500 rounded-full mr-3 animate-pulse"
                                  style={{ animationDelay: `${i * 200}ms` }}
                                ></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                          <Button 
                            className="bg-gradient-to-r from-maize-500 to-tea-600 hover:from-maize-600 hover:to-tea-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                            onClick={() => setShowSoilAnalysis(true)}
                          >
                            Analyze Soil
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yield Calculator - Spiral Shape */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-sage-400/20 to-agri-500/20 transform -rotate-2 group-hover:-rotate-5 transition-transform duration-700 rounded-[2rem]"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-[2rem] p-8 shadow-2xl border border-sage-100 transform group-hover:-translate-y-2 transition-all duration-500">
                      <div className="flex items-start space-x-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-sage-500 to-agri-600 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                            <Calculator className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-sage-400 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-800 mb-3">Harvest Prophet</h4>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Predict your yields with advanced AI that considers weather patterns, soil conditions, and market trends specific to Kenya.
                          </p>
                          <div className="space-y-3 mb-6">
                            {["AI-Driven Analysis", "Risk Assessment", "Profit Projections"].map((feature, i) => (
                              <div key={feature} className="flex items-center text-sm text-gray-700">
                                <div
                                  className="w-2 h-2 bg-sage-500 rounded-full mr-3 animate-pulse"
                                  style={{ animationDelay: `${i * 200}ms` }}
                                ></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                          <Button 
                            className="bg-gradient-to-r from-sage-500 to-agri-600 hover:from-sage-600 hover:to-agri-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                            onClick={() => setShowYieldCalculator(true)}
                          >
                            Predict Yield
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced AI Capabilities - Honeycomb Pattern */}
              <div
                className={`mb-16 transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                <div className="text-center mb-12">
                  <h3 className="text-4xl font-bold bg-gradient-to-r from-agri-800 to-sage-700 bg-clip-text text-transparent mb-4">
                    The Ecosystem Advantage
                  </h3>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Powered by Gemini AI with continuous learning from Plant-Id for unmatched reliability
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Target,
                      title: "Kenya-Rooted Wisdom",
                      description:
                        "Every recommendation is filtered through deep understanding of Kenyan climate, soil, and traditional farming knowledge.",
                      gradient: "from-agri-500 to-sage-600",
                      bgGradient: "from-agri-50 to-sage-50",
                    },
                    {
                      icon: Shield,
                      title: "Living Memory",
                      description:
                        "Your farm's story grows richer with every analysis, creating a personalized knowledge base that evolves with your land.",
                      gradient: "from-tea-500 to-maize-600",
                      bgGradient: "from-tea-50 to-maize-50",
                    },
                    {
                      icon: Brain,
                      title: "Holistic Intelligence",
                      description:
                        "From seed to harvest, our AI connects every aspect of farming into one unified intelligence system.",
                      gradient: "from-sage-500 to-agri-600",
                      bgGradient: "from-sage-50 to-agri-50",
                    },
                  ].map((capability) => (
                    <div
                      key={capability.title}
                      className="group relative transform hover:scale-105 transition-all duration-500"
                    >
                      {/* Hexagonal background */}
                      <div className="absolute inset-0 transform rotate-6 group-hover:rotate-12 transition-transform duration-500">
                        <div
                          className={`w-full h-full bg-gradient-to-br ${capability.bgGradient} rounded-3xl opacity-50`}
                        ></div>
                      </div>

                      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 text-center">
                        <div
                          className={`w-24 h-24 bg-gradient-to-br ${capability.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
                        >
                          <capability.icon className="w-12 h-12 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-800 mb-4">{capability.title}</h4>
                        <p className="text-gray-600 leading-relaxed">{capability.description}</p>
                        <div
                          className={`mt-6 h-1 bg-gradient-to-r ${capability.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Dashboard - Organic Flow */}
              <div
                className={`transform transition-all duration-1000 delay-900 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              >
                <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-[3rem] p-10 shadow-2xl border border-gray-100">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-agri-200/30 to-sage-300/30 rounded-full transform -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-tea-200/30 to-maize-300/30 rounded-full transform translate-x-20 translate-y-20"></div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-3xl font-bold text-gray-800 mb-2">System Vitals</h4>
                        <p className="text-gray-600 text-lg">All analyses flow seamlessly into your growing knowledge base</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-agri-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold text-agri-600">Ecosystem Thriving</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { label: "Plant Analysis", time: "~25 seconds", progress: 85, color: "agri" },
                        { label: "Soil Analysis", time: "~30 seconds", progress: 75, color: "tea" },
                        { label: "Yield Calculator", time: "~40 seconds", progress: 65, color: "sage" },
                      ].map((metric) => (
                        <div key={metric.label} className="group">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-semibold text-gray-700">{metric.label}</span>
                            <span className="text-gray-600 font-medium">{metric.time}</span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={metric.progress}
                              className="h-3 bg-gray-200 group-hover:bg-gray-300 transition-colors duration-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analysis History Tab */}
            <TabsContent value="history" className="space-y-6">
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