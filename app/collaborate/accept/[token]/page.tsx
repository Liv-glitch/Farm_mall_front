"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
//import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
//import { Button } from "@/components/ui/button"
//import { Input } from "@/components/ui/input"
//import { Label } from "@/components/ui/label"
import { Loader2, UserCheck, AlertCircle, Eye, EyeOff } from "lucide-react"
//import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api/client"
//import { useAuth } from "@/lib/hooks/use-auth"

interface AcceptInvitePageProps {
  params: {
    token: string
  }
}

export default function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = params
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Get invite data from URL parameters
  const inviteInfo = {
    role: searchParams.get('role') || '',
    farm: searchParams.get('farm') || '',
    existing: searchParams.get('existing') === 'true',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    name: searchParams.get('name') || ''
  }
  
  const [registrationData, setRegistrationData] = useState({
    fullName: inviteInfo.name,
    password: "",
    county: "",
    subCounty: "",
    email: inviteInfo.email,
    phoneNumber: inviteInfo.phone
  })

  // Check invite validity when component mounts
  useEffect(() => {
    const checkInvite = async () => {
      try {
        setLoading(true)
        // You might need to implement getInviteDetails in API client
        // For now, we'll handle this in the accept flow
        setLoading(false)
      } catch (error: any) {
        setError("Invalid or expired invitation link")
        setLoading(false)
      }
    }

    if (token) {
      checkInvite()
    }
  }, [token])

  const handleAcceptInvite = async () => {
    try {
      setLoading(true)
      setError("")

      await apiClient.acceptInvite(token)
      
      toast({
        title: "Invitation Accepted!",
        description: `You have successfully joined ${inviteInfo.farm} as ${inviteInfo.role}.`,
      })
      
      // Redirect to dashboard
      router.push("/dashboard")
      
    } catch (error: any) {
      setError(error.message || "Failed to accept invitation")
      setLoading(false)
    }
  }

  const handleRegisterWithInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError("")

      await apiClient.registerWithInvite(token, registrationData)
      
      toast({
        title: "Account Created & Invitation Accepted!",
        description: "Welcome to the farm collaboration platform.",
      })
      
      // Redirect to dashboard
      router.push("/dashboard")
      
    } catch (error: any) {
      setError(error.message || "Failed to create account")
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-agri-600" />
            <p className="mt-4 text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && inviteInfo.existing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-4 text-red-600 text-center">{error}</p>
            <Button 
              onClick={() => router.push("/auth/login")} 
              className="mt-4 bg-agri-600 hover:bg-agri-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show registration form for new users
  if (!inviteInfo.existing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-agri-800">Join {inviteInfo.farm}</CardTitle>
            <CardDescription>
              Create your account to join {inviteInfo.farm} as {inviteInfo.role}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterWithInvite} className="space-y-4" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="reg-fullName">Full Name</Label>
                <Input
                  id="reg-fullName"
                  name="fullName"
                  value={registrationData.fullName}
                  onChange={(e) => setRegistrationData({...registrationData, fullName: e.target.value})}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                  placeholder="john@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="reg-phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={registrationData.phoneNumber}
                  onChange={(e) => setRegistrationData({...registrationData, phoneNumber: e.target.value})}
                  placeholder="+254712345678"
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-county">County</Label>
                <Input
                  id="reg-county"
                  name="county"
                  value={registrationData.county}
                  onChange={(e) => setRegistrationData({...registrationData, county: e.target.value})}
                  placeholder="Nairobi"
                  autoComplete="address-level1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-subCounty">Sub County</Label>
                <Input
                  id="reg-subCounty"
                  name="subCounty"
                  value={registrationData.subCounty}
                  onChange={(e) => setRegistrationData({...registrationData, subCounty: e.target.value})}
                  placeholder="Westlands"
                  autoComplete="address-level2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={registrationData.password}
                    onChange={(e) => setRegistrationData({...registrationData, password: e.target.value})}
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/auth/login")}
                  className="border-agri-200 text-agri-700 hover:bg-agri-50"
                >
                  Already have an account?
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-agri-600 hover:bg-agri-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Create Account & Join
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show acceptance page for existing users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-agri-800">Farm Collaboration Invitation</CardTitle>
          <CardDescription>
            {inviteInfo.name && `Hi ${inviteInfo.name}! `}
            You've been invited to join {inviteInfo.farm} as {inviteInfo.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Show invitation details */}
          <div className="space-y-3 mb-6 p-4 bg-agri-50 rounded-lg border border-agri-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-agri-700">Farm:</span>
              <span className="text-sm text-agri-900">{inviteInfo.farm}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-agri-700">Role:</span>
              <span className="text-sm text-agri-900 capitalize">{inviteInfo.role}</span>
            </div>
            {inviteInfo.email && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-agri-700">Email:</span>
                <span className="text-sm text-agri-900">{inviteInfo.email}</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="border-agri-200 text-agri-700 hover:bg-agri-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptInvite}
              disabled={loading}
              className="bg-agri-600 hover:bg-agri-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
