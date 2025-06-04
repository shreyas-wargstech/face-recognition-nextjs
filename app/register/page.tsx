'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceRegistrationResponse, FaceStatusResponse } from '@/lib/api'
import WebcamCapture from '@/components/WebcamCapture'
import { UserCheck, AlertCircle, CheckCircle } from 'lucide-react'

const RegisterPage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FaceRegistrationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('selectedUserId')
    if (saved) {
      setUserId(parseInt(saved))
    }
  }, [])

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setStatusLoading(true)
        const status = await faceAPI.getFaceStatus(userId)
        setFaceStatus(status)
      } catch (error) {
        console.error('Failed to check face status:', error)
      } finally {
        setStatusLoading(false)
      }
    }

    if (userId) {
      checkStatus()
    }
  }, [userId])

  const handleCapture = async (imageFile: File) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await faceAPI.registerFace(userId, imageFile, 'web')
      setResult(response)
      
      // Refresh status
      const status = await faceAPI.getFaceStatus(userId)
      setFaceStatus(status)
    } catch (error: any) {
      console.error('Registration failed:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleUserIdChange = (newUserId: number) => {
    setUserId(newUserId)
    localStorage.setItem('selectedUserId', newUserId.toString())
    setResult(null)
    setError(null)
  }

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Face Registration</h1>
        <p className="text-lg text-gray-600">
          Register your face for secure authentication
        </p>
      </div>

      {/* User Selection */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select User</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3, 4].map(id => (
            <button
              key={id}
              onClick={() => handleUserIdChange(id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                userId === id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              User {id}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Selected User ID: <span className="font-medium">{userId}</span>
        </p>
      </div>

      {/* Current Status */}
      {!statusLoading && faceStatus && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <UserCheck className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Current Status</h2>
          </div>
          
          {faceStatus.registered ? (
            <div className="alert-success">
              <div className="flex items-center space-x-2">
                <CheckCircle size={20} />
                <div>
                  <p className="font-medium">✅ Face Already Registered</p>
                  <p className="text-sm">
                    User: {faceStatus.user_name} | 
                    Quality: {faceStatus.quality_score?.toFixed(1)}% | 
                    Model: {faceStatus.model_name} |
                    Registered: {faceStatus.registered_at ? new Date(faceStatus.registered_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-info">
              <div className="flex items-center space-x-2">
                <AlertCircle size={20} />
                <div>
                  <p className="font-medium">No Face Registration Found</p>
                  <p className="text-sm">User: {faceStatus.user_name} - Please register your face below</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registration Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {faceStatus?.registered ? 'Re-register Face' : 'Register Face'}
        </h2>
        
        <div className="text-center">
          <WebcamCapture onCapture={handleCapture} loading={loading} />
          
          {loading && (
            <div className="mt-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="text-gray-600">Processing face registration...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="mt-6">
          <div className="alert-error">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} />
              <div>
                <p className="font-medium">Registration Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <div className="alert-success">
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} />
              <div>
                <p className="font-medium">✅ Face Registered Successfully!</p>
                <p className="text-sm">
                  Quality Score: {result.quality_score.toFixed(1)}% | 
                  Confidence: {result.face_confidence.toFixed(1)}% | 
                  Model: {result.model_name} |
                  Processing Time: {result.processing_time.toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Registration Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">•</span>
            <span>Ensure good lighting on your face</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">•</span>
            <span>Look directly at the camera</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">•</span>
            <span>Remove glasses, masks, or hats if possible</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">•</span>
            <span>Keep a neutral expression</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600">•</span>
            <span>Target quality score above 70% for best results</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default RegisterPage