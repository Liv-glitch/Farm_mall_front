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
          <h1 className="text-2xl font-bold text-agri-800">Collaborator Management</h1>
          <p className="text-agri-600">Manage your farm collaborators and their permissions</p>
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
      </div>
    </DashboardLayout>
  )
} 