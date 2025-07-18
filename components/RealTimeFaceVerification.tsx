// OptimizedFaceVerification.tsx - Instant Single-Frame Verification
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Shield, CheckCircle, AlertCircle, Zap, StopCircle, PlayCircle, Eye, UserCheck, Wifi, WifiOff, Loader, RotateCcw, Clock } from 'lucide-react'

interface OptimizedFaceVerificationProps {
  userId: number
  quizId?: string
  courseId?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

const OptimizedFaceVerification: React.FC<OptimizedFaceVerificationProps> = ({ 
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
  const frameCountRef = useRef(0)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [status, setStatus] = useState<string>('Ready for instant verification')
  const [similarityScore, setSimilarityScore] = useState<number | null>(null)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [isMatch, setIsMatch] = useState<boolean | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [comparisonTime, setComparisonTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [framesSent, setFramesSent] = useState(0)
  const [totalSessionTime, setTotalSessionTime] = useState<number | null>(null)

  // Ultra-fast verification settings
  const FRAME_CAPTURE_INTERVAL = 200  // 200ms - very fast capture
  const FRAME_QUALITY = 0.3           // Lower quality for speed
  const MAX_FRAME_SIZE = { width: 240, height: 180 }  // Very small for speed
  const CONNECTION_TIMEOUT = 5000      // Fast timeout
  const SIMILARITY_THRESHOLD = 50.0    // Relaxed threshold

  const buildWebSocketUrl = useCallback(() => {
    const baseUrl = `ws://localhost:8000/ws/face-verification-fast/${userId}`
    const params = new URLSearchParams()
    
    if (quizId) params.append('quiz_id', quizId)
    if (courseId) params.append('course_id', courseId)
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  }, [userId, quizId, courseId])

  const startVideoStream = useCallback(async () => {
    try {
      // Ultra-fast camera constraints
      const constraints = {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 320 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 240 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user'
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      console.log('✅ Ultra-fast verification camera started')
      return true
    } catch (error) {
      console.error('Camera error:', error)
      setError('Camera access failed')
      return false
    }
  }, [])

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
        setStatus('Connected to instant verification service')
        console.log('⚡ Ultra-fast verification WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch (message.type) {
            case 'connected':
              setStatus('Ready for single-frame verification')
              setIsStreaming(true)
              startFrameCapture()
              break

            case 'frame_processed':
              if (message.success) {
                setSimilarityScore(message.similarity_score)
                setIsMatch(message.is_match)
                setQualityScore(message.quality_score)
                setProcessingTime(message.processing_time)
                setComparisonTime(message.comparison_time)
                setStatus(message.message)
                setError(null)
              } else {
                setStatus(message.message)
              }
              break

            case 'verification_complete':
              setSuccess(true)
              setVerificationResult(message)
              setTotalSessionTime(message.total_session_time)
              setStatus(message.message)
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

            case 'pong':
              // Handle heartbeat response
              break
          }
        } catch (error) {
          console.error('Error parsing verification message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Verification WebSocket error:', error)
        clearTimeout(connectionTimeout)
        setError('Connection error')
        setConnectionState('disconnected')
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnected(false)
        setIsStreaming(false)
        setConnectionState('disconnected')
        console.log('❌ Verification WebSocket closed:', event.code)
        
        if (event.code === 4003) {
          setError('No face registration found. Please register first.')
        }
      }

    } catch (error) {
      console.error('Verification WebSocket creation error:', error)
      setError('Failed to create connection')
      setConnectionState('disconnected')
    }
  }, [buildWebSocketUrl, onSuccess, onError])

  const startFrameCapture = useCallback(() => {
    if (!intervalRef.current) {
      frameCountRef.current = 0
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
      // Ultra-small processing for speed
      canvas.width = MAX_FRAME_SIZE.width
      canvas.height = MAX_FRAME_SIZE.height

      // Fast draw
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Very low quality for maximum speed
      const frameData = canvas.toDataURL('image/jpeg', FRAME_QUALITY)

      // Send frame for instant processing
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        frame: frameData,
        timestamp: Date.now()
      }))

      frameCountRef.current += 1
      setFramesSent(prev => prev + 1)

