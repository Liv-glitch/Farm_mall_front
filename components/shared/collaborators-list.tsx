"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserPlus, MoreVertical, UserX, UserCog } from "lucide-react"
import type { Collaborator, CollaboratorRole } from "@/lib/types/auth"
import { toast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
import { InviteCollaboratorModal } from "@/components/modals/invite-collaborator-modal"
import { useToast } from "@/components/ui/use-toast"

interface CollaboratorsListProps {
  farmId: string;
  onCollaboratorSelect: (collaborator: Collaborator) => void;
}

export function CollaboratorsList({ farmId, onCollaboratorSelect }: CollaboratorsListProps) {
  const { toast } = useToast()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const handleInviteClick = () => {
    console.log('Invite button clicked! Setting showInviteModal to true')
    setShowInviteModal(true)
  }
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [newRole, setNewRole] = useState<CollaboratorRole>("worker")

  const fetchCollaborators = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getFarmCollaborators(farmId)
      console.log('Fetched collaborators:', response) // Debug log
      setCollaborators(Array.isArray(response) ? response : [])
    } catch (error: any) {
      console.error('Error fetching collaborators:', error)
      toast({
        title: "Error Loading Collaborators",
        description: error.message || "Failed to load collaborators. Please try again.",
        variant: "destructive"
      })
      setCollaborators([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollaborators()
  }, [farmId])

  const handleRemoveCollaborator = async () => {
    if (!selectedCollaborator) return

    try {
      // Optimistically remove from UI first
      setCollaborators(prev => prev.filter(c => c.id !== selectedCollaborator.id))
      setShowRemoveDialog(false)
      setSelectedCollaborator(null)

      // Then make the API call
      await apiClient.removeCollaborator(farmId, selectedCollaborator.id)
      
      toast({
        title: "Collaborator Removed",
        description: "The collaborator has been removed successfully.",
      })

      // Refresh the list to ensure we're in sync with server
      fetchCollaborators()
    } catch (error: any) {
      console.error("Failed to remove collaborator:", error)
      
      // Revert the optimistic update
      fetchCollaborators()
      
      toast({
        title: "Failed to Remove",
        description: error.message || "Failed to remove collaborator. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedCollaborator) return

    try {
      console.log('Updating collaborator role:', {
        farmId,
        collaborationId: selectedCollaborator.id, // This is the collaboration record ID
        newRole
      });

      await apiClient.updateCollaboratorRole(farmId, selectedCollaborator.id, newRole)
      
      toast({
        title: "Role Updated",
        description: "The collaborator's role has been updated successfully.",
      })

      // Refresh the collaborators list to get the updated data
      await fetchCollaborators();
      
      setShowRoleDialog(false)
      setSelectedCollaborator(null)
    } catch (error: any) {
      console.error("Failed to update role:", error)
      toast({
        title: "Failed to Update Role",
        description: error.message || "Failed to update collaborator's role. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: CollaboratorRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'family_member':
        return 'bg-amber-100 text-amber-800'
      case 'worker':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: CollaboratorRole): string => {
    switch (role) {
      case 'admin':
        return 'Farm Admin'
      case 'manager':
        return 'Farm Manager'
      case 'family_member':
        return 'Family Member'
      case 'worker':
        return 'Farm Worker'
      case 'viewer':
        return 'Viewer'
      default:
        // Since we've handled all possible values in the switch,
        // this should never be reached, but TypeScript requires it
        return role
    }
  }

  // Role update dialog content
  const roleOptions: { value: CollaboratorRole; label: string; description: string }[] = [
    {
      value: "manager",
      label: "Farm Manager",
      description: "Can manage all farm operations and other collaborators"
    },
    {
      value: "worker",
      label: "Farm Worker",
      description: "Can view and update assigned tasks"
    },
    {
      value: "family_member",
      label: "Family Member",
      description: "Can view operations and financial information"
    },
    {
      value: "viewer",
      label: "Viewer",
      description: "Can only view basic farm information"
    }
  ]

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-600"></div>
        </CardContent>
      </Card>
    )
  }

  if (collaborators.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No collaborators found</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 border-agri-200 text-agri-700 hover:bg-agri-50"
            onClick={handleInviteClick}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Collaborator
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Farm Collaborators</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            className="border-agri-200 text-agri-700 hover:bg-agri-50"
            onClick={handleInviteClick}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-agri-50 cursor-pointer"
                onClick={() => {
                  console.log('Selected collaborator:', collaborator) // Debug log
                  onCollaboratorSelect(collaborator)
                }}
              >
                <div>
                  <h3 className="font-medium">{collaborator.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleBadgeColor(collaborator.role)}>
                      {getRoleLabel(collaborator.role)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {collaborator.status}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onCollaboratorSelect(collaborator)
                      }}
                    >
                      Manage Permissions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => {
          console.log('Closing invite modal')
          setShowInviteModal(false)
        }}
        farmId={farmId}
        onCollaboratorInvited={fetchCollaborators}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedCollaborator?.fullName} from your farm? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveCollaborator} className="bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Update Dialog */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Role</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a new role for {selectedCollaborator?.fullName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            {roleOptions.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                  newRole === option.value ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
                onClick={() => setNewRole(option.value)}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{option.label}</h4>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <div className="flex h-5 w-5 items-center justify-center">
                  {newRole === option.value && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateRole}>
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 