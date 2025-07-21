"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { config } from "@/lib/config"
import { toast } from "@/components/ui/use-toast"
import type { User, LoginRequest, RegisterRequest, Farm } from "@/lib/types/auth"

interface AuthContextType {
  user: User | null
  farm: Farm | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Helper function to set both localStorage and cookie
function setAuthToken(token: string) {
  // Set in localStorage for client-side access
  localStorage.setItem(config.auth.tokenKey, token)
  
  // Set cookie for middleware access - use farm_mall_token to match middleware
  document.cookie = `farm_mall_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
}

// Helper function to remove both localStorage and cookie
function clearAuthToken() {
  localStorage.removeItem(config.auth.tokenKey)
  localStorage.removeItem(config.auth.refreshTokenKey)
  
  // Clear cookie - use farm_mall_token to match middleware
  document.cookie = `farm_mall_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for token in both localStorage and cookie
    const token = localStorage.getItem(config.auth.tokenKey)
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('farm_mall_token='))?.split('=')[1]
    
    // If we have a token in either place, try to fetch user
    if (token || cookieToken) {
      // If tokens don't match, sync them
      if (token !== cookieToken) {
        if (token) {
          setAuthToken(token)
        } else if (cookieToken) {
          localStorage.setItem(config.auth.tokenKey, cookieToken)
        }
      }
      
      // Always attempt to fetch user if we have any token
      fetchUserAndFarm()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserAndFarm = async () => {
    try {
      const userData = await apiClient.getProfile() as User
      setUser(userData)

      // Fetch user's farm
      const farms = await apiClient.getUserFarms()
      if (farms && farms.length > 0) {
        const firstFarm = farms[0]
        setFarm({
          id: firstFarm.id,
          name: firstFarm.name,
          location: firstFarm.location,
          size: firstFarm.sizeAcres || 0,
          userId: firstFarm.ownerId,
          createdAt: firstFarm.createdAt,
          updatedAt: firstFarm.updatedAt,
          owner: userData, // Use the current user as owner
          collaborators: firstFarm.collaborators || [] // Use collaborators from farm data or empty array
        })
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      clearAuthToken()
      if (!window.location.pathname.startsWith('/auth/') && window.location.pathname !== '/') {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginRequest) => {
    try {
      // Check if there was a recent login attempt
      const lastLoginAttempt = localStorage.getItem('lastLoginAttempt')
      const now = Date.now()
      
      if (lastLoginAttempt) {
        const timeSinceLastAttempt = now - parseInt(lastLoginAttempt)
        if (timeSinceLastAttempt < 2000) {
          throw new Error("Please wait a moment before trying again")
        }
      }
      
      localStorage.setItem('lastLoginAttempt', now.toString())
      
      const response = await apiClient.login(credentials) as any
      
      localStorage.removeItem('lastLoginAttempt')
      
      const token = response?.token || response?.tokens?.accessToken || response?.accessToken
      const user = response?.user || response?.data?.user
      
      if (!token || !user) {
        throw new Error("Invalid response from server")
      }
      
      setAuthToken(token)
      apiClient.setToken(token)
      setUser(user)

      // Fetch farm data after successful login
      const farms = await apiClient.getUserFarms()
      if (farms && farms.length > 0) {
        const firstFarm = farms[0]
        setFarm({
          id: firstFarm.id,
          name: firstFarm.name,
          location: firstFarm.location,
          size: firstFarm.sizeAcres || 0,
          userId: firstFarm.ownerId,
          createdAt: firstFarm.createdAt,
          updatedAt: firstFarm.updatedAt,
          owner: user,
          collaborators: firstFarm.collaborators || []
        })
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`,
      })

      setTimeout(() => {
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 100)
      
    } catch (error) {
      console.error("Login failed:", error)
      // Don't show toast here - let the login page handle error display
      // The login page will catch this error and display it in the UI
      throw error
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await apiClient.register(userData) as any
      
      const token = response?.token || response?.tokens?.accessToken || response?.accessToken
      const user = response?.user || response?.data?.user
      
      if (!token || !user) {
        throw new Error("Invalid response from server")
      }
      
      setAuthToken(token)
      apiClient.setToken(token)
      setUser(user)

      toast({
        title: "Registration Successful",
        description: `Welcome to Farm Mall, ${user.fullName}!`,
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 100)
      
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const logout = () => {
    clearAuthToken()
    apiClient.clearTokens()
    setUser(null)
    setFarm(null)
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
    
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        farm,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