      // Stop after successful verification (single frame mode)
      if (success) {
        stopStreaming()
      }

    } catch (error) {
      console.error('Error capturing verification frame:', error)
    }
  }, [success])

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop' }))
        wsRef.current.close()
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
  }, [])

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
    setSuccess(false)
    setError(null)
    setSimilarityScore(null)
    setQualityScore(null)
    setIsMatch(null)
    setProcessingTime(null)
    setComparisonTime(null)
    setVerificationResult(null)
    setFramesSent(0)
    setTotalSessionTime(null)
    frameCountRef.current = 0
    setStatus('Ready for instant verification')
    handleStart()
  }, [handleStart])

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
      {/* Ultra-Fast Video Display */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-[240px] h-[180px] object-cover rounded-lg border-2 border-gray-300 bg-black"
        />
        
        {/* Instant Verification Status */}
        <div className="absolute top-2 left-2 right-2">
          <div className="bg-black bg-opacity-80 text-white p-2 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium flex items-center">
                <Zap size={12} className="mr-1 text-blue-400" />
                Instant Verification
              </span>
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <span className="text-xs">{connectionState}</span>
              </div>
            </div>
            
            <p className="text-xs">{status}</p>
            
            {/* Instant Processing Indicator */}
            {isStreaming && !success && (
              <div className="mt-1 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs">Frames sent: {framesSent}</span>
              </div>
            )}

            {/* Performance Metrics */}
            {(processingTime !== null || comparisonTime !== null) && (
              <div className="mt-1 text-xs text-blue-300">
                {processingTime !== null && <span>Process: {processingTime.toFixed(0)}ms </span>}
                {comparisonTime !== null && <span>Compare: {comparisonTime.toFixed(0)}ms </span>}
                {totalSessionTime && <span>Total: {totalSessionTime.toFixed(0)}ms</span>}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Verification Indicators */}
        {(similarityScore !== null || qualityScore !== null) && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black bg-opacity-80 text-white p-2 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {similarityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Similarity</span>
                    <div className="flex items-center space-x-1">
                      <span className={`font-bold ${similarityScore >= SIMILARITY_THRESHOLD ? 'text-green-400' : 'text-red-400'}`}>
                        {similarityScore.toFixed(1)}%
                      </span>
                      {getMatchIndicator()}
                    </div>
                  </div>
                )}
                {qualityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Quality</span>
                    <span className="font-bold text-blue-400">
                      {qualityScore.toFixed(1)}%
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
            <div className={`${verificationResult.verified ? 'bg-green-500' : 'bg-red-500'} text-white p-3 rounded-full`}>
              {verificationResult.verified ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            </div>
          </div>
        )}
      </div>

      {/* Ultra-Fast Controls */}
      <div className="flex space-x-3">
        {!isStreaming && !success && (
          <button
            onClick={handleStart}
            disabled={connectionState === 'connecting'}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {connectionState === 'connecting' ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            <span>Instant Verification</span>
          </button>
        )}

        {isStreaming && (
          <div className="flex space-x-2">
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <StopCircle size={16} />
              <span>Stop</span>
            </button>
            
            <button
              onClick={handleRestart}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {success && (
          <button
            onClick={handleRestart}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Eye size={16} />
            <span>Verify Again</span>
          </button>
        )}
      </div>

      {/* Context Information */}
      {(quizId || courseId) && (
        <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <UserCheck size={16} className="text-gray-600" />
            <p className="font-medium text-gray-800 text-sm">Verification Context</p>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            {courseId && <p><strong>Course:</strong> {courseId}</p>}
            {quizId && <p><strong>Quiz:</strong> {quizId}</p>}
            <p><strong>Threshold:</strong> {SIMILARITY_THRESHOLD}% (relaxed)</p>
            <p><strong>Mode:</strong> Single-frame instant verification</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800 text-sm">Verification Error</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <button
              onClick={handleRestart}
              className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Verification Results */}
      {success && verificationResult && (
        <div className={`w-full max-w-sm ${verificationResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3`}>
          <div className="flex items-center space-x-2 mb-2">
            {verificationResult.verified ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : (
              <AlertCircle size={16} className="text-red-600" />
            )}
            <p className={`font-medium text-sm ${verificationResult.verified ? 'text-green-800' : 'text-red-800'}`}>
              {verificationResult.verified ? 'Instant Verification Passed!' : 'Verification Failed!'}
            </p>
          </div>
          <div className={`text-xs ${verificationResult.verified ? 'text-green-700' : 'text-red-700'} space-y-1`}>
            <p><strong>User:</strong> {verificationResult.user_name}</p>
            <p><strong>Similarity:</strong> {verificationResult.similarity_score?.toFixed(1)}%</p>
            <p><strong>Quality:</strong> {verificationResult.quality_score?.toFixed(1)}%</p>
            <p><strong>Processing:</strong> {verificationResult.processing_time?.toFixed(0)}ms</p>
            <p><strong>Total Time:</strong> {verificationResult.total_session_time?.toFixed(0)}ms</p>
            <p><strong>Mode:</strong> {verificationResult.mode}</p>
            <p><strong>Threshold:</strong> {verificationResult.threshold_used}%</p>
            {verificationResult.verification_id && (
              <p><strong>ID:</strong> {verificationResult.verification_id}</p>
            )}
          </div>
        </div>
      )}

      {/* Speed Features */}
      <div className="w-full max-w-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Zap size={16} className="text-blue-600" />
          <p className="font-medium text-blue-800 text-sm">Instant Verification Features</p>
        </div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Single-frame verification (instant)</li>
          <li>• 240x180 optimized processing</li>
          <li>• 200ms capture interval</li>
          <li>• Relaxed {SIMILARITY_THRESHOLD}% threshold</li>
          <li>• No quality checks (speed priority)</li>
          <li>• Expected completion: &lt;1 second</li>
          <li>• Ultra-low latency WebSocket</li>
        </ul>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default OptimizedFaceVerification
