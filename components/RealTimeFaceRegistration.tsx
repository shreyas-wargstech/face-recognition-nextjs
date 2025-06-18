// components/RealTimeFaceRegistration.tsx - Perfectly aligned with backend
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, CheckCircle, AlertCircle, Shield, StopCircle, PlayCircle, Loader, Wifi, WifiOff, RotateCcw } from 'lucide-react'

interface RealTimeFaceRegistrationProps {
  userId: number
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

const RealTimeFaceRegistration: React.FC<RealTimeFaceRegistrationProps> = ({ 
  userId, 
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
  const [status, setStatus] = useState<string>('Ready to start registration')
  const [framesCollected, setFramesCollected] = useState(0)
  const [framesSent, setFramesSent] = useState(0)
  const [requiredFrames, setRequiredFrames] = useState(3)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [antispoofingScore, setAntispoofingScore] = useState<number | null>(null)
  const [faceConfidence, setFaceConfidence] = useState<number | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [networkLatency, setNetworkLatency] = useState<number | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)

  // Backend-aligned settings from main.py
  const MAX_RETRIES = 3
  const RECONNECT_DELAY = 3000
  const FRAME_CAPTURE_INTERVAL = 1000  // 1 second - matches backend frame_skip
  const FRAME_QUALITY = 0.6  // Matches backend quality setting
  const MAX_FRAME_SIZE = { width: 480, height: 360 }  // Matches backend
  const HEARTBEAT_INTERVAL = 20000  // 20 seconds - matches backend
  const CONNECTION_TIMEOUT = 15000  // 15 seconds - matches backend

  const buildWebSocketUrl = useCallback(() => {
    // Exact URL format from backend
    return `ws://localhost:8000/ws/face-registration/${userId}`
  }, [userId])

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
      // Exact constraints that match backend expectations
      const constraints = {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 640 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 480 },
          frameRate: { ideal: 15, max: 20 },
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

      // Connection timeout - matches backend
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
        setStatus('Connected. Initializing registration...')
        setRetryCount(0)
        startHeartbeat()
        console.log('🔗 WebSocket connected for face registration')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 Received message:', message.type)

          // Handle all message types from backend exactly as implemented
          switch (message.type) {
            case 'connected':
              setRequiredFrames(message.required_frames || 3)
              setStatus(`Registration ready. Please look at the camera. Need ${message.required_frames || 3} good frames.`)
              setIsStreaming(true)
              startFrameCapture()
              break

            case 'frame_processed':
              if (message.success) {
                setFramesCollected(message.frames_collected)
                setQualityScore(message.quality_score)
                setAntispoofingScore(message.antispoofing_score)
                setFaceConfidence(message.face_confidence)
                setProcessingTime(message.processing_time)
                setStatus(message.message)
                setError(null)
              } else {
                setStatus(message.message)
                setProcessingTime(message.processing_time)
                // Don't treat failed frame processing as error - just feedback
              }
              break

            case 'spoofing_detected':
              setError(message.message)
              setStatus('⚠️ Spoofing detected! Please use your real face.')
              setAntispoofingScore(message.antispoofing_score)
              break

            case 'registration_complete':
              setSuccess(true)
              setSessionData(message)
              setStatus('✅ Face registration completed successfully!')
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
              if (message.timestamp) {
                const latency = Date.now() - message.timestamp
                setNetworkLatency(latency)
              }
              break

            case 'heartbeat':
              // Server heartbeat received - keep connection alive
              break

            case 'timeout_warning':
              setError(message.message)
              setStatus('⚠️ Connection issue detected')
              break

            default:
              console.log('Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        clearTimeout(connectionTimeout)
        setError('Connection error occurred')
        setConnectionState('disconnected')
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnected(false)
        setIsStreaming(false)
        stopHeartbeat()
        
        console.log('❌ WebSocket closed:', event.code, event.reason)
        
        // Handle specific close codes from backend
        if (event.code === 4004) {
          setError('User not found')
          setStatus('❌ User not found')
          setConnectionState('disconnected')
        } else if (!success && retryCount < MAX_RETRIES) {
          // Auto-reconnect logic matching backend expectations
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
      // Set canvas dimensions to match backend expectations
      canvas.width = MAX_FRAME_SIZE.width
      canvas.height = MAX_FRAME_SIZE.height

      // Draw and resize frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64 with quality matching backend
      const frameData = canvas.toDataURL('image/jpeg', FRAME_QUALITY)

      // Send frame with exact format expected by backend
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        frame: frameData,
        timestamp: Date.now()
      }))

      setFramesSent(prev => prev + 1)
      setFrameCount(prev => prev + 1)
    } catch (error) {
      console.error('Error capturing/sending frame:', error)
    }
  }, [])

  const stopStreaming = useCallback(() => {
    // Stop frame capture
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Stop heartbeat
    stopHeartbeat()

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Close WebSocket with proper format expected by backend
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop' }))
        wsRef.current.close(1000, 'User stopped')
      } catch (error) {
        console.error('Error closing WebSocket:', error)
      }
      wsRef.current = null
    }

    // Stop video stream
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
    setStatus('Registration stopped')
  }, [stopStreaming])

  const handleRestart = useCallback(() => {
    // Reset all state to initial values
    setSuccess(false)
    setError(null)
    setFramesCollected(0)
    setFramesSent(0)
    setFrameCount(0)
    setProcessedCount(0)
    setQualityScore(null)
    setAntispoofingScore(null)
    setFaceConfidence(null)
    setProcessingTime(null)
    setSessionData(null)
    setRetryCount(0)
    setNetworkLatency(null)
    setStatus('Ready to start registration')
    handleStart()
  }, [handleStart])

  // Cleanup on unmount
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

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connected':
        return `Connected ${networkLatency ? `(${networkLatency}ms)` : ''}`
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return `Reconnecting... (${retryCount}/${MAX_RETRIES})`
      default:
        return 'Disconnected'
    }
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
        
        {/* Status Overlay - matches backend messaging */}
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black bg-opacity-70 text-white p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Registration Status</span>
              <div className="flex items-center space-x-2">
                {getConnectionIcon()}
                <span className="text-xs">{getConnectionText()}</span>
              </div>
            </div>
            
            <p className="text-sm">{status}</p>
            
            {/* Progress Bar - aligned with backend frame requirements */}
            {requiredFrames > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress ({framesCollected}/{requiredFrames})</span>
                  <span>Sent: {framesSent} | Total: {frameCount}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (framesCollected / requiredFrames) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Performance Metrics - matches backend data */}
            {(processingTime !== null || networkLatency !== null) && (
              <div className="mt-2 text-xs text-gray-300">
                {processingTime !== null && <span>Process: {processingTime.toFixed(0)}ms </span>}
                {networkLatency !== null && <span>Latency: {networkLatency}ms</span>}
              </div>
            )}
          </div>
        </div>

        {/* Quality Indicators - matches backend thresholds */}
        {(qualityScore !== null || antispoofingScore !== null || faceConfidence !== null) && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-70 text-white p-2 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {qualityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Quality</span>
                    <span className={`font-bold ${qualityScore >= 25 ? 'text-green-400' : qualityScore >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore.toFixed(1)}%
                    </span>
                  </div>
                )}
                {antispoofingScore !== null && (
                  <div>
                    <span className="block text-gray-300">Liveness</span>
                    <span className={`font-bold ${antispoofingScore >= 0.4 ? 'text-green-400' : 'text-red-400'}`}>
                      {(antispoofingScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {faceConfidence !== null && (
                  <div>
                    <span className="block text-gray-300">Detection</span>
                    <span className={`font-bold ${faceConfidence >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                      {(faceConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center rounded-lg">
            <div className="bg-green-500 text-white p-4 rounded-full">
              <CheckCircle size={48} />
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
            <span>
              {connectionState === 'connecting' ? 'Connecting...' : 'Start Registration'}
            </span>
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
            
            <button
              onClick={handleRestart}
              className="flex items-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RotateCcw size={20} />
              <span>Restart</span>
            </button>
          </div>
        )}

        {success && (
          <button
            onClick={handleRestart}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Camera size={20} />
            <span>Register Again</span>
          </button>
        )}

        {connectionState === 'disconnected' && retryCount >= MAX_RETRIES && !success && (
          <button
            onClick={handleRestart}
            className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <PlayCircle size={20} />
            <span>Retry Connection</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <p className="font-medium text-red-800">Registration Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Results - matches backend response structure */}
      {success && sessionData && (
        <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="font-medium text-green-800">Registration Successful!</p>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>User:</strong> {sessionData.user_name}</p>
            <p><strong>Face ID:</strong> {sessionData.face_id}</p>
            <p><strong>Quality Score:</strong> {sessionData.quality_score?.toFixed(1)}%</p>
            <p><strong>Anti-spoofing Score:</strong> {(sessionData.antispoofing_score * 100)?.toFixed(1)}%</p>
            <p><strong>Frames Processed:</strong> {sessionData.frames_processed}</p>
            <p><strong>Model:</strong> {sessionData.model_name || 'ArcFace'}</p>
            {sessionData.avg_processing_time && (
              <p><strong>Avg Processing Time:</strong> {sessionData.avg_processing_time.toFixed(0)}ms</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions - aligned with backend settings */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield size={20} className="text-blue-600" />
          <p className="font-medium text-blue-800">Registration Instructions</p>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Need {requiredFrames} high-quality frames</li>
          <li>• Quality threshold: 25% (relaxed)</li>
          <li>• Liveness threshold: 40% (moderate)</li>
          <li>• Look directly at camera and stay still</li>
          <li>• System processes 1 frame per second</li>
          <li>• Auto-reconnection on network issues</li>
        </ul>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default RealTimeFaceRegistration