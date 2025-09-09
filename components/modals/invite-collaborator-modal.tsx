"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus } from "lucide-react"
import type { CollaboratorRole } from "@/lib/types/auth"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

interface InviteCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  farmId: string
  onCollaboratorInvited: () => void
}

export function InviteCollaboratorModal({ isOpen, onClose, farmId, onCollaboratorInvited }: InviteCollaboratorModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    role: "worker" as CollaboratorRole,
  })

  // Format Kenyan phone number to +254 format
  const formatKenyanPhoneNumber = (phone: string): string => {
    if (!phone) return phone
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Handle different Kenyan phone number formats
    if (cleaned.startsWith('254')) {
      // Already has country code (254711598133 -> +254711598133)
      return `+${cleaned}`
    } else if (cleaned.startsWith('0')) {
      // Starts with 0 (0711598133 -> +254711598133)
      return `+254${cleaned.slice(1)}`
    } else if (cleaned.length === 9) {
      // 9 digits without leading 0 (711598133 -> +254711598133)
      return `+254${cleaned}`
    }
    
    // Return as is if format is not recognized
    return phone
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Format the phone number before sending
      const formattedData = {
        ...formData,
        phoneNumber: formData.phoneNumber ? formatKenyanPhoneNumber(formData.phoneNumber) : ""
      }
      
      await apiClient.inviteCollaborator(farmId, formattedData)
      
      toast({
        title: "Invitation Sent",
        description: "The collaborator has been invited successfully.",
      })

      onCollaboratorInvited()
      onClose()

      // Reset form
      setFormData({
        email: "",
        phoneNumber: "",
        role: "worker",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Send Invitation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-agri-800">Invite Collaborator</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on your farm by sending them an invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="collaborator@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="0712345678 or 712345678 or 254712345678"
            />
            <p className="text-xs text-muted-foreground">
              Kenyan phone number (will be formatted to +254 automatically)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: CollaboratorRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Farm Manager</SelectItem>
                <SelectItem value="worker">Farm Worker</SelectItem>
                <SelectItem value="family_member">Family Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.role === "manager" && "Can manage farm operations and assign tasks"}
              {formData.role === "worker" && "Can view and update assigned tasks"}
              {formData.role === "family_member" && "Can view farm operations and financials"}
              {formData.role === "viewer" && "Can only view basic farm information"}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-agri-200 text-agri-700 hover:bg-agri-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-agri-600 hover:bg-agri-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invite...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 