// components/RealTimeFaceVerification.tsx
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Shield, CheckCircle, AlertCircle, StopCircle, PlayCircle, Eye, UserCheck } from 'lucide-react'

interface RealTimeFaceVerificationProps {
  userId: number
  quizId?: string
  courseId?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

const RealTimeFaceVerification: React.FC<RealTimeFaceVerificationProps> = ({ 
  userId, 
  quizId, 
  courseId, 
  onSuccess, 
  onError, 
  className = "" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<string>('Ready to start verification')
  const [framesCollected, setFramesCollected] = useState(0)
  const [requiredFrames, setRequiredFrames] = useState(10)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [similarityScore, setSimilarityScore] = useState<number | null>(null)
  const [antispoofingScore, setAntispoofingScore] = useState<number | null>(null)
  const [isMatch, setIsMatch] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const buildWebSocketUrl = useCallback(() => {
    const baseUrl = `ws://localhost:8000/ws/face-verification/${userId}`
    const params = new URLSearchParams()
    
    if (quizId) params.append('quiz_id', quizId)
    if (courseId) params.append('course_id', courseId)
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  }, [userId, quizId, courseId])

  const startVideoStream = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
          facingMode: 'user'
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Initialize WebSocket connection
      const wsUrl = buildWebSocketUrl()
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setStatus('Connected. Initializing verification...')
        console.log('🔗 WebSocket connected for face verification')
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('📨 Received message:', message)

        switch (message.type) {
          case 'connected':
            setRequiredFrames(message.required_frames)
            setStatus(`Verification ready. Please look at the camera. Need ${message.required_frames} good frames.`)
            setIsStreaming(true)
            startFrameCapture()
            break

          case 'frame_processed':
            if (message.success) {
              setFramesCollected(message.frames_collected)
              setQualityScore(message.quality_score)
              setAntispoofingScore(message.antispoofing_score)
              setSimilarityScore(message.similarity_score)
              setIsMatch(message.is_match)
              setStatus(message.message)
              setError(null)
            } else {
              setStatus(message.message)
              // Don't set error for temporary quality issues
            }
            break

          case 'spoofing_detected':
            setError(message.message)
            setStatus('⚠️ Spoofing detected! Please use your real face.')
            setAntispoofingScore(message.antispoofing_score)
            break

          case 'verification_complete':
            setSuccess(true)
            setVerificationResult(message)
            setStatus(message.verified ? '✅ Identity verified successfully!' : '❌ Identity verification failed')
            stopStreaming()
            if (onSuccess) {
              onSuccess(message)
            }
            break

          case 'error':
            setError(message.message)
            setStatus(`❌ Error: ${message.message}`)
            if (onError) {
              onError(message.message)
            }
            break
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setError('Connection error occurred')
        setStatus('❌ Connection failed')
        if (onError) {
          onError('WebSocket connection failed')
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsStreaming(false)
        console.log('❌ WebSocket closed:', event.code, event.reason)
        
        if (event.code === 4004) {
          setError('User not found')
          setStatus('❌ User not found')
        } else if (event.code === 4003) {
          setError('No face registration found. Please register your face first.')
          setStatus('❌ Face not registered')
        } else if (!success) {
          setStatus('Connection closed')
        }
      }

    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Failed to access camera. Please check permissions.')
      setStatus('❌ Camera access failed')
      if (onError) {
        onError('Camera access failed')
      }
    }
  }, [buildWebSocketUrl, onSuccess, onError, success])

  const startFrameCapture = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        captureAndSendFrame()
      }, 200) // Send frame every 200ms (5 FPS)
    }
  }, [])

  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    // Set canvas dimensions
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current frame
    ctx.drawImage(video, 0, 0)

    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8)

    // Send frame to WebSocket
    try {
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        frame: frameData
      }))
    } catch (error) {
      console.error('Error sending frame:', error)
    }
  }, [])

  const stopStreaming = useCallback(() => {
    // Stop frame capture
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }))
      wsRef.current.close()
      wsRef.current = null
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setIsStreaming(false)
    setIsConnected(false)
  }, [])

  const handleStop = useCallback(() => {
    stopStreaming()
    setStatus('Verification stopped')
  }, [stopStreaming])

  const handleRestart = useCallback(() => {
    setSuccess(false)
    setError(null)
    setFramesCollected(0)
    setQualityScore(null)
    setSimilarityScore(null)
    setAntispoofingScore(null)
    setIsMatch(null)
    setVerificationResult(null)
    setStatus('Ready to start verification')
    startVideoStream()
  }, [startVideoStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  const getMatchIndicator = () => {
    if (isMatch === null) return null
    return isMatch ? (
      <div className="flex items-center space-x-1 text-green-400">
        <CheckCircle size={12} />
        <span>Match</span>
      </div>
    ) : (
      <div className="flex items-center space-x-1 text-red-400">
        <AlertCircle size={12} />
        <span>No Match</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Video Display */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-[640px] h-[480px] object-cover rounded-lg border-2 border-gray-300 bg-black"
        />
        
        {/* Overlay Information */}
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Verification Status</span>
              <div className="flex items-center space-x-2">
                {isConnected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <span className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <p className="text-sm">{status}</p>
            
            {requiredFrames > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{framesCollected}/{requiredFrames}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(framesCollected / requiredFrames) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Verification Indicators */}
        {(qualityScore !== null || similarityScore !== null || antispoofingScore !== null) && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-70 text-white p-2 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {qualityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Quality</span>
                    <span className={`font-bold ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore.toFixed(1)}%
                    </span>
                  </div>
                )}
                {similarityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Similarity</span>
                    <div className="flex items-center space-x-1">
                      <span className={`font-bold ${similarityScore >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                        {similarityScore.toFixed(1)}%
                      </span>
                      {getMatchIndicator()}
                    </div>
                  </div>
                )}
                {antispoofingScore !== null && (
                  <div>
                    <span className="block text-gray-300">Liveness</span>
                    <span className={`font-bold ${antispoofingScore >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                      {(antispoofingScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success/Failure Overlay */}
        {success && verificationResult && (
          <div className={`absolute inset-0 ${verificationResult.verified ? 'bg-green-500' : 'bg-red-500'} bg-opacity-20 flex items-center justify-center rounded-lg`}>
            <div className={`${verificationResult.verified ? 'bg-green-500' : 'bg-red-500'} text-white p-4 rounded-full`}>
              {verificationResult.verified ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        {!isStreaming && !success && (
          <button
            onClick={startVideoStream}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlayCircle size={20} />
            <span>Start Verification</span>
          </button>
        )}

        {isStreaming && (
          <button
            onClick={handleStop}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <StopCircle size={20} />
            <span>Stop Verification</span>
          </button>
        )}

        {success && (
          <button
            onClick={handleRestart}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Eye size={20} />
            <span>Verify Again</span>
          </button>
        )}
      </div>

      {/* Context Information */}
      {(quizId || courseId) && (
        <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <UserCheck size={20} className="text-gray-600" />
            <p className="font-medium text-gray-800">Verification Context</p>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {courseId && <p><strong>Course:</strong> {courseId}</p>}
            {quizId && <p><strong>Quiz:</strong> {quizId}</p>}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <p className="font-medium text-red-800">Verification Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Results */}
      {success && verificationResult && (
        <div className={`w-full max-w-md ${verificationResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <div className="flex items-center space-x-2 mb-3">
            {verificationResult.verified ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            <p className={`font-medium ${verificationResult.verified ? 'text-green-800' : 'text-red-800'}`}>
              {verificationResult.verified ? 'Verification Successful!' : 'Verification Failed!'}
            </p>
          </div>
          <div className={`text-sm ${verificationResult.verified ? 'text-green-700' : 'text-red-700'} space-y-1`}>
            <p><strong>User:</strong> {verificationResult.user_name}</p>
            <p><strong>Similarity Score:</strong> {verificationResult.similarity_score?.toFixed(1)}%</p>
            <p><strong>Quality Score:</strong> {verificationResult.quality_score?.toFixed(1)}%</p>
            <p><strong>Anti-spoofing Score:</strong> {(verificationResult.antispoofing_score * 100)?.toFixed(1)}%</p>
            <p><strong>Match Ratio:</strong> {(verificationResult.match_ratio * 100)?.toFixed(1)}%</p>
            <p><strong>Frames Processed:</strong> {verificationResult.frames_processed}</p>
            {verificationResult.verification_id && (
              <p><strong>Verification ID:</strong> {verificationResult.verification_id}</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield size={20} className="text-blue-600" />
          <p className="font-medium text-blue-800">Verification Instructions</p>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Look directly at the camera</li>
          <li>• Match your registered pose and lighting</li>
          <li>• Keep your face centered and still</li>
          <li>• Ensure good lighting conditions</li>
          <li>• The system will verify {requiredFrames} frames against your registration</li>
          <li>• Liveness detection prevents spoofing attacks</li>
        </ul>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default RealTimeFaceVerification