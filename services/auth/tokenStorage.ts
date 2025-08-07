import EncryptedStorage from 'react-native-encrypted-storage'
import { safeError } from '../../utils/logger'

const TOKEN_KEY = 'discogs_token'

export const storeDiscogsToken = async (token: { oauth_token: string; oauth_token_secret: string }) => {
  try {
    await EncryptedStorage.setItem(TOKEN_KEY, JSON.stringify(token))
  } catch (error) {
    safeError('Error storing Discogs token:', error)
    throw new Error('Failed to store authentication token')
  }
}

export const getDiscogsToken = async (): Promise<{ oauth_token: string; oauth_token_secret: string } | null> => {
  try {
    const raw = await EncryptedStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    safeError('Error retrieving Discogs token:', error)
    // If there's an error retrieving, assume no token exists
    // This prevents the app from crashing on storage errors
    return null
  }
}

export const clearDiscogsToken = async () => {
  try {
    await EncryptedStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    safeError('Error clearing Discogs token:', error)
    // Don't throw here as clearing should be non-fatal
  }
}
