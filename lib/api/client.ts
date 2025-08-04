import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios"
import { config } from "@/lib/config"
import type { User, LoginRequest, RegisterRequest, CollaboratorRole } from "@/lib/types/auth"

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
    // Ensure we have a valid base URL
    const baseURL = config.api.baseUrl || 'http://localhost:3000'
    
    this.client = axios.create({
      baseURL: `${baseURL}/api/${config.api.version}`,
      timeout: 180000, // 3 minutes default timeout for AI operations
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
        // Handle successful responses - extract data if it exists
        const result = response.data?.data || response.data

        // Return the extracted data
        return { ...response, data: result }
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
        
        // Handle 401 errors - but don't try to refresh tokens for auth endpoints
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt token refresh for auth endpoints (login, register, etc.)
          const isAuthEndpoint = originalRequest.url?.includes('/auth/')
          
          if (isAuthEndpoint) {
            // For auth endpoints, just return the original error
          } else {
            // For other endpoints, try token refresh
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
    try {
      console.log('Attempting registration with data:', {
        ...data,
        password: '[REDACTED]' // Don't log the actual password
      });
      
      const response = await this.request<{
        token: string;
        refreshToken: string;
        user: User;
      }>({
        method: "POST",
        url: "/auth/register",
        data,
      });
      
      
      return response;
    } catch (error: any) {
      console.error('Registration error details:', {
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        }
      });
      throw error;
    }
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

  // Enhanced Plant AI endpoints (Gemini + Plant.id)
  async identifyPlant({ image, latitude, longitude, similar_images, plant_type, location }: { 
    image: File, 
    latitude?: number, 
    longitude?: number, 
    similar_images?: boolean,
    plant_type?: string,
    location?: string
  }) {
    const formData = new FormData();
    formData.append("image1", image);
    if (latitude !== undefined) formData.append("latitude", latitude.toString());
    if (longitude !== undefined) formData.append("longitude", longitude.toString());
    if (similar_images === true) formData.append("similar_images", "true");
    if (plant_type) formData.append("plant_type", plant_type);
    if (location) formData.append("location", location);
    
    // Use enhanced endpoint with Gemini AI
    return this.client.post("/enhanced-plant/identify", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 minutes for AI processing
    }).then(r => r.data);
  }

  async assessPlantHealth({ image, latitude, longitude, similar_images, plant_type, symptoms, location }: { 
    image: File, 
    latitude?: number, 
    longitude?: number, 
    similar_images?: boolean,
    plant_type?: string,
    symptoms?: string,
    location?: string
  }) {
    const formData = new FormData();
    formData.append("image1", image);
    if (latitude !== undefined) formData.append("latitude", latitude.toString());
    if (longitude !== undefined) formData.append("longitude", longitude.toString());
    if (similar_images === true) formData.append("similar_images", "true");
    if (plant_type) formData.append("plant_type", plant_type);
    if (symptoms) formData.append("symptoms", symptoms);
    if (location) formData.append("location", location);
    
    // Use enhanced endpoint with Gemini AI
    return this.client.post("/enhanced-plant/health", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 minutes for AI processing
    }).then(r => r.data);
  }

  // New Soil Analysis endpoint
  async analyzeSoil({ document, location, crop_type, farm_size, budget }: {
    document: File,
    location?: string,
    crop_type?: string,
    farm_size?: string,
    budget?: string
  }) {
    const formData = new FormData();
    formData.append("document", document);
    if (location) formData.append("location", location);
    if (crop_type) formData.append("crop_type", crop_type);
    if (farm_size) formData.append("farm_size", farm_size);
    if (budget) formData.append("budget", budget);
    
    return this.client.post("/enhanced-plant/soil", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 150000, // 2.5 minutes for soil analysis
    }).then(r => r.data);
  }

  // New Smart Yield Calculator endpoint
  async calculateYield(data: {
    cropType: string,
    farmSize: number,
    location: string,
    variety?: string,
    farmingSystem?: string,
    irrigationType?: string,
    fertilizationLevel?: string,
    pestManagement?: string,
    season?: string,
    inputBudget?: number,
    targetMarket?: string,
    soilData?: {
      ph?: number,
      organicMatter?: number,
      nitrogen?: number,
      phosphorus?: number,
      potassium?: number,
      texture?: string,
      drainage?: string
    },
    previousYields?: Array<{
      year: number,
      yield: number,
      practices: string
    }>
  }) {
    return this.client.post("/enhanced-plant/yield", data, {
      headers: { "Content-Type": "application/json" },
      timeout: 180000, // 3 minutes for complex yield calculations
    }).then(r => r.data);
  }

  // Analysis History endpoints
  async getAnalysisHistory(params?: {
    type?: 'plant_identification' | 'plant_health' | 'soil_analysis' | 'yield_calculation',
    limit?: number,
    offset?: number,
    search?: string
  }) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.search) searchParams.append('search', params.search);

    // Use axios directly to bypass the interceptor that strips the response structure
    const axiosResponse = await axios.get(`${this.client.defaults.baseURL}/enhanced-plant/history?${searchParams}`, {
      headers: this.client.defaults.headers.common,
      timeout: this.client.defaults.timeout
    });
    
    // Return the full API response as-is
    return axiosResponse.data;
  }

  async getAnalysisById(analysisId: string, type: string) {
    return this.client.get(`/enhanced-plant/analysis/${analysisId}?type=${type}`).then(r => r.data);
  }

  async deleteAnalysis(analysisId: string, type: string) {
    return this.client.delete(`/enhanced-plant/analysis/${analysisId}?type=${type}`).then(r => r.data);
  }

  // Legacy endpoints (kept for backward compatibility)
  async identifyPlantLegacy({ image, latitude, longitude, similar_images }: { image: File, latitude?: number, longitude?: number, similar_images?: boolean }) {
    const formData = new FormData();
    formData.append("image1", image);
    if (latitude !== undefined) formData.append("latitude", latitude.toString());
    if (longitude !== undefined) formData.append("longitude", longitude.toString());
    if (similar_images === true) formData.append("similar_images", "true");
    return this.client.post("/simple-plantid/identify", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  }

  async assessPlantHealthLegacy({ image, latitude, longitude, similar_images }: { image: File, latitude?: number, longitude?: number, similar_images?: boolean }) {
    const formData = new FormData();
    formData.append("image", image);
    if (latitude !== undefined) formData.append("latitude", latitude.toString());
    if (longitude !== undefined) formData.append("longitude", longitude.toString());
    if (similar_images === true) formData.append("similar_images", "true");
    return this.client.post("/plantid-health/health_assessment/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  }

  // Production cycles and activities endpoints
  async getCycles() {
    const response = await this.client.get("/production/cycles")
    return response.data
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

  // Collaboration endpoints
  async getFarmCollaborators(farmId: string) {
    return this.request({
      method: "GET",
      url: `/collaboration/farms/${farmId}/collaborators`,
    })
  }

  async removeCollaborator(farmId: string, collaborationId: string) {
    return this.request({
      method: "DELETE",
      url: `/collaboration/farms/${farmId}/collaborators/${collaborationId}`,
    })
  }

  // Update role (high-level)
  async updateCollaboratorRole(farmId: string, collaborationId: string, role: CollaboratorRole) {
    return this.request({
      method: "PATCH",
      url: `/collaboration/farms/${farmId}/collaborators/${collaborationId}/role`,
      data: { role },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Get collaborator permissions
  async getCollaboratorPermissions(farmId: string, collaborationId: string) {
    const response = await this.request({
      method: "GET",
      url: `/collaboration/farms/${farmId}/collaborators`,
    }) as any[]

    const collaborator = response.find(c => c.id === collaborationId)
    if (!collaborator) {
      throw new Error("Collaborator not found")
    }

    return collaborator
  }

  // Update granular permissions
  async updateCollaboratorPermissions(
    farmId: string, 
    collaborationId: string, 
    permissions: {
      canCreateCycles: boolean;
      canEditCycles: boolean;
      canDeleteCycles: boolean;
      canAssignTasks: boolean;
      canViewFinancials: boolean;
    }
  ) {
    return this.request({
      method: "PATCH",
      url: `/collaboration/farms/${farmId}/collaborators/${collaborationId}/permissions`,
      data: { permissions },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  async inviteCollaborator(farmId: string, data: { email?: string; phoneNumber?: string; role: CollaboratorRole }) {
    return this.request({
      method: "POST",
      url: `/collaboration/farms/${farmId}/invite`,
      data,
    })
  }

  async acceptInvite(token: string) {
    return this.request({
      method: "POST",
      url: `/collaboration/invites/${token}/accept`,
    })
  }

  async registerWithInvite(token: string, data: {
    fullName: string;
    password: string;
    county: string;
    subCounty: string;
    email?: string;
    phoneNumber?: string;
  }) {
    return this.request({
      method: "POST",
      url: `/collaboration/invites/${token}/register`,
      data,
    })
  }

  async getUserFarms(): Promise<any[]> {
    const response = await this.request({
      method: "GET",
      url: "/collaboration/farms",
    })
    return Array.isArray(response) ? response : []
  }

  // Farm endpoints
  async getFarms() {
    return this.request({
      method: "GET",
      url: "/farms",
    })
  }

  // Media endpoints
  async uploadUserProfile(file: File, isPublic: boolean = true) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('isPublic', isPublic.toString())

    return this.client.post("/media/upload/user-profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data)
  }

  async uploadLivestockMedia(data: {
    file: File;
    farmId: string;
    animalType: 'cattle' | 'poultry' | 'swine' | 'sheep' | 'goats';
    recordId: string;
    generateVariants?: boolean;
  }) {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('farmId', data.farmId)
    formData.append('animalType', data.animalType)
    formData.append('recordId', data.recordId)
    if (data.generateVariants) formData.append('generateVariants', 'true')

    return this.client.post("/media/upload/livestock", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data)
  }

  async uploadCropMedia(data: {
    file: File;
    farmId: string;
    purpose: 'identification' | 'health' | 'harvest' | 'treatment' | 'progress';
    fieldId: string;
    entityId?: string;
    generateVariants?: boolean;
  }) {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('farmId', data.farmId)
    formData.append('purpose', data.purpose)
    formData.append('fieldId', data.fieldId)
    if (data.entityId) formData.append('entityId', data.entityId)
    if (data.generateVariants) formData.append('generateVariants', 'true')

    return this.client.post("/media/upload/crops", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data)
  }

  async uploadSoilAnalysis(data: {
    file: File;
    farmId: string;
    analysisType: 'soil-test' | 'sand-analysis' | 'composition' | 'ph-test' | 'nutrient-analysis';
    locationId: string;
  }) {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('farmId', data.farmId)
    formData.append('analysisType', data.analysisType)
    formData.append('locationId', data.locationId)

    return this.client.post("/media/upload/soil-analysis", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data)
  }

  async uploadGenericMedia(data: {
    file: File;
    category: string;
    subcategory?: string;
    contextId: string;
    entityId?: string;
    generateVariants?: boolean;
    isPublic?: boolean;
    expiresAt?: string;
  }) {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('category', data.category)
    if (data.subcategory) formData.append('subcategory', data.subcategory)
    formData.append('contextId', data.contextId)
    if (data.entityId) formData.append('entityId', data.entityId)
    if (data.generateVariants) formData.append('generateVariants', 'true')
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString())
    if (data.expiresAt) formData.append('expiresAt', data.expiresAt)

    return this.client.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data)
  }

  async getMyMedia(params?: {
    limit?: number;
    offset?: number;
    mimeType?: 'image' | 'video' | 'application';
    status?: 'uploading' | 'processing' | 'ready' | 'failed';
  }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.mimeType) searchParams.append('mimeType', params.mimeType)
    if (params?.status) searchParams.append('status', params.status)

    return this.client.get(`/media/my-media?${searchParams}`).then(r => r.data)
  }

  async associateMedia(mediaId: string, data: {
    associatableType: string;
    associatableId: string;
    role: 'primary' | 'thumbnail' | 'attachment' | 'comparison' | 'before' | 'after' | 'evidence' | 'diagnostic';
    category: string;
    subcategory?: string;
    contextId: string;
    entityId?: string;
    order?: number;
  }) {
    return this.request({
      method: "POST",
      url: `/media/${mediaId}/associate`,
      data,
    })
  }

  async getMediaByAssociation(associationType: string, associationId: string, role?: string) {
    const params = role ? `?role=${role}` : ''
    return this.client.get(`/media/by-association/${associationType}/${associationId}${params}`).then(r => r.data)
  }

  async getMediaAnalytics() {
    return this.client.get("/media/analytics").then(r => r.data)
  }

  async generateMediaVariants(mediaId: string) {
    return this.client.post(`/media/${mediaId}/variants`).then(r => r.data)
  }

  async deleteMedia(mediaId: string) {
    return this.client.delete(`/media/${mediaId}`).then(r => r.data)
  }
}

export const apiClient = new ApiClient()
