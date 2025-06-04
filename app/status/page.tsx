'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceStatusResponse } from '@/lib/api'
import { Activity, UserCheck, History, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'

const StatusPage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null)
  const [verificationHistory, setVerificationHistory] = useState<any>(null)
  const [systemStats, setSystemStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
        
        // Fetch face status
        const status = await faceAPI.getFaceStatus(userId)
        setFaceStatus(status)
        
        // Fetch verification history
        const history = await faceAPI.getVerificationHistory(userId, 20)
        setVerificationHistory(history)
        
        // Fetch system stats
        const stats = await faceAPI.getStats()
        setSystemStats(stats)
        
      } catch (error) {
        console.error('Failed to fetch data:', error)
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

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">User Status & History</h1>
        <p className="text-lg text-gray-600">
          View registration status and verification history
        </p>
      </div>

      {/* User Selection */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Select User</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(id => (
            <button
              key={id}
              onClick={() => handleUserChange(id)}
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
      </div>

      {/* Registration Status */}
      {faceStatus && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Registration Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">User ID:</span> {faceStatus.user_id}</p>
                <p><span className="text-gray-600">Name:</span> {faceStatus.user_name}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Face Registration</h3>
              {faceStatus.registered ? (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-green-600 font-medium">Registered</span>
                  </div>
                  <p><span className="text-gray-600">Face ID:</span> {faceStatus.face_id}</p>
                  <p><span className="text-gray-600">Quality Score:</span> {faceStatus.quality_score?.toFixed(1)}%</p>
                  <p><span className="text-gray-600">Confidence:</span> {faceStatus.face_confidence?.toFixed(1)}%</p>
                  <p><span className="text-gray-600">Model:</span> {faceStatus.model_name}</p>
                  <p><span className="text-gray-600">Source:</span> {faceStatus.registration_source}</p>
                  {faceStatus.registered_at && (
                    <p><span className="text-gray-600">Registered:</span> {formatDate(faceStatus.registered_at)}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <XCircle size={16} className="text-red-600" />
                  <span className="text-red-600 font-medium">Not Registered</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Statistics */}
      {systemStats && (
        <div className="card mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">System Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <div className="mt-4 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              systemStats.system_health === 'excellent' ? 'bg-green-100 text-green-800' :
              systemStats.system_health === 'good' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              System Health: {systemStats.system_health}
            </span>
          </div>
        </div>
      )}

      {/* Verification History */}
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
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Total Verifications: {verificationHistory.total_verifications}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Result</th>
                      <th className="text-left py-2 px-3">Similarity</th>
                      <th className="text-left py-2 px-3">Quality</th>
                      <th className="text-left py-2 px-3">Course/Quiz</th>
                      <th className="text-left py-2 px-3">Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationHistory.verifications.map((verification: any) => (
                      <tr key={verification.verification_id} className="border-b border-gray-100">
                        <td className="py-3 px-3 text-sm">
                          {verification.verified_at ? formatDate(verification.verified_at) : 'N/A'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                            verification.verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {verification.verified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            <span>{verification.verified ? 'Passed' : 'Failed'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {verification.similarity_score.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-sm">
                          {verification.quality_score?.toFixed(1) || 'N/A'}%
                        </td>
                        <td className="py-3 px-3 text-sm">
                          <div>
                            {verification.course_id && <div>Course: {verification.course_id}</div>}
                            {verification.quiz_id && <div>Quiz: {verification.quiz_id}</div>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-600">
                          {verification.model_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StatusPage