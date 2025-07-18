// components/RealTimeFaceVerification.tsx - Professional Version
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Shield, CheckCircle, AlertCircle, StopCircle, PlayCircle, Eye, UserCheck, Wifi, WifiOff, Loader, RotateCcw, Activity, Target, Award } from 'lucide-react'

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
  const [frameCount, setFrameCount] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [maxSimilarity, setMaxSimilarity] = useState<number | null>(null)
  const [matchRatio, setMatchRatio] = useState<number | null>(null)
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Backend-aligned settings
  const MAX_RETRIES = 3
  const RECONNECT_DELAY = 2000
  const FRAME_CAPTURE_INTERVAL = 800
  const FRAME_QUALITY = 0.7
  const MAX_FRAME_SIZE = { width: 480, height: 360 }
  const HEARTBEAT_INTERVAL = 15000
  const CONNECTION_TIMEOUT = 10000
  const SIMILARITY_THRESHOLD = 55.0
  const MAX_VERIFICATION_ATTEMPTS = 5

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
    const constraintSets = [
      {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 640 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 480 },
          frameRate: { ideal: 20, max: 30 },
          facingMode: 'user'
        },
        audio: false
      },
      {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 640 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 480 },
          frameRate: { ideal: 20 },
          facingMode: 'user'
        },
        audio: false
      },
      {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 640 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 480 },
          facingMode: 'user'
        },
        audio: false
      },
      {
        video: {
          facingMode: 'user'
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ]

    for (let i = 0; i < constraintSets.length; i++) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraintSets[i])
        streamRef.current = stream
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        return true
      } catch (error) {
        if (i === constraintSets.length - 1) {
          let errorMessage = 'Failed to access camera.'
          if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions and refresh the page.'
          } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.'
          } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'Camera does not support required settings. Using basic camera access.'
          } else if (error.name === 'NotReadableError') {
            errorMessage = 'Camera is already in use by another application.'
          }
          
          setError(errorMessage)
          if (onError) {
            onError(errorMessage)
          }
          return false
        }
      }
    }
    
    return false
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
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

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
                
                if (message.similarity_score && (maxSimilarity === null || message.similarity_score > maxSimilarity)) {
                  setMaxSimilarity(message.similarity_score)
                }
              } else {
                setStatus(message.message)
                setProcessingTime(message.processing_time)
                setAttemptsRemaining(message.attempts_remaining || 0)
              }
              setProcessedCount(prev => prev + 1)
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
              
              setSimilarityScore(message.similarity_score)
              setMaxSimilarity(message.max_similarity_score)
              setQualityScore(message.quality_score)
              setAntispoofingScore(message.antispoofing_score)
              setMatchRatio(message.match_ratio)
              setConfidenceScore(message.confidence_score)
              
              stopStreaming()
              if (onSuccess) {
                onSuccess(message)
              }
              break

            case 'verification_restarted':
              setFramesCollected(0)
              setFramesSent(0)
              setFrameCount(0)
              setProcessedCount(0)
              setQualityScore(null)
              setSimilarityScore(null)
              setAntispoofingScore(null)
              setIsMatch(null)
              setMaxSimilarity(null)
              setMatchRatio(null)
              setConfidenceScore(null)
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
          }
        } catch (error) {
          console.error('Error parsing verification WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout)
        setError('Connection error occurred')
        setConnectionState('disconnected')
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnected(false)
        setIsStreaming(false)
        stopHeartbeat()
        
        if (event.code === 4004) {
          setError('User not found')
          setStatus('❌ User not found')
          setConnectionState('disconnected')
        } else if (event.code === 4003) {
          setError('No face registration found. Please register your face first.')
          setStatus('❌ Face not registered')
          setConnectionState('disconnected')
        } else if (!success && retryCount < MAX_RETRIES) {
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
      setError('Failed to create connection')
      setConnectionState('disconnected')
    }
  }, [buildWebSocketUrl, success, retryCount, onSuccess, onError, startHeartbeat, stopHeartbeat, maxSimilarity])

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
      setFrameCount(prev => prev + 1)
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'restart_verification' }))
    }
    
    setSuccess(false)
    setError(null)
    setFramesCollected(0)
    setFramesSent(0)
    setFrameCount(0)
    setProcessedCount(0)
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
    setMaxSimilarity(null)
    setMatchRatio(null)
    setConfidenceScore(null)
    
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
        return <Wifi size={16} className="text-green-400" />
      case 'connecting':
      case 'reconnecting':
        return <Loader size={16} className="text-yellow-400 animate-spin" />
      default:
        return <WifiOff size={16} className="text-red-400" />
    }
  }

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connected':
        return `VERIFYING ${networkLatency ? `(${networkLatency}ms)` : ''}`
      case 'connecting':
        return 'CONNECTING...'
      case 'reconnecting':
        return `RECONNECTING... (${retryCount}/${MAX_RETRIES})`
      default:
        return 'DISCONNECTED'
    }
  }

  const getMatchIndicator = () => {
    if (isMatch === null) return null
    return isMatch ? (
      <div className="flex items-center space-x-1 text-green-400">
        <CheckCircle size={12} />
        <span>MATCH</span>
      </div>
    ) : (
      <div className="flex items-center space-x-1 text-red-400">
        <AlertCircle size={12} />
        <span>NO MATCH</span>
      </div>
    )
  }

  const getStatusColor = () => {
    if (connectionState === 'connected' && isStreaming) {
      if (verificationResult?.verified) return 'border-green-400 shadow-green-400/30 shadow-2xl'
      if (verificationResult?.verified === false) return 'border-red-400 shadow-red-400/30 shadow-2xl'
      return 'border-blue-400 shadow-blue-400/30 shadow-xl'
    }
    if (connectionState === 'connecting') return 'border-yellow-400 shadow-yellow-400/30 shadow-xl'
    return 'border-gray-400 shadow-gray-400/20 shadow-lg'
  }

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Professional Video Container */}
      <div className="relative w-full max-w-2xl mx-auto">
        <div 
          className={`relative rounded-2xl overflow-hidden transition-all duration-300 border-2 ${getStatusColor()}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-[400px] object-cover bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          />
          
          {/* Professional Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
          
          {/* Corner Status Indicators */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center space-x-2">
              {getConnectionIcon()}
              <span className="text-white text-xs font-medium">
                {getConnectionText()}
              </span>
            </div>
            
            {isStreaming && (
              <div className="bg-purple-500/90 backdrop-blur-sm rounded-full w-3 h-3 animate-pulse" />
            )}
          </div>

          {/* Similarity Score - Top Center */}
          {similarityScore !== null && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${similarityScore >= SIMILARITY_THRESHOLD ? 'text-green-400' : 'text-red-400'}`}>
                    {similarityScore.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-300">Similarity</div>
                  {getMatchIndicator()}
                </div>
              </div>
            </div>
          )}

          {/* Quality Metrics - Top Right */}
          {(qualityScore !== null || antispoofingScore !== null) && (
            <div className="absolute top-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 space-y-1">
                {qualityScore !== null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">Quality</span>
                    <span className={`font-bold ${qualityScore >= 10 ? 'text-green-400' : qualityScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                {antispoofingScore !== null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">Liveness</span>
                    <span className={`font-bold ${antispoofingScore >= 0.2 ? 'text-green-400' : 'text-red-400'}`}>
                      {(antispoofingScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Center Status Display */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-black/80 backdrop-blur-md rounded-xl px-6 py-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Eye className="text-purple-400" size={20} />
                  <span className="text-white font-medium">Identity Verification</span>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-300">Progress</div>
                  <div className="text-sm font-bold text-white">
                    {framesCollected}/{requiredFrames}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-200 text-sm leading-relaxed">{status}</p>
              
              {/* Progress Bar */}
              {requiredFrames > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, (framesCollected / requiredFrames) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Attempts remaining: {attemptsRemaining}</span>
                    <span>{Math.round((framesCollected / requiredFrames) * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {(processingTime !== null || comparisonTime !== null) && (
                <div className="mt-2 text-xs text-gray-400">
                  {processingTime !== null && <span>Process: {processingTime.toFixed(0)}ms </span>}
                  {comparisonTime !== null && <span>Compare: {comparisonTime.toFixed(0)}ms </span>}
                  {networkLatency !== null && <span>Network: {networkLatency}ms</span>}
                </div>
              )}
            </div>
          </div>

          {/* Success/Failure Overlay */}
          {success && verificationResult && (
            <div className={`absolute inset-0 ${verificationResult.verified ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center rounded-2xl`}>
              <div className={`${verificationResult.verified ? 'bg-green-500' : 'bg-red-500'} text-white p-6 rounded-full shadow-2xl animate-pulse`}>
                {verificationResult.verified ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Information */}
      {(quizId || courseId) && (
        <div className="w-full max-w-2xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck size={20} className="text-purple-600" />
            <p className="font-semibold text-purple-800 text-lg">Verification Context</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-purple-700">
            {courseId && (
              <div className="flex items-center space-x-2">
                <Award size={16} />
                <span><strong>Course:</strong> {courseId}</span>
              </div>
            )}
            {quizId && (
              <div className="flex items-center space-x-2">
                <Target size={16} />
                <span><strong>Quiz:</strong> {quizId}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Shield size={16} />
              <span><strong>Threshold:</strong> {SIMILARITY_THRESHOLD}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity size={16} />
              <span><strong>Frames:</strong> {requiredFrames} required</span>
            </div>
          </div>
        </div>
      )}

      {/* Professional Controls */}
      <div className="space-y-4 w-full max-w-2xl">
        {/* Main Controls */}
        <div className="flex justify-center space-x-4">
          {!isStreaming && !success && (
            <button
              onClick={handleStart}
              disabled={connectionState === 'connecting'}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                {connectionState === 'connecting' ? (
                  <Loader size={24} className="animate-spin" />
                ) : (
                  <PlayCircle size={24} />
                )}
                <span className="text-lg">Start Verification</span>
              </div>
            </button>
          )}

          {isStreaming && (
            <div className="flex space-x-3">
              <button
                onClick={handleStop}
                className="group px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-500 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <StopCircle size={20} />
                  <span>Stop</span>
                </div>
              </button>
              
              {canRetry && (
                <button
                  onClick={handleRestart}
                  className="group px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center space-x-2">
                    <RotateCcw size={20} />
                    <span>Retry</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {success && (
            <button
              onClick={handleRestart}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <Eye size={24} />
                <span className="text-lg">Verify Again</span>
              </div>
            </button>
          )}
        </div>

        {/* Performance Stats */}
        {(framesSent > 0 || processingTime !== null) && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Activity className="mr-2 text-purple-600" size={18} />
              Verification Performance
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{framesSent}</div>
                <div className="text-xs text-gray-600">Frames Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {similarityScore ? `${similarityScore.toFixed(0)}%` : '0%'}
                </div>
                <div className="text-xs text-gray-600">Max Similarity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {processingTime ? `${processingTime.toFixed(0)}ms` : '0ms'}
                </div>
                <div className="text-xs text-gray-600">Processing Time</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-2xl bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 mb-1">Verification Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            {canRetry && (
              <button
                onClick={handleRestart}
                className="ml-3 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Verification Results */}
      {success && verificationResult && (
        <div className={`w-full max-w-2xl ${verificationResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2 rounded-xl p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            {verificationResult.verified ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <AlertCircle size={24} className="text-red-600" />
            )}
            <p className={`font-semibold text-lg ${verificationResult.verified ? 'text-green-800' : 'text-red-800'}`}>
              {verificationResult.verified ? 'Verification Successful!' : 'Verification Failed!'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className={`space-y-2 ${verificationResult.verified ? 'text-green-700' : 'text-red-700'}`}>
              <p><strong>User:</strong> {verificationResult.user_name}</p>
              <p><strong>Similarity:</strong> {verificationResult.similarity_score?.toFixed(1)}%</p>
              {verificationResult.max_similarity_score && (
                <p><strong>Best Match:</strong> {verificationResult.max_similarity_score?.toFixed(1)}%</p>
              )}
              <p><strong>Quality:</strong> {verificationResult.quality_score?.toFixed(1)}%</p>
            </div>
            <div className={`space-y-2 ${verificationResult.verified ? 'text-green-700' : 'text-red-700'}`}>
              <p><strong>Anti-spoofing:</strong> {(verificationResult.antispoofing_score * 100)?.toFixed(1)}%</p>
              {verificationResult.match_ratio !== undefined && (
                <p><strong>Match Ratio:</strong> {(verificationResult.match_ratio * 100)?.toFixed(1)}%</p>
              )}
              <p><strong>Frames:</strong> {verificationResult.frames_processed}</p>
              <p><strong>Threshold:</strong> {verificationResult.threshold_used || SIMILARITY_THRESHOLD}%</p>
            </div>
          </div>
          
          {verificationResult.verification_id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Verification ID:</strong> {verificationResult.verification_id} | 
                <strong> Method:</strong> {verificationResult.verification_method || 'optimized_stream'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Professional Instructions */}
      <div className="w-full max-w-2xl bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield size={20} className="text-blue-600" />
          <p className="font-semibold text-blue-800 text-lg">Fast Verification (Optimized)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {[
              'Only 2 frames needed for verification',
              'Relaxed 55% similarity threshold',
              'Multiple retry attempts allowed'
            ].map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                </div>
                <span className="text-sm text-blue-700">{instruction}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              'Look directly at camera and stay still',
              'Auto-reconnection on network issues',
              'Multi-criteria matching for better success'
            ].map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{index + 4}</span>
                </div>
                <span className="text-sm text-blue-700">{instruction}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default RealTimeFaceVerification