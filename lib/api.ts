// lib/api.ts - Updated to work with real database users
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  // For demo purposes, using a simple token
  config.headers.Authorization = 'Bearer lms-face-token-123'
  return config
})

// Updated User interface to match database structure
export interface User {
  id: number
  name: string
  email?: string
  mobile?: string
  role: string
  roleId: number
  status: string
  active: boolean
  salutation?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  total_users: number
  students: number
  instructors: number
  staff: number
  admins: number
  registered_faces: number
  registration_rate: number
}

// Response interfaces (keeping existing ones)
export interface AppUser {
  id: number
  Name: string
  Email?: string
  MobileNumber?: string
  Status: string
  RoleID: number
  Active: boolean
  LastLoginDateTime?: string
  CreationDateTime: string
  UpdationDateTime: string
}

export interface Face {
  id: number
  UserID: number
  ModelName: string
  DetectorBackend: string
  QualityScore?: number
  FaceConfidence?: number
  S3Key?: string
  S3Url?: string
  IsActive: boolean
  RegistrationSource: string
  StorageType: string
  CreationDateTime: string
  UpdateDateTime: string
}

export interface FaceVerification {
  id: number
  UserID: number
  QuizID?: string
  CourseID?: string
  VerificationResult: boolean
  SimilarityScore: number
  Distance: number
  ThresholdUsed: number
  ModelName: string
  DistanceMetric: string
  ProcessingTime?: number
  S3Key?: string
  S3Url?: string
  QualityScore?: number
  VerificationDateTime: string
  CreationDateTime: string
}

export interface StreamingSession {
  id: number
  SessionID: string
  UserID: number
  SessionType: string
  Status: string
  FramesProcessed: number
  LivenessScore?: number
  AntiSpoofingScore?: number
  QualityScore?: number
  StartTime: string
  EndTime?: string
}

// API Response interfaces that match backend exactly
export interface FaceRegistrationResponse {
  success: boolean
  face_id: number
  user_id: number
  user_name: string
  quality_score: number
  face_confidence: number
  model_name: string
  processing_time: number
  message: string
  antispoofing_score?: number
  frames_processed?: number
  avg_processing_time?: number
  registration_source?: string
}

export interface FaceVerificationResponse {
  success: boolean
  verification_id: number
  user_id: number
  user_name: string
  quiz_id?: string
  course_id?: string
  verified: boolean
  similarity_score: number
  max_similarity_score?: number
  distance: number
  threshold: number
  quality_score: number
  antispoofing_score: number
  match_ratio: number
  confidence_score: number
  frames_processed: number
  processing_time: number
  avg_processing_time: number
  model_name: string
  verification_method: string
  threshold_used: number
  message: string
}

export interface FaceStatusResponse {
  user_id: number
  user_name: string
  registered: boolean
  face_id?: number
  quality_score?: number
  face_confidence?: number
  model_name?: string
  detector_backend?: string
  registration_source?: string
  registered_at?: string
}

export interface HealthResponse {
  status: string
  timestamp: string
  engine?: string
  database?: string
  services?: {
    deepface: string
    database: string
    api: string
  }
  configuration?: {
    model: string
    detector: string
    distance_metric: string
    anti_spoofing: boolean
    threshold: string | number
  }
  performance?: {
    min_quality_score: number
    min_face_confidence: number
  }
  version?: string
  active_connections?: number
  memory_usage?: number
}

export interface VerificationHistoryResponse {
  user_id: number
  total_verifications: number
  verifications: Array<{
    verification_id: number
    user_id: number
    quiz_id?: string
    course_id?: string
    verified: boolean
    similarity_score: number
    distance: number
    threshold_used: number
    model_name: string
    quality_score?: number
    antispoofing_score?: number
    verification_datetime?: string
    verified_at?: string
  }>
}

export interface SystemStatsResponse {
  total_users: number
  registered_faces: number
  registration_rate: number
  success_rate_24h: number
  system_health: 'excellent' | 'good' | 'poor'
  active_sessions: number
  avg_processing_time: number
  total_verifications_today: number
}

