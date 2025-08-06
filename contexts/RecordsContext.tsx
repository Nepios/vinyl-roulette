import React, { createContext, useContext, ReactNode, useState } from 'react'
import { Record } from '../screens/UserCollection'

interface RecordsContextType {
  records: Record[]
  setRecords: React.Dispatch<React.SetStateAction<Record[]>>
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined)

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>([])

  return (
    <RecordsContext.Provider value={{ records, setRecords }}>
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