import { useEffect } from 'react'
import { Linking } from 'react-native'

export const useDiscogsOAuthCallback = (
  onSuccess: (verifier: string, token: string) => void
) => {
  useEffect(() => {
    console.log('Setting up Linking listener for OAuth callback')
    const handleUrl = (event: { url: string }) => {
      const url = new URL(event.url)

      if (url.hostname === 'oauth-callback') {
        const verifier = url.searchParams.get('oauth_verifier')
        const token = url.searchParams.get('oauth_token')
        if (verifier && token) {
          console.log('OAuth callback received with verifier and token')
          onSuccess(verifier, token)
        }
      }
    }

    const subscription = Linking.addEventListener('url', handleUrl)

    // Also handle if app is launched from cold start with URL
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url })
    })

    return () => {
      subscription?.remove()
    }
  }, [onSuccess])
}
