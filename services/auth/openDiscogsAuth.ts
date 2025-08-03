import InAppBrowser from 'react-native-inappbrowser-reborn'
import { Linking } from 'react-native'

let isInAppBrowserOpen = false

export const openDiscogsAuth = async (oauth_token: string, onCallback?: (url: string) => void): Promise<void> => {
  const authUrl = `https://discogs.com/oauth/authorize?oauth_token=${oauth_token}`
  const callbackUrlScheme = 'vinylroulette'

  try {
    // Check if an InAppBrowser is already open
    if (isInAppBrowserOpen) {
      console.warn('InAppBrowser is already open, closing it first')
      await InAppBrowser.close()
      isInAppBrowserOpen = false
      // Small delay to ensure the browser is fully closed
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const isAvailable = await InAppBrowser.isAvailable()
    if (isAvailable) {
      isInAppBrowserOpen = true
      
      console.log('Opening InAppBrowser with URL:', authUrl)
      
      const result = await InAppBrowser.openAuth(authUrl, callbackUrlScheme, {
        // iOS options
        ephemeralWebSession: false,
        // Android options
        showTitle: true,
        toolbarColor: '#FF6600',
        secondaryToolbarColor: 'black',
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        forceCloseOnRedirection: true,
      })
      
      console.log('InAppBrowser result:', result)
      
      // Reset the flag when browser closes
      isInAppBrowserOpen = false
      
      // Handle the result
      if (result.type === 'success' && result.url) {
        console.log('Auth successful, callback URL:', result.url)
        
        // Call the callback function directly
        if (onCallback) {
          console.log('Calling provided callback function')
          onCallback(result.url)
        } else {
          console.warn('No callback function provided, callback URL will not be handled')
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled authentication')
      } else {
        console.log('InAppBrowser result:', result)
      }
    } else {
      // Fallback to system browser
      console.log('InAppBrowser not available, using system browser')
      await Linking.openURL(authUrl)
    }
  } catch (error) {
    isInAppBrowserOpen = false
    console.error('Error opening Discogs auth URL:', error)
    
    if (error.message?.includes('Another InAppBrowser is already being presented')) {
      console.warn('InAppBrowser already open, trying to close and retry')
      try {
        await InAppBrowser.close()
        await new Promise(resolve => setTimeout(resolve, 500))
        // Retry with system browser instead
        await Linking.openURL(authUrl)
      } catch (retryError) {
        console.error('Retry failed:', retryError)
      }
    } else {
      // Fallback to system browser on any other error
      console.log('Falling back to system browser')
      await Linking.openURL(authUrl)
    }
  }
}
