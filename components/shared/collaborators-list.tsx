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

interface CollaboratorsListProps {
  farmId: string;
  onCollaboratorSelect?: (collaborator: Collaborator) => void;
}

export function CollaboratorsList({ farmId, onCollaboratorSelect }: CollaboratorsListProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [newRole, setNewRole] = useState<CollaboratorRole>("worker")

  const fetchCollaborators = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getFarmCollaborators(farmId) as Collaborator[]
      console.log('Fetched collaborators:', response)
      setCollaborators(response)
    } catch (error: any) {
      console.error("Failed to fetch collaborators:", error)
      toast({
        title: "Error Loading Collaborators",
        description: error.message || "Failed to load collaborators. Please try again.",
        variant: "destructive",
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
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "worker":
        return "bg-green-100 text-green-800"
      case "family_member":
        return "bg-purple-100 text-purple-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleLabel = (role: CollaboratorRole): string => {
    switch (role) {
      case "manager":
        return "Farm Manager"
      case "worker":
        return "Farm Worker"
      case "family_member":
        return "Family Member"
      case "viewer":
        return "Viewer"
      default:
        return (role as string).replace(/_/g, " ").split(" ").map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ")
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Farm Collaborators</CardTitle>
          <Button onClick={() => setShowInviteModal(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted-foreground/20 rounded"></div>
                    <div className="h-3 w-48 bg-muted-foreground/20 rounded"></div>
                  </div>
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
                </div>
              ))}
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No collaborators yet</p>
              <Button 
                onClick={() => setShowInviteModal(true)}
                variant="outline" 
                className="mt-2"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Your First Collaborator
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors"
                  onClick={() => onCollaboratorSelect?.(collaborator)}
                >
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{collaborator.fullName}</h4>
                    <p className="text-sm text-muted-foreground truncate">{collaborator.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getRoleBadgeColor(collaborator.role)}`}>
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
                          e.stopPropagation();
                          setSelectedCollaborator(collaborator);
                          setNewRole(collaborator.role);
                          setShowRoleDialog(true);
                        }}
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCollaborator(collaborator);
                          setShowRemoveDialog(true);
                        }}
                        className="text-red-600"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
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