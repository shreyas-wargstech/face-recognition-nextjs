// OptimizedFaceRegistration.tsx - Ultra-Fast Frontend Implementation
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, CheckCircle, AlertCircle, Zap, StopCircle, PlayCircle, Loader, Wifi, WifiOff, RotateCcw } from 'lucide-react'

interface OptimizedFaceRegistrationProps {
  userId: number
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

const OptimizedFaceRegistration: React.FC<OptimizedFaceRegistrationProps> = ({ 
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
  const frameCountRef = useRef(0)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [status, setStatus] = useState<string>('Ready for ultra-fast registration')
  const [framesCollected, setFramesCollected] = useState(0)
  const [framesSent, setFramesSent] = useState(0)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [faceConfidence, setFaceConfidence] = useState<number | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [totalTime, setTotalTime] = useState<number | null>(null)

  // Optimized settings for maximum speed
  const FRAME_CAPTURE_INTERVAL = 300  // 300ms - much faster than original 1000ms
  const FRAME_QUALITY = 0.4           // Lower quality for speed (was 0.6)
  const MAX_FRAME_SIZE = { width: 320, height: 240 }  // Smaller resolution for speed
  const CONNECTION_TIMEOUT = 8000      // Faster timeout
  const REQUIRED_FRAMES = 2            // Reduced from 3

  const buildWebSocketUrl = useCallback(() => {
    // Use the new ultra-fast endpoint
    return `ws://localhost:8000/ws/face-registration-fast/${userId}`
  }, [userId])

  const startVideoStream = useCallback(async () => {
    try {
      // Optimized camera constraints for speed
      const constraints = {
        video: {
          width: { ideal: MAX_FRAME_SIZE.width, max: 480 },
          height: { ideal: MAX_FRAME_SIZE.height, max: 360 },
          frameRate: { ideal: 30, max: 30 },  // Higher framerate for responsiveness
          facingMode: 'user'
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      console.log('✅ Optimized camera stream started')
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
        setStatus('Connected to ultra-fast registration service')
        console.log('🚀 Ultra-fast WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          switch (message.type) {
            case 'connected':
              setStatus(`Ultra-fast mode ready. Need ${REQUIRED_FRAMES} frames.`)
              setIsStreaming(true)
              startFrameCapture()
              break

            case 'frame_processed':
              if (message.success) {
                setFramesCollected(message.frames_collected)
                setQualityScore(message.quality_score)
                setFaceConfidence(message.face_confidence)
                setProcessingTime(message.processing_time)
                setStatus(message.message)
                setError(null)
              } else {
                setStatus(message.message)
                setProcessingTime(message.processing_time)
              }
              break

            case 'registration_complete':
              setSuccess(true)
              setSessionData(message)
              setTotalTime(message.total_time)
              setStatus(`⚡ Ultra-fast registration complete in ${message.total_time?.toFixed(0)}ms!`)
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
          console.error('Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        clearTimeout(connectionTimeout)
        setError('Connection error')
        setConnectionState('disconnected')
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        setIsConnected(false)
        setIsStreaming(false)
        setConnectionState('disconnected')
        console.log('❌ WebSocket closed:', event.code)
      }

    } catch (error) {
      console.error('WebSocket creation error:', error)
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
      // Optimized canvas processing
      canvas.width = MAX_FRAME_SIZE.width
      canvas.height = MAX_FRAME_SIZE.height

      // Fast draw operation
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Lower quality for speed
      const frameData = canvas.toDataURL('image/jpeg', FRAME_QUALITY)

      // Send frame immediately (no queuing)
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        frame: frameData,
        timestamp: Date.now()
      }))

      frameCountRef.current += 1
      setFramesSent(prev => prev + 1)

    } catch (error) {
      console.error('Error capturing frame:', error)
    }
  }, [])

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
        console.error('Error closing WebSocket:', error)
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
    setStatus('Registration stopped')
  }, [stopStreaming])

