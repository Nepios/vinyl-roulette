import EncryptedStorage from 'react-native-encrypted-storage'

const TOKEN_KEY = 'discogs_token'

export const storeDiscogsToken = async (token: { oauth_token: string; oauth_token_secret: string }) => {
  await EncryptedStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export const getDiscogsToken = async (): Promise<{ oauth_token: string; oauth_token_secret: string } | null> => {
  const raw = await EncryptedStorage.getItem(TOKEN_KEY)
  return raw ? JSON.parse(raw) : null
}

export const clearDiscogsToken = async () => {
  await EncryptedStorage.removeItem(TOKEN_KEY)
}
