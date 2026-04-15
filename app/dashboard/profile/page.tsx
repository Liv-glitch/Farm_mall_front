"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { UserSidebar } from "@/components/user/user-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit, User, MapPin, Mail, Phone, Calendar, Shield } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { ProfileModal } from "@/components/modals/profile-modal"

// Helper function to get user initials
const getUserInitials = (fullName: string) => {
  if (!fullName || typeof fullName !== 'string') {
    return 'U'
  }
  const names = fullName.trim().split(' ').filter(name => name.length > 0)
  if (names.length === 0) {
    return 'U'
  }
  return names
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)

  const handleProfileUpdated = async () => {
    // Refresh user data from the server
    await refreshUser()
  }

  if (!user) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-700 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Extract user data from potentially nested structure
  const userData = user?.user || user
  
  const displayName = userData?.fullName || userData?.name || 'User'
  const initials = getUserInitials(displayName)
  const location = userData?.subCounty && userData?.county 
    ? `${userData.subCounty}, ${userData.county}` 
    : 'Location not set'

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-agri-100 rounded-lg">
                  <User className="h-6 w-6 text-agri-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                  <p className="text-gray-600">Manage your account information</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowEditModal(true)}
                className="bg-agri-700 hover:bg-agri-800"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card className="bg-white shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Profile Picture or Initials */}
                      <div className="w-24 h-24 rounded-full bg-agri-100 flex items-center justify-center">
                        {userData?.profilePictureUrl ? (
                          <img 
                            src={userData.profilePictureUrl} 
                            alt={displayName}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-agri-700">{initials}</span>
                        )}
                      </div>
                      
                      {/* User Name */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{displayName}</h3>
                        <p className="text-sm text-gray-600">{location}</p>
                      </div>
                      
                      {/* Subscription Badge */}
                      <Badge 
                        variant={userData?.subscriptionType === 'premium' ? 'default' : 'secondary'}
                        className={userData?.subscriptionType === 'premium' ? 'bg-agri-100 text-agri-800' : 'bg-gray-100 text-gray-600'}
                      >
                        {userData?.subscriptionType === 'premium' ? 'Premium' : 'Free'} Plan
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <Card className="bg-agri-50 border-agri-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <User className="h-5 w-5 text-agri-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-gray-900 mt-1">{displayName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {userData?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone Number</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {userData?.phoneNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="bg-maize-50 border-maize-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <Shield className="h-5 w-5 text-agri-600" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Account Type</label>
                        <p className="text-gray-900 mt-1 capitalize">{userData?.role || 'User'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subscription</label>
                        <p className="text-gray-900 mt-1 capitalize">{userData?.subscriptionType || 'Free'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Member Since</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Updated</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Security */}
                <Card className="bg-tea-50 border-tea-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-agri-800">
                      <Shield className="h-5 w-5 text-agri-600" />
                      Account Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Status</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Login</span>
                        <span className="text-sm text-gray-900">Recently</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      <ProfileModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        user={user}
        onProfileUpdated={handleProfileUpdated}
      />
    </DashboardLayout>
  )
} 