import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios"
import { config } from "@/lib/config"
import type { User, LoginRequest, RegisterRequest } from "@/lib/types/auth"

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null
  private refreshToken: string | null = null
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: any) => void
  }> = []

  constructor() {
    this.client = axios.create({
      baseURL: `${config.api.baseUrl}/api/${config.api.version}`,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        // Add ngrok-specific header to bypass browser warning
        "ngrok-skip-browser-warning": "true",
      },
    })

    // Load tokens from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(config.auth.tokenKey)
      this.refreshToken = localStorage.getItem(config.auth.refreshTokenKey)
      if (this.token) {
        this.setAuthHeader(this.token)
      }
    }

    this.setupInterceptors()
  }

  private processQueue(error: any | null, token: string | null = null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve(token!)
      }
    })
    this.failedQueue = []
  }

  private async handleTokenRefresh() {
    try {
      if (!this.refreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await this.client.post("/auth/refresh", {
        refreshToken: this.refreshToken
      })

      const { token, refreshToken } = response.data

      this.setToken(token)
      this.setRefreshToken(refreshToken)

      return token
    } catch (error) {
      this.clearTokens()
      this.redirectToLogin()
      throw error
    }
  }

  private redirectToLogin() {
    if (typeof window !== "undefined") {
      // Store the current URL to redirect back after login
      localStorage.setItem("redirectAfterLogin", window.location.pathname)
      window.location.href = "/auth/login"
    }
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
        console.log("📍 Full URL:", `${config.baseURL}${config.url}`)
        console.log("📋 Headers:", config.headers)
        if (config.data) {
          console.log("📦 Payload:", config.data)
        }
        console.groupEnd()
        return config
      },
      (error) => {
        console.error("🚨 Request Error:", error)
        return Promise.reject(error)
      },
    )

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.group(`📡 API Response: ${response.status} ${response.config.url}`)
        console.log("✅ Status:", response.status, response.statusText)
        console.log("📊 Headers:", response.headers)
        console.log("📄 Raw Response:", response.data)

        // Handle successful responses - extract data if it exists
        const result = response.data?.data || response.data
        console.log("✅ Final Success Result:", result)
        console.groupEnd()

        // Return the extracted data
        return { ...response, data: result }
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
        
        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            try {
              const token = await new Promise<string>((resolve, reject) => {
                this.failedQueue.push({ resolve, reject })
              })
              this.setAuthHeader(token)
              return this.client(originalRequest)
            } catch (err) {
              return Promise.reject(err)
            }
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const token = await this.handleTokenRefresh()
            this.processQueue(null, token)
            this.setAuthHeader(token)
            return this.client(originalRequest)
          } catch (refreshError) {
            this.processQueue(refreshError, null)
            this.clearTokens()
            this.redirectToLogin()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        console.group(`💥 API Error: ${error.config?.url}`)
        console.error("🚨 Error Status:", error.response?.status)
        console.error("📄 Error Response:", error.response?.data)
        console.error("🔗 URL:", error.config?.url)
        console.error("⚙️ Config:", error.config)

        let errorMessage = "An error occurred"

        if (error.response) {
          // Handle rate limit errors specifically
          if (error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after']
            const waitTime = retryAfter ? `${retryAfter} seconds` : 'a moment'
            errorMessage = `Too many attempts. Please wait ${waitTime} before trying again.`
          } else if (error.response.status === 401) {
            errorMessage = "Invalid credentials. Please check your email/phone and password."
          } else {
            // Server responded with error status (400, 500, etc.)
            const errorData = error.response.data as any

            if (errorData?.success === false) {
              // Handle validation errors from errors array
              if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                errorMessage = errorData.errors.join(", ")
              } else if (errorData.message) {
                errorMessage = errorData.message
              }
            } else if (errorData?.message) {
              errorMessage = errorData.message
            } else {
              errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`
            }
          }
        } else if (error.request) {
          // Network error (no response received)
          errorMessage = "Network error - please check your connection"
        } else {
          // Something else happened
          errorMessage = error.message || "Request failed"
        }

        console.error("❌ Final Error Message:", errorMessage)
        console.groupEnd()

        // Create a new error with the processed message
        const processedError = new Error(errorMessage)
        return Promise.reject(processedError)
      },
    )
  }

  setToken(token: string) {
    this.token = token
    this.setAuthHeader(token)
    if (typeof window !== "undefined") {
      localStorage.setItem(config.auth.tokenKey, token)
    }
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken
    if (typeof window !== "undefined") {
      localStorage.setItem(config.auth.refreshTokenKey, refreshToken)
    }
  }

  clearTokens() {
    this.token = null
    this.refreshToken = null
    delete this.client.defaults.headers.common["Authorization"]
    if (typeof window !== "undefined") {
      localStorage.removeItem(config.auth.tokenKey)
      localStorage.removeItem(config.auth.refreshTokenKey)
    }
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config)
    return response.data
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<any> {
    const response = await this.request<{
      token: string;
      refreshToken: string;
      user: User;
    }>({
      method: "POST",
      url: "/auth/login",
      data,
    })
    
    // Store both tokens
    if (response.token) {
      this.setToken(response.token)
    }
    if (response.refreshToken) {
      this.setRefreshToken(response.refreshToken)
    }
    
    return response
  }

  async register(data: RegisterRequest): Promise<any> {
    return this.request({
      method: "POST",
      url: "/auth/register",
      data,
    })
  }

  async getProfile(): Promise<User> {
    return this.request({
      method: "GET",
      url: "/auth/profile",
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.getProfile()
  }

  async updateProfile(data: any) {
    return this.request({
      method: "PUT",
      url: "/auth/profile",
      data,
    })
  }

  async logout() {
    return this.request({
      method: "POST",
      url: "/auth/logout",
    })
  }

  // Get global dashboard stats for admin
  async getDashboardStats() {
    return this.client.get("/admin/dashboard/stats").then(r => r.data)
  }

  async getProductionCycles() {
    return this.request({
      method: "GET",
      url: "/production/cycles",
    })
  }

  async createProductionCycle(data: any) {
    return this.request({
      method: "POST",
      url: "/production/cycles",
      data,
    })
  }

  async getProductionCycle(id: string) {
    return this.request({
      method: "GET",
      url: `/production/cycles/${id}`,
    })
  }

  async updateCycle(cycleOrFormData: any) {
    const cycleId = cycleOrFormData instanceof FormData ? 
      cycleOrFormData.get("id") : 
      cycleOrFormData.id;

    return this.request({
      method: "PUT",
      url: `/production/cycles/${cycleId}`,
      data: cycleOrFormData,
      headers: cycleOrFormData instanceof FormData ? 
        { "Content-Type": "multipart/form-data" } : 
        undefined
    });
  }

  // Calculator endpoints
  async getCostEstimate(data: any) {
    return this.request({
      method: "POST",
      url: "/calculator/cost-estimate",
      data,
    })
  }

  async getHarvestPrediction(data: any) {
    return this.request({
      method: "POST",
      url: "/calculator/harvest-prediction",
      data,
    })
  }

  async getCropVarieties() {
    const response = await this.request({
      method: "GET",
      url: "/production/crop-varieties",
    }) as any

    // Extract varieties array from nested response
    return response?.varieties || response || []
  }

  // Admin endpoints
  async getUsers(params?: any) {
    return this.request({
      method: "GET",
      url: "/admin/users",
      params,
    })
  }

  async getSystemStats() {
    return this.request({
      method: "GET",
      url: "/admin/stats",
    })
  }

  // Plant AI endpoints
  async identifyPlant({ image, latitude, longitude, similar_images }: { image: File, latitude?: number, longitude?: number, similar_images?: boolean }) {
    const formData = new FormData();
    formData.append("image1", image);
    if (latitude !== undefined) formData.append("latitude", latitude.toString());
    if (longitude !== undefined) formData.append("longitude", longitude.toString());
    if (similar_images === true) formData.append("similar_images", "true");
    return this.client.post("/simple-plantid/identify", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  }

  async assessPlantHealth({ image, latitude, longitude, similar_images }: { image: File, latitude?: number, longitude?: number, similar_images?: boolean }) {
    const formData = new FormData();
    formData.append("image", image);
    if (latitude !== undefined) formData.append("latitude", latitude.toString());
    if (longitude !== undefined) formData.append("longitude", longitude.toString());
    if (similar_images === true) formData.append("similar_images", "true");
    return this.client.post("/v3/health_assessment/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  }

  // Production cycles and activities endpoints
  async getCycles() {
    return this.client.get("/production/cycles").then(r => r.data)
  }
  async getCycle(cycleId: string) {
    return this.client.get(`/production/cycles/${cycleId}`).then(r => r.data)
  }
  async getCycleActivities(cycleId: string) {
    return this.client.get(`/production/cycles/${cycleId}/activities`).then(r => r.data)
  }
  async addActivity(cycleId: string, activityOrFormData: any) {
    if (activityOrFormData instanceof FormData) {
      return this.client.post(`/production/cycles/${cycleId}/activities`, activityOrFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(r => r.data)
    } else {
      return this.client.post(`/production/cycles/${cycleId}/activities`, activityOrFormData).then(r => r.data)
    }
  }
  async updateActivity(cycleId: string, activityOrFormData: any) {
    if (activityOrFormData instanceof FormData) {
      return this.client.put(`/production/activities/${activityOrFormData.get("id")}`, activityOrFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then(r => r.data)
    } else {
      return this.client.put(`/production/activities/${activityOrFormData.id}`, activityOrFormData).then(r => r.data)
    }
  }
}

export const apiClient = new ApiClient()
