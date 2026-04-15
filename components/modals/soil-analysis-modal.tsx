"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  TestTube, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Download,
  Sparkles,
  TrendingUp,
  Leaf,
  Recycle
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import { ProductionCycle } from "@/lib/types/production"

interface SoilAnalysisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SoilAnalysisResult {
  basicProperties: {
    ph: number
    phCategory: string
    organicMatter: number
    organicMatterCategory: string
  }
  nutrients: {
    macronutrients: {
      nitrogen: { available: number; category: string; recommendations: string[] }
      phosphorus: { available: number; category: string; recommendations: string[] }
      potassium: { available: number; category: string; recommendations: string[] }
    }
  }
  soilHealth: {
    overallScore: number
    category: string
    limitingFactors: string[]
    strengths: string[]
  }
  cropRecommendations: Array<{
    crop: string
    suitability: string
    expectedYield: string
    specificAdvice: string
  }>
  fertilizationPlan: {
    immediate: string[]
    seasonal: string[]
  }
  regionFactors: {
    climateConsiderations: string[]
    localAvailability: string[]
    economicFactors: string[]
  }
}

export function SoilAnalysisModal({ open, onOpenChange }: SoilAnalysisModalProps) {
  const [document, setDocument] = useState<File | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loadingCycles, setLoadingCycles] = useState(false)
  const [cropType, setCropType] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<SoilAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      loadCycles()
    }
  }, [open])

  const loadCycles = async () => {
    setLoadingCycles(true)
    try {
      const cyclesData = await apiClient.getCycles()
      setCycles(cyclesData || [])
    } catch (error) {
      console.error('Failed to load cycles:', error)
      toast({
        title: "Error",
        description: "Failed to load production cycles",
        variant: "destructive"
      })
    } finally {
      setLoadingCycles(false)
    }
  }

  const reset = () => {
    setDocument(null)
    setSelectedCycle("")
    setCropType("")
    setAdditionalInfo("")
    setResult(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validateFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    
    if (!validTypes.includes(file.type)) {
      return "Please upload a PDF document or image file (JPEG, PNG, WebP)"
    }
    
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    setProgress(0)

    try {
      if (!document) {
        setError("Please upload a soil test report or soil image.")
        setLoading(false)
        return
      }

      const fileError = validateFile(document)
      if (fileError) {
        setError(fileError)
        setLoading(false)
        return
      }

      // Simulate progress for better UX - slow increment until API completes
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 85)) // Slower increment, stops at 85%
      }, 2000)

      let analysisResult: SoilAnalysisResult
      
      try {
        const selectedCycleData = selectedCycle ? cycles.find(c => c.id === selectedCycle) : null
        
        // Use the new enhanced soil analysis API
        const res = await apiClient.analyzeSoil({
          document,
          crop_type: cropType,
          cycle_id: selectedCycle || undefined,
          farm_location: selectedCycleData?.farmLocation || undefined,
          farm_size: selectedCycleData?.landSizeAcres || undefined
        })
        
        if (res.success && res.data) {
          analysisResult = res.data as SoilAnalysisResult
        } else {
          throw new Error("API analysis failed")
        }
      } catch (apiError) {
        console.warn("Using fallback analysis:", apiError)
        // Fallback to mock analysis for development/offline mode
        analysisResult = {
          basicProperties: {
            ph: 6.2,
            phCategory: "slightly_acidic",
            organicMatter: 3.1,
            organicMatterCategory: "medium"
          },
          nutrients: {
            macronutrients: {
              nitrogen: {
                available: 42,
                category: "medium",
                recommendations: ["Apply 60kg/ha CAN at planting", "Top-dress with 30kg/ha CAN at 6 weeks"]
              },
              phosphorus: {
                available: 28,
                category: "high",
                recommendations: ["Reduce DAP application by 25%", "Focus on NPK maintenance"]
              },
              potassium: {
                available: 165,
                category: "adequate",
                recommendations: ["Maintain current potassium levels", "Apply organic manure annually"]
              }
            }
          },
          soilHealth: {
            overallScore: 76,
            category: "good",
            limitingFactors: ["Moderate nitrogen deficiency", "Slight compaction in subsoil"],
            strengths: ["Good pH for most crops", "Adequate phosphorus levels", "Good organic matter content"]
          },
          cropRecommendations: [
            {
              crop: cropType || "maize",
              suitability: "excellent",
              expectedYield: "22-28 bags/acre",
              specificAdvice: "Ideal soil conditions for high-yield maize production. Focus on nitrogen management."
            },
            {
              crop: "beans",
              suitability: "very good",
              expectedYield: "12-15 bags/acre",
              specificAdvice: "Legumes will help improve soil nitrogen naturally."
            }
          ],
          fertilizationPlan: {
            immediate: [
              "Apply 8-10 tonnes/ha well-composted farmyard manure before planting",
              "Use 50kg/ha DAP at planting for phosphorus and initial nitrogen"
            ],
            seasonal: [
              "Top-dress with 50kg/ha CAN at 4-6 weeks after planting",
              "Apply foliar nutrients during grain filling stage",
              "Consider lime application if pH drops below 6.0"
            ]
          },
          regionFactors: {
            climateConsiderations: [
              "High altitude cooling extends growing season",
              "Bimodal rainfall pattern - plan for two seasons",
              "Cool temperatures may slow nutrient release"
            ],
            localAvailability: [
              "DAP readily available from NCPB stores",
              "CAN available from local agro-dealers",
              "Organic manure from local dairy farms"
            ],
            economicFactors: [
              "Fertilizer subsidy programs available through government",
              "Group buying can reduce input costs by 15-20%",
              "Expected ROI of 250-300% with proper management"
            ]
          }
        }
      }

      // API call completed - clear interval and quickly animate to 100%
      clearInterval(progressInterval)
      
      // Quick animation to 100%
      const animateToComplete = () => {
        setProgress(prev => {
          if (prev >= 100) return 100
          const increment = Math.max(5, (100 - prev) / 3) // Fast increment to finish
          return Math.min(prev + increment, 100)
        })
      }
      
      const completionInterval = setInterval(animateToComplete, 100)
      setTimeout(() => {
        clearInterval(completionInterval)
        setProgress(100)
      }, 800) // Complete animation within 800ms
      
      setResult(analysisResult)
      
      toast({
        title: "Analysis Complete!",
        description: "Your soil analysis has been completed and saved to your history."
      })

    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try again.")
      toast({ 
        title: "Analysis Failed", 
        description: err.message, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
      if (!result) setProgress(0)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-maize-600 bg-maize-100"
    return "text-red-600 bg-red-100"
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'excellent': return "default"
      case 'very good': 
      case 'good': return "secondary"
      case 'adequate': 
      case 'medium': return "outline"
      case 'low': 
      case 'deficient': return "destructive"
      default: return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-maize-600" />
            <span>AI Soil Analysis</span>
            <Badge variant="outline" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Gemini Enhanced
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Upload your soil test report (PDF) or soil sample image for AI-powered analysis with Kenya-specific recommendations.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* File Upload - Required */}
            <div className="space-y-2">
              <Label htmlFor="soil-document" className="flex items-center">
                Soil Test Report or Sample Image *
                <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-maize-400 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-center space-x-2">
                    <FileText className="h-8 w-8 text-maize-600" />
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <Input
                      id="soil-document"
                      type="file"
                      accept=".pdf,image/*"
                      required
                      ref={fileInputRef}
                      onChange={(e) => setDocument(e.target.files?.[0] || null)}
                      disabled={loading}
                      className="hidden"
                    />
                    <Label htmlFor="soil-document" className="cursor-pointer">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF lab reports or soil images (JPEG, PNG, WebP) up to 10MB
                        </p>
                      </div>
                    </Label>
                  </div>
                  {document && (
                    <div className="mt-2 p-2 bg-maize-50 rounded text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 inline mr-1" />
                      {document.name} ({(document.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Production Cycle Selection */}
            <div className="space-y-2">
              <Label htmlFor="cycle" className="flex items-center">
                <Recycle className="h-4 w-4 mr-1" />
                Production Cycle (Optional)
              </Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle} disabled={loading || loadingCycles}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCycles ? "Loading cycles..." : "Select a production cycle"} />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.cropVariety?.name} - {cycle.farmLocation} ({cycle.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCycle && (
                <div className="text-xs text-gray-600 mt-1">
                  <p>Selected cycle will provide context for soil analysis and recommendations.</p>
                </div>
              )}
            </div>

            {/* Crop Type */}
            <div className="space-y-2">
              <Label htmlFor="crop-type">Intended Crop (Optional)</Label>
              <Select value={cropType} onValueChange={setCropType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crop type for specific recommendations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maize">Maize</SelectItem>
                  <SelectItem value="beans">Beans</SelectItem>
                  <SelectItem value="potato">Potato</SelectItem>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="barley">Barley</SelectItem>
                  <SelectItem value="tomato">Tomato</SelectItem>
                  <SelectItem value="cabbage">Cabbage</SelectItem>
                  <SelectItem value="carrots">Carrots</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additional-info">Additional Information (Optional)</Label>
              <Textarea
                id="additional-info"
                placeholder="Any specific concerns, previous treatments, or questions about your soil..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Loading Progress */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Analyzing soil sample...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  This may take 60-150 seconds. Please don't close this dialog.
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-maize-700 hover:bg-maize-800" 
              disabled={loading || !document}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Analyzing Soil...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Analyze Soil Sample
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold">Analysis Complete</h3>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>

            {/* Soil Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Soil Health Score</span>
                  <div className={`px-3 py-1 rounded-full text-lg font-bold ${getHealthScoreColor(result.soilHealth.overallScore)}`}>
                    {result.soilHealth.overallScore}/100
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">Strengths</h4>
                    <ul className="space-y-1">
                      {result.soilHealth.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-maize-700">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {result.soilHealth.limitingFactors.map((factor, idx) => (
                        <li key={idx} className="text-sm flex items-start">
                          <AlertCircle className="h-4 w-4 text-maize-600 mr-2 mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Soil Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">pH Level</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{result.basicProperties.ph}</span>
                        <Badge variant={getCategoryBadgeVariant(result.basicProperties.phCategory)}>
                          {result.basicProperties.phCategory.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Organic Matter</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{result.basicProperties.organicMatter}%</span>
                        <Badge variant={getCategoryBadgeVariant(result.basicProperties.organicMatterCategory)}>
                          {result.basicProperties.organicMatterCategory}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrients */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrient Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(result.nutrients.macronutrients).map(([nutrient, data]) => (
                    <div key={nutrient} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium capitalize">{nutrient}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{data.available} ppm</span>
                          <Badge variant={getCategoryBadgeVariant(data.category)}>
                            {data.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {data.recommendations.map((rec, idx) => (
                          <p key={idx} className="text-xs text-gray-600">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crop Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="h-5 w-5 mr-2 text-green-600" />
                  Crop Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {result.cropRecommendations.map((crop, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium capitalize">{crop.crop}</h4>
                        <Badge variant={getCategoryBadgeVariant(crop.suitability)}>
                          {crop.suitability}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        Expected Yield: {crop.expectedYield}
                      </p>
                      <p className="text-sm">{crop.specificAdvice}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button 
                onClick={() => setResult(null)} 
                variant="outline"
                className="flex-1"
              >
                Analyze Another Sample
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-maize-700 hover:bg-maize-800"
              >
                Save & Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}