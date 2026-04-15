export interface MediaVariant {
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'
  url: string
  width: number
  height: number
  fileSize: number
}

export interface MediaContext {
  category: string
  subcategory?: string
  contextId: string
  entityId?: string
}

export interface MediaMetadata {
  width?: number
  height?: number
  duration?: number
  camera?: {
    make?: string
    model?: string
  }
  location?: {
    latitude?: number
    longitude?: number
  }
  [key: string]: any
}

export interface MediaFile {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  size: string
  status: 'uploading' | 'processing' | 'ready' | 'failed'
  storagePath: string
  publicUrl?: string
  variants: MediaVariant[]
  context: MediaContext
  metadata: MediaMetadata
  isPublic: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface MediaUploadResponse {
  success: boolean
  data: MediaFile
  message?: string
}

export interface MediaListResponse {
  success: boolean
  data: MediaFile[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export interface MediaAssociation {
  id: string
  mediaId: string
  associatableType: string
  associatableId: string
  role: 'primary' | 'thumbnail' | 'attachment' | 'comparison' | 'before' | 'after' | 'evidence' | 'diagnostic' | 'documentation'
  category: string
  subcategory?: string
  contextId: string
  entityId?: string
  order: number
  createdAt: string
}

export interface MediaAnalytics {
  totalFiles: number
  totalSizeBytes: number
  byMimeType: Record<string, number>
  uploadTrend: Array<{
    date: string
    count: number
  }>
  averageProcessingTime: number
  storageUsageByCategory: Record<string, {
    count: number
    sizeBytes: number
  }>
}

// Helper type for creating records with media
export interface MediaFileInput {
  file: File
  category: string
  subcategory?: string
  role?: MediaRole
}

export interface RecordWithMediaResult {
  record: any
  media: MediaFile[]
}

export type AnimalType = 'cattle' | 'poultry' | 'swine' | 'sheep' | 'goats'
export type CropPurpose = 'identification' | 'health' | 'harvest' | 'treatment' | 'progress'
export type SoilAnalysisType = 'soil-test' | 'sand-analysis' | 'composition' | 'ph-test' | 'nutrient-analysis'
export type MediaRole = 'primary' | 'thumbnail' | 'attachment' | 'comparison' | 'before' | 'after' | 'evidence' | 'diagnostic' | 'documentation'