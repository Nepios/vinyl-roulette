import React, { createContext, useContext, ReactNode } from 'react'
import { useDiscogsAuth, DiscogsAuthState } from '../hooks/useDiscogsAuth'

interface AuthContextType extends DiscogsAuthState {
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authState = useDiscogsAuth()

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