  const handleRestart = useCallback(() => {
    setSuccess(false)
    setError(null)
    setFramesCollected(0)
    setFramesSent(0)
    setQualityScore(null)
    setFaceConfidence(null)
    setProcessingTime(null)
    setTotalTime(null)
    setSessionData(null)
    frameCountRef.current = 0
    setStatus('Ready for ultra-fast registration')
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

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Optimized Video Display */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-[320px] h-[240px] object-cover rounded-lg border-2 border-gray-300 bg-black"
        />
        
        {/* Ultra-Fast Status Overlay */}
        <div className="absolute top-2 left-2 right-2">
          <div className="bg-black bg-opacity-80 text-white p-2 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium flex items-center">
                <Zap size={12} className="mr-1 text-yellow-400" />
                Ultra-Fast Mode
              </span>
              <div className="flex items-center space-x-1">
                {getConnectionIcon()}
                <span className="text-xs">{connectionState}</span>
              </div>
            </div>
            
            <p className="text-xs">{status}</p>
            
            {/* Fast Progress */}
            {REQUIRED_FRAMES > 0 && (
              <div className="mt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress ({framesCollected}/{REQUIRED_FRAMES})</span>
                  <span>Sent: {framesSent}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className="bg-yellow-400 h-1 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(100, (framesCollected / REQUIRED_FRAMES) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {processingTime !== null && (
              <div className="mt-1 text-xs text-yellow-300">
                Processing: {processingTime.toFixed(0)}ms
                {totalTime && ` | Total: ${totalTime.toFixed(0)}ms`}
              </div>
            )}
          </div>
        </div>

        {/* Quality Indicators */}
        {(qualityScore !== null || faceConfidence !== null) && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black bg-opacity-80 text-white p-2 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {qualityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Quality</span>
                    <span className={`font-bold ${qualityScore >= 15 ? 'text-green-400' : 'text-red-400'}`}>
                      {qualityScore.toFixed(1)}%
                    </span>
                  </div>
                )}
                {faceConfidence !== null && (
                  <div>
                    <span className="block text-gray-300">Detection</span>
                    <span className={`font-bold ${faceConfidence >= 0.45 ? 'text-green-400' : 'text-red-400'}`}>
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
            <div className="bg-green-500 text-white p-3 rounded-full">
              <CheckCircle size={32} />
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
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {connectionState === 'connecting' ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            <span>Ultra-Fast Registration</span>
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
              <span>Restart</span>
            </button>
          </div>
        )}

        {success && (
          <button
            onClick={handleRestart}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Camera size={16} />
            <span>Register Again</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-600" />
            <div>
              <p className="font-medium text-red-800 text-sm">Registration Error</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Results */}
      {success && sessionData && (
        <div className="w-full max-w-sm bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="font-medium text-green-800 text-sm">Ultra-Fast Registration Complete!</p>
          </div>
          <div className="text-xs text-green-700 space-y-1">
            <p><strong>User:</strong> {sessionData.user_name}</p>
            <p><strong>Face ID:</strong> {sessionData.face_id}</p>
            <p><strong>Quality:</strong> {sessionData.quality_score?.toFixed(1)}%</p>
            <p><strong>Frames:</strong> {sessionData.frames_processed}</p>
            <p><strong>Total Time:</strong> {sessionData.total_time?.toFixed(0)}ms</p>
            <p><strong>Mode:</strong> {sessionData.mode}</p>
          </div>
        </div>
      )}

      {/* Performance Info */}
      <div className="w-full max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Zap size={16} className="text-yellow-600" />
          <p className="font-medium text-yellow-800 text-sm">Ultra-Fast Mode Features</p>
        </div>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Only {REQUIRED_FRAMES} frames needed</li>
          <li>• 300ms capture interval (3x faster)</li>
          <li>• Optimized 320x240 processing</li>
          <li>• Reduced quality thresholds</li>
          <li>• Instant frame processing</li>
          <li>• Expected completion: &lt;3 seconds</li>
        </ul>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default OptimizedFaceRegistration
