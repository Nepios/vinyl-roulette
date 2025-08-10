import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { QueueItem, addToQueue, getQueue, removeFromQueue, clearQueue, isInQueue, getQueueCount } from '../database/queueService'
import { Record } from '../types/Record'

interface QueueContextType {
  queue: QueueItem[]
  queueCount: number
  loading: boolean
  error: string | null
  addToQueue: (record: Record) => Promise<boolean>
  removeFromQueue: (queueId: number) => Promise<void>
  clearQueue: () => Promise<void>
  refreshQueue: () => Promise<void>
  isInQueue: (recordId: number) => Promise<boolean>
  clearError: () => void
}

const QueueContext = createContext<QueueContextType | undefined>(undefined)

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [queueCount, setQueueCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshQueue = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [queueItems, count] = await Promise.all([
        getQueue(),
        getQueueCount()
      ])
      
      setQueue(queueItems)
      setQueueCount(count)
      console.log(`✅ Queue refreshed: ${count} items`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh queue'
      setError(errorMessage)
      console.error('❌ Error refreshing queue:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAddToQueue = useCallback(async (record: Record): Promise<boolean> => {
    setError(null)

    try {
      // Check if already in queue
      const alreadyInQueue = await isInQueue(record.id)
      if (alreadyInQueue) {
        setError('This record is already in your queue')
        return false
      }

      await addToQueue(record)
      await refreshQueue() // Refresh to get updated list
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to queue'
      setError(errorMessage)
      console.error('❌ Error adding to queue:', err)
      return false
    }
  }, [refreshQueue])

  const handleRemoveFromQueue = useCallback(async (queueId: number) => {
    setError(null)

    try {
      await removeFromQueue(queueId)
      await refreshQueue() // Refresh to get updated list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from queue'
      setError(errorMessage)
      console.error('❌ Error removing from queue:', err)
    }
  }, [refreshQueue])

  const handleClearQueue = useCallback(async () => {
    setError(null)

    try {
      await clearQueue()
      setQueue([])
      setQueueCount(0)
      console.log('✅ Queue cleared')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear queue'
      setError(errorMessage)
      console.error('❌ Error clearing queue:', err)
    }
  }, [])

  const checkIsInQueue = useCallback(async (recordId: number): Promise<boolean> => {
    try {
      return await isInQueue(recordId)
    } catch (err) {
      console.error('❌ Error checking queue:', err)
      return false
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <QueueContext.Provider value={{ 
      queue, 
      queueCount,
      loading, 
      error, 
      addToQueue: handleAddToQueue,
      removeFromQueue: handleRemoveFromQueue,
      clearQueue: handleClearQueue,
      refreshQueue,
      isInQueue: checkIsInQueue,
      clearError
    }}>
      {children}
    </QueueContext.Provider>
  )
}

export const useQueueContext = () => {
  const context = useContext(QueueContext)
  if (context === undefined) {
    throw new Error('useQueueContext must be used within a QueueProvider')
  }
  return context
}