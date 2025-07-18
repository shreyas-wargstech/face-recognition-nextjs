  // components/WebcamCapture.tsx - Professional Version
  'use client'

  import React, { useRef, useCallback, useState } from 'react'
  import Webcam from 'react-webcam'
  import { Camera, RotateCcw, Check, AlertCircle, Shield, Eye, Loader } from 'lucide-react'

  interface WebcamCaptureProps {
    onCapture: (imageFile: File) => void
    loading?: boolean
    className?: string
  }

  const WebcamCapture: React.FC<WebcamCaptureProps> = ({ 
    onCapture, 
    loading = false, 
    className = "" 
  }) => {
    const webcamRef = useRef<Webcam>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [cameraReady, setCameraReady] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    const capture = useCallback(() => {
      if (loading || isCapturing) return
      
      setIsCapturing(true)
      
      // Add a small delay for better UX
      setTimeout(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
          setCapturedImage(imageSrc)
          
          // Convert base64 to File
          fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], `face-${Date.now()}.jpg`, { type: 'image/jpeg' })
              onCapture(file)
              setIsCapturing(false)
            })
            .catch(error => {
              console.error('Error converting image:', error)
              setIsCapturing(false)
            })
        } else {
          setIsCapturing(false)
        }
      }, 200)
    }, [onCapture, loading, isCapturing])

    const retake = useCallback(() => {
      if (loading) return
      setCapturedImage(null)
    }, [loading])

    const handleUserMedia = useCallback(() => {
      setCameraReady(true)
      setCameraError(null)
    }, [])

    const handleUserMediaError = useCallback((error: any) => {
      setCameraReady(false)
      
      let errorMessage = 'Failed to access camera.'
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and refresh the page.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.'
      }
      
      setCameraError(errorMessage)
    }, [])

    const videoConstraints = {
      width: 640,
      height: 480,
      facingMode: "user"
    }

    return (
      <div className={`flex flex-col items-center space-y-6 ${className}`}>
        {/* Professional Camera Container */}
        <div className="relative w-full max-w-2xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg transition-all duration-300 hover:shadow-xl">
            {/* Camera Display */}
            {capturedImage ? (
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-[480px] object-cover bg-gray-900"
                />
                
                {/* Success Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
                
                {/* Success Indicator */}
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                    <Check size={20} className="text-white" />
                  </div>
                </div>
                
                {/* Capture Confirmation */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-black/80 backdrop-blur-md rounded-xl px-6 py-4 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 rounded-full p-2">
                        <Check size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Photo Captured Successfully</p>
                        <p className="text-gray-300 text-sm">Ready for processing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {cameraError ? (
                  // Camera Error State
                  <div className="w-full h-[480px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <AlertCircle size={48} className="text-red-400 mx-auto" />
                      <div>
                        <h3 className="text-white font-semibold mb-2">Camera Access Error</h3>
                        <p className="text-gray-300 text-sm max-w-md">{cameraError}</p>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                ) : (
                  // Live Camera Feed
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      onUserMedia={handleUserMedia}
                      onUserMediaError={handleUserMediaError}
                      className="w-full h-[480px] object-cover bg-gray-900"
                    />
                    
                    {/* Professional Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
                    
                    {/* Camera Status */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                        <span className="text-white text-xs font-medium">
                          {cameraReady ? 'LIVE' : 'CONNECTING...'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Center Guidelines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Face outline guide */}
                      <div className="w-64 h-80 border-2 border-white/30 rounded-full opacity-60">
                        <div className="absolute inset-4 border border-white/20 rounded-full" />
                      </div>
                    </div>
                    
                    {/* Instructions */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/80 backdrop-blur-md rounded-xl px-6 py-4 border border-white/10">
                        <div className="flex items-center space-x-3 mb-2">
                          <Eye className="text-blue-400" size={20} />
                          <span className="text-white font-medium">Position Your Face</span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Center your face within the oval guide and ensure good lighting
                        </p>
                      </div>
                    </div>
                    
                    {/* Loading Overlay */}
                    {isCapturing && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white p-4 rounded-full shadow-2xl">
                          <Loader size={32} className="animate-spin" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Professional Controls */}
        <div className="flex justify-center space-x-4">
          {!capturedImage && !cameraError ? (
            <button
              onClick={capture}
              disabled={loading || isCapturing || !cameraReady}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                {isCapturing ? (
                  <Loader size={24} className="animate-spin" />
                ) : (
                  <Camera size={24} />
                )}
                <span className="text-lg">
                  {isCapturing ? 'Capturing...' : loading ? 'Processing...' : 'Capture Photo'}
                </span>
              </div>
              
              {/* Capture effect */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
              )}
            </button>
          ) : capturedImage ? (
            <button
              onClick={retake}
              disabled={loading}
              className="group px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <RotateCcw size={24} />
                <span className="text-lg">Retake Photo</span>
              </div>
            </button>
          ) : null}
        </div>

        {/* Professional Instructions */}
        <div className="w-full max-w-2xl bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield size={20} className="text-blue-600" />
            <p className="font-semibold text-blue-800 text-lg">Photo Capture Guidelines</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {[
                'Ensure your face is well-lit and clearly visible',
                'Look directly at the camera lens',
                'Keep your face centered in the frame'
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
                'Remove glasses or masks if possible',
                'Maintain consistent distance (arm\'s length)',
                'Stay still during photo capture'
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

        {/* Technical Info */}
        <div className="w-full max-w-2xl text-center text-sm text-gray-500">
          <p>High-quality photo capture • Professional face recognition • Secure processing</p>
        </div>
      </div>
    )
  }

  export default WebcamCapture