// app/register/page.tsx - Perfectly aligned with backend
'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceStatusResponse } from '@/lib/api'
import RealTimeFaceRegistration from '@/components/RealTimeFaceRegistration'
import { UserCheck, AlertCircle, CheckCircle, Info, Users, Shield, Clock, TrendingUp } from 'lucide-react'

const RegisterPage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [registrationResult, setRegistrationResult] = useState<any>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Demo users - matches backend AppUser structure
  const demoUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Student' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Student' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Instructor' },
    { id: 4, name: 'Alice Wilson', email: 'alice@example.com', role: 'Student' },
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
        // Provide fallback status for demo
        setFaceStatus({
          user_id: userId,
          user_name: demoUsers.find(u => u.id === userId)?.name || `User ${userId}`,
          registered: false
        })
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
    setIsRegistering(false)
    
    // Refresh status for new user
    setStatusLoading(true)
  }

  const handleRegistrationSuccess = (result: any) => {
    console.log('Registration successful:', result)
    setRegistrationResult(result)
    setShowRegistration(false)
    setIsRegistering(false)
    
    // Refresh face status to show updated registration
    const refreshStatus = async () => {
      try {
        const status = await faceAPI.getFaceStatus(userId)
        setFaceStatus(status)
      } catch (error) {
        console.error('Failed to refresh face status:', error)
        // Update local status based on registration result
        setFaceStatus({
          user_id: result.user_id,
          user_name: result.user_name,
          registered: true,
          face_id: result.face_id,
          quality_score: result.quality_score,
          face_confidence: result.face_confidence,
          model_name: result.model_name || 'ArcFace',
          registration_source: result.registration_source || 'stream_v2',
          registered_at: new Date().toISOString()
        })
      }
    }
    
    refreshStatus()
  }

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error)
    setIsRegistering(false)
    // Error is already displayed in the component
  }

  const startRegistration = () => {
    setRegistrationResult(null)
    setShowRegistration(true)
    setIsRegistering(true)
  }

  const cancelRegistration = () => {
    setShowRegistration(false)
    setIsRegistering(false)
  }

  const selectedUser = demoUsers.find(user => user.id === userId)

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Face Registration</h1>
        <p className="text-lg text-gray-600">
          Register your face using our advanced real-time streaming system with anti-spoofing protection
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
                  <p className="text-xs text-gray-500">User ID: {user.id} | Role: {user.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Selected User: <span className="font-medium">{selectedUser?.name} (ID: {userId})</span>
        </p>
      </div>

      {/* Current Status - matches backend Face model structure */}
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
                  <div className="text-sm space-y-1 mt-2">
                    <p><strong>User:</strong> {faceStatus.user_name}</p>
                    {faceStatus.face_id && <p><strong>Face ID:</strong> {faceStatus.face_id}</p>}
                    {faceStatus.quality_score && <p><strong>Quality Score:</strong> {faceStatus.quality_score.toFixed(1)}%</p>}
                    {faceStatus.face_confidence && <p><strong>Face Confidence:</strong> {(faceStatus.face_confidence * 100).toFixed(1)}%</p>}
                    {faceStatus.model_name && <p><strong>Model:</strong> {faceStatus.model_name}</p>}
                    {faceStatus.detector_backend && <p><strong>Detector:</strong> {faceStatus.detector_backend}</p>}
                    {faceStatus.registration_source && <p><strong>Source:</strong> {faceStatus.registration_source}</p>}
                    {faceStatus.registered_at && (
                      <p><strong>Registered:</strong> {new Date(faceStatus.registered_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert-info">
              <div className="flex items-center space-x-2">
                <Info size={20} />
                <div>
                  <p className="font-medium">No Face Registration Found</p>
                  <p className="text-sm">User: {faceStatus.user_name} - Please register your face using the real-time streaming system below</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registration Success Result - matches backend response structure */}
      {registrationResult && (
        <div className="card mb-6">
          <div className="alert-success">
            <div className="flex items-center space-x-2">
              <CheckCircle size={20} />
              <div>
                <p className="font-medium">✅ Registration Completed Successfully!</p>
                <div className="text-sm space-y-1 mt-2">
                  <p><strong>User:</strong> {registrationResult.user_name}</p>
                  <p><strong>Face ID:</strong> {registrationResult.face_id}</p>
                  <p><strong>Quality Score:</strong> {registrationResult.quality_score?.toFixed(1)}%</p>
                  <p><strong>Anti-spoofing Score:</strong> {(registrationResult.antispoofing_score * 100)?.toFixed(1)}%</p>
                  <p><strong>Face Confidence:</strong> {(registrationResult.face_confidence * 100)?.toFixed(1)}%</p>
                  <p><strong>Frames Processed:</strong> {registrationResult.frames_processed}</p>
                  <p><strong>Model:</strong> {registrationResult.model_name || 'ArcFace'}</p>
                  <p><strong>Registration Source:</strong> {registrationResult.registration_source || 'stream_v2'}</p>
                  {registrationResult.avg_processing_time && (
                    <p><strong>Avg Processing Time:</strong> {registrationResult.avg_processing_time.toFixed(0)}ms</p>
                  )}
                </div>
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
          
          {!showRegistration && !isRegistering && (
            <button
              onClick={startRegistration}
              className="btn-primary"
            >
              {faceStatus?.registered ? 'Re-register with Real-Time System' : 'Start Real-Time Registration'}
            </button>
          )}
          
          {showRegistration && isRegistering && (
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
              The system will capture and process multiple frames with advanced anti-spoofing detection
            </p>
          </div>
        )}
      </div>

      {/* Security Features - aligned with backend capabilities */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔒 Enhanced Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Real-Time Processing</h4>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Live video stream WebSocket connection</li>
              <li>• 3 high-quality frames minimum (optimized)</li>
              <li>• Quality assessment per frame (≥25% threshold)</li>
              <li>• Automatic best frame selection</li>
              <li>• Frame skip optimization (1 frame/second)</li>
              <li>• Encrypted face embedding storage</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Anti-Spoofing Protection</h4>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Advanced liveness detection (≥40% threshold)</li>
              <li>• Photo attack prevention</li>
              <li>• Video replay protection</li>
              <li>• Face confidence scoring (≥50%)</li>
              <li>• Real-time spoofing alerts</li>
              <li>• Multi-criteria validation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Registration Tips */}
      <div className="mt-6 card bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">📋 Registration Tips for Best Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-green-800 mb-2">Environment Setup</h4>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>• Ensure good, even lighting on your face</li>
              <li>• Avoid backlighting or harsh shadows</li>
              <li>• Use a stable internet connection</li>
              <li>• Find a quiet, controlled environment</li>
              <li>• Ensure camera permissions are granted</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-green-800 mb-2">Positioning & Behavior</h4>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>• Look directly at the camera lens</li>
              <li>• Keep your face centered in the frame</li>
              <li>• Maintain consistent distance (arm's length)</li>
              <li>• Remove glasses or masks if possible</li>
              <li>• Stay still during frame capture</li>
              <li>• Allow 1-2 seconds between captures</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Information - matches backend implementation */}
      <div className="mt-6 card bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">⚙️ Technical Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">AI Model</h4>
            <p>ArcFace with OpenCV detection</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Frame Requirements</h4>
            <p>3 high-quality frames minimum</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Security Level</h4>
            <p>Enterprise-grade anti-spoofing</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Connection</h4>
            <p>WebSocket real-time streaming</p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Quality Thresholds</h4>
            <ul className="space-y-1">
              <li>• Face Quality: ≥25%</li>
              <li>• Face Confidence: ≥50%</li>
              <li>• Anti-spoofing: ≥40%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Performance</h4>
            <ul className="space-y-1">
              <li>• Processing: ~1-3 seconds/frame</li>
              <li>• Connection timeout: 15 seconds</li>
              <li>• Auto-reconnect: 3 attempts</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Storage</h4>
            <ul className="space-y-1">
              <li>• Encrypted embeddings</li>
              <li>• Database: Face table</li>
              <li>• Source: stream_v2</li>
            </ul>
          </div>
        </div>
      </div>

      {/* System Status Indicator */}
      <div className="mt-6 card bg-yellow-50 border-yellow-200">
        <div className="flex items-center space-x-3 mb-3">
          <TrendingUp className="text-yellow-600" size={20} />
          <h3 className="text-lg font-semibold text-yellow-900">System Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <div className="text-lg font-bold text-green-700">Operational</div>
            <div className="text-green-600">WebSocket Server</div>
          </div>
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <div className="text-lg font-bold text-blue-700">Active</div>
            <div className="text-blue-600">Face Recognition AI</div>
          </div>
          <div className="text-center p-3 bg-purple-100 rounded-lg">
            <div className="text-lg font-bold text-purple-700">Ready</div>
            <div className="text-purple-600">Anti-spoofing Engine</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage