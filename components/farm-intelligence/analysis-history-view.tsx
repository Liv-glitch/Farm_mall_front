"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Calendar, 
  Download,
  Eye,
  Trash2,
  HeartPulse,
  TestTube,
  Calculator,
  Leaf,
  Clock,
  TrendingUp,
  MapPin,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { AnalysisDetailModal } from "@/components/modals/analysis-detail-modal"

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

// Mock data for development - replace with real API calls
const mockAnalysisData: AnalysisRecord[] = [
  {
    id: "1",
    type: "plant_health",
    title: "Maize Disease Analysis",
    description: "Fall Armyworm detected with 87% confidence",
    confidence: 0.87,
    status: "completed",
    isHealthy: false,
    createdAt: "2025-08-04T10:24:26.000Z",
    location: "Nakuru County",
    cropType: "Maize",
    result: {
      healthStatus: { overall: "diseased", healthScore: 60 },
      diseases: [{ name: "Fall Armyworm", severity: "moderate" }]
    },
    media: {
      id: "media-1",
      originalUrl: "/placeholder.jpg",
      variants: { thumbnail: "/placeholder.jpg" }
    }
  },
  {
    id: "2", 
    type: "plant_identification",
    title: "Unknown Weed Identification",
    description: "Couch Grass (Cynodon dactylon) identified",
    confidence: 0.94,
    status: "completed",
    createdAt: "2025-08-03T14:15:30.000Z",
    location: "Kiambu County",
    result: {
      plants: [{ commonName: "Couch Grass", scientificName: "Cynodon dactylon" }]
    },
    media: {
      id: "media-2",
      originalUrl: "/placeholder.jpg"
    }
  },
  {
    id: "3",
    type: "soil_analysis", 
    title: "Farm Soil Analysis",
    description: "pH 6.2, Medium Nitrogen, High Phosphorus",
    status: "completed",
    createdAt: "2025-08-02T09:30:15.000Z",
    location: "Meru County",
    result: {
      basicProperties: { ph: 6.2, organicMatter: 3.1 },
      soilHealth: { overallScore: 78, category: "good" }
    }
  },
  {
    id: "4",
    type: "yield_calculation",
    title: "Potato Yield Projection",
    description: "5.2 tonnes expected, ROI 128%",
    status: "completed", 
    createdAt: "2025-08-01T16:45:20.000Z",
    location: "Nyandarua County",
    cropType: "Potato",
    result: {
      estimatedYield: { quantity: 5200, unit: "kg" },
      economicProjection: { roi: 128.5, netProfit: { realistic: 85000 } }
    }
  }
]

