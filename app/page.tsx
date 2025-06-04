'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { faceAPI } from '@/lib/api'
import { UserCircle, BookOpen, Shield, TrendingUp } from 'lucide-react'

const HomePage = () => {
  const [selectedUserId, setSelectedUserId] = useState<number>(1)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Demo users - in a real app, these would come from your database
  const demoUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    { id: 4, name: 'Alice Wilson', email: 'alice@example.com' },
  ]

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await faceAPI.getHealth()
        setHealthStatus(health)
      } catch (error) {
        console.error('Failed to check health:', error)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  const saveUserId = () => {
    localStorage.setItem('selectedUserId', selectedUserId.toString())
  }

  useEffect(() => {
    const saved = localStorage.getItem('selectedUserId')
    if (saved) {
      setSelectedUserId(parseInt(saved))
    }
  }, [])

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LMS Face Recognition Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Test the face recognition system for secure quiz access. 
          Register your face, take a course, and verify your identity before taking a quiz.
        </p>
      </div>

      {/* System Status */}
      {healthStatus && (
        <div className="mb-8">
          <div className={`card ${healthStatus.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                <p className={`text-sm ${healthStatus.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {healthStatus.status === 'healthy' ? '✅ All systems operational' : '⚠️ Some issues detected'}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <p>Model: {healthStatus.configuration?.model}</p>
                <p>Version: {healthStatus.version}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Selection */}
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
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUserId === user.id
                    ? 'border-primary-500 bg-primary-50'
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
                    <p className="text-xs text-gray-500">User ID: {user.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={saveUserId}
            className="btn-primary"
          >
            Select User {selectedUserId}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/register" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="text-primary-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Register Face</h3>
          </div>
          <p className="text-gray-600">
            Register your face for secure authentication. Take a clear photo of yourself.
          </p>
        </Link>

        <Link href="/course" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <BookOpen className="text-primary-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Take Course</h3>
          </div>
          <p className="text-gray-600">
            Access the demo course content and take the quiz with face verification.
          </p>
        </Link>

        <Link href="/status" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="text-primary-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">View Status</h3>
          </div>
          <p className="text-gray-600">
            Check your registration status and view verification history.
          </p>
        </Link>
      </div>

      {/* Instructions */}
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Test</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <h3 className="font-medium text-gray-900">Select a User</h3>
              <p className="text-gray-600">Choose one of the demo users above and click "Select User"</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <h3 className="font-medium text-gray-900">Register Your Face</h3>
              <p className="text-gray-600">Go to "Register Face" and take a clear photo of yourself</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <h3 className="font-medium text-gray-900">Take the Course</h3>
              <p className="text-gray-600">Access the demo course and attempt the quiz</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <div>
              <h3 className="font-medium text-gray-900">Face Verification</h3>
              <p className="text-gray-600">Before the quiz, verify your identity with another photo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage