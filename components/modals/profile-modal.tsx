"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import type { User } from "@/lib/types/auth"

export interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function ProfileModal({ open, onOpenChange, user }: ProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    county: user?.county || '',
    subCounty: user?.subCounty || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.updateProfile(formData)
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-agri-800">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