export function AnalysisHistoryView() {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const { toast } = useToast()

  // Helper functions to generate titles and descriptions from API data
  const generateTitle = (record: any) => {
    console.log('🔍 Generating title for record:', record.type, record)
    
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
          return `Plant ID - ${record.result.plants[0].commonName}`
        }
        if (record.result?.plants?.[0]?.name) {
          return `Plant ID - ${record.result.plants[0].name}`
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
    console.log('🔍 Generating description for record:', record.type, record)
    
    // Use result field from API response instead of analysis
    const analysis = record.result || record.analysis || record
    
    switch (record.type) {
      case 'plant_health':
        if (analysis?.healthStatus?.healthScore) {
          return `Health Score: ${analysis.healthStatus.healthScore}%, ${analysis?.primaryConcerns?.[0] || 'Analysis completed'}`
        }
        if (analysis?.nutritionalDeficiencies?.length > 0) {
          return `${analysis.nutritionalDeficiencies[0].nutrient} deficiency detected`
        }
        if (analysis?.diseases?.length > 0 && analysis.diseases[0]?.name) {
          return `${analysis.diseases[0].name} detected with ${analysis.diseases[0].severity || 'unknown'} severity`
        }
        if (analysis?.pests?.length > 0 && analysis.pests[0]?.name) {
          return `${analysis.pests[0].name} detected`
        }
        if (analysis?.healthStatus?.assessment) {
          return analysis.healthStatus.assessment.substring(0, 100) + "..."
        }
        return record.isHealthy ? "Plant appears healthy" : "Issues detected in plant health"
      case 'plant_identification':
        if (analysis?.plants?.[0]) {
          const plant = analysis.plants[0]
          const scientificName = plant.scientificName || plant.species || plant.name
          const commonName = plant.commonName || plant.common_name
          return `${commonName || scientificName || 'Unknown species'} identified`
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

  // Load analysis history on component mount
  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  const loadAnalysisHistory = async (reset = true) => {
    try {
      setLoading(true)
      const response = await apiClient.getAnalysisHistory({
        limit: 20,
        offset: reset ? 0 : records.length
      })
      
      console.log('🔍 Analysis History API Response:', response)
      console.log('🔍 Response success:', response?.success)
      console.log('🔍 Response data:', response?.data)
      console.log('🔍 Response total:', response?.total)
      
      if (response.success) {
        const rawRecords = response.data || []
        console.log('🔍 Raw records loaded:', rawRecords.length, rawRecords)
        
        // Transform API records to match UI expectations
        const newRecords = rawRecords.map((record: any) => {
          console.log('🔍 Transforming individual record:', record.id, record.type, record)
          
          return {
            id: record.id,
            type: record.type,
            title: generateTitle(record),
            description: generateDescription(record),
            confidence: record.result?.healthStatus?.confidence || record.confidence,
            status: "completed", // All returned records are completed
            isHealthy: record.isHealthy || record.result?.healthStatus?.isHealthy,
            createdAt: record.createdAt || record.created_at || new Date().toISOString(),
            result: record.result || record.analysis || record,
            media: record.media || record.mediaUrls,
            location: record.location || record.metadata?.location,
            cropType: record.cropType || record.crop_type || record.metadata?.cropType
          }
        })
        
        console.log('🔍 Transformed records:', newRecords)
        setRecords(reset ? newRecords : [...records, ...newRecords])
        setTotal(response.total || 0)
        setHasMore(newRecords.length === 20) // Has more if we got a full page
      } else {
        console.log('🔍 API response success was false')
        setRecords([])
        setTotal(0)
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error)
      // Set empty array on error
      setRecords([])
      setTotal(0)
      setHasMore(false)
      
      toast({
        title: "Connection Error",
        description: "Could not load analysis history. Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter records based on search and filters
  useEffect(() => {
    let filtered = records

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.cropType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(record => record.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter)
    }

    setFilteredRecords(filtered)
  }, [records, searchTerm, typeFilter, statusFilter])

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'plant_identification': return <Leaf className="h-5 w-5 text-green-600" />
      case 'plant_health': return <HeartPulse className="h-5 w-5 text-red-600" />
      case 'soil_analysis': return <TestTube className="h-5 w-5 text-amber-600" />
      case 'yield_calculation': return <Calculator className="h-5 w-5 text-blue-600" />
      default: return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'plant_identification': return 'Plant ID'
      case 'plant_health': return 'Plant Health'
      case 'soil_analysis': return 'Soil Analysis'
      case 'yield_calculation': return 'Yield Calculator'
      default: return 'Analysis'
    }
  }

  const getStatusBadge = (record: AnalysisRecord) => {
    switch (record.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      case 'processing':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </Badge>
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      default:
        return null
    }
  }

  const getHealthIndicator = (record: AnalysisRecord) => {
    if (record.type === 'plant_health' && record.isHealthy !== undefined) {
      return record.isHealthy ? (
        <Badge variant="outline" className="border-green-300 text-green-700">
          ✅ Healthy
        </Badge>
      ) : (
        <Badge variant="outline" className="border-red-300 text-red-700">
          ⚠️ Issues Found
        </Badge>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  const handleViewDetails = async (record: AnalysisRecord) => {
    try {
      console.log('🔍 Loading detailed analysis for:', record.id, record.type)
      
      // Fetch the full analysis details from the API
      const detailResponse = await apiClient.getAnalysisById(record.id, record.type)
      console.log('🔍 Detailed analysis response:', detailResponse)
      
      if (detailResponse.success && detailResponse.data) {
        // Update the record with the full analysis data
        const enhancedRecord = {
          ...record,
          result: detailResponse.data.analysis || detailResponse.data,
          media: detailResponse.data.mediaUrls || detailResponse.data.media || record.media
        }
        console.log('🔍 Enhanced record with full data:', enhancedRecord)
        setSelectedRecord(enhancedRecord)
      } else {
        // Fallback to showing the record as-is
        console.log('🔍 Using existing record data')
        setSelectedRecord(record)
      }
    } catch (error) {
      console.error('Failed to load detailed analysis:', error)
      // Fallback to showing the record as-is
      setSelectedRecord(record)
      toast({
        title: "Warning",
        description: "Could not load full analysis details. Showing available data.",
        variant: "default"
      })
    }
  }

  const handleDeleteRecord = async (record: AnalysisRecord) => {
    try {
      await apiClient.deleteAnalysis(record.id, record.type)
      setRecords(records.filter(r => r.id !== record.id))
      toast({
        title: "Record deleted",
        description: "Analysis record has been successfully deleted."
      })
    } catch (error) {
      console.error('Failed to delete record:', error)
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRefresh = async () => {
    await loadAnalysisHistory(true)
    toast({
      title: "Refreshed",
      description: "Analysis history has been updated."
    })
  }

  const handleLoadMore = () => {
    loadAnalysisHistory(false)
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
          <p className="text-gray-600">
            View and manage all your AI analysis records ({filteredRecords.length} of {records.length})
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, description, location, or crop type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Analysis Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="plant_identification">Plant ID</SelectItem>
                <SelectItem value="plant_health">Plant Health</SelectItem>
                <SelectItem value="soil_analysis">Soil Analysis</SelectItem>
                <SelectItem value="yield_calculation">Yield Calculator</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No records found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || typeFilter !== "all" || statusFilter !== "all" 
                    ? "Try adjusting your search or filters." 
                    : "Start using AI services to build your analysis history."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Main Content */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icon and Image */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getAnalysisIcon(record.type)}
                      </div>
                      {record.media?.variants?.thumbnail && (
                        <img 
                          src={record.media.variants.thumbnail} 
                          alt="Analysis"
                          className="w-12 h-12 rounded object-cover border"
                        />
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {record.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {getAnalysisTypeName(record.type)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {record.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
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
                      
                      <div className="flex items-center space-x-2 mt-3">
                        {getStatusBadge(record)}
                        {getHealthIndicator(record)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(record)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRecord(record)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load More Records ({filteredRecords.length} of {total})
          </Button>
        </div>
      )}
      
      {loading && filteredRecords.length > 0 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading more records...</span>
          </div>
        </div>
      )}

      {/* Analysis Detail Modal */}
      <AnalysisDetailModal
        open={!!selectedRecord}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null)
        }}
        record={selectedRecord}
      />
    </div>
  )
}