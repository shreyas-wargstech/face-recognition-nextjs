// components/OptimizedRealTimeFaceVerification.tsx
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Shield, CheckCircle, AlertCircle, StopCircle, PlayCircle, Eye, UserCheck, Wifi, WifiOff, Loader, RotateCcw } from 'lucide-react'

interface OptimizedRealTimeFaceVerificationProps {
  userId: number
  quizId?: string
  courseId?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

const OptimizedRealTimeFaceVerification: React.FC<OptimizedRealTimeFaceVerificationProps> = ({ 
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
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected')
  const [status, setStatus] = useState<string>('Ready to start verification')
  const [framesCollected, setFramesCollected] = useState(0)
  const [framesSent, setFramesSent] = useState(0)
  const [requiredFrames, setRequiredFrames] = useState(2)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [similarityScore, setSimilarityScore] = useState<number | null>(null)
  const [antispoofingScore, setAntispoofingScore] = useState<number | null>(null)
  const [isMatch, setIsMatch] = useState<boolean | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [comparisonTime, setComparisonTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState(5)
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [canRetry, setCanRetry] = useState(true)

  // Optimized settings for verification
  const MAX_RETRIES = 3
  const RECONNECT_DELAY = 2000  // Faster reconnection for verification
  const FRAME_CAPTURE_INTERVAL = 800  // Faster for verification - 800ms
  const FRAME_QUALITY = 0.7  // Better quality for verification
  const MAX_FRAME_SIZE = { width: 480, height: 360 }
  const HEARTBEAT_INTERVAL = 15000  // 15 seconds
  const CONNECTION_TIMEOUT = 10000  // 10 seconds - faster for verification

  const buildWebSocketUrl = useCallback(() => {
    const baseUrl = `ws://localhost:8000/ws/face-verification/${userId}`
    const params = new URLSearchParams()
    
    if (quizId) params.append('quiz_id', quizId)
    if (courseId) params.append('course_id', courseId)
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  }, [userId, quizId, courseId])

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const pingStart = Date.now()
        wsRef.current.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: pingStart 
        }))
      }
    }, HEARTBEAT_INTERVAL)
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const startVideoStream = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 640 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 480 },
          frameRate: { ideal: 20, max: 30 },  // Higher frame rate for verification
          facingMode: 'user'
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      return true
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Failed to access camera. Please check permissions.')
      if (onError) {
        onError('Camera access failed')
      }
      return false
    }
  }, [onError])

  const connectWebSocket = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setConnectionState('connecting')
    setError(null)

    try {
      const wsUrl = buildWebSocketUrl()
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setError('Connection timeout')
          setConnectionState('disconnected')
        }
      }, CONNECTION_TIMEOUT)

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        setIsConnected(true)
        setConnectionState('connected')
        setStatus('Connected. Initializing verification...')
        setRetryCount(0)
        startHeartbeat()
        console.log('🔗 WebSocket connected for face verification')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 Received verification message:', message.type)

          switch (message.type) {
            case 'connected':
              setRequiredFrames(message.required_frames || 2)
              setStatus(`Verification ready. Please look at the camera. Need ${message.required_frames || 2} frames.`)
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
                setProcessingTime(message.processing_time)
                setComparisonTime(message.comparison_time)
                setStatus(message.message)
                setError(null)
              } else {
                setStatus(message.message)
                setProcessingTime(message.processing_time)
                setAttemptsRemaining(message.attempts_remaining || 0)
              }
              break

            case 'spoofing_detected':
              setError(message.message)
              setStatus('⚠️ Please use your real face for verification')
              setAntispoofingScore(message.antispoofing_score)
              setCanRetry(message.can_retry !== false)
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

            case 'verification_restarted':
              setFramesCollected(0)
              setFramesSent(0)
              setQualityScore(null)
              setSimilarityScore(null)
              setAntispoofingScore(null)
              setIsMatch(null)
              setError(null)
              setStatus(message.message)
              break

            case 'error':
              setError(message.message)
              setStatus(`❌ Error: ${message.message}`)
              setCanRetry(message.can_retry !== false)
              if (onError) {
                onError(message.message)
              }
              break

            case 'pong':
              if (message.timestamp) {
                const latency = Date.now() - message.timestamp
                setNetworkLatency(latency)
              }
              break

            case 'timeout_warning':
              setError(message.message)
              setStatus('⚠️ Connection issue detected')
              setCanRetry(message.can_retry !== false)
              break

            default:
              console.log('Unknown verification message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing verification WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Verification WebSocket error:', error)
        clearTimeout(connectionTimeout)
        setError('Connection error occurred')
        setConnectionState('disconnected')
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnected(false)
        setIsStreaming(false)
        stopHeartbeat()
        
        console.log('❌ Verification WebSocket closed:', event.code, event.reason)
        
        if (event.code === 4004) {
          setError('User not found')
          setStatus('❌ User not found')
          setConnectionState('disconnected')
        } else if (event.code === 4003) {
          setError('No face registration found. Please register your face first.')
          setStatus('❌ Face not registered')
          setConnectionState('disconnected')
        } else if (!success && retryCount < MAX_RETRIES) {
          // Auto-reconnect logic
          setConnectionState('reconnecting')
          setStatus(`Connection lost. Reconnecting... (${retryCount + 1}/${MAX_RETRIES})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1)
            connectWebSocket()
          }, RECONNECT_DELAY)
        } else {
          setConnectionState('disconnected')
          if (!success) {
            setStatus('Connection failed. Please try again.')
          }
        }
      }

    } catch (error) {
      console.error('WebSocket creation error:', error)
      setError('Failed to create connection')
      setConnectionState('disconnected')
    }
  }, [buildWebSocketUrl, success, retryCount, onSuccess, onError, startHeartbeat, stopHeartbeat])

  const startFrameCapture = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        captureAndSendFrame()
      }, FRAME_CAPTURE_INTERVAL)
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

    try {
      canvas.width = MAX_FRAME_SIZE.width
      canvas.height = MAX_FRAME_SIZE.height

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frameData = canvas.toDataURL('image/jpeg', FRAME_QUALITY)

      wsRef.current.send(JSON.stringify({
        type: 'frame',
        frame: frameData,
        timestamp: Date.now()
      }))

      setFramesSent(prev => prev + 1)
    } catch (error) {
      console.error('Error capturing/sending verification frame:', error)
    }
  }, [])

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    stopHeartbeat()

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop' }))
        wsRef.current.close(1000, 'User stopped')
      } catch (error) {
        console.error('Error closing verification WebSocket:', error)
      }
      wsRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setIsStreaming(false)
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [stopHeartbeat])

  const handleStart = useCallback(async () => {
    const videoStarted = await startVideoStream()
    if (videoStarted) {
      await connectWebSocket()
    }
  }, [startVideoStream, connectWebSocket])

  const handleStop = useCallback(() => {
    stopStreaming()
    setStatus('Verification stopped')
  }, [stopStreaming])

  const handleRestart = useCallback(() => {
    // Send restart signal to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'restart_verification' }))
    }
    
    // Reset local state
    setSuccess(false)
    setError(null)
    setFramesCollected(0)
    setFramesSent(0)
    setQualityScore(null)
    setSimilarityScore(null)
    setAntispoofingScore(null)
    setIsMatch(null)
    setProcessingTime(null)
    setComparisonTime(null)
    setVerificationResult(null)
    setAttemptsRemaining(5)
    setRetryCount(0)
    setNetworkLatency(null)
    setCanRetry(true)
    
    if (!isConnected) {
      handleStart()
    }
  }, [isConnected, handleStart])

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  const getConnectionIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi size={16} className="text-green-500" />
      case 'connecting':
      case 'reconnecting':
        return <Loader size={16} className="text-yellow-500 animate-spin" />
      default:
        return <WifiOff size={16} className="text-red-500" />
    }
  }

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
          className="w-[480px] h-[360px] object-cover rounded-lg border-2 border-gray-300 bg-black"
        />
        
        {/* Verification Status Overlay */}
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Identity Verification</span>
              <div className="flex items-center space-x-2">
                {getConnectionIcon()}
                <span className="text-xs">
                  {connectionState === 'connected' ? `Connected ${networkLatency ? `(${networkLatency}ms)` : ''}` :
                   connectionState === 'connecting' ? 'Connecting...' :
                   connectionState === 'reconnecting' ? `Reconnecting... (${retryCount}/${MAX_RETRIES})` :
                   'Disconnected'}
                </span>
              </div>
            </div>
            
            <p className="text-sm">{status}</p>
            
            {/* Progress Bar */}
            {requiredFrames > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress ({framesCollected}/{requiredFrames})</span>
                  <span>Attempts: {attemptsRemaining}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(framesCollected / requiredFrames) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {(processingTime !== null || comparisonTime !== null) && (
              <div className="mt-2 text-xs text-gray-300">
                {processingTime !== null && <span>Process: {processingTime.toFixed(0)}ms </span>}
                {comparisonTime !== null && <span>Compare: {comparisonTime.toFixed(0)}ms </span>}
                {networkLatency !== null && <span>Latency: {networkLatency}ms</span>}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Verification Indicators */}
        {(qualityScore !== null || similarityScore !== null || antispoofingScore !== null) && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-70 text-white p-2 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {qualityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Quality</span>
                    <span className={`font-bold ${qualityScore >= 30 ? 'text-green-400' : qualityScore >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore.toFixed(1)}%
                    </span>
                  </div>
                )}
                {similarityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Similarity</span>
                    <div className="flex items-center space-x-1">
                      <span className={`font-bold ${similarityScore >= 55 ? 'text-green-400' : 'text-red-400'}`}>
                        {similarityScore.toFixed(1)}%
                      </span>
                      {getMatchIndicator()}
                    </div>
                  </div>
                )}
                {antispoofingScore !== null && (
                  <div>
                    <span className="block text-gray-300">Liveness</span>
                    <span className={`font-bold ${antispoofingScore >= 0.3 ? 'text-green-400' : 'text-red-400'}`}>
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
            onClick={handleStart}
            disabled={connectionState === 'connecting'}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {connectionState === 'connecting' ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <PlayCircle size={20} />
            )}
            <span>Start Verification</span>
          </button>
        )}

        {isStreaming && (
          <div className="flex space-x-2">
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <StopCircle size={20} />
              <span>Stop</span>
            </button>
            
            {canRetry && (
              <button
                onClick={handleRestart}
                className="flex items-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <RotateCcw size={20} />
                <span>Retry</span>
              </button>
            )}
          </div>
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
            <p><strong>Threshold:</strong> 55% similarity (relaxed)</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Verification Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            {canRetry && (
              <button
                onClick={handleRestart}
                className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Retry
              </button>
            )}
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
            {verificationResult.max_similarity_score && (
              <p><strong>Best Match:</strong> {verificationResult.max_similarity_score?.toFixed(1)}%</p>
            )}
            <p><strong>Quality Score:</strong> {verificationResult.quality_score?.toFixed(1)}%</p>
            <p><strong>Anti-spoofing:</strong> {(verificationResult.antispoofing_score * 100)?.toFixed(1)}%</p>
            <p><strong>Match Ratio:</strong> {(verificationResult.match_ratio * 100)?.toFixed(1)}%</p>
            <p><strong>Frames Processed:</strong> {verificationResult.frames_processed}</p>
            {verificationResult.verification_id && (
              <p><strong>Verification ID:</strong> {verificationResult.verification_id}</p>
            )}
          </div>
        </div>
      )}

      {/* Optimized Instructions */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield size={20} className="text-blue-600" />
          <p className="font-medium text-blue-800">Fast Verification (Optimized)</p>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Only 2 frames needed for verification</li>
          <li>• Relaxed 55% similarity threshold</li>
          <li>• Multiple retry attempts allowed</li>
          <li>• Auto-reconnection on network issues</li>
          <li>• Look directly at camera and stay still</li>
          <li>• Faster processing for quiz access</li>
        </ul>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default OptimizedRealTimeFaceVerification