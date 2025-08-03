import { Linking } from 'react-native'

export const openDiscogsAuthBrowser = async (oauth_token: string): Promise<void> => {
  const authUrl = `https://discogs.com/oauth/authorize?oauth_token=${oauth_token}`
  
  try {
    console.log('Opening system browser with URL:', authUrl)
    
    const canOpen = await Linking.canOpenURL(authUrl)
    if (!canOpen) {
      throw new Error('Cannot open URL')
    }
    
    await Linking.openURL(authUrl)
    console.log('System browser opened successfully')
    
  } catch (error) {
    console.error('Error opening Discogs auth URL in system browser:', error)
    throw error
  }
}
