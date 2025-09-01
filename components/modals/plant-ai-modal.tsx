"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  Leaf, 
  HeartPulse, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Camera,
  Zap,
  ShieldCheck,
  Target,
  Activity,
  TrendingUp,
  FileText,
  Recycle
} from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/components/ui/use-toast"
import { ProductionCycle } from "@/lib/types/production"

interface PlantAIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "identify" | "health"
}

export function PlantAIModal({ open, onOpenChange, mode }: PlantAIModalProps) {
  const [image, setImage] = useState<File | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loadingCycles, setLoadingCycles] = useState(false)
  const [similarImages, setSimilarImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

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
    setImage(null)
    setSelectedCycle("")
    setSimilarImages(false)
    setResult(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    setProgress(0)

    try {
      if (!image) {
        setError("Please upload a plant image.")
        setLoading(false)
        return
      }

      // Simulate progress for better UX - slow increment until API completes
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 85)) // Slower increment, stops at 85%
      }, 1500)

      const selectedCycleData = selectedCycle ? cycles.find(c => c.id === selectedCycle) : null
      
      let res
      if (mode === "identify") {
        res = await apiClient.identifyPlant({ 
          image, 
          similar_images: similarImages,
          cycle_id: selectedCycle || undefined,
          crop_variety: selectedCycleData?.cropVariety?.name || undefined
        })
      } else {
        res = await apiClient.assessPlantHealth({ 
          image, 
          similar_images: similarImages,
          cycle_id: selectedCycle || undefined,
          crop_variety: selectedCycleData?.cropVariety?.name || undefined
        })
      }
      
      console.log('🔍 API Response received:', res)
      console.log('🔍 Response type:', typeof res)
      console.log('🔍 Response keys:', res ? Object.keys(res) : 'null')
      
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
        // Show results only after progress animation completes
        setResult(res)
        toast({
          title: "Analysis Complete!",
          description: `Plant ${mode === 'identify' ? 'identification' : 'health assessment'} completed successfully.`
        })
      }, 800) // Complete animation within 800ms

    } catch (err: any) {
      setError(err.message || "Failed to get result.")
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
      if (!result) setProgress(0)
    }
  }

  // Helper functions to detect enhanced vs legacy format
  const isEnhancedResponse = (res: any) => {
    console.log('🔍 Checking response format:', res)
    console.log('🔍 res.data:', res?.data)
    console.log('🔍 res.data.healthStatus:', res?.data?.healthStatus)
    console.log('🔍 res.data.nutritionalDeficiencies:', res?.data?.nutritionalDeficiencies)
    
    // Check for enhanced Gemini format
    const hasEnhanced = res?.healthStatus || res?.plants || 
                       res?.data?.healthStatus || res?.data?.plants ||
                       res?.data?.nutritionalDeficiencies || res?.data?.environmentalStress
    console.log('🔍 Is Enhanced Response:', hasEnhanced)
    return hasEnhanced
  }

  const getEnhancedData = (res: any) => {
    return res?.data || res
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const title = mode === "identify" ? "Identify Plant" : "Assess Plant Health"
  const icon = mode === "identify" ? <Leaf className="w-5 h-5 text-green-600" /> : <HeartPulse className="w-5 h-5 text-red-600" />

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
            <Badge variant="outline" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Gemini Enhanced
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {mode === "identify" 
              ? "Upload a plant image for AI-powered species identification with Kenya-specific insights."
              : "Upload a plant image for comprehensive health analysis with disease detection and treatment recommendations."}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Image Upload - Required */}
            <div className="space-y-2">
              <Label htmlFor="plant-image" className="flex items-center">
                <Camera className="h-4 w-4 mr-1" />
                Plant Image *
                <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                <div className="space-y-2">
                  <Camera className="h-8 w-8 text-green-600 mx-auto" />
                  <Input
                    id="plant-image"
                    type="file"
                    accept="image/*"
                    required
                    ref={fileInputRef}
                    onChange={e => setImage(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="hidden"
                  />
                  <Label htmlFor="plant-image" className="cursor-pointer">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload plant image
                      </p>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, WebP up to 10MB
                      </p>
                    </div>
                  </Label>
                  {image && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 inline mr-1" />
                      {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
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
                  <p>Selected cycle will help provide more specific analysis for your crop type.</p>
                </div>
              )}
            </div>


            {/* Advanced Options */}
            <div className="flex items-center space-x-2">
              <input
                id="similar-images"
                type="checkbox"
                checked={similarImages}
                onChange={e => setSimilarImages(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="similar-images" className="text-sm">Include similar reference images</Label>
            </div>

            {/* Loading Progress */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing {mode === 'identify' ? 'identification' : 'health analysis'}...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  This may take 60-120 seconds. Please don't close this dialog.
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
              className={`w-full ${mode === 'identify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              disabled={loading || !image}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  {mode === 'identify' ? <Leaf className="w-4 h-4 mr-2" /> : <HeartPulse className="w-4 h-4 mr-2" />}
                  {title}
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Enhanced Results Display */
          <div className="space-y-6">
            {isEnhancedResponse(result) ? (
              /* Enhanced Gemini AI Results */
              <div className="space-y-6">
                {mode === "health" && (
                  /* Health Analysis Results */
                  <>
                    {/* Health Status Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Activity className="h-5 w-5 mr-2 text-blue-600" />
                            Plant Health Status
                          </span>
                          {getEnhancedData(result).healthStatus?.healthScore && (
                            <div className={`px-3 py-1 rounded-full text-lg font-bold ${getHealthScoreColor(getEnhancedData(result).healthStatus.healthScore)}`}>
                              {getEnhancedData(result).healthStatus.healthScore}%
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {getEnhancedData(result).healthStatus?.overall && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Overall Status:</span>
                              <Badge variant={getEnhancedData(result).healthStatus.overall === 'healthy' ? 'default' : 'destructive'}>
                                {getEnhancedData(result).healthStatus.overall}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Assessment Description */}
                    {getEnhancedData(result).healthStatus?.assessment && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-blue-600" />
                            Assessment Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{getEnhancedData(result).healthStatus.assessment}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Nutritional Deficiencies */}
                    {getEnhancedData(result).nutritionalDeficiencies && getEnhancedData(result).nutritionalDeficiencies.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                            Nutritional Deficiencies
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {getEnhancedData(result).nutritionalDeficiencies.map((deficiency: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-lg">{deficiency.nutrient}</h4>
                                  <Badge variant="destructive">
                                    {deficiency.severity} severity
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  {deficiency.symptoms && deficiency.symptoms.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Symptoms:</h5>
                                      <ul className="list-disc list-inside text-sm text-gray-600">
                                        {deficiency.symptoms.map((symptom: string, sidx: number) => (
                                          <li key={sidx}>{symptom}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {deficiency.causes && deficiency.causes.length > 0 && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-1">Causes:</h5>
                                      <ul className="list-disc list-inside text-sm text-gray-600">
                                        {deficiency.causes.slice(0, 2).map((cause: string, cidx: number) => (
                                          <li key={cidx}>{cause}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Environmental Stress */}
                    {getEnhancedData(result).environmentalStress && getEnhancedData(result).environmentalStress.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-yellow-600" />
                            Environmental Stress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {getEnhancedData(result).environmentalStress.map((stress: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-lg capitalize">{stress.type.replace('_', ' ')}</h4>
                                  <Badge variant="outline">
                                    {stress.severity} severity
                                  </Badge>
                                </div>
                                {stress.symptoms && stress.symptoms.length > 0 && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-1">Symptoms:</h5>
                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                      {stress.symptoms.map((symptom: string, sidx: number) => (
                                        <li key={sidx}>{symptom}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Disease Information (if any) */}
                    {getEnhancedData(result).diseases && getEnhancedData(result).diseases.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                            Detected Diseases
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {getEnhancedData(result).diseases.map((disease: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-lg">{disease.name || disease.commonName}</h4>
                                  <Badge variant="destructive">
                                    {disease.severity || 'Unknown severity'}
                                  </Badge>
                                </div>
                                {disease.description && (
                                  <p className="text-sm text-gray-600 mb-3">{disease.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Treatment Recommendations */}
                    {getEnhancedData(result).treatment && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
                            Treatment Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {getEnhancedData(result).treatment.immediate && getEnhancedData(result).treatment.immediate.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 text-red-700 flex items-center">
                                  <Target className="h-4 w-4 mr-1" />
                                  Immediate Actions
                                </h4>
                                <ul className="space-y-1">
                                  {getEnhancedData(result).treatment.immediate.map((action: string, idx: number) => (
                                    <li key={idx} className="text-sm flex items-start">
                                      <Zap className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )} 
                
                {mode === "identify" && (
                  /* Plant Identification Results */
                  <>
                    {getEnhancedData(result).plants && getEnhancedData(result).plants.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Leaf className="h-5 w-5 mr-2 text-green-600" />
                            Plant Identification Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {getEnhancedData(result).plants.slice(0, 3).map((plant: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      {plant.commonName || plant.name}
                                    </h4>
                                    {plant.scientificName && (
                                      <p className="text-sm italic text-gray-600">{plant.scientificName}</p>
                                    )}
                                  </div>
                                </div>
                                {plant.description && (
                                  <p className="text-sm text-gray-600 mb-3">{plant.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Legacy Plant.id Results + Fallback */
              <div className="space-y-4">
                {/* Legacy format display (existing code) */}
                {mode === "identify" && result.result?.classification?.suggestions?.length > 0 && (
                  <div className="p-3 rounded bg-muted text-sm max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {result.result.classification.suggestions.slice(0, 3).map((s: any, i: number) => (
                        <div key={s.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center space-x-3">
                            {s.details?.image?.value && (
                              <img src={s.details.image.value} alt={s.name} className="w-16 h-16 object-cover rounded border cursor-pointer" onClick={() => setZoomImage(s.details.image.value)} />
                            )}
                            <div>
                              <div className="font-semibold text-base text-foreground">{s.name}</div>
                              <div className="text-xs text-muted-foreground">Probability: {(s.probability * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mode === "health" && result.result?.disease?.suggestions?.length > 0 && (
                  <div className="p-3 rounded bg-muted text-sm max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {result.result.disease.suggestions.slice(0, 3).map((s: any, i: number) => (
                        <div key={s.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-semibold text-base text-foreground">{s.details?.local_name || s.name}</div>
                              <div className="text-xs text-muted-foreground">Probability: {(s.probability * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback display for unrecognized response format */}
                {!result.result?.classification?.suggestions && !result.result?.disease?.suggestions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
                        Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">Raw Analysis Data:</h4>
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border max-h-96 overflow-y-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>The analysis completed successfully but the response format is not yet supported by the UI. 
                          The raw data above contains all the analysis results from the AI.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button 
                onClick={() => setResult(null)} 
                variant="outline"
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Analyze Another Image
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className={`flex-1 ${mode === 'identify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save & Close
              </Button>
            </div>
          </div>
        )}
        
        {/* Image Zoom Dialog */}
        <Dialog open={!!zoomImage} onOpenChange={o => { if (!o) setZoomImage(null) }}>
          <DialogContent className="max-w-lg w-full flex flex-col items-center justify-center bg-black/95">
            {zoomImage && (
              <img src={zoomImage} alt="Zoomed" className="max-h-[80vh] max-w-full rounded shadow-lg" />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}