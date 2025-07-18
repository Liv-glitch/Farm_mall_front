"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CollaboratorsList } from "@/components/shared/collaborators-list"
import { CollaboratorPermissions } from "@/components/shared/collaborator-permissions"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Collaborator } from "@/lib/types/auth"

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
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-agri-800">Farm Settings</h1>
          <p className="text-agri-600">Manage your farm settings, collaborators, and farm-specific configurations</p>
        </div>

        <div className="w-full border-b mb-6">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("collaborators")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "collaborators"
                  ? "border-agri-600 text-agri-600"
                  : "border-transparent hover:text-agri-600"
              }`}
            >
              Collaborators
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              disabled={!selectedCollaborator}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "permissions"
                  ? "border-agri-600 text-agri-600"
                  : "border-transparent hover:text-agri-600"
              } ${!selectedCollaborator ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveTab("farm")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "farm"
                  ? "border-agri-600 text-agri-600"
                  : "border-transparent hover:text-agri-600"
              }`}
            >
              Farm Settings
            </button>
          </div>
        </div>

        {activeTab === "collaborators" && (
          <CollaboratorsList 
            farmId={farm.id}
            onCollaboratorSelect={handleCollaboratorSelect}
          />
        )}

        {activeTab === "permissions" && selectedCollaborator && (
          <div key={selectedCollaborator.id}>
            <CollaboratorPermissions
              farmId={farm.id}
              collaborator={selectedCollaborator}
              onPermissionsUpdated={() => {
                // Refresh collaborators list if needed
              }}
            />
          </div>
        )}

        {activeTab === "farm" && (
          <Card className="bg-agri-50 border-agri-100">
            <CardHeader>
              <CardTitle className="text-agri-800">Farm Settings</CardTitle>
              <CardDescription className="text-agri-600">
                Manage your farm information and configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-agri-200">
                <h4 className="font-semibold text-gray-900 mb-2">Farm Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Farm Name</label>
                    <p className="text-gray-900">{farm.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{farm.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Size</label>
                    <p className="text-gray-900">{farm.size} acres</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-gray-900">{new Date(farm.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-agri-200">
                <h4 className="font-semibold text-gray-900 mb-2">Profile Management</h4>
                <p className="text-gray-600 mb-4">
                  To edit your personal profile information (name, email, location), 
                  please use the Profile section in the sidebar.
                </p>
                <Button 
                  variant="outline" 
                  className="border-agri-200 text-agri-700 hover:bg-agri-50"
                  onClick={() => window.location.href = '/dashboard/profile'}
                >
                  Go to Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
} 