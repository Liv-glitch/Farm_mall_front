"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Loader2, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import type { MediaFile } from "@/lib/types/media"

interface ProfilePictureUploadProps {
  currentImageUrl?: string
  userName?: string
  onUploadSuccess?: (mediaFile: MediaFile) => void
  onUploadError?: (error: string) => void
  onFileSelect?: (file: File) => void
  uploadOnSelect?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  disabled?: boolean
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16", 
  lg: "h-24 w-24",
  xl: "h-32 w-32"
}

const buttonSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6", 
  xl: "h-8 w-8"
}

export function ProfilePictureUpload({ 
  currentImageUrl,
  userName = "User",
  onUploadSuccess,
  onUploadError,
  onFileSelect,
  uploadOnSelect = true,
  size = "lg",
  className,
  disabled = false
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get user initials for fallback
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Determine which image to show
  const displayImageUrl = previewUrl || currentImageUrl

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, WebP, or GIF)"
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 50MB"
    }

    return null
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setPreviewUrl(previewUrl)

    // If uploadOnSelect is false, just call onFileSelect and return
    if (!uploadOnSelect && onFileSelect) {
      onFileSelect(file)
      return
    }

    // Otherwise, proceed with immediate upload (legacy behavior)
    setUploading(true)
    
    try {
      const result = await apiClient.uploadUserProfile(file, true)
      
      // The API client already extracts the data, so result is the MediaFile directly
      if (result && result.id) {
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
        })
        
        // Clean up preview URL since we have the real URL now
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        
        onUploadSuccess?.(result)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error: any) {
      console.error("Profile picture upload failed:", error)
      
      // Clean up preview on error
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      
      const errorMessage = error.message || "Failed to upload profile picture"
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], "border-2 border-muted")}>
          <AvatarImage 
            src={displayImageUrl} 
            alt={`${userName}'s profile picture`}
            className="object-cover"
          />
          <AvatarFallback className="bg-agri-100 text-agri-800 font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay button */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn(
            "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/60 border-0 text-white",
            uploading && "opacity-100",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={handleUploadClick}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className={cn(buttonSizeClasses[size], "animate-spin")} />
          ) : (
            <Camera className={buttonSizeClasses[size]} />
          )}
        </Button>

        {/* Preview indicator */}
        {previewUrl && !uploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload instructions for larger sizes */}
      {size === "xl" && (
        <div className="mt-3 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || uploading}
            className="text-xs"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3 w-3" />
                Upload Photo
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP or GIF (max 50MB)
          </p>
        </div>
      )}
    </div>
  )
}