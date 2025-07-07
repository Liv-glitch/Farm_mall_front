"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CollaboratorsList } from "@/components/shared/collaborators-list"
import { CollaboratorPermissions } from "@/components/shared/collaborator-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { useAuth } from "@/lib/hooks/use-auth"
import { Collaborator } from "@/lib/types/auth"
import { Button } from "@/components/ui/button"
import { Save, Users, Shield, User, Bell } from "lucide-react"

export default function SettingsPage() {
  const { user, farm, loading } = useAuth()
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null)
  const [activeTab, setActiveTab] = useState("collaborators")

  const handleCollaboratorSelect = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator)
    setActiveTab("permissions")
  }

  if (loading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!farm) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h2 className="text-xl font-semibold text-gray-900">No Farm Found</h2>
            <p className="text-gray-600 mt-2">Please create a farm to manage settings.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your farm settings and collaborators
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-3 border-none shadow-lg bg-gradient-to-b from-sage-50/50 to-sage-100/50 dark:from-sage-900/50 dark:to-sage-800/50">
            <CardContent className="p-4">
              <TabsList className="flex flex-col w-full space-y-2 bg-transparent">
                <TabsTrigger 
                  value="collaborators" 
                  className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-sage-800"
                >
                  <Users className="h-4 w-4 mr-3" />
                  Collaborators
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  disabled={!selectedCollaborator}
                  className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-sage-800"
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-sage-800"
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="w-full justify-start text-left px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-sage-800"
                >
                  <Bell className="h-4 w-4 mr-3" />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <div className="col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="collaborators" className="m-0">
                <CollaboratorsList 
                  farmId={farm.id}
                  onCollaboratorSelect={handleCollaboratorSelect}
                />
              </TabsContent>

              <TabsContent value="permissions" className="m-0">
                {selectedCollaborator && (
                  <CollaboratorPermissions
                    farmId={farm.id}
                    collaborator={selectedCollaborator}
                    onPermissionsUpdated={() => {
                      // Refresh collaborators list if needed
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="profile" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Manage your profile information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Profile settings content */}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how you receive updates and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Notifications settings content */}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 