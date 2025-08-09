import React, { createContext, useContext, ReactNode, useState, useCallback, useRef } from 'react'
import { Record } from '../types/Record'
import { initDatabase } from '../database/database'
import { syncIfStale } from '../database/syncService'
import { getAllRecords } from '../database/collectionService'
import { getRandomRecord as getRandomRecordUtil } from '../utils/recordUtils'

interface RecordsContextType {
  records: Record[]
  loading: boolean
  error: string | null
  initialized: boolean
  currentRandomRecord: Record | null
  loadCollection: (username: string, force?: boolean) => Promise<void>
  refreshCollection: (username: string) => Promise<void>
  clearError: () => void
  getRandomRecord: () => void
  clearRandomRecord: () => void
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined)

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [currentRandomRecord, setCurrentRandomRecord] = useState<Record | null>(null)
  
  // Track ongoing operations to prevent duplicate calls
  const loadingRef = useRef<{ [username: string]: boolean }>({})
  const lastLoadedUser = useRef<string | null>(null)

  const loadCollection = useCallback(async (username: string, force = false) => {
    if (!username) {
      setError('Username is required to load collection')
      return
    }

    // Prevent duplicate loading for the same user
    const loadingKey = `${username}-${force}`
    if (loadingRef.current[loadingKey]) {
      console.log('Collection load already in progress for:', username)
      return
    }

    // If already loaded for this user and not forcing, skip
    if (!force && lastLoadedUser.current === username && initialized && records.length > 0) {
      console.log('Collection already loaded for:', username)
      return
    }

    loadingRef.current[loadingKey] = true
    setLoading(true)
    setError(null)

    try {
      await initDatabase()
      const syncResult = await syncIfStale(username, force)
      const data = await getAllRecords()
      
      setRecords(data)
      setInitialized(true)
      lastLoadedUser.current = username
      
      console.log(`✅ Loaded ${data.length} records for ${username} (sync: ${syncResult})`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load collection'
      setError(errorMessage)
      console.error('❌ Error loading collection:', err)
    } finally {
      setLoading(false)
      delete loadingRef.current[loadingKey]
    }
  }, [initialized, records.length])

  const refreshCollection = useCallback(async (username: string) => {
    await loadCollection(username, true)
  }, [loadCollection])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getRandomRecord = useCallback(() => {
    if (records.length === 0) {
      console.warn('No records available for random selection')
      return
    }
    
    const randomRecord = getRandomRecordUtil(records)
    setCurrentRandomRecord(randomRecord)
  }, [records])

  const clearRandomRecord = useCallback(() => {
    setCurrentRandomRecord(null)
  }, [])

  return (
    <RecordsContext.Provider value={{ 
      records, 
      loading, 
      error, 
      initialized,
      currentRandomRecord,
      loadCollection, 
      refreshCollection, 
      clearError,
      getRandomRecord,
      clearRandomRecord
    }}>
      {children}
    </RecordsContext.Provider>
  )
}

export const useRecordsContext = () => {
  const context = useContext(RecordsContext)
  if (context === undefined) {
    throw new Error('useRecordsContext must be used within a RecordsProvider')
  }
  return context
}