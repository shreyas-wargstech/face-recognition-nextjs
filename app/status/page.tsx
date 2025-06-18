// app/status/page.tsx - Perfectly aligned with backend models and API
'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceStatusResponse, VerificationHistoryResponse, SystemStatsResponse } from '@/lib/api'
import { Activity, UserCheck, History, TrendingUp, CheckCircle, XCircle, Clock, Database, Wifi, Server, Shield, Eye, Award } from 'lucide-react'

const StatusPage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null)
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryResponse | null>(null)
  const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all data in parallel for better performance
        const [statusResult, historyResult, statsResult, healthResult] = await Promise.allSettled([
          faceAPI.getFaceStatus(userId),
          faceAPI.getVerificationHistory(userId, 20),
          faceAPI.getStats(),
          faceAPI.getHealth()
        ])
        
        // Handle face status
        if (statusResult.status === 'fulfilled') {
          setFaceStatus(statusResult.value)
        } else {
          console.error('Failed to fetch face status:', statusResult.reason)
          setFaceStatus({
            user_id: userId,
            user_name: demoUsers.find(u => u.id === userId)?.name || `User ${userId}`,
            registered: false
          })
        }
        
        // Handle verification history
        if (historyResult.status === 'fulfilled') {
          setVerificationHistory(historyResult.value)
        } else {
          console.error('Failed to fetch verification history:', historyResult.reason)
          setVerificationHistory({
            user_id: userId,
            total_verifications: 0,
            verifications: []
          })
        }
        
        // Handle system stats
        if (statsResult.status === 'fulfilled') {
          setSystemStats(statsResult.value)
        } else {
          console.error('Failed to fetch system stats:', statsResult.reason)
          setSystemStats({
            total_users: 4,
            registered_faces: 0,
            registration_rate: 0,
            success_rate_24h: 0,
            system_health: 'poor',
            active_sessions: 0,
            avg_processing_time: 0,
            total_verifications_today: 0
          })
        }
        
        // Handle system health
        if (healthResult.status === 'fulfilled') {
          setSystemHealth(healthResult.value)
        } else {
          console.error('Failed to fetch system health:', healthResult.reason)
          setSystemHealth({
            status: 'error',
            timestamp: new Date().toISOString(),
            engine: 'unknown',
            database: 'disconnected'
          })
        }
        
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load status data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  const handleUserChange = (newUserId: number) => {
    setUserId(newUserId)
    localStorage.setItem('selectedUserId', newUserId.toString())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getVerificationStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle size={16} className="text-green-600" />
    ) : (
      <XCircle size={16} className="text-red-600" />
    )
  }

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const selectedUser = demoUsers.find(u => u.id === userId)

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">User Status & System Analytics</h1>
        <p className="text-lg text-gray-600">
          View face registration status, verification history, and system performance metrics
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <XCircle size={20} className="text-red-600" />
            <div>
              <p className="font-medium text-red-800">Error Loading Data</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Selection */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Select User</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {demoUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleUserChange(user.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                userId === user.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {user.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Selected: {selectedUser?.name} (ID: {userId}) | Role: {selectedUser?.role}
        </p>
      </div>

      {/* Registration Status - matches backend Face model */}
      {faceStatus && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Face Registration Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">User ID:</span> {faceStatus.user_id}</p>
                <p><span className="text-gray-600">Name:</span> {faceStatus.user_name}</p>
                <p><span className="text-gray-600">Role:</span> {selectedUser?.role}</p>
                <p><span className="text-gray-600">Email:</span> {selectedUser?.email}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Face Registration Details</h3>
              {faceStatus.registered ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-green-600 font-medium">Registered</span>
                  </div>
                  {faceStatus.face_id && <p><span className="text-gray-600">Face ID:</span> {faceStatus.face_id}</p>}
                  {faceStatus.quality_score && <p><span className="text-gray-600">Quality Score:</span> {faceStatus.quality_score.toFixed(1)}%</p>}
                  {faceStatus.face_confidence && <p><span className="text-gray-600">Face Confidence:</span> {(faceStatus.face_confidence * 100).toFixed(1)}%</p>}
                  <p><span className="text-gray-600">Model:</span> {faceStatus.model_name || 'ArcFace'}</p>
                  <p><span className="text-gray-600">Detector:</span> {faceStatus.detector_backend || 'opencv'}</p>
                  <p><span className="text-gray-600">Source:</span> {faceStatus.registration_source || 'unknown'}</p>
                  {faceStatus.registered_at && (
                    <p><span className="text-gray-600">Registered:</span> {formatDate(faceStatus.registered_at)}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle size={16} className="text-red-600" />
                  <span className="text-red-600 font-medium">Not Registered</span>
                  <a href="/register" className="text-blue-600 hover:underline text-sm ml-2">
                    Register now →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Health - matches backend HealthResponse */}
      {systemHealth && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">System Health Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Wifi size={24} className={systemHealth.status === 'healthy' ? 'text-green-500' : 'text-red-500'} />
              </div>
              <div className="text-lg font-bold text-gray-900">API Server</div>
              <div className={`text-sm ${systemHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.status === 'healthy' ? 'Online' : 'Issues'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Database size={24} className={systemHealth.database === 'healthy' ? 'text-green-500' : 'text-red-500'} />
              </div>
              <div className="text-lg font-bold text-gray-900">Database</div>
              <div className={`text-sm ${systemHealth.database === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.database === 'healthy' ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Shield size={24} className="text-green-500" />
              </div>
              <div className="text-lg font-bold text-gray-900">Face Recognition</div>
              <div className="text-sm text-green-600">
                {systemHealth.engine || 'DeepFace + ArcFace'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity size={24} className="text-yellow-500" />
              </div>
              <div className="text-lg font-bold text-gray-900">Active Sessions</div>
              <div className="text-sm text-yellow-600">
                {systemHealth.active_connections || 0}
              </div>
            </div>
          </div>
          
          {/* System Configuration - matches backend configuration */}
          {systemHealth.configuration && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Model:</strong> {systemHealth.configuration.model}</p>
                  <p><strong>Detector:</strong> {systemHealth.configuration.detector}</p>
                  <p><strong>Distance Metric:</strong> {systemHealth.configuration.distance_metric}</p>
                </div>
                <div>
                  <p><strong>Anti-spoofing:</strong> {systemHealth.configuration.anti_spoofing ? 'Enabled' : 'Disabled'}</p>
                  <p><strong>Similarity Threshold:</strong> {systemHealth.configuration.threshold}%</p>
                  <p><strong>Version:</strong> {systemHealth.version || '3.0.0'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Performance Metrics */}
          {systemHealth.performance && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Performance Thresholds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <p><strong>Min Quality Score:</strong> {systemHealth.performance.min_quality_score}%</p>
                <p><strong>Min Face Confidence:</strong> {(systemHealth.performance.min_face_confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Statistics - matches backend SystemStatsResponse */}
      {systemStats && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">System Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{systemStats.total_users}</div>
              <div className="text-sm text-blue-800">Total Users</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{systemStats.registered_faces}</div>
              <div className="text-sm text-green-800">Registered Faces</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{systemStats.registration_rate.toFixed(1)}%</div>
              <div className="text-sm text-purple-800">Registration Rate</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{systemStats.success_rate_24h.toFixed(1)}%</div>
              <div className="text-sm text-orange-800">Success Rate (24h)</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{systemStats.active_sessions}</div>
              <div className="text-sm text-yellow-800">Active Sessions</div>
            </div>
            
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">{systemStats.avg_processing_time.toFixed(0)}ms</div>
              <div className="text-sm text-indigo-800">Avg Processing Time</div>
            </div>
            
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-xl font-bold text-pink-600">{systemStats.total_verifications_today}</div>
              <div className="text-sm text-pink-800">Verifications Today</div>
            </div>
          </div>
          
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getSystemHealthColor(systemStats.system_health)}`}>
              System Health: {systemStats.system_health}
            </span>
          </div>
        </div>
      )}

      {/* Verification History - matches backend FaceVerification model */}
      {verificationHistory && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <History className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Verification History</h2>
          </div>
          
          {verificationHistory.verifications.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No verification attempts yet</p>
              <p className="text-sm text-gray-500">Take a quiz to see your verification history</p>
              <a href="/course" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Go to Course →
              </a>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total Verifications: <span className="font-semibold">{verificationHistory.total_verifications}</span>
                </div>
                <div className="text-sm text-gray-600">
                  User: {verificationHistory.user_id} ({selectedUser?.name})
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-3 font-semibold text-gray-900">Date & Time</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-900">Result</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-900">Similarity</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-900">Quality</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-900">Context</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-900">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationHistory.verifications.map((verification) => (
                      <tr key={verification.verification_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-3 text-sm">
                          {verification.verification_datetime ? 
                            formatDate(verification.verification_datetime) : 
                            verification.verified_at ? formatDate(verification.verified_at) : 'N/A'
                          }
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                            verification.verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getVerificationStatusIcon(verification.verified)}
                            <span>{verification.verified ? 'Passed' : 'Failed'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <span className={`font-medium ${verification.similarity_score >= 55 ? 'text-green-600' : 'text-red-600'}`}>
                            {verification.similarity_score.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {verification.quality_score ? (
                            <span className={`${verification.quality_score >= 25 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {verification.quality_score.toFixed(1)}%
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <div className="space-y-1">
                            {verification.course_id && (
                              <div className="flex items-center space-x-1">
                                <BookOpen size={12} />
                                <span>Course: {verification.course_id}</span>
                              </div>
                            )}
                            {verification.quiz_id && (
                              <div className="flex items-center space-x-1">
                                <Award size={12} />
                                <span>Quiz: {verification.quiz_id}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-600">
                          <div className="space-y-1">
                            <p><strong>ID:</strong> {verification.verification_id}</p>
                            <p><strong>Model:</strong> {verification.model_name}</p>
                            <p><strong>Threshold:</strong> {verification.threshold_used}%</p>
                            <p><strong>Distance:</strong> {verification.distance.toFixed(3)}</p>
                            {verification.antispoofing_score && (
                              <p><strong>Anti-spoof:</strong> {(verification.antispoofing_score * 100).toFixed(1)}%</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Verification Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Verification Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      {verificationHistory.total_verifications > 0 ? 
                        ((verificationHistory.verifications.filter(v => v.verified).length / verificationHistory.total_verifications) * 100).toFixed(1) : 0
                      }%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Similarity:</span>
                    <span className="ml-2 font-semibold">
                      {verificationHistory.verifications.length > 0 ? 
                        (verificationHistory.verifications.reduce((sum, v) => sum + v.similarity_score, 0) / verificationHistory.verifications.length).toFixed(1) : 0
                      }%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Attempts:</span>
                    <span className="ml-2 font-semibold">{verificationHistory.total_verifications}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/register" className="card hover:shadow-lg transition-shadow cursor-pointer bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <UserCheck className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-blue-900">Register Face</h3>
          </div>
          <p className="text-blue-700">
            {faceStatus?.registered ? 'Re-register your face with improved settings' : 'Register your face for secure authentication'}
          </p>
        </a>

        <a href="/course" className="card hover:shadow-lg transition-shadow cursor-pointer bg-green-50 border-green-200">
          <div className="flex items-center space-x-3 mb-3">
            <Eye className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-green-900">Take Quiz</h3>
          </div>
          <p className="text-green-700">
            Test your knowledge with real-time face verification for secure assessment
          </p>
        </a>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-purple-900">Security Level</h3>
          </div>
          <p className="text-purple-700">
            Enterprise-grade face recognition with anti-spoofing protection
          </p>
          <div className="mt-2 text-sm text-purple-600">
            • ArcFace model • Real-time streaming • Encrypted storage
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusPage