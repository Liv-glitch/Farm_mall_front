"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Calendar, 
  MapPin, 
  TrendingUp,
  Leaf,
  HeartPulse,
  TestTube,
  Calculator,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Target,
  Zap,
  Download,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  Grid3X3
} from "lucide-react"

interface AnalysisRecord {
  id: string
  type: "plant_identification" | "plant_health" | "soil_analysis" | "yield_calculation"
  title: string
  description: string
  confidence?: number
  status: "processing" | "completed" | "failed"
  isHealthy?: boolean
  createdAt: string
  result: any
  media?: {
    id: string
    originalUrl: string
    variants?: {
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
    }
  }
  location?: string
  cropType?: string
}

interface AnalysisDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AnalysisRecord | null
}

export function AnalysisDetailModal({ open, onOpenChange, record }: AnalysisDetailModalProps) {
  if (!record) return null

  // Extract all available images and documents from the record
  const getAllImages = () => {
    const images: Array<{url: string, type: 'uploaded' | 'similar', label: string, description?: string, fileType?: string}> = []
    
    // Determine file type from URL
    const getFileType = (url: string) => {
      const extension = url.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image'
      if (['pdf'].includes(extension || '')) return 'pdf'
      if (['doc', 'docx'].includes(extension || '')) return 'document'
      return 'image' // default to image
    }
    
    // Add uploaded image/document
    if (record.media?.originalUrl) {
      const fileType = getFileType(record.media.originalUrl)
      images.push({
        url: record.media.originalUrl,
        type: 'uploaded',
        label: fileType === 'pdf' ? 'Uploaded PDF Document' : 
               fileType === 'document' ? 'Uploaded Document' : 'Uploaded Image',
        description: fileType === 'pdf' ? 'Original PDF document uploaded for soil analysis' :
                    fileType === 'document' ? 'Original document uploaded for analysis' :
                    'Original image uploaded for analysis',
        fileType
      })
    }
    
    // Add alternative image variants if available
    if (record.media?.variants) {
      Object.entries(record.media.variants).forEach(([size, url]) => {
        if (url && url !== record.media?.originalUrl) {
          images.push({
            url: url as string,
            type: 'uploaded',
            label: `${size.charAt(0).toUpperCase() + size.slice(1)} Version`,
            description: `${size} resolution variant`,
            fileType: 'image'
          })
        }
      })
    }
    
    // Add similar images from Gemini response
    if (record.result?.similarImages && Array.isArray(record.result.similarImages)) {
      record.result.similarImages.forEach((img: any, idx: number) => {
        images.push({
          url: img.url || img,
          type: 'similar',
          label: `Similar Image ${idx + 1}`,
          description: img.description || img.similarity || 'Similar image found by AI',
          fileType: 'image'
        })
      })
    }
    
    // Check for similar images in other possible locations
    if (record.result?.images && Array.isArray(record.result.images)) {
      record.result.images.forEach((img: any, idx: number) => {
        images.push({
          url: img.url || img,
          type: 'similar',
          label: `Reference Image ${idx + 1}`,
          description: img.description || 'Reference image from analysis',
          fileType: 'image'
        })
      })
    }
    
    // Check for example images or visual references in the analysis results
    if (record.result?.examples && Array.isArray(record.result.examples)) {
      record.result.examples.forEach((example: any, idx: number) => {
        if (example.image || example.url) {
          images.push({
            url: example.image || example.url,
            type: 'similar',
            label: `Example ${idx + 1}`,
            description: example.description || example.caption || 'Visual example from analysis',
            fileType: 'image'
          })
        }
      })
    }
    
    // Remove duplicates based on URL
    const uniqueImages = images.filter((img, index, self) => 
      index === self.findIndex(i => i.url === img.url)
    )
    
    return uniqueImages
  }

  const allImages = getAllImages()

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'plant_identification': return <Leaf className="h-6 w-6 text-green-600" />
      case 'plant_health': return <HeartPulse className="h-6 w-6 text-red-600" />
      case 'soil_analysis': return <TestTube className="h-6 w-6 text-amber-600" />
      case 'yield_calculation': return <Calculator className="h-6 w-6 text-blue-600" />
      default: return <FileText className="h-6 w-6 text-gray-600" />
    }
  }

  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'plant_identification': return 'Plant Identification'
      case 'plant_health': return 'Plant Health Analysis'
      case 'soil_analysis': return 'Soil Analysis'
      case 'yield_calculation': return 'Yield Calculation'
      default: return 'Analysis'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderPlantHealthResults = () => {
    const data = record.result

    return (
      <div className="space-y-6">
        {/* Health Status Overview */}
        {data.healthStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Plant Health Status
                </span>
                {data.healthStatus.healthScore && (
                  <div className={`px-4 py-2 rounded-full text-xl font-bold ${getHealthScoreColor(data.healthStatus.healthScore)}`}>
                    {data.healthStatus.healthScore}%
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {data.healthStatus.overall && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Overall Status:</span>
                        <Badge variant={data.healthStatus.overall === 'healthy' ? 'default' : 'destructive'} className="capitalize">
                          {data.healthStatus.overall}
                        </Badge>
                      </div>
                    )}
                    {data.healthStatus.urgency && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Urgency:</span>
                        <Badge variant={data.healthStatus.urgency === 'none' ? 'outline' : 'destructive'} className="capitalize">
                          {data.healthStatus.urgency}
                        </Badge>
                      </div>
                    )}
                    {data.healthStatus.confidence && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className="font-medium">{(data.healthStatus.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                  {data.healthStatus.isHealthy !== undefined && (
                    <div className="flex items-center justify-center">
                      <div className={`p-4 rounded-lg ${data.healthStatus.isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
                        {data.healthStatus.isHealthy ? (
                          <CheckCircle2 className="h-12 w-12 text-green-600" />
                        ) : (
                          <AlertCircle className="h-12 w-12 text-red-600" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {data.healthStatus.assessment && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Detailed Assessment:</h5>
                    <p className="text-sm text-gray-700 leading-relaxed">{data.healthStatus.assessment}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Notes */}
        {data.analysisNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Analysis Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">{data.analysisNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Diseases */}
        {data.diseases && data.diseases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Diseases Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.diseases.map((disease: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-red-500 pl-4 bg-red-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-red-800">{disease.name}</h4>
                      <Badge variant="destructive">
                        {disease.severity || 'Detected'}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {disease.symptoms && disease.symptoms.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1 text-red-700">Symptoms:</h5>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {disease.symptoms.map((symptom: string, sidx: number) => (
                              <li key={sidx}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {disease.treatment && disease.treatment.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1 text-red-700">Treatment:</h5>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {disease.treatment.map((treatment: string, tidx: number) => (
                              <li key={tidx}>{treatment}</li>
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

        {/* Pests */}
        {data.pests && data.pests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-amber-600" />
                Pests Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.pests.map((pest: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-amber-500 pl-4 bg-amber-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-amber-800">{pest.name}</h4>
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        {pest.severity || 'Detected'}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {pest.symptoms && pest.symptoms.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1 text-amber-700">Symptoms:</h5>
                          <ul className="list-disc list-inside text-sm text-amber-600">
                            {pest.symptoms.map((symptom: string, sidx: number) => (
                              <li key={sidx}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {pest.treatment && pest.treatment.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1 text-amber-700">Treatment:</h5>
                          <ul className="list-disc list-inside text-sm text-amber-600">
                            {pest.treatment.map((treatment: string, tidx: number) => (
                              <li key={tidx}>{treatment}</li>
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

        {/* Nutritional Deficiencies */}
        {data.nutritionalDeficiencies && data.nutritionalDeficiencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Nutritional Deficiencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.nutritionalDeficiencies.map((deficiency: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-4 bg-orange-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-orange-800">{deficiency.nutrient}</h4>
                      <Badge variant="outline" className="border-orange-500 text-orange-700">
                        {deficiency.severity} severity
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {deficiency.symptoms && deficiency.symptoms.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1 text-orange-700">Symptoms:</h5>
                          <ul className="list-disc list-inside text-sm text-orange-600">
                            {deficiency.symptoms.map((symptom: string, sidx: number) => (
                              <li key={sidx}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {deficiency.causes && deficiency.causes.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-1 text-orange-700">Causes:</h5>
                          <ul className="list-disc list-inside text-sm text-orange-600">
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
        {data.environmentalStress && data.environmentalStress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                Environmental Stress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.environmentalStress.map((stress: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-yellow-800 capitalize">{stress.type.replace('_', ' ')}</h4>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        {stress.severity} severity
                      </Badge>
                    </div>
                    {stress.symptoms && stress.symptoms.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-1 text-yellow-700">Symptoms:</h5>
                        <ul className="list-disc list-inside text-sm text-yellow-600">
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

        {/* Primary Concerns */}
        {data.primaryConcerns && data.primaryConcerns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Primary Concerns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.primaryConcerns.map((concern: string, idx: number) => (
                  <div key={idx} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{concern}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Treatment Priority */}
        {data.treatmentPriority && data.treatmentPriority.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Treatment Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.treatmentPriority.map((treatment: any, idx: number) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold mr-2 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-gray-700">{typeof treatment === 'string' ? treatment : treatment.name || treatment.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preventive Measures */}
        {data.preventiveMeasures && data.preventiveMeasures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
                Preventive Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {data.preventiveMeasures.map((measure: string, idx: number) => (
                  <div key={idx} className="flex items-start p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-800">{measure}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Follow-up Recommendations */}
        {data.followUpRecommendations && data.followUpRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Follow-up Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.followUpRecommendations.map((recommendation: string, idx: number) => (
                  <div key={idx} className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-3 mt-0">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-blue-800">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regional Factors */}
        {data.regionalFactors && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Regional Context & Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
                  {data.regionalFactors}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderPlantIdentificationResults = () => {
    const data = record.result

    return (
      <div className="space-y-6">
        {/* Primary Identification */}
        {data.primaryIdentification && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="h-5 w-5 mr-2 text-green-600" />
                Primary Identification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h3 className="text-xl font-bold text-green-800 mb-2">{data.primaryIdentification}</h3>
                <p className="text-sm text-green-700">Main species identified with highest confidence</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Notes */}
        {data.analysisNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Analysis Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">{data.analysisNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Identified Plants */}
        {data.plants && data.plants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="h-5 w-5 mr-2 text-green-600" />
                Plant Identification Results ({data.plants.length} species detected)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.plants.map((plant: any, idx: number) => (
                  <div key={idx} className={`border rounded-lg p-4 ${idx === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-lg">
                            {plant.commonName || plant.common_name || plant.name || 'Unknown'}
                          </h4>
                          {idx === 0 && (
                            <Badge variant="default" className="bg-green-600">
                              Primary Match
                            </Badge>
                          )}
                        </div>
                        
                        {(plant.scientificName || plant.species) && (
                          <p className="text-sm italic text-gray-600 mb-2">
                            <em>{plant.scientificName || plant.species}</em>
                          </p>
                        )}

                        {plant.genus && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span><strong>Genus:</strong> {plant.genus}</span>
                            {plant.family && <span><strong>Family:</strong> {plant.family}</span>}
                          </div>
                        )}
                      </div>
                      {plant.confidence && (
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            plant.confidence > 0.8 
                              ? 'bg-green-100 text-green-700' 
                              : plant.confidence > 0.6 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {(plant.confidence * 100).toFixed(1)}%
                          </div>
                          <p className="text-xs text-gray-500 mt-1">confidence</p>
                        </div>
                      )}
                    </div>

                    {plant.description && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-1">Description:</h5>
                        <p className="text-sm text-gray-600 leading-relaxed">{plant.description}</p>
                      </div>
                    )}

                    {plant.characteristics && plant.characteristics.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-2">Key Characteristics:</h5>
                        <div className="flex flex-wrap gap-2">
                          {plant.characteristics.map((char: string, cidx: number) => (
                            <Badge key={cidx} variant="outline" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {plant.uses && plant.uses.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Common Uses:</h5>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {plant.uses.slice(0, 3).map((use: string, uidx: number) => (
                            <li key={uidx}>{use}</li>
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

        {/* Alternative Identifications */}
        {data.alternativeIdentifications && data.alternativeIdentifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-amber-600" />
                Alternative Identifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alternativeIdentifications.map((alt: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <h5 className="font-medium">{alt.name || alt}</h5>
                      {alt.reason && (
                        <p className="text-sm text-amber-700">{alt.reason}</p>
                      )}
                    </div>
                    {alt.confidence && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        {(alt.confidence * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regional Context */}
        {data.regionalContext && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Regional Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
                  {data.regionalContext}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Growing Conditions */}
        {data.growingConditions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Growing Conditions & Care
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {data.growingConditions.climate && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-blue-700">Climate:</h5>
                    <p className="text-sm text-gray-600">{data.growingConditions.climate}</p>
                  </div>
                )}
                {data.growingConditions.soil && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-blue-700">Soil Requirements:</h5>
                    <p className="text-sm text-gray-600">{data.growingConditions.soil}</p>
                  </div>
                )}
                {data.growingConditions.water && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-blue-700">Water Needs:</h5>
                    <p className="text-sm text-gray-600">{data.growingConditions.water}</p>
                  </div>
                )}
                {data.growingConditions.sunlight && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-blue-700">Sunlight:</h5>
                    <p className="text-sm text-gray-600">{data.growingConditions.sunlight}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderSoilAnalysisResults = () => {
    const data = record.result

    const getNutrientColor = (category: string) => {
      switch (category?.toLowerCase()) {
        case 'high': return 'bg-green-100 text-green-800 border-green-300'
        case 'adequate': return 'bg-blue-100 text-blue-800 border-blue-300'
        case 'low': case 'deficient': return 'bg-red-100 text-red-800 border-red-300'
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        default: return 'bg-gray-100 text-gray-800 border-gray-300'
      }
    }

    return (
      <div className="space-y-6">
        {/* Soil Health Overview */}
        {data.soilHealth && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <TestTube className="h-5 w-5 mr-2 text-amber-600" />
                  Soil Health Assessment
                </span>
                {data.soilHealth.overallScore && (
                  <div className={`px-4 py-2 rounded-full text-xl font-bold ${getHealthScoreColor(data.soilHealth.overallScore)}`}>
                    {data.soilHealth.overallScore}/100
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {data.soilHealth.strengths && (
                  <div>
                    <h4 className="font-medium mb-3 text-green-700 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Soil Strengths
                    </h4>
                    <div className="space-y-2">
                      {data.soilHealth.strengths.map((strength: string, idx: number) => (
                        <div key={idx} className="flex items-start p-2 bg-green-50 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-green-800">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.soilHealth.limitingFactors && (
                  <div>
                    <h4 className="font-medium mb-3 text-amber-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-2">
                      {data.soilHealth.limitingFactors.map((factor: string, idx: number) => (
                        <div key={idx} className="flex items-start p-2 bg-amber-50 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-amber-800">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {data.soilHealth.category && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Overall Category:</span>
                    <Badge variant="outline" className="capitalize">
                      {data.soilHealth.category} Health
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Basic Properties */}
        {data.basicProperties && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Basic Soil Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {data.basicProperties.ph && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">pH Level</span>
                        <span className="text-2xl font-bold text-blue-600">{data.basicProperties.ph}</span>
                      </div>
                      <Badge className={getNutrientColor(data.basicProperties.phCategory)}>
                        {data.basicProperties.phCategory?.replace('_', ' ') || 'Normal'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        {data.basicProperties.ph < 6.0 ? 'Acidic soil' : 
                         data.basicProperties.ph > 7.5 ? 'Alkaline soil' : 'Neutral soil'}
                      </p>
                    </div>
                  )}

                  {data.basicProperties.organicMatter && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">Organic Matter</span>
                        <span className="text-2xl font-bold text-green-600">{data.basicProperties.organicMatter}%</span>
                      </div>
                      <Badge className={getNutrientColor(data.basicProperties.organicMatterCategory)}>
                        {data.basicProperties.organicMatterCategory || 'Normal'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Higher organic matter improves soil fertility and structure
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {data.cationExchangeCapacity && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">CEC</span>
                        <span className="text-2xl font-bold text-purple-600">{data.cationExchangeCapacity}</span>
                      </div>
                      <p className="text-xs text-gray-500">Cation Exchange Capacity - nutrient holding ability</p>
                    </div>
                  )}

                  {data.electricalConductivity && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">Electrical Conductivity</span>
                        <span className="text-2xl font-bold text-yellow-600">{data.electricalConductivity}</span>
                      </div>
                      <p className="text-xs text-gray-500">Salt content indicator</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nutrient Analysis */}
        {data.nutrients && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Nutrient Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Macronutrients */}
              {data.nutrients.macronutrients && (
                <div className="mb-6">
                  <h4 className="font-medium text-lg mb-4 text-green-700">Macronutrients</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(data.nutrients.macronutrients).map(([nutrient, details]: [string, any]) => (
                      <div key={nutrient} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700 capitalize">{nutrient}</span>
                          {details.available && (
                            <span className="text-lg font-bold text-blue-600">{details.available}</span>
                          )}
                        </div>
                        <Badge className={getNutrientColor(details.category)} size="sm">
                          {details.category?.replace('_', ' ') || 'Not measured'}
                        </Badge>
                        {details.recommendations && details.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {details.recommendations[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Micronutrients */}
              {data.nutrients.micronutrients && (
                <div>
                  <h4 className="font-medium text-lg mb-4 text-amber-700">Micronutrients</h4>
                  <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(data.nutrients.micronutrients).map(([nutrient, details]: [string, any]) => (
                      <div key={nutrient} className="p-3 border rounded-lg text-center">
                        <span className="font-medium text-gray-700 capitalize text-sm">{nutrient}</span>
                        {details.value && (
                          <div className="text-lg font-bold text-amber-600 mt-1">{details.value}</div>
                        )}
                        <Badge className={getNutrientColor(details.category)} size="sm">
                          {details.category?.replace('_', ' ') || 'Not measured'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Physical Properties */}
        {data.physicalProperties && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                Physical Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {data.physicalProperties.texture && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-purple-700">Soil Texture</h5>
                    {data.physicalProperties.texture.textureClass !== 'not_measured' ? (
                      <div className="space-y-2">
                        <Badge variant="outline" className="capitalize">
                          {data.physicalProperties.texture.textureClass?.replace('_', ' ')}
                        </Badge>
                        {data.physicalProperties.texture.clay && (
                          <div className="text-sm text-gray-600">
                            Clay: {data.physicalProperties.texture.clay}% | 
                            Sand: {data.physicalProperties.texture.sand}% | 
                            Silt: {data.physicalProperties.texture.silt}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Not measured in this analysis</div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {data.physicalProperties.drainage && data.physicalProperties.drainage !== 'not_assessed' && (
                    <div>
                      <span className="text-sm text-gray-600">Drainage: </span>
                      <Badge variant="outline">{data.physicalProperties.drainage}</Badge>
                    </div>
                  )}
                  
                  {data.physicalProperties.structure && data.physicalProperties.structure !== 'not_mentioned' && (
                    <div>
                      <span className="text-sm text-gray-600">Structure: </span>
                      <Badge variant="outline">{data.physicalProperties.structure}</Badge>
                    </div>
                  )}

                  {data.physicalProperties.waterHoldingCapacity && data.physicalProperties.waterHoldingCapacity !== 'not_mentioned' && (
                    <div>
                      <span className="text-sm text-gray-600">Water Holding: </span>
                      <Badge variant="outline">{data.physicalProperties.waterHoldingCapacity}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {data.physicalProperties.recommendations && data.physicalProperties.recommendations.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <h5 className="font-medium text-sm mb-2 text-purple-700">Physical Property Recommendations:</h5>
                  <ul className="text-sm text-purple-800 space-y-1">
                    {data.physicalProperties.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fertilization Plan */}
        {data.fertilizationPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-green-600" />
                Fertilization Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Immediate Actions */}
              {data.fertilizationPlan.immediate && data.fertilizationPlan.immediate.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-red-700 flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    Immediate Actions
                  </h4>
                  <div className="space-y-3">
                    {data.fertilizationPlan.immediate.map((action: any, idx: number) => (
                      <div key={idx} className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-red-800">{action.type || 'Fertilizer Application'}</h5>
                            <p className="text-sm text-red-700 mt-1">{action.description || action}</p>
                          </div>
                          {action.cost && (
                            <Badge variant="outline" className="border-red-500 text-red-700">
                              {action.cost}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal Plan */}
              {data.fertilizationPlan.seasonal && data.fertilizationPlan.seasonal.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-blue-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Seasonal Applications
                  </h4>
                  <div className="space-y-3">
                    {data.fertilizationPlan.seasonal.map((season: any, idx: number) => (
                      <div key={idx} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <h5 className="font-medium text-blue-800 mb-2">{season.season}</h5>
                        {season.applications && season.applications.length > 0 && (
                          <ul className="text-sm text-blue-700 space-y-1">
                            {season.applications.map((app: string, aidx: number) => (
                              <li key={aidx} className="flex items-start">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                {app}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Long-term Plan */}
              {data.fertilizationPlan.longTerm && data.fertilizationPlan.longTerm.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-green-700 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Long-term Strategy
                  </h4>
                  <div className="grid gap-3">
                    {data.fertilizationPlan.longTerm.map((strategy: string, idx: number) => (
                      <div key={idx} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <span className="text-sm text-green-800">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Crop Recommendations */}
        {data.cropRecommendations && data.cropRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Leaf className="h-5 w-5 mr-2 text-green-600" />
                Recommended Crops ({data.cropRecommendations.length} suitable crops)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {data.cropRecommendations.map((crop: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-green-50 transition-colors">
                    <h5 className="font-medium text-green-800 mb-2">{crop.cropType}</h5>
                    {crop.suitability && (
                      <Badge className={getNutrientColor(crop.suitability)} size="sm">
                        {crop.suitability} suitability
                      </Badge>
                    )}
                    {crop.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{crop.notes}</p>
                    )}
                    {crop.expectedYield && (
                      <p className="text-xs text-green-600 mt-1">Expected: {crop.expectedYield}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monitoring Plan */}
        {data.monitoringPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Monitoring & Follow-up Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monitoringPlan.frequency && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-sm text-blue-700 mb-1">Monitoring Frequency:</h5>
                    <p className="text-sm text-blue-800">{data.monitoringPlan.frequency}</p>
                  </div>
                )}

                {data.monitoringPlan.parameters && data.monitoringPlan.parameters.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Key Parameters to Monitor:</h5>
                    <div className="flex flex-wrap gap-2">
                      {data.monitoringPlan.parameters.map((param: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {data.monitoringPlan.methods && data.monitoringPlan.methods.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Monitoring Methods:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {data.monitoringPlan.methods.map((method: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          {method}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.monitoringPlan.warningSignals && data.monitoringPlan.warningSignals.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-red-700">Warning Signals to Watch:</h5>
                    <ul className="text-sm text-red-600 space-y-1">
                      {data.monitoringPlan.warningSignals.map((signal: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regional Factors */}
        {data.regionalFactors && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Regional Context & Economic Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.regionalFactors.climateConsiderations && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-purple-700">Climate Considerations:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {data.regionalFactors.climateConsiderations.map((consideration: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {consideration}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.regionalFactors.economicFactors && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-green-700">Economic Factors:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {data.regionalFactors.economicFactors.map((factor: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-2 h-2 bg-green-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.regionalFactors.culturalPractices && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-blue-700">Cultural Practices:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {data.regionalFactors.culturalPractices.map((practice: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {practice}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.regionalFactors.localAvailability && (
                  <div>
                    <h5 className="font-medium text-sm mb-2 text-amber-700">Local Input Availability:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {data.regionalFactors.localAvailability.map((availability: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-2 h-2 bg-amber-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {availability}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Analysis */}
        {data.detailedAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Next Steps & Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.detailedAnalysis.nextSteps && data.detailedAnalysis.nextSteps.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-3 text-gray-700">Recommended Next Steps:</h5>
                  <div className="space-y-3">
                    {data.detailedAnalysis.nextSteps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-3 mt-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommendations Summary */}
        {data.recommendations && data.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
                Key Recommendations Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-green-800">{rec.type || 'Recommendation'}</h5>
                      <Badge variant="outline" className={`border-green-500 text-green-700 ${
                        rec.priority === 'high' ? 'bg-red-100 border-red-500 text-red-700' : ''
                      }`}>
                        {rec.priority || 'Medium'} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-green-700">{rec.description || rec}</p>
                    {rec.cost && (
                      <p className="text-xs text-green-600 mt-1">Cost: {rec.cost}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderYieldCalculationResults = () => {
    const data = record.result

    return (
      <div className="space-y-6">
        {/* Yield Estimates */}
        {data.estimatedYield && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Yield Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.estimatedYield.quantity} {data.estimatedYield.unit || 'kg'}
                  </div>
                  <p className="text-sm text-gray-600">Expected Yield</p>
                </div>
                {data.economicProjection?.roi && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {data.economicProjection.roi}%
                    </div>
                    <p className="text-sm text-gray-600">Return on Investment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Economic Analysis */}
        {data.economicProjection && (
          <Card>
            <CardHeader>
              <CardTitle>Economic Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.economicProjection.netProfit?.realistic && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Net Profit (Realistic)</span>
                    <span className="font-medium">KES {data.economicProjection.netProfit.realistic.toLocaleString()}</span>
                  </div>
                )}
                {data.economicProjection.totalRevenue && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-medium">KES {data.economicProjection.totalRevenue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderResults = () => {
    switch (record.type) {
      case 'plant_health':
        return renderPlantHealthResults()
      case 'plant_identification':
        return renderPlantIdentificationResults()
      case 'soil_analysis':
        return renderSoilAnalysisResults()
      case 'yield_calculation':
        return renderYieldCalculationResults()
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(record.result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getAnalysisIcon(record.type)}
              <span>{getAnalysisTypeName(record.type)}</span>
              <Badge variant="outline" className="text-xs">
                {record.status}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{record.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{record.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(record.createdAt)}</span>
                    </div>
                    
                    {record.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{record.location}</span>
                      </div>
                    )}
                    
                    {record.confidence && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{(record.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Image Gallery */}
                {allImages.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700 flex items-center">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Analysis Images ({allImages.length})
                      </h4>
                      {allImages.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          Gallery
                        </Badge>
                      )}
                    </div>
                    
                    {/* Primary Image (larger display) */}
                    <div className="mb-4">
                      <div className="relative group">
                        <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                          <img 
                            src={allImages[0].url} 
                            alt={allImages[0].label}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                            onClick={() => window.open(allImages[0].url, '_blank')}
                          />
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className={`${allImages[0].type === 'uploaded' ? 'bg-blue-600' : 'bg-green-600'}`}>
                            {allImages[0].type === 'uploaded' ? 'Uploaded' : 'Similar'}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/80 hover:bg-white"
                            onClick={() => window.open(allImages[0].url, '_blank')}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white font-medium text-sm">{allImages[0].label}</p>
                          {allImages[0].description && (
                            <p className="text-white/80 text-xs">{allImages[0].description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail Gallery for additional images */}
                    {allImages.length > 1 && (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {allImages.slice(1).map((img, idx) => (
                            <div key={idx + 1} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <img 
                                  src={img.url} 
                                  alt={img.label}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                                  onClick={() => window.open(img.url, '_blank')}
                                />
                              </div>
                              <div className="absolute top-1 left-1">
                                <Badge size="sm" className={`text-xs ${img.type === 'uploaded' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                  {img.type === 'uploaded' ? 'Upload' : 'Similar'}
                                </Badge>
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white"
                                  onClick={() => window.open(img.url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <p className="text-white text-xs font-medium truncate">{img.label}</p>
                                {img.description && (
                                  <p className="text-white/70 text-xs truncate">{img.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-600 rounded"></div>
                            <span>Uploaded Images/Documents</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-600 rounded"></div>
                            <span>Similar/Reference Images</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Image Information */}
                    {allImages.some(img => img.type === 'similar') && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start space-x-2">
                          <ImageIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Similar Images Found</p>
                            <p className="text-xs text-green-700">
                              AI has identified {allImages.filter(img => img.type === 'similar').length} similar images 
                              to help with identification and comparison analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {renderResults()}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}