// hooks/useUsers.ts - Custom hook for managing database users
'use client'

import { useState, useEffect, useCallback } from 'react'
import { faceAPI, User, UserStats } from '@/lib/api'

interface UseUsersReturn {
  users: User[]
  selectedUser: User | null
  loading: boolean
  error: string | null
  stats: UserStats | null
  selectedUserId: number | null
  setSelectedUserId: (userId: number) => void
  refreshUsers: () => Promise<void>
  getUserById: (userId: number) => User | undefined
  getUsersByRole: (role: string) => User[]
  saveSelectedUser: () => void
}

export const useUsers = (initialUserId?: number): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserIdState] = useState<number | null>(initialUserId || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)

  // Load selected user ID from localStorage on mount
  useEffect(() => {
    if (!initialUserId) {
      const saved = localStorage.getItem('selectedUserId')
      if (saved) {
        setSelectedUserIdState(parseInt(saved))
      }
    }
  }, [initialUserId])

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [usersData, statsData] = await Promise.allSettled([
        faceAPI.fetchAllUsers(),
        faceAPI.getUserStats()
      ])
      
      if (usersData.status === 'fulfilled') {
        setUsers(usersData.value)
        
        // If no user is selected and we have users, select the first one
        if (!selectedUserId && usersData.value.length > 0) {
          setSelectedUserIdState(usersData.value[0].id)
        }
      } else {
        throw new Error('Failed to fetch users')
      }
      
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value)
      }
      
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [selectedUserId])

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Set selected user ID with validation
  const setSelectedUserId = useCallback((userId: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setSelectedUserIdState(userId)
    } else {
      console.warn(`User with ID ${userId} not found`)
    }
  }, [users])

  // Save selected user to localStorage
  const saveSelectedUser = useCallback(() => {
    if (selectedUserId) {
      localStorage.setItem('selectedUserId', selectedUserId.toString())
    }
  }, [selectedUserId])

  // Auto-save when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem('selectedUserId', selectedUserId.toString())
    }
  }, [selectedUserId])

  // Get user by ID
  const getUserById = useCallback((userId: number): User | undefined => {
    return users.find(user => user.id === userId)
  }, [users])

  // Get users by role
  const getUsersByRole = useCallback((role: string): User[] => {
    return users.filter(user => user.role.toLowerCase() === role.toLowerCase())
  }, [users])

  // Find selected user object
  const selectedUser = selectedUserId ? getUserById(selectedUserId) : null

  // Refresh function for manual updates
  const refreshUsers = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  return {
    users,
    selectedUser,
    loading,
    error,
    stats,
    selectedUserId,
    setSelectedUserId,
    refreshUsers,
    getUserById,
    getUsersByRole,
    saveSelectedUser
  }
}

// Additional hook for user status with face registration
export const useUserWithFaceStatus = (userId: number | null) => {
  const [faceStatus, setFaceStatus] = useState<any>(null)
  const [faceLoading, setFaceLoading] = useState(false)
  const [faceError, setFaceError] = useState<string | null>(null)

  const fetchFaceStatus = useCallback(async () => {
    if (!userId) return

    try {
      setFaceLoading(true)
      setFaceError(null)
      const status = await faceAPI.getFaceStatus(userId)
      setFaceStatus(status)
    } catch (error) {
      console.error('Failed to fetch face status:', error)
      setFaceError(error instanceof Error ? error.message : 'Failed to load face status')
      // Provide fallback status
      setFaceStatus({
        user_id: userId,
        user_name: `User ${userId}`,
        registered: false
      })
    } finally {
      setFaceLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchFaceStatus()
  }, [fetchFaceStatus])

  return {
    faceStatus,
    faceLoading,
    faceError,
    refreshFaceStatus: fetchFaceStatus
  }
}