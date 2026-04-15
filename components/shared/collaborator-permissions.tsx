import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import type { Collaborator } from "@/lib/types/auth"
import { toast } from "@/components/ui/use-toast"

interface CollaboratorPermissionsProps {
  farmId: string
  collaborator: Collaborator
  onPermissionsUpdated?: () => void
}

interface Permissions {
  canCreateCycles: boolean
  canEditCycles: boolean
  canDeleteCycles: boolean
  canAssignTasks: boolean
  canViewFinancials: boolean
}

export function CollaboratorPermissions({
  farmId,
  collaborator,
  onPermissionsUpdated
}: CollaboratorPermissionsProps) {
  const [permissions, setPermissions] = useState<Permissions>({
    canCreateCycles: false,
    canEditCycles: false,
    canDeleteCycles: false,
    canAssignTasks: false,
    canViewFinancials: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPermissions() {
      try {
        setLoading(true)
        const response = await apiClient.getCollaboratorPermissions(farmId, collaborator.id)
        console.log('Loaded permissions:', response) // Debug log
        if (response?.permissions) {
          setPermissions(response.permissions)
        }
      } catch (error) {
        console.error('Error loading permissions:', error)
        toast({
          title: "Error",
          description: "Failed to load permissions",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (collaborator?.id) {
      loadPermissions()
    }
  }, [farmId, collaborator])

  const handlePermissionChange = async (key: keyof Permissions, value: boolean) => {
    try {
      const updatedPermissions = { ...permissions, [key]: value }
      await apiClient.updateCollaboratorPermissions(farmId, collaborator.id, updatedPermissions)
      setPermissions(updatedPermissions)
      onPermissionsUpdated?.()
      toast({
        title: "Success",
        description: "Permissions updated successfully"
      })
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions for {collaborator.fullName}</CardTitle>
        <CardDescription>Manage what this collaborator can do on your farm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="canCreateCycles" className="flex flex-col space-y-1">
              <span>Create Production Cycles</span>
              <span className="text-sm text-muted-foreground">Can create new production cycles</span>
            </Label>
            <Switch 
              id="canCreateCycles" 
              checked={permissions.canCreateCycles}
              onCheckedChange={(checked) => handlePermissionChange('canCreateCycles', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="canEditCycles" className="flex flex-col space-y-1">
              <span>Edit Production Cycles</span>
              <span className="text-sm text-muted-foreground">Can modify existing production cycles</span>
            </Label>
            <Switch 
              id="canEditCycles" 
              checked={permissions.canEditCycles}
              onCheckedChange={(checked) => handlePermissionChange('canEditCycles', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="canDeleteCycles" className="flex flex-col space-y-1">
              <span>Delete Production Cycles</span>
              <span className="text-sm text-muted-foreground">Can remove production cycles</span>
            </Label>
            <Switch 
              id="canDeleteCycles" 
              checked={permissions.canDeleteCycles}
              onCheckedChange={(checked) => handlePermissionChange('canDeleteCycles', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="canAssignTasks" className="flex flex-col space-y-1">
              <span>Assign Tasks</span>
              <span className="text-sm text-muted-foreground">Can assign tasks to other collaborators</span>
            </Label>
            <Switch 
              id="canAssignTasks" 
              checked={permissions.canAssignTasks}
              onCheckedChange={(checked) => handlePermissionChange('canAssignTasks', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="canViewFinancials" className="flex flex-col space-y-1">
              <span>View Financials</span>
              <span className="text-sm text-muted-foreground">Can view financial information and reports</span>
            </Label>
            <Switch 
              id="canViewFinancials" 
              checked={permissions.canViewFinancials}
              onCheckedChange={(checked) => handlePermissionChange('canViewFinancials', checked)}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <h4 className="text-sm font-medium">Role: {collaborator.role}</h4>
              <p className="text-sm text-muted-foreground">Status: {collaborator.status}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 