// app/page.tsx - Perfectly aligned with backend
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { faceAPI, HealthResponse } from '@/lib/api'
import { UserCircle, BookOpen, Shield, TrendingUp, Server, Database, Wifi, Activity, CheckCircle, AlertCircle, XCircle, Users, Eye, Award, Clock } from 'lucide-react'

const HomePage = () => {
  const [selectedUserId, setSelectedUserId] = useState<number>(1)
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null)
  const [systemStats, setSystemStats] = useState<any>(null)
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
    const checkHealth = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch system health and stats
        const [healthResult, statsResult] = await Promise.allSettled([
          faceAPI.getHealth(),
          faceAPI.getStats()
        ])
        
        if (healthResult.status === 'fulfilled') {
          setHealthStatus(healthResult.value)
        } else {
          console.error('Failed to check health:', healthResult.reason)
          setHealthStatus({
            status: 'error',
            timestamp: new Date().toISOString(),
            engine: 'unknown',
            database: 'unknown'
          })
        }
        
        if (statsResult.status === 'fulfilled') {
          setSystemStats(statsResult.value)
        } else {
          console.error('Failed to get stats:', statsResult.reason)
          setSystemStats({
            total_users: 4,
            registered_faces: 0,
            registration_rate: 0,
            success_rate_24h: 0,
            system_health: 'unknown'
          })
        }
        
      } catch (error) {
        console.error('Failed to fetch system data:', error)
        setError('Failed to connect to backend services')
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  const saveUserId = () => {
    localStorage.setItem('selectedUserId', selectedUserId.toString())
    // Show confirmation
    const button = document.querySelector('.save-user-btn') as HTMLButtonElement
    if (button) {
      const originalText = button.textContent
      button.textContent = 'Saved!'
      button.disabled = true
      setTimeout(() => {
        button.textContent = originalText
        button.disabled = false
      }, 2000)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('selectedUserId')
    if (saved) {
      setSelectedUserId(parseInt(saved))
    }
  }, [])

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={20} className="text-green-500" />
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />
      default:
        return <XCircle size={20} className="text-red-500" />
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-red-200 bg-red-50'
    }
  }

  const getHealthText = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅ All systems operational'
      case 'warning':
        return '⚠️ Some issues detected'
      default:
        return '❌ System issues detected'
    }
  }

  const selectedUser = demoUsers.find(user => user.id === selectedUserId)

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LMS Face Recognition System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced real-time face recognition system for secure educational assessments. 
          Register your face, take courses, and verify your identity with enterprise-grade AI technology.
        </p>
      </div>

      {/* System Status - matches backend HealthResponse */}
      {loading ? (
        <div className="mb-8">
          <div className="card border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
              <span className="text-gray-600">Checking system status...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className={`card ${getHealthColor(healthStatus?.status || 'error')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getHealthIcon(healthStatus?.status || 'error')}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                  <p className={`text-sm ${
                    healthStatus?.status === 'healthy' ? 'text-green-600' : 
                    healthStatus?.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {getHealthText(healthStatus?.status || 'error')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Engine:</strong> {healthStatus?.engine || 'DeepFace + ArcFace'}</p>
                  <p><strong>Database:</strong> {healthStatus?.database || 'MySQL'}</p>
                  <p><strong>Version:</strong> {healthStatus?.version || '3.0.0'}</p>
                  <p><strong>Timestamp:</strong> {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleTimeString() : 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Connection Error:</strong> {error}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Some features may not be available. Please ensure the backend server is running.
                </p>
              </div>
            )}

            {/* Detailed Status - matches backend services structure */}
            {healthStatus?.services && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Server size={16} className={healthStatus.services.api === 'healthy' ? 'text-green-500' : 'text-red-500'} />
                  <span className="text-sm">API: {healthStatus.services.api}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database size={16} className={healthStatus.services.database === 'healthy' ? 'text-green-500' : 'text-red-500'} />
                  <span className="text-sm">Database: {healthStatus.services.database}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity size={16} className={healthStatus.services.deepface === 'healthy' ? 'text-green-500' : 'text-red-500'} />
                  <span className="text-sm">DeepFace: {healthStatus.services.deepface}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Statistics Overview */}
      {systemStats && (
        <div className="mb-8">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="text-primary-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">System Overview</h3>
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
                <div className="text-2xl font-bold text-purple-600">{systemStats.registration_rate?.toFixed(1) || 0}%</div>
                <div className="text-sm text-purple-800">Registration Rate</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{systemStats.success_rate_24h?.toFixed(1) || 0}%</div>
                <div className="text-sm text-orange-800">Success Rate (24h)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Selection - matches backend AppUser structure */}
      <div className="mb-8">
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Demo User</h2>
          <p className="text-gray-600 mb-4">
            Choose a user to test the face recognition system. In a real application, 
            this would be handled by your authentication system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {demoUsers.map(user => (
              <div
                key={user.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedUserId === user.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <UserCircle 
                    size={40} 
                    className={selectedUserId === user.id ? 'text-primary-600' : 'text-gray-400'} 
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">ID: {user.id}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">Role: {user.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium">{selectedUser?.name} (ID: {selectedUserId})</span>
            </div>
            <button
              onClick={saveUserId}
              className="btn-primary save-user-btn"
            >
              Select User {selectedUserId}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/register" className="card hover:shadow-lg transition-all cursor-pointer group bg-blue-50 border-blue-200 hover:border-blue-300">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="text-blue-600 group-hover:text-blue-700" size={28} />
            <h3 className="text-lg font-semibold text-blue-900">Register Face</h3>
          </div>
          <p className="text-blue-700 mb-3">
            Register your face for secure authentication using our advanced real-time streaming system.
          </p>
          <div className="text-xs text-blue-600">
            • Real-time processing • Anti-spoofing protection • ArcFace AI model
          </div>
        </Link>

        <Link href="/course" className="card hover:shadow-lg transition-all cursor-pointer group bg-green-50 border-green-200 hover:border-green-300">
          <div className="flex items-center space-x-3 mb-3">
            <BookOpen className="text-green-600 group-hover:text-green-700" size={28} />
            <h3 className="text-lg font-semibold text-green-900">Take Course</h3>
          </div>
          <p className="text-green-700 mb-3">
            Access the demo course content and take quizzes with real-time face verification.
          </p>
          <div className="text-xs text-green-600">
            • Interactive learning • Secure assessments • Identity verification
          </div>
        </Link>

        <Link href="/status" className="card hover:shadow-lg transition-all cursor-pointer group bg-purple-50 border-purple-200 hover:border-purple-300">
          <div className="flex items-center space-x-3 mb-3">
            <Activity className="text-purple-600 group-hover:text-purple-700" size={28} />
            <h3 className="text-lg font-semibold text-purple-900">View Status</h3>
          </div>
          <p className="text-purple-700 mb-3">
            Check your registration status, verification history, and system analytics.
          </p>
          <div className="text-xs text-purple-600">
            • User analytics • System metrics • Verification history
          </div>
        </Link>
      </div>

      {/* How to Test Instructions */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Test the System</h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Select a Demo User</h3>
              <p className="text-gray-600">Choose one of the demo users above and click "Select User" to set your testing identity</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Register Your Face</h3>
              <p className="text-gray-600">Go to "Register Face" and use the real-time streaming system to capture and register your facial features</p>
              <div className="mt-2 text-sm text-blue-600">
                • Requires 3 high-quality frames • Anti-spoofing detection • Encrypted storage
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Take the Course</h3>
              <p className="text-gray-600">Access the demo course to learn about programming variables and prepare for the quiz</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Face Verification</h3>
              <p className="text-gray-600">Before accessing the quiz, verify your identity with optimized real-time face recognition</p>
              <div className="mt-2 text-sm text-green-600">
                • Only 2 frames needed • 55% similarity threshold • Multiple retry attempts
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">View Analytics</h3>
              <p className="text-gray-600">Check the Status page to view your verification history and system performance metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications - matches backend configuration */}
      <div className="mt-8 card bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Technical Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">AI Models</h4>
            <ul className="space-y-1 text-gray-700 text-sm">
              <li>• <strong>Face Recognition:</strong> ArcFace</li>
              <li>• <strong>Face Detection:</strong> OpenCV / RetinaFace</li>
              <li>• <strong>Distance Metric:</strong> Cosine Similarity</li>
              <li>• <strong>Anti-spoofing:</strong> Advanced Liveness Detection</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Performance Thresholds</h4>
            <ul className="space-y-1 text-gray-700 text-sm">
              <li>• <strong>Registration Quality:</strong> ≥25%</li>
              <li>• <strong>Face Confidence:</strong> ≥50%</li>
              <li>• <strong>Verification Similarity:</strong> ≥55%</li>
              <li>• <strong>Anti-spoofing:</strong> ≥20% (verification)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">System Architecture</h4>
            <ul className="space-y-1 text-gray-700 text-sm">
              <li>• <strong>Backend:</strong> FastAPI + WebSockets</li>
              <li>• <strong>Database:</strong> MySQL with encryption</li>
              <li>• <strong>Real-time:</strong> Streaming video processing</li>
              <li>• <strong>Security:</strong> Enterprise-grade encryption</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">System Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p>✅ Real-time WebSocket streaming</p>
              <p>✅ Multi-criteria face matching</p>
              <p>✅ Automatic reconnection handling</p>
              <p>✅ Quality assessment per frame</p>
            </div>
            <div>
              <p>✅ Anti-spoofing protection</p>
              <p>✅ Encrypted face embeddings</p>
              <p>✅ Comprehensive audit logging</p>
              <p>✅ Optimized for 95%+ success rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Information */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>LMS Face Recognition System v3.0.0 • Built with FastAPI, Next.js, and DeepFace</p>
        <p className="mt-1">For demonstration purposes only • {healthStatus?.timestamp ? `Last updated: ${new Date(healthStatus.timestamp).toLocaleString()}` : ''}</p>
      </div>
    </div>
  )
}

export default HomePage