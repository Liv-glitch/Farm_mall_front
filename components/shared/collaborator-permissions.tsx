import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import { Collaborator } from "@/lib/types/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Save, X, Check, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface CollaboratorPermissionsProps {
  farmId: string
  collaborator: Collaborator
  onPermissionsUpdated?: () => void
}

type CollaboratorPermissions = Collaborator['permissions']

interface Permission {
  id: string
  label: string
  description: string
  key: keyof CollaboratorPermissions
}

const PERMISSIONS: Permission[] = [
  {
    id: "create_cycles",
    label: "Create Production Cycles",
    description: "Can create new production cycles",
    key: "canCreateCycles"
  },
  {
    id: "edit_cycles",
    label: "Edit Production Cycles",
    description: "Can modify existing production cycles",
    key: "canEditCycles"
  },
  {
    id: "delete_cycles",
    label: "Delete Production Cycles",
    description: "Can remove production cycles",
    key: "canDeleteCycles"
  },
  {
    id: "assign_tasks",
    label: "Assign Tasks",
    description: "Can assign tasks to other collaborators",
    key: "canAssignTasks"
  },
  {
    id: "view_financials",
    label: "View Financials",
    description: "Can access financial information",
    key: "canViewFinancials"
  }
]

export function CollaboratorPermissions({
  farmId,
  collaborator,
  onPermissionsUpdated,
}: CollaboratorPermissionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<CollaboratorPermissions>(collaborator.permissions)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setPermissions(collaborator.permissions)
    setHasChanges(false)
    setSaveSuccess(false)
  }, [collaborator])

  const handlePermissionToggle = (key: keyof CollaboratorPermissions) => {
    setPermissions(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(collaborator.permissions))
      return updated
    })
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")
    try {
      await apiClient.updateCollaboratorPermissions(
        farmId,
        collaborator.id,
        permissions
      )
      setHasChanges(false)
      setSaveSuccess(true)
      onPermissionsUpdated?.()
    } catch (err) {
      setError("Failed to update permissions. Please try again.")
      // Reload original permissions on error
      loadPermissions()
    }
    setLoading(false)
  }

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCollaboratorPermissions(farmId, collaborator.id)
      
      // The permissions are now directly in the collaborator object
      if (response?.permissions) {
        setPermissions(response.permissions)
      } else {
        throw new Error("No permissions data found")
      }
      
      setHasChanges(false)
    } catch (error: any) {
      console.error("Failed to load permissions:", error)
      toast({
        title: "Error Loading Permissions",
        description: error.message || "Failed to load permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              Permissions for {collaborator.fullName}
            </CardTitle>
            <CardDescription>
              Manage what this collaborator can do on your farm
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPermissions(collaborator.permissions)
                  setHasChanges(false)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className={cn(
                "transition-all",
                hasChanges && "bg-sage-600 hover:bg-sage-700",
                saveSuccess && "bg-green-600 hover:bg-green-700"
              )}
              size="sm"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveSuccess ? "Saved" : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {PERMISSIONS.map((permission) => (
            <div
              key={permission.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg transition-all",
                "hover:bg-sage-50 dark:hover:bg-sage-900/50",
                permissions[permission.key] && "bg-sage-50/50 dark:bg-sage-900/30"
              )}
            >
              <div className="space-y-1">
                <h3 className="font-medium">{permission.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {permission.description}
                </p>
              </div>
              <Switch
                checked={permissions[permission.key]}
                onCheckedChange={() => handlePermissionToggle(permission.key)}
                className={cn(
                  "data-[state=checked]:bg-sage-600",
                  permissions[permission.key] && "shadow-lg"
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 