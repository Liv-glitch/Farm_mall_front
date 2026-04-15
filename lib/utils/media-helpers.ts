import { apiClient } from "@/lib/api/client"
import type { MediaFileInput, RecordWithMediaResult } from "@/lib/types/media"

/**
 * Complete workflow: Create record + Upload media + Associate
 * This follows the two-step process described in the API documentation
 */
export async function createRecordWithMedia(
  recordType: string,
  recordData: any,
  mediaFiles: MediaFileInput[]
): Promise<RecordWithMediaResult> {
  try {
    // Step 1: Create the business record using existing API endpoints
    const recordResponse = await fetch(`/api/v1/${recordType}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('farm_mall_token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    })

    if (!recordResponse.ok) {
      throw new Error(`Failed to create ${recordType} record`)
    }

    const record = await recordResponse.json()
    const recordId = record.data?.id || record.id

    if (!recordId) {
      throw new Error('No record ID returned from server')
    }

    // Step 2: Upload and associate media files
    const mediaResults = []
    
    for (const mediaFile of mediaFiles) {
      // Upload media using the generic upload endpoint
      const uploadResult = await apiClient.uploadGenericMedia({
        file: mediaFile.file,
        category: mediaFile.category,
        subcategory: mediaFile.subcategory,
        contextId: recordData.farmId || recordData.contextId,
        entityId: recordId,
        generateVariants: true
      })

      if (!uploadResult.success) {
        throw new Error(`Failed to upload media: ${uploadResult.message}`)
      }

      // Associate media with the record
      await apiClient.associateMedia(uploadResult.data.id, {
        associatableType: recordType.replace(/-/g, '_'), // Convert kebab-case to snake_case
        associatableId: recordId,
        role: mediaFile.role || 'primary',
        category: mediaFile.category,
        subcategory: mediaFile.subcategory,
        contextId: recordData.farmId || recordData.contextId,
        entityId: recordId
      })

      mediaResults.push(uploadResult.data)
    }

    return {
      record: record.data || record,
      media: mediaResults
    }

  } catch (error) {
    console.error('Failed to create record with media:', error)
    throw error
  }
}

/**
 * Fetch a record with its associated media
 */
export async function getRecordWithMedia(
  recordType: string,
  recordId: string,
  role?: string
): Promise<any> {
  try {
    // Get the record
    const recordResponse = await fetch(`/api/v1/${recordType}/${recordId}`, {
      headers: { 
        'Authorization': 'Bearer ' + localStorage.getItem('farm_mall_token')
      }
    })

    if (!recordResponse.ok) {
      throw new Error(`Failed to fetch ${recordType} record`)
    }

    const record = await recordResponse.json()

    // Get associated media
    const associationType = recordType.replace(/-/g, '_')
    const media = await apiClient.getMediaByAssociation(associationType, recordId, role)

    return {
      ...record.data || record,
      media: media.data || []
    }

  } catch (error) {
    console.error('Failed to fetch record with media:', error)
    throw error
  }
}

/**
 * Helper to determine the appropriate media category based on record type
 */
export function getMediaCategoryForRecordType(recordType: string): {
  category: string
  subcategory?: string
} {
  const categoryMap: Record<string, { category: string; subcategory?: string }> = {
    'pest-analyses': { category: 'pest-analysis', subcategory: 'evidence' },
    'soil-tests': { category: 'soil-analysis', subcategory: 'documentation' },
    'crop-identifications': { category: 'crops', subcategory: 'identification' },
    'livestock-records': { category: 'livestock', subcategory: 'health' },
    'equipment-maintenance': { category: 'equipment', subcategory: 'maintenance' },
    'production-cycles': { category: 'crops', subcategory: 'progress' }
  }

  return categoryMap[recordType] || { category: 'documentation' }
}

/**
 * Validate file before upload
 */
export function validateMediaFile(file: File): string | null {
  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return "Unsupported file type. Please use JPEG, PNG, WebP, GIF, MP4, PDF, TXT, or Word documents."
  }

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024 // 50MB in bytes
  if (file.size > maxSize) {
    return "File size must be less than 50MB"
  }

  return null
}