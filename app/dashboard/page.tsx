"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardLayout } from "@/components/shared/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, User, Edit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserSidebar } from "@/components/user/user-sidebar"
import { apiClient } from "@/lib/api/client"
import type { ProductionCycle } from "@/lib/types/production"

// Helper function to get user initials
const getUserInitials = (fullName: string) => {
  if (!fullName || typeof fullName !== 'string') {
    return 'U'
  }
  // Clean the name and get initials
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

// Helper function to format currency
const formatCurrency = (amount: number) => {
  // Handle NaN, null, undefined
  if (isNaN(amount) || amount == null) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0)
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper function to format date
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// User Profile Card Component
const UserProfileCard = ({ user }: { user: any }) => {
  const router = useRouter()
  
  // Extract user data from potentially nested structure
  const userData = user?.user || user
  
  const displayName = userData?.fullName || userData?.name || 'User'
  const initials = getUserInitials(displayName)
  
  const location = userData?.subCounty && userData?.county 
    ? `${userData.subCounty}, ${userData.county}` 
    : 'Location not set'

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Picture or Initials */}
          <div className="w-20 h-20 rounded-full bg-agri-100 flex items-center justify-center">
            {userData?.profilePictureUrl ? (
              <img 
                src={userData.profilePictureUrl} 
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-agri-700">{initials}</span>
            )}
          </div>
          
          {/* User Name */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-600">{location}</p>
          </div>
          
          {/* Edit Profile Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="border-agri-200 text-agri-700 hover:bg-agri-50"
            onClick={() => router.push('/dashboard/profile')}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Production Cycles Summary Component
const ProductionCyclesSummary = ({ cycles }: { cycles: ProductionCycle[] }) => {
  const activeCycles = cycles.filter(c => c.status === "active").length
  const totalInvestment = cycles.reduce((sum, cycle) => {
    const activityCosts = cycle.activities?.reduce((acc, activity) => {
      let cost = 0
      if (typeof activity.cost === 'string') {
        const parsed = parseFloat(activity.cost)
        cost = isNaN(parsed) ? 0 : parsed
      } else if (typeof activity.cost === 'number') {
        cost = isNaN(activity.cost) ? 0 : activity.cost
      }
      return acc + cost
    }, 0) || 0
    return sum + activityCosts
  }, 0)
  const totalArea = Math.round(cycles.reduce((sum, cycle) => {
    // Handle different data types for landSizeAcres
    let acres = 0
    if (typeof cycle.landSizeAcres === 'number') {
      acres = cycle.landSizeAcres
    } else if (typeof cycle.landSizeAcres === 'string') {
      acres = parseFloat(cycle.landSizeAcres) || 0
    }
    return sum + acres
  }, 0) * 10) / 10

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-agri-50 border-agri-100">
        <CardContent className="p-4 text-center">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Active Cycles</h4>
          <p className="text-2xl font-bold text-agri-700">{activeCycles}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-agri-50 border-agri-100">
        <CardContent className="p-4 text-center">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Total Investment</h4>
          <p className="text-lg font-bold text-agri-700">{formatCurrency(totalInvestment)}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-agri-50 border-agri-100">
        <CardContent className="p-4 text-center">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Total Area</h4>
          <p className="text-lg font-bold text-agri-700">{totalArea} Acres</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Production Cycles List Component
const ProductionCyclesList = ({ cycles }: { cycles: ProductionCycle[] }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Production Cycles</h3>
        <Link href="/dashboard/cycles/new">
          <Button className="bg-agri-700 hover:bg-agri-800">
            <Plus className="w-4 h-4 mr-2" />
            New Cycle
          </Button>
        </Link>
      </div>
      
      <div className="space-y-3">
        {cycles.map((cycle) => {
          // Calculate total cost from activities for this cycle
          const cycleTotalCost = cycle.activities?.reduce((sum, activity) => {
            let cost = 0
            if (typeof activity.cost === 'string') {
              const parsed = parseFloat(activity.cost)
              cost = isNaN(parsed) ? 0 : parsed
            } else if (typeof activity.cost === 'number') {
              cost = isNaN(activity.cost) ? 0 : activity.cost
            }
            return sum + cost
          }, 0) || 0

          return (
            <Card key={cycle.id} className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-gray-900">{cycle.cropVariety?.name}</h4>
                    <p className="text-sm text-gray-600">
                      {cycle.landSizeAcres} Acres, {cycle.farmLocation}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Planted on: {formatDate(cycle.plantingDate)}</p>
                      <p>Expected Harvest: {formatDate(cycle.estimatedHarvestDate)}</p>
                      <p>Total Cost: {formatCurrency(cycleTotalCost)}</p>
                    </div>
                  </div>
                <Link href={`/dashboard/cycles/${cycle.id}`}>
                  <Button variant="ghost" size="sm" className="text-agri-700 hover:bg-agri-50">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [cycles, setCycles] = useState<ProductionCycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.getCycles()
        const cyclesData = Array.isArray(res) ? res : (res?.data ? res.data : [])
        setCycles(cyclesData)
      } catch (err) {
        console.error("Error fetching cycles:", err)
        setCycles([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (!user || loading) {
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

  const hasCycles = cycles.length > 0
  
  // Extract user data from potentially nested structure  
  const userData = user?.user || user
  const displayName = userData?.fullName || userData?.name || 'User'
  const firstName = displayName.split(' ')[0]

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="min-h-screen bg-gray-50">


        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-agri-800">
                {hasCycles ? `Welcome back, ${firstName}!` : `Welcome, ${firstName}!`}
              </h1>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <UserProfileCard user={user} />
              </div>

              {/* Right Column - Cycles Content */}
              <div className="lg:col-span-2 space-y-6">
                {hasCycles ? (
                  <>
                    {/* Summary Statistics */}
                    <ProductionCyclesSummary cycles={cycles} />
                    
                    {/* Production Cycles List */}
                    <ProductionCyclesList cycles={cycles} />
                  </>
                ) : (
                  /* No Active Cycles State */
                  <Card className="bg-agri-50 border-agri-100">
                    <CardContent className="p-8 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-agri-100 rounded-full flex items-center justify-center mx-auto">
                          <User className="w-8 h-8 text-agri-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No active Production Cycles yet.
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Start your first production cycle to begin tracking your farming activities.
                          </p>
                          <Link href="/dashboard/cycles/new">
                            <Button className="bg-agri-700 hover:bg-agri-800">
                              <Plus className="w-4 h-4 mr-2" />
                              Start New Cycle
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
