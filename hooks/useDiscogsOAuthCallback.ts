import { useEffect } from 'react'
import { Linking } from 'react-native'

export const useDiscogsOAuthCallback = (
  onCallback: (verifier: string, token: string) => void
) => {
  useEffect(() => {
    const handler = (event: { url: string }) => {
      console.log('Received URL:', event.url)
      
      try {
        const url = new URL(event.url)
        console.log('Parsed URL - Protocol:', url.protocol, 'Hostname:', url.hostname, 'Pathname:', url.pathname)
        console.log('Search params:', url.search)
        
        // Check for vinylroulette scheme with oauth-callback path
        if (url.protocol === 'vinylroulette:' && url.pathname === '/oauth-callback') {
          const verifier = url.searchParams.get('oauth_verifier')
          const token = url.searchParams.get('oauth_token')
          
          console.log('OAuth callback detected - Verifier:', verifier, 'Token:', token)
          
          if (verifier && token) {
            console.log('Calling onCallback with verifier and token')
            onCallback(verifier, token)
          } else {
            console.warn('Missing verifier or token in callback URL')
          }
        } else {
          console.log('URL does not match expected callback pattern')
        }
      } catch (error) {
        console.error('Error parsing callback URL:', error)
        
        // Fallback: try to parse as a simple string
        if (event.url.includes('vinylroulette://oauth-callback')) {
          console.log('Attempting fallback parsing')
          const urlParts = event.url.split('?')[1]
          if (urlParts) {
            const params = new URLSearchParams(urlParts)
            const verifier = params.get('oauth_verifier')
            const token = params.get('oauth_token')
            
            if (verifier && token) {
              console.log('Fallback parsing successful')
              onCallback(verifier, token)
            }
          }
        }
      }
    }

    console.log('Setting up OAuth callback listener')
    const subscription = Linking.addListener('url', handler)
    
    // Check if app was launched with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL detected:', url)
        handler({ url })
      }
    })

    return () => {
      console.log('Removing OAuth callback listener')
      subscription.remove()
    }
  }, [onCallback])
}
