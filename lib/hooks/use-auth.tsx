"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { config } from "@/lib/config"
import { toast } from "@/components/ui/use-toast"
import type { User, LoginRequest, RegisterRequest } from "@/lib/types/auth"

interface AuthContextType {
  user: User | null
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
  
  // Set cookie for middleware access
  document.cookie = `${config.auth.tokenKey}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`
}

// Helper function to remove both localStorage and cookie
function clearAuthToken() {
  localStorage.removeItem(config.auth.tokenKey)
  localStorage.removeItem(config.auth.refreshTokenKey)
  
  // Clear cookie
  document.cookie = `${config.auth.tokenKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem(config.auth.tokenKey)
    if (token) {
      // Validate token and get user info
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await apiClient.getProfile() as User
      setUser(userData)
    } catch (error) {
      console.error("Failed to fetch user:", error)
      // Token might be invalid, clear it
      clearAuthToken()
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      })
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
        if (timeSinceLastAttempt < 2000) { // 2 seconds minimum between attempts
          throw new Error("Please wait a moment before trying again")
        }
      }
      
      // Record this attempt
      localStorage.setItem('lastLoginAttempt', now.toString())
      
      const response = await apiClient.login(credentials) as any
      
      // Clear the last attempt timestamp on success
      localStorage.removeItem('lastLoginAttempt')
      
      // Handle different response structures
      const token = response?.token || response?.tokens?.accessToken || response?.accessToken
      const user = response?.user || response?.data?.user
      
      if (!token || !user) {
        throw new Error("Invalid response from server")
      }
      
      // Set auth token in both localStorage and cookie
      setAuthToken(token)
      
      // Update API client token
      apiClient.setToken(token)
      
      setUser(user)

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`,
      })

      // Role-based routing with slight delay to ensure state is updated
      setTimeout(() => {
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 100)
      
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await apiClient.register(userData) as any
      
      // Handle different response structures
      const token = response?.token || response?.tokens?.accessToken || response?.accessToken
      const user = response?.user || response?.data?.user
      
      if (!token || !user) {
        throw new Error("Invalid response from server")
      }
      
      // Set auth token in both localStorage and cookie
      setAuthToken(token)
      
      // Update API client token
      apiClient.setToken(token)
      
      setUser(user)

      toast({
        title: "Registration Successful",
        description: `Welcome to Farm Mall, ${user.fullName}!`,
      })

      // Redirect to dashboard for new users
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
    // Clear all auth data
    clearAuthToken()
    apiClient.clearTokens()
    setUser(null)
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
    
    // Redirect to home page
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
