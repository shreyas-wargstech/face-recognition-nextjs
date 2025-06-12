// app/register/page.tsx - Updated with Real-Time Face Registration
'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceStatusResponse } from '@/lib/api'
import RealTimeFaceRegistration from '@/components/RealTimeFaceRegistration'
import { UserCheck, AlertCircle, CheckCircle, Info, Users, Shield } from 'lucide-react'

const RegisterPage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [registrationResult, setRegistrationResult] = useState<any>(null)
  const [showRegistration, setShowRegistration] = useState(false)

  // Demo users - in a real app, these would come from your database
  const demoUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    { id: 4, name: 'Alice Wilson', email: 'alice@example.com' },
  ]

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

  const handleUserIdChange = (newUserId: number) => {
    setUserId(newUserId)
    localStorage.setItem('selectedUserId', newUserId.toString())
    setRegistrationResult(null)
    setShowRegistration(false)
    
    // Refresh status for new user
    setStatusLoading(true)
  }

  const handleRegistrationSuccess = (result: any) => {
    setRegistrationResult(result)
    setShowRegistration(false)
    
    // Refresh face status
    const refreshStatus = async () => {
      try {
        const status = await faceAPI.getFaceStatus(userId)
        setFaceStatus(status)
      } catch (error) {
        console.error('Failed to refresh face status:', error)
      }
    }
    
    refreshStatus()
  }

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error)
    // The error is already displayed in the component
  }

  const startRegistration = () => {
    setRegistrationResult(null)
    setShowRegistration(true)
  }

  const cancelRegistration = () => {
    setShowRegistration(false)
  }

  const selectedUser = demoUsers.find(user => user.id === userId)

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Face Registration</h1>
        <p className="text-lg text-gray-600">
          Register your face using our advanced real-time system with anti-spoofing protection
        </p>
      </div>

      {/* User Selection */}
      <div className="card mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="text-primary-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Select Demo User</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {demoUsers.map(user => (
            <div
              key={user.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                userId === user.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleUserIdChange(user.id)}
            >
              <div className="flex items-center space-x-3">
                <UserCheck 
                  size={40} 
                  className={userId === user.id ? 'text-primary-600' : 'text-gray-400'} 
                />
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">User ID: {user.id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Selected User: <span className="font-medium">{selectedUser?.name} (ID: {userId})</span>
        </p>
      </div>

      {/* Current Status */}
      {!statusLoading && faceStatus && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <UserCheck className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Current Registration Status</h2>
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
                    Source: {faceStatus.registration_source} |
                    Registered: {faceStatus.registered_at ? new Date(faceStatus.registered_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-info">
              <div className="flex items-center space-x-2">
                <Info size={20} />
                <div>
                  <p className="font-medium">No Face Registration Found</p>
                  <p className="text-sm">User: {faceStatus.user_name} - Please register your face using the real-time system below</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registration Success Result */}
      {registrationResult && (
        <div className="card mb-6">
          <div className="alert-success">
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} />
              <div>
                <p className="font-medium">✅ Registration Completed Successfully!</p>
                <p className="text-sm">
                  Quality Score: {registrationResult.quality_score?.toFixed(1)}% | 
                  Anti-spoofing Score: {(registrationResult.antispoofing_score * 100)?.toFixed(1)}% | 
                  Frames Processed: {registrationResult.frames_processed} |
                  Face ID: {registrationResult.face_id}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Interface */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              {faceStatus?.registered ? 'Re-register Face' : 'Register Face'}
            </h2>
          </div>
          
          {!showRegistration && (
            <button
              onClick={startRegistration}
              className="btn-primary"
            >
              {faceStatus?.registered ? 'Re-register with Real-Time System' : 'Start Real-Time Registration'}
            </button>
          )}
          
          {showRegistration && (
            <button
              onClick={cancelRegistration}
              className="btn-secondary"
            >
              Cancel Registration
            </button>
          )}
        </div>
        
        {showRegistration ? (
          <RealTimeFaceRegistration
            userId={userId}
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
            className="w-full"
          />
        ) : (
          <div className="text-center py-12">
            <Shield size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Click "Start Real-Time Registration" to begin the secure face registration process
            </p>
            <p className="text-sm text-gray-500">
              The system will capture multiple frames with anti-spoofing detection for maximum security
            </p>
          </div>
        )}
      </div>

      {/* Security Features */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔒 Enhanced Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Real-Time Processing</h4>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Live video stream analysis</li>
              <li>• Multiple frame verification</li>
              <li>• Quality assessment per frame</li>
              <li>• Automatic best frame selection</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Anti-Spoofing Protection</h4>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Liveness detection</li>
              <li>• Photo attack prevention</li>
              <li>• Video replay protection</li>
              <li>• Advanced spoof detection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Registration Tips */}
      <div className="mt-6 card bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">📋 Registration Tips for Best Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-800 mb-2">Environment</h4>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>• Ensure good, even lighting</li>
              <li>• Avoid backlighting or shadows</li>
              <li>• Use a stable internet connection</li>
              <li>• Find a quiet, controlled environment</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-green-800 mb-2">Positioning</h4>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>• Look directly at the camera</li>
              <li>• Keep your face centered</li>
              <li>• Maintain consistent distance</li>
              <li>• Remove glasses or masks if possible</li>
              <li>• Stay still during capture</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Information */}
      <div className="mt-6 card bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Technical Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">AI Model</h4>
            <p>ArcFace with RetinaFace detection</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Frame Requirements</h4>
            <p>10 high-quality frames minimum</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Security Level</h4>
            <p>Enterprise-grade anti-spoofing</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage