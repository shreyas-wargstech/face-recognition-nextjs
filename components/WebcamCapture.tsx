'use client'

import React, { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { Camera, RotateCcw, Check } from 'lucide-react'

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

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      
      // Convert base64 to File
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `face-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file)
        })
    }
  }, [onCapture])

  const retake = useCallback(() => {
    setCapturedImage(null)
  }, [])

  const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: "user"
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        {capturedImage ? (
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-[480px] h-[360px] object-cover rounded-lg border-2 border-gray-300"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
              <Check size={16} />
            </div>
          </div>
        ) : (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="rounded-lg border-2 border-gray-300"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                Position your face in the center
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        {!capturedImage ? (
          <button
            onClick={capture}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Camera size={20} />
            <span>Capture Photo</span>
          </button>
        ) : (
          <button
            onClick={retake}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw size={20} />
            <span>Retake Photo</span>
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center max-w-md">
        <p>• Make sure your face is well-lit and clearly visible</p>
        <p>• Look directly at the camera</p>
        <p>• Remove glasses or masks if possible</p>
      </div>
    </div>
  )
}

export default WebcamCapture