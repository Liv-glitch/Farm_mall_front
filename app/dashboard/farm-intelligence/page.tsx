"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { PlantAIModal } from "@/components/modals/plant-ai-modal"
import { 
  Leaf, 
  HeartPulse, 
  Search, 
  TestTube, 
  Brain,
  Camera,
  Upload,
  FileText,
  BarChart3
} from "lucide-react"

export default function FarmIntelligencePage() {
  const [showPlantIdentify, setShowPlantIdentify] = useState(false)
  const [showPlantHealth, setShowPlantHealth] = useState(false)
  const [showSoilAnalysis, setShowSoilAnalysis] = useState(false)

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-agri-100 rounded-lg">
                <Brain className="h-6 w-6 text-agri-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Farm Intelligence</h1>
                <p className="text-gray-600">AI-powered tools for smarter farming decisions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              {/* Services Overview */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your AI Tool</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Select the service you need. Each tool uses advanced AI to help you make better farming decisions.
                </p>
              </div>

              {/* Service Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Plant Health Card */}
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    showPlantHealth ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                  }`}
                  onClick={() => setShowPlantHealth(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HeartPulse className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Plant Health Analysis</h3>
                    <p className="text-gray-600 mb-4">
                      Detect diseases, pests, and health issues in your crops using AI
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Disease Detection</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Treatment Plans</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Prevention Tips</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </CardContent>
                </Card>

                {/* Plant ID Card */}
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    showPlantIdentify ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => setShowPlantIdentify(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Plant Identification</h3>
                    <p className="text-gray-600 mb-4">
                      Identify unknown plants, weeds, and crop varieties instantly
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Weed Identification</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Crop Verification</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Management Tips</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Identify Plant
                    </Button>
                  </CardContent>
                </Card>

                {/* Soil Analysis Card */}
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    showSoilAnalysis ? 'border-amber-700 bg-amber-50' : 'border-gray-200 hover:border-amber-600'
                  }`}
                  onClick={() => setShowSoilAnalysis(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TestTube className="h-8 w-8 text-amber-700" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Soil Analysis</h3>
                    <p className="text-gray-600 mb-4">
                      Analyze soil samples for nutrients, pH, and optimal crop recommendations
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-amber-700 rounded-full"></span>
                        <span>NPK Testing</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-amber-700 rounded-full"></span>
                        <span>pH Analysis</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-amber-700 rounded-full"></span>
                        <span>Fertilizer Recommendations</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-amber-700 hover:bg-amber-800 text-white">
                      <TestTube className="h-4 w-4 mr-2" />
                      Analyze Soil
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* How It Works Section */}
              <Card className="bg-gradient-to-r from-agri-50 to-maize-50 border-agri-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-agri-700" />
                    <span>How Our AI Tools Work</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-agri-700">1</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Upload Your Sample</h4>
                      <p className="text-sm text-gray-600">Take a photo or upload an image of what you want to analyze</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-agri-700">2</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
                      <p className="text-sm text-gray-600">Our advanced AI processes your sample and provides detailed insights</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-agri-700">3</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Get Results</h4>
                      <p className="text-sm text-gray-600">Receive comprehensive reports with actionable recommendations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>
        </main>

        {/* Modals */}
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
        {/* TODO: Add Soil Analysis Modal when implemented */}
      </div>
    </DashboardLayout>
  )
} 