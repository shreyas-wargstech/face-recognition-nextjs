// app/course/page.tsx - Updated with Real-Time Face Verification
'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceStatusResponse } from '@/lib/api'
import RealTimeFaceVerification from '@/components/RealTimeFaceVerification'
import { BookOpen, Shield, CheckCircle, AlertCircle, Award, Users, Lock, Eye } from 'lucide-react'

const CoursePage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [currentSection, setCurrentSection] = useState<'course' | 'verification' | 'quiz' | 'results'>('course')
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [quizAnswer, setQuizAnswer] = useState<string>('')
  const [quizResult, setQuizResult] = useState<{ correct: boolean; score: number } | null>(null)
  const [faceStatus, setFaceStatus] = useState<FaceStatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const courseId = 'intro-to-programming'
  const quizId = 'quiz-1'

  // Demo users
  const demoUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    { id: 4, name: 'Alice Wilson', email: 'alice@example.com' },
  ]

  // Quiz data
  const quizQuestion = {
    question: "What is the primary purpose of a variable in programming?",
    options: [
      "To make the code look more complex",
      "To store and manage data that can be used and modified during program execution",
      "To slow down the program execution",
      "To create visual effects on the screen"
    ],
    correctAnswer: 1
  }

  useEffect(() => {
    const saved = localStorage.getItem('selectedUserId')
    if (saved) {
      setUserId(parseInt(saved))
    }
  }, [])

  useEffect(() => {
    const checkFaceStatus = async () => {
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
      checkFaceStatus()
    }
  }, [userId])

  const handleUserChange = (newUserId: number) => {
    setUserId(newUserId)
    localStorage.setItem('selectedUserId', newUserId.toString())
    
    // Reset states when changing user
    setCurrentSection('course')
    setVerificationResult(null)
    setQuizAnswer('')
    setQuizResult(null)
  }

  const handleStartQuiz = () => {
    if (!faceStatus?.registered) {
      alert('Please register your face first before taking the quiz.')
      return
    }
    
    setCurrentSection('verification')
    setVerificationResult(null)
  }

  const handleVerificationSuccess = (result: any) => {
    setVerificationResult(result)
    
    if (result.verified) {
      // Verification successful, proceed to quiz after a short delay
      setTimeout(() => {
        setCurrentSection('quiz')
      }, 2000)
    } else {
      // Verification failed, stay on verification screen
      setTimeout(() => {
        setCurrentSection('course')
      }, 3000)
    }
  }

  const handleVerificationError = (error: string) => {
    console.error('Verification error:', error)
    // Error is already displayed in the component
  }

  const handleQuizSubmit = () => {
    const selectedAnswerIndex = parseInt(quizAnswer)
    const isCorrect = selectedAnswerIndex === quizQuestion.correctAnswer
    const score = isCorrect ? 100 : 0
    
    setQuizResult({ correct: isCorrect, score })
    setCurrentSection('results')
  }

  const handleRetake = () => {
    setCurrentSection('course')
    setQuizAnswer('')
    setQuizResult(null)
    setVerificationResult(null)
  }

  const selectedUser = demoUsers.find(user => user.id === userId)

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Introduction to Programming</h1>
        <p className="text-lg text-gray-600">
          Learn the fundamentals of programming and test your knowledge with secure real-time verification
        </p>
      </div>

      {/* User Selection */}
      <div className="card mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <Users className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Current User</h2>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {demoUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserChange(user.id)}
                className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                  userId === user.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Selected: {selectedUser?.name} (ID: {userId})
          </div>
        </div>

        {/* Face Registration Status */}
        {!statusLoading && faceStatus && (
          <div className="mt-4 p-3 rounded-lg border">
            {faceStatus.registered ? (
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Face registered ✓</span>
                <span className="text-xs text-gray-600">
                  (Quality: {faceStatus.quality_score?.toFixed(1)}%)
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Face not registered</span>
                <a href="/register" className="text-xs text-blue-600 hover:underline ml-2">
                  Register now →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Content */}
      {currentSection === 'course' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="text-primary-600" size={24} />
              <h2 className="text-2xl font-semibold text-gray-900">Course Content</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What are Variables?</h3>
              <p className="text-gray-700 mb-4">
                Variables are fundamental building blocks in programming. They act as containers that store data values. 
                Think of them as labeled boxes where you can put different types of information that your program can use and modify.
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Key Concepts:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Storage:</strong> Variables store data in your computer's memory</li>
                <li><strong>Naming:</strong> Each variable has a unique name to identify it</li>
                <li><strong>Types:</strong> Variables can store different types of data (numbers, text, true/false values)</li>
                <li><strong>Modification:</strong> The value stored in a variable can be changed during program execution</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Example:</h4>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <code className="text-sm">
                  <span className="text-blue-600">let</span> <span className="text-purple-600">userName</span> = <span className="text-green-600">"John"</span>;<br/>
                  <span className="text-blue-600">let</span> <span className="text-purple-600">age</span> = <span className="text-orange-600">25</span>;<br/>
                  <span className="text-blue-600">let</span> <span className="text-purple-600">isStudent</span> = <span className="text-red-600">true</span>;
                </code>
              </div>
              
              <p className="text-gray-700">
                In this example, we created three variables: <code>userName</code> stores text, 
                <code>age</code> stores a number, and <code>isStudent</code> stores a boolean (true/false) value.
              </p>
            </div>
          </div>

          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center space-x-3 mb-3">
              <Lock className="text-primary-600" size={24} />
              <h3 className="text-lg font-semibold text-primary-900">Ready to Test Your Knowledge?</h3>
            </div>
            <p className="text-primary-800 mb-4">
              Complete the quiz to test your understanding of variables. 
              Real-time face verification will be required before you can access the quiz to ensure academic integrity.
            </p>
            
            {faceStatus?.registered ? (
              <button
                onClick={handleStartQuiz}
                className="btn-primary flex items-center space-x-2"
              >
                <Shield size={20} />
                <span>Start Quiz (Real-Time Verification Required)</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="alert-info">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-medium">Face Registration Required</p>
                      <p className="text-sm">You must register your face before taking the quiz.</p>
                    </div>
                  </div>
                </div>
                <a 
                  href="/register" 
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Shield size={20} />
                  <span>Register Face First</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-Time Face Verification */}
      {currentSection === 'verification' && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Eye className="text-primary-600" size={24} />
            <h2 className="text-2xl font-semibold text-gray-900">Real-Time Identity Verification</h2>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600 mb-2">
              Please verify your identity before accessing the quiz
            </p>
            <p className="text-sm text-gray-500">
              This ensures academic integrity and prevents unauthorized access
            </p>
          </div>

          <RealTimeFaceVerification
            userId={userId}
            quizId={quizId}
            courseId={courseId}
            onSuccess={handleVerificationSuccess}
            onError={handleVerificationError}
            className="w-full"
          />

          {verificationResult && (
            <div className="mt-6">
              {verificationResult.verified ? (
                <div className="alert-success">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <div>
                      <p className="font-medium">✅ Identity Verified Successfully!</p>
                      <p className="text-sm">
                        Similarity: {verificationResult.similarity_score?.toFixed(1)}% | 
                        Quality: {verificationResult.quality_score?.toFixed(1)}% | 
                        Match Ratio: {(verificationResult.match_ratio * 100)?.toFixed(1)}%
                      </p>
                      <p className="text-sm mt-1">Redirecting to quiz...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert-error">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={20} />
                    <div>
                      <p className="font-medium">❌ Identity Verification Failed</p>
                      <p className="text-sm">
                        Similarity: {verificationResult.similarity_score?.toFixed(1)}% (Required: ≥70%) |
                        Match Ratio: {(verificationResult.match_ratio * 100)?.toFixed(1)}%
                      </p>
                      <p className="text-sm mt-1">Please try again or contact support if you continue to have issues.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quiz */}
      {currentSection === 'quiz' && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Award className="text-primary-600" size={24} />
            <h2 className="text-2xl font-semibold text-gray-900">Quiz: Variables in Programming</h2>
          </div>

          {/* Verification Status */}
          {verificationResult && verificationResult.verified && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Identity Verified</p>
                  <p className="text-sm text-green-700">
                    {selectedUser?.name} verified with {verificationResult.similarity_score?.toFixed(1)}% similarity
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{quizQuestion.question}</h3>
            
            <div className="space-y-3">
              {quizQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="quiz-answer"
                    value={index}
                    checked={quizAnswer === index.toString()}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleQuizSubmit}
            disabled={!quizAnswer}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Quiz Results */}
      {currentSection === 'results' && quizResult && (
        <div className="card">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              quizResult.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {quizResult.correct ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {quizResult.correct ? 'Congratulations!' : 'Not Quite Right'}
            </h2>
            
            <p className="text-lg text-gray-600 mb-4">
              Your Score: <span className="font-bold text-2xl">{quizResult.score}%</span>
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Correct Answer:</h3>
              <p className="text-gray-700">{quizQuestion.options[quizQuestion.correctAnswer]}</p>
              
              {!quizResult.correct && (
                <div className="mt-3">
                  <h4 className="font-semibold text-gray-900 mb-1">Your Answer:</h4>
                  <p className="text-red-600">{quizQuestion.options[parseInt(quizAnswer)]}</p>
                </div>
              )}
            </div>

            {/* Verification Summary */}
            {verificationResult && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Verification Summary</h3>
                <div className="text-blue-800 text-sm space-y-1">
                  <p><strong>Student:</strong> {selectedUser?.name} (ID: {verificationResult.user_id})</p>
                  <p><strong>Verification ID:</strong> {verificationResult.verification_id}</p>
                  <p><strong>Similarity Score:</strong> {verificationResult.similarity_score?.toFixed(1)}%</p>
                  <p><strong>Quality Score:</strong> {verificationResult.quality_score?.toFixed(1)}%</p>
                  <p><strong>Match Ratio:</strong> {(verificationResult.match_ratio * 100)?.toFixed(1)}%</p>
                  <p><strong>Course:</strong> {courseId}</p>
                  <p><strong>Quiz:</strong> {quizId}</p>
                  <p><strong>Anti-spoofing:</strong> Passed ✓</p>
                </div>
              </div>
            )}
            
            <button
              onClick={handleRetake}
              className="btn-primary"
            >
              Return to Course
            </button>
          </div>
        </div>
      )}

      {/* Security Information */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-3 mb-3">
          <Shield className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-blue-900">Enhanced Security Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Real-Time Verification</h4>
            <ul className="space-y-1">
              <li>• Live video stream analysis</li>
              <li>• Multiple frame verification</li>
              <li>• Similarity scoring</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Anti-Spoofing Protection</h4>
            <ul className="space-y-1">
              <li>• Prevents photo attacks</li>
              <li>• Detects video replays</li>
              <li>• Liveness detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoursePage