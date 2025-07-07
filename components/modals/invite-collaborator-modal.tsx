"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus } from "lucide-react"
import type { CollaboratorRole } from "@/lib/types/auth"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"

interface InviteCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  farmId: string
  onCollaboratorInvited: () => void
}

export function InviteCollaboratorModal({ isOpen, onClose, farmId, onCollaboratorInvited }: InviteCollaboratorModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    role: "worker" as CollaboratorRole,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.inviteCollaborator(farmId, formData)
      
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
          <DialogTitle>Invite Collaborator</DialogTitle>
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
              placeholder="+254712345678"
            />
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
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