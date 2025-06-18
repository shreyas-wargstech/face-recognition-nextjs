// components/Navigation.tsx - Updated and aligned
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UserPlus, BookOpen, Activity, Shield } from 'lucide-react'

const Navigation = () => {
  const pathname = usePathname()

  const navItems = [
    { 
      href: '/', 
      label: 'Home', 
      icon: Home,
      description: 'System overview and user selection'
    },
    { 
      href: '/register', 
      label: 'Register Face', 
      icon: UserPlus,
      description: 'Real-time face registration'
    },
    { 
      href: '/course', 
      label: 'Course', 
      icon: BookOpen,
      description: 'Learning content and secure quizzes'
    },
    { 
      href: '/status', 
      label: 'Status', 
      icon: Activity,
      description: 'Analytics and verification history'
    },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg">LMS Face Recognition</span>
              <div className="text-xs text-gray-500">Real-time Streaming System v3.0</div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navItems.map(({ href, label, icon: Icon, description }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={description}
                >
                  <Icon size={16} className={isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'} />
                  <span>{label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Optional: Show current page info */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Backend: FastAPI + WebSockets</span>
              <span>•</span>
              <span>AI: DeepFace + ArcFace</span>
              <span>•</span>
              <span>Security: Enterprise Grade</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>System Active</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation