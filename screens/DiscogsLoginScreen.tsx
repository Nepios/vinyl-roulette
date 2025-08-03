import React, { useState } from 'react'
import { View, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { getRequestToken, getAccessToken } from '../services/auth/discogsOAuth'
import { storeDiscogsToken } from '../services/auth/tokenStorage'
import { openDiscogsAuth } from '../services/auth/openDiscogsAuth'
import { useDiscogsOAuthCallback } from '../hooks/useDiscogsOAuthCallback'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App'; 
import { fetchUserIdentity } from '../services/discogsApi'

// Store request secret outside of component to avoid state issues
let globalRequestSecret: string | null = null

const DiscogsLoginScreen = () => {
  const [loading, setLoading] = useState(false)
  const [requestSecret, setRequestSecret] = useState<string | null>(null)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Function to handle OAuth callback URL from InAppBrowser
  const handleOAuthCallback = async (callbackUrl: string) => {
    try {
      const url = new URL(callbackUrl)
      const verifier = url.searchParams.get('oauth_verifier')
      const token = url.searchParams.get('oauth_token')
      
      console.log('Parsed InAppBrowser callback - Verifier:', verifier, 'Token:', token)
      
      if (!verifier || !token) {
        throw new Error('Missing oauth_verifier or oauth_token in callback')
      }
      
      // Use globalRequestSecret as fallback if requestSecret state is lost
      const secretToUse = requestSecret || globalRequestSecret
      
      if (!secretToUse) {
        console.error('No request secret available - state:', requestSecret, 'global:', globalRequestSecret)
        throw new Error('No request secret available for token exchange')
      }
      const access = await getAccessToken(token, secretToUse, verifier)
      console.log('Access token received:', access)
      
      await storeDiscogsToken(access)
      console.log('Token stored successfully')
      
      // Clear the secrets after successful use
      globalRequestSecret = null
      setRequestSecret(null)
      
      try {
        const identity = await fetchUserIdentity()
        navigation.navigate('Collection', { username: identity.username })
      } catch (identityError) {
        Alert.alert('Success!', 'Logged in successfully! Please restart the app to view your collection.')
      }
    } catch (err) {
      console.error('InAppBrowser OAuth callback handling error:', err)
      const errorMessage = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: string }).message : String(err)
      Alert.alert('Login failed', `Could not complete login: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Keep the existing hook as fallback for system browser
  useDiscogsOAuthCallback(async (verifier, token) => {
    if (!requestSecret) {
      console.warn('No request secret available for token exchange')
      Alert.alert('Login Error', 'Session expired. Please try logging in again.')
      return
    }
    
    try {
      setLoading(true)
      const access = await getAccessToken(token, requestSecret, verifier)
      await storeDiscogsToken(access)
      Alert.alert('Success!', 'Logged in successfully!')
    } catch (err) {
      console.error('Access token exchange error:', err)
      const errorMessage = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: string }).message : String(err)
      Alert.alert('Login failed', `Could not get access token: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  })

  const handleLogin = async () => {
    if (loading) {
      console.warn('Login already in progress')
      return
    }

    try {
      setLoading(true)
      const { oauth_token, oauth_token_secret } = await getRequestToken()
      setRequestSecret(oauth_token_secret)
      globalRequestSecret = oauth_token_secret
      await openDiscogsAuth(oauth_token, handleOAuthCallback)
    } catch (err) {
      globalRequestSecret = null
      setRequestSecret(null)
      setLoading(false) // Only set loading to false on error, success will be handled by callback
    }
  }

  return (
    <View style={styles.container}>
      <Button title="Login with Discogs" onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator style={styles.loader} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loader: {
    marginTop: 20,
  },
})

export default DiscogsLoginScreen
