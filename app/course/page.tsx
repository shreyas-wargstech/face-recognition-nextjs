'use client'

import React, { useState, useEffect } from 'react'
import { faceAPI, FaceVerificationResponse } from '@/lib/api'
import WebcamCapture from '@/components/WebcamCapture'
import { BookOpen, Shield, CheckCircle, AlertCircle, Award } from 'lucide-react'

const CoursePage = () => {
  const [userId, setUserId] = useState<number>(1)
  const [currentSection, setCurrentSection] = useState<'course' | 'verification' | 'quiz' | 'results'>('course')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResponse | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [quizAnswer, setQuizAnswer] = useState<string>('')
  const [quizResult, setQuizResult] = useState<{ correct: boolean; score: number } | null>(null)

  const courseId = 'intro-to-programming'
  const quizId = 'quiz-1'

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

  const handleStartQuiz = () => {
    setCurrentSection('verification')
    setVerificationResult(null)
    setVerificationError(null)
  }

  const handleVerificationCapture = async (imageFile: File) => {
    setVerificationLoading(true)
    setVerificationError(null)
    setVerificationResult(null)

    try {
      const response = await faceAPI.verifyFace(userId, imageFile, quizId, courseId)
      setVerificationResult(response)
      
      if (response.verified) {
        // Verification successful, proceed to quiz
        setTimeout(() => {
          setCurrentSection('quiz')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Verification failed:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Verification failed'
      setVerificationError(errorMessage)
    } finally {
      setVerificationLoading(false)
    }
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
    setVerificationError(null)
  }

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Introduction to Programming</h1>
        <p className="text-lg text-gray-600">
          Learn the fundamentals of programming and test your knowledge
        </p>
      </div>

      {/* User Selection */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current User</h2>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(id => (
              <button
                key={id}
                onClick={() => {
                  setUserId(id)
                  localStorage.setItem('selectedUserId', id.toString())
                }}
                className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                  userId === id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                User {id}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-600">Selected: User {userId}</span>
        </div>
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
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Ready to Test Your Knowledge?</h3>
            <p className="text-primary-800 mb-4">
              Complete the quiz to test your understanding of variables. 
              Face verification will be required before you can access the quiz.
            </p>
            <button
              onClick={handleStartQuiz}
              className="btn-primary flex items-center space-x-2"
            >
              <Shield size={20} />
              <span>Start Quiz (Face Verification Required)</span>
            </button>
          </div>
        </div>
      )}

      {/* Face Verification */}
      {currentSection === 'verification' && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="text-primary-600" size={24} />
            <h2 className="text-2xl font-semibold text-gray-900">Identity Verification Required</h2>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600 mb-2">
              Please verify your identity before accessing the quiz
            </p>
            <p className="text-sm text-gray-500">
              This ensures academic integrity and prevents unauthorized access
            </p>
          </div>

          <WebcamCapture onCapture={handleVerificationCapture} loading={verificationLoading} />

          {verificationLoading && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="text-gray-600">Verifying your identity...</span>
              </div>
            </div>
          )}

          {verificationError && (
            <div className="mt-6 alert-error">
              <div className="flex items-center space-x-2">
                <AlertCircle size={20} />
                <div>
                  <p className="font-medium">Verification Failed</p>
                  <p className="text-sm">{verificationError}</p>
                </div>
              </div>
            </div>
          )}

          {verificationResult && (
            <div className="mt-6">
              {verificationResult.verified ? (
                <div className="alert-success">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <div>
                      <p className="font-medium">✅ Identity Verified Successfully!</p>
                      <p className="text-sm">
                        Similarity: {verificationResult.similarity_score.toFixed(1)}% | 
                        Quality: {verificationResult.quality_score.toFixed(1)}% | 
                        Processing: {verificationResult.processing_time.toFixed(0)}ms
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
                        Similarity: {verificationResult.similarity_score.toFixed(1)}% (Required: ≥{(verificationResult.threshold * 100).toFixed(0)}%)
                      </p>
                      <p className="text-sm mt-1">Please try again with a clearer photo.</p>
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
            className="btn-primary"
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

            {verificationResult && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Verification Details</h3>
                <p className="text-blue-800 text-sm">
                  Identity verified for User {verificationResult.user_id} ({verificationResult.user_name}) | 
                  Similarity: {verificationResult.similarity_score.toFixed(1)}% | 
                  Quiz ID: {verificationResult.quiz_id} | 
                  Course ID: {verificationResult.course_id}
                </p>
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
    </div>
  )
}

export default CoursePage