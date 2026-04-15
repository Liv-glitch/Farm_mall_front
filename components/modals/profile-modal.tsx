"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { ProfilePictureUpload } from "@/components/shared/profile-picture-upload"
import type { User } from "@/lib/types/auth"

export interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onProfileUpdated?: () => void
}

export function ProfileModal({ open, onOpenChange, user, onProfileUpdated }: ProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [pendingProfilePicture, setPendingProfilePicture] = useState<File | null>(null)
  const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    county: '',
    subCounty: '',
    profilePictureUrl: ''
  })
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    county: '',
    subCounty: '',
  })

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      // Extract user data from nested structure if needed
      const userData = user.user || user
      
      const newFormData = {
        fullName: userData.fullName || userData.name || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        county: userData.county || '',
        subCounty: userData.subCounty || '',
      }
      
      const newProfilePictureUrl = userData.profilePictureUrl || ''
      
      // Store original data for comparison
      setOriginalData({
        ...newFormData,
        profilePictureUrl: newProfilePictureUrl
      })
      
      // Set current form data
      setFormData(newFormData)
      setProfilePictureUrl(newProfilePictureUrl)
      
      // Clear any pending picture
      setPendingProfilePicture(null)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let updatedData: any = {}
      let hasChanges = false

      // Check for text field changes
      Object.keys(formData).forEach(key => {
        const formValue = formData[key as keyof typeof formData]
        const originalValue = originalData[key as keyof typeof originalData]
        
        if (formValue !== originalValue) {
          updatedData[key] = formValue
          hasChanges = true
        }
      })

      // Handle profile picture upload if new picture is selected
      if (pendingProfilePicture) {
        const mediaResult = await apiClient.uploadUserProfile(pendingProfilePicture, true)
        
        if (mediaResult && mediaResult.id) {
          const newProfilePictureUrl = 
            mediaResult.publicUrl || 
            mediaResult.variants?.find(v => v.size === 'medium')?.url || 
            mediaResult.variants?.find(v => v.size === 'small')?.url ||
            mediaResult.variants?.[0]?.url || ''

          updatedData.profilePictureUrl = newProfilePictureUrl
          hasChanges = true
        }
      }

      // Only update if there are changes
      if (hasChanges) {
        await apiClient.updateProfile(updatedData)
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      } else {
        toast({
          title: "No Changes",
          description: "No changes were made to your profile",
        })
      }
      
      // Call the callback to refresh user data
      if (onProfileUpdated) {
        onProfileUpdated()
      }
      
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureSelect = (file: File) => {
    // Store the file for later upload on form submission
    setPendingProfilePicture(file)
    
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setProfilePictureUrl(previewUrl)
  }

  // Show loading if user data is not available
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-700 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-agri-800">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and contact details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex justify-center">
            <ProfilePictureUpload
              currentImageUrl={profilePictureUrl}
              userName={user?.fullName || user?.name}
              onFileSelect={handleProfilePictureSelect}
              uploadOnSelect={false}
              size="xl"
              className="mb-4"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-agri-700">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-agri-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumber" className="text-agri-700">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                placeholder="+254..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="county" className="text-agri-700">County</Label>
                <Input
                  id="county"
                  value={formData.county}
                  onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                  className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="subCounty" className="text-agri-700">Sub County</Label>
                <Input
                  id="subCounty"
                  value={formData.subCounty}
                  onChange={(e) => setFormData(prev => ({ ...prev, subCounty: e.target.value }))}
                  className="mt-2 border-agri-200 focus:border-agri-500 focus:ring-agri-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-agri-200 text-agri-700 hover:bg-agri-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-agri-700 hover:bg-agri-800"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Updating...
                </>
              ) : (
                <>
                  Update Profile
                  {pendingProfilePicture && (
                    <span className="ml-1 text-xs bg-agri-600 px-1 rounded">+pic</span>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
