import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests (you can modify this based on your auth setup)
api.interceptors.request.use((config) => {
  // For demo purposes, using a simple token
  config.headers.Authorization = 'Bearer lms-face-token-123'
  return config
})

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
  distance: number
  threshold: number
  quality_score: number
  processing_time: number
  model_name: string
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
  engine: string
  database: string
  services: {
    deepface: string
    database: string
    api: string
  }
  configuration: {
    model: string
    detector: string
    distance_metric: string
    anti_spoofing: boolean
    threshold: string | number
  }
  performance: {
    min_quality_score: number
    min_face_confidence: number
  }
  version: string
}

export const faceAPI = {
  // Register a user's face
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

  // Verify a user's face
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

  // Get face registration status
  async getFaceStatus(userId: number): Promise<FaceStatusResponse> {
    const response = await api.get(`/api/v1/face/status/${userId}`)
    return response.data
  },

  // Get verification history
  async getVerificationHistory(userId: number, limit: number = 10) {
    const response = await api.get(`/api/v1/face/verifications/${userId}?limit=${limit}`)
    return response.data
  },

  // Health check
  async getHealth(): Promise<HealthResponse> {
    const response = await api.get('/api/v1/health')
    return response.data
  },

  // System stats
  async getStats() {
    const response = await api.get('/api/v1/stats')
    return response.data
  },
}

export default api