export const faceAPI = {
  // Traditional HTTP endpoints (if they exist in backend)
  async registerFace(userId: number, imageFile: File, source: string = 'web'): Promise<FaceRegistrationResponse> {
    const formData = new FormData()
    formData.append('user_id', userId.toString())
    formData.append('file', imageFile)
    formData.append('source', source)

    const response = await api.post('/api/v1/face/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Verify face (traditional endpoint)
  async verifyFace(
    userId: number, 
    imageFile: File, 
    quizId?: string, 
    courseId?: string
  ): Promise<FaceVerificationResponse> {
    const formData = new FormData()
    formData.append('user_id', userId.toString())
    formData.append('file', imageFile)
    if (quizId) formData.append('quiz_id', quizId)
    if (courseId) formData.append('course_id', courseId)

    const response = await api.post('/api/v1/face/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get face registration status - aligned with backend
  async getFaceStatus(userId: number): Promise<FaceStatusResponse> {
    try {
      const response = await api.get(`/api/v1/face/status/${userId}`)
      return response.data
    } catch (error: any) {
      // Handle case where user is not found
      if (error.response?.status === 404) {
        throw new Error('User not found')
      }
      throw error
    }
  },

  // Get verification history - aligned with backend response format
  async getVerificationHistory(userId: number, limit: number = 10): Promise<VerificationHistoryResponse> {
    try {
      const response = await api.get(`/api/v1/face/verifications/${userId}?limit=${limit}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          user_id: userId,
          total_verifications: 0,
          verifications: []
        }
      }
      throw error
    }
  },

  // Health check - aligned with backend HealthResponse
  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await api.get('/api/v1/health')
      return response.data
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        engine: 'unknown',
        database: 'unknown'
      }
    }
  },

  // System stats - aligned with backend response
  async getStats(): Promise<SystemStatsResponse> {
    try {
      const response = await api.get('/api/v1/stats')
      return response.data
    } catch (error) {
      return {
        total_users: 0,
        registered_faces: 0,
        registration_rate: 0,
        success_rate_24h: 0,
        system_health: 'poor',
        active_sessions: 0,
        avg_processing_time: 0,
        total_verifications_today: 0
      }
    }
  },

  // USER MANAGEMENT - NEW METHODS FOR DATABASE USERS
  // Fetch all users from database
  async fetchAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/api/v1/users')
      return response.data
    } catch (error) {
      console.error('Failed to fetch users:', error)
      throw new Error('Failed to fetch users from database')
    }
  },

  // Fetch specific user by ID
  async fetchUserById(userId: number): Promise<User> {
    try {
      const response = await api.get(`/api/v1/user/${userId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User not found')
      }
      console.error(`Failed to fetch user ${userId}:`, error)
      throw new Error('Failed to fetch user details')
    }
  },

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get('/api/v1/users/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      return {
        total_users: 0,
        students: 0,
        instructors: 0,
        staff: 0,
        admins: 0,
        registered_faces: 0,
        registration_rate: 0
      }
    }
  },

  // WebSocket connection helpers
  createRegistrationWebSocket(userId: number): WebSocket {
    const wsUrl = `ws://localhost:8000/ws/face-registration/${userId}`
    return new WebSocket(wsUrl)
  },

  createVerificationWebSocket(userId: number, quizId?: string, courseId?: string): WebSocket {
    const baseUrl = `ws://localhost:8000/ws/face-verification/${userId}`
    const params = new URLSearchParams()
    
    if (quizId) params.append('quiz_id', quizId)
    if (courseId) params.append('course_id', courseId)
    
    const wsUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
    return new WebSocket(wsUrl)
  },

  // Streaming session management (if backend supports these endpoints)
  async getActiveSession(userId: number): Promise<StreamingSession | null> {
    try {
      const response = await api.get(`/api/v1/streaming/session/${userId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async terminateSession(sessionId: string): Promise<boolean> {
    try {
      await api.post(`/api/v1/streaming/terminate/${sessionId}`)
      return true
    } catch (error) {
      console.error('Failed to terminate session:', error)
      return false
    }
  }
}

export default api