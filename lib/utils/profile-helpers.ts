import { apiClient } from "@/lib/api/client"
import type { MediaFile } from "@/lib/types/media"

export interface ProfileUpdateData {
  fullName?: string
  email?: string
  phoneNumber?: string
  county?: string
  subCounty?: string
  locationLat?: number
  locationLng?: number
}

export interface ProfileUpdateWithPictureResult {
  success: boolean
  user: any
  newPictureUrl?: string
  error?: string
}

/**
 * Complete profile update workflow following the API documentation
 * Handles both profile data updates and profile picture uploads
 */
export async function updateProfileWithPicture(
  profileData: ProfileUpdateData,
  newPictureFile?: File,
  oldProfilePictureId?: string
): Promise<ProfileUpdateWithPictureResult> {
  try {
    let updatedProfile = { ...profileData }

    // Step 1: Upload new profile picture if provided
    if (newPictureFile) {
      console.log('Uploading new profile picture...')
      
      const mediaResult = await apiClient.uploadUserProfile(newPictureFile, true)
      
      if (mediaResult && mediaResult.id) {
        // Get the best available URL for the profile picture
        const newProfilePictureUrl = 
          mediaResult.publicUrl || 
          mediaResult.variants?.find(v => v.size === 'medium')?.url || 
          mediaResult.variants?.find(v => v.size === 'small')?.url ||
          mediaResult.variants?.[0]?.url || ''

        // Update profile data with new picture URL
        updatedProfile.profilePictureUrl = newProfilePictureUrl

        console.log('Profile picture uploaded successfully:', newProfilePictureUrl)

        // Optionally delete old profile picture to save storage
        if (oldProfilePictureId) {
          try {
            await apiClient.deleteMedia(oldProfilePictureId)
            console.log('Old profile picture deleted:', oldProfilePictureId)
          } catch (error) {
            console.warn('Failed to delete old profile picture:', error)
            // Don't fail the whole operation if old picture deletion fails
          }
        }
      } else {
        throw new Error('Invalid media upload response')
      }
    }

    // Step 2: Update profile information
    console.log('Updating profile data...', updatedProfile)
    
    const profileResponse = await apiClient.updateProfile(updatedProfile)
    
    console.log('Profile updated successfully')

    return {
      success: true,
      user: profileResponse,
      newPictureUrl: updatedProfile.profilePictureUrl
    }

  } catch (error: any) {
    console.error('Profile update failed:', error)
    
    return {
      success: false,
      user: null,
      error: error.message || 'Failed to update profile'
    }
  }
}

/**
 * Get current profile picture with all variants
 */
export async function getCurrentProfilePicture(): Promise<{
  currentUrl?: string
  allProfilePics: MediaFile[]
  variants: any[]
}> {
  try {
    // Get user profile to get current URL
    const user = await apiClient.getCurrentUser()
    
    // Get media files to find profile pictures
    const mediaResponse = await apiClient.getMyMedia({
      mimeType: 'image',
      limit: 50
    })

    // Filter for profile pictures
    const profilePics = mediaResponse.data?.filter((media: MediaFile) =>
      media.context.category === 'users' &&
      media.context.subcategory === 'profiles'
    ) || []

    return {
      currentUrl: user.profilePictureUrl,
      allProfilePics: profilePics,
      variants: profilePics[0]?.variants || []
    }

  } catch (error) {
    console.error('Failed to get current profile picture:', error)
    return {
      allProfilePics: [],
      variants: []
    }
  }
}

/**
 * Validate profile picture file before upload
 */
export function validateProfilePicture(file: File): string | null {
  // Check file type - only images allowed for profile pictures
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  if (!allowedTypes.includes(file.type)) {
    return "Please select a valid image file (JPEG, PNG, WebP, or GIF)"
  }

  // Check file size (10MB max for profile pictures)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return "Profile picture must be less than 10MB"
  }

  // Check image dimensions (optional - can be done on backend too)
  return new Promise<string | null>((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Check minimum dimensions
      if (img.width < 100 || img.height < 100) {
        resolve("Profile picture must be at least 100x100 pixels")
      } else if (img.width > 5000 || img.height > 5000) {
        resolve("Profile picture must be smaller than 5000x5000 pixels")
      } else {
        resolve(null) // Valid
      }
    }
    img.onerror = () => resolve("Invalid image file")
    img.src = URL.createObjectURL(file)
  }) as any

  return null // Sync validation passed
}