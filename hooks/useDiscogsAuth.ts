import { useState, useEffect, useCallback } from 'react'
import { getDiscogsToken, clearDiscogsToken } from '../services/auth/tokenStorage'
import { fetchUserIdentity } from '../services/discogsApi'

export interface DiscogsAuthState {
  isAuthorized: boolean | null
  username: string | null
  loading: boolean
  error: string | null
}

export const useDiscogsAuth = () => {
  const [authState, setAuthState] = useState<DiscogsAuthState>({
    isAuthorized: null,
    username: null,
    loading: true,
    error: null
  })

  const checkAuthorizationStatus = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const token = await getDiscogsToken()
      if (token) {
        // Token exists, try to get user identity to verify it's valid
        try {
          const identity = await fetchUserIdentity()
          setAuthState({
            isAuthorized: true,
            username: identity.username,
            loading: false,
            error: null
          })
        } catch (error) {
          // Token is invalid or expired, clear it
          console.warn('Token exists but is invalid, clearing it:', error)
          try {
            await clearDiscogsToken()
          } catch (clearError) {
            console.error('Error clearing invalid token:', clearError)
          }
          setAuthState({
            isAuthorized: false,
            username: null,
            loading: false,
            error: null // Don't show error for invalid tokens
          })
        }
      } else {
        // No token found
        setAuthState({
          isAuthorized: false,
          username: null,
          loading: false,
          error: null
        })
      }
    } catch (error) {
      console.error('Error checking authorization status:', error)
      // For storage errors, assume no authentication
      setAuthState({
        isAuthorized: false,
        username: null,
        loading: false,
        error: null // Don't show storage errors to user
      })
    }
  }, [])

  useEffect(() => {
    checkAuthorizationStatus()
  }, [checkAuthorizationStatus])

  const refreshAuth = useCallback(() => {
    checkAuthorizationStatus()
  }, [checkAuthorizationStatus])

  return {
    ...authState,
    refreshAuth
  }
}
