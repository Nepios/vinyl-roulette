import EncryptedStorage from 'react-native-encrypted-storage'

export const clearAllEncryptedStorage = async () => {
  try {
    console.log('Clearing all encrypted storage...')
    await EncryptedStorage.clear()
    console.log('✅ All encrypted storage cleared successfully')
    return true
  } catch (error) {
    console.error('❌ Error clearing encrypted storage:', error)
    return false
  }
}

export const debugStorage = async () => {
  try {
    console.log('=== DEBUG: Checking encrypted storage ===')
    
    // Try to get the token
    const token = await EncryptedStorage.getItem('discogs_token')
    console.log('Current token:', token ? 'Token exists' : 'No token found')
    
    // List all keys (if supported)
    try {
      const keys = await EncryptedStorage.getAllKeys?.()
      console.log('All storage keys:', keys)
    } catch (e) {
      console.log('getAllKeys not supported or error:', e)
    }
    
    console.log('=== END DEBUG ===')
  } catch (error) {
    console.error('Error in debugStorage:', error)
  }
}
