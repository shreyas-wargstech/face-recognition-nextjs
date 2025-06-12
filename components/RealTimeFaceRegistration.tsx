// components/RealTimeFaceRegistration.tsx
'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, CheckCircle, AlertCircle, Shield, StopCircle, PlayCircle, Loader } from 'lucide-react'

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

  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<string>('Ready to start registration')
  const [framesCollected, setFramesCollected] = useState(0)
  const [requiredFrames, setRequiredFrames] = useState(10)
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [antispoofingScore, setAntispoofingScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

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
      const wsUrl = `ws://localhost:8000/ws/face-registration/${userId}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setStatus('Connected. Initializing registration...')
        console.log('🔗 WebSocket connected for face registration')
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('📨 Received message:', message)

        switch (message.type) {
          case 'connected':
            setRequiredFrames(message.required_frames)
            setStatus(`Registration ready. Please look at the camera. Need ${message.required_frames} good frames.`)
            setIsStreaming(true)
            startFrameCapture()
            break

          case 'frame_processed':
            if (message.success) {
              setFramesCollected(message.frames_collected)
              setQualityScore(message.quality_score)
              setAntispoofingScore(message.antispoofing_score)
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
  }, [userId, onSuccess, onError, success])

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
    setStatus('Registration stopped')
  }, [stopStreaming])

  const handleRestart = useCallback(() => {
    setSuccess(false)
    setError(null)
    setFramesCollected(0)
    setQualityScore(null)
    setAntispoofingScore(null)
    setSessionData(null)
    setStatus('Ready to start registration')
    startVideoStream()
  }, [startVideoStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

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
              <span className="text-sm font-medium">Registration Status</span>
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

        {/* Quality Indicators */}
        {(qualityScore !== null || antispoofingScore !== null) && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-70 text-white p-2 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {qualityScore !== null && (
                  <div>
                    <span className="block text-gray-300">Quality</span>
                    <span className={`font-bold ${qualityScore >= 70 ? 'text-green-400' : qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {qualityScore.toFixed(1)}%
                    </span>
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
            onClick={startVideoStream}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlayCircle size={20} />
            <span>Start Registration</span>
          </button>
        )}

        {isStreaming && (
          <button
            onClick={handleStop}
            className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <StopCircle size={20} />
            <span>Stop Registration</span>
          </button>
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

      {/* Success Results */}
      {success && sessionData && (
        <div className="w-full max-w-md bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="font-medium text-green-800">Registration Successful!</p>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>User:</strong> {sessionData.user_name}</p>
            <p><strong>Quality Score:</strong> {sessionData.quality_score?.toFixed(1)}%</p>
            <p><strong>Anti-spoofing Score:</strong> {(sessionData.antispoofing_score * 100)?.toFixed(1)}%</p>
            <p><strong>Frames Processed:</strong> {sessionData.frames_processed}</p>
            <p><strong>Face ID:</strong> {sessionData.face_id}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield size={20} className="text-blue-600" />
          <p className="font-medium text-blue-800">Registration Instructions</p>
        </div>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Look directly at the camera</li>
          <li>• Ensure good lighting on your face</li>
          <li>• Keep your face centered in the frame</li>
          <li>• Remove glasses or masks if possible</li>
          <li>• Stay still during the process</li>
          <li>• The system will collect {requiredFrames} high-quality frames</li>
        </ul>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default RealTimeFaceRegistration