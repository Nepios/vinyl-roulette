import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getRequestToken, getAccessToken } from '../services/auth/discogsOAuth'
import { storeDiscogsToken } from '../services/auth/tokenStorage'
import { openDiscogsAuth } from '../services/auth/openDiscogsAuth'
import { useDiscogsOAuthCallback } from '../hooks/useDiscogsOAuthCallback'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App'; 
import { fetchUserIdentity } from '../services/discogsApi'
import { useAuthContext } from '../contexts/AuthContext'
import { clearAllEncryptedStorage, debugStorage } from '../utils/debugUtils'
import { colors, spacing, borderRadius, shadows, typography } from '../styles/theme'
import { hasDynamicIsland } from '../utils/deviceUtils'

// Store request secret outside of component to avoid state issues
let globalRequestSecret: string | null = null

const DiscogsLoginScreen = () => {
  const [loading, setLoading] = useState(false)
  const [requestSecret, setRequestSecret] = useState<string | null>(null)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshAuth } = useAuthContext()

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
      
      // Refresh the auth context to update the app state
      refreshAuth()
      
      try {
        const identity = await fetchUserIdentity()
        navigation.navigate('Collection', { username: identity.username })
      } catch (identityError) {
        // If we can't get identity immediately, the auth refresh will handle the navigation
        console.log('Token stored, auth will be refreshed automatically')
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

  const handleClearStorage = async () => {
    const success = await clearAllEncryptedStorage()
    if (success) {
      refreshAuth()
      Alert.alert('Success', 'All encrypted storage cleared!')
    } else {
      Alert.alert('Error', 'Failed to clear encrypted storage')
    }
  }

  const handleDebugStorage = async () => {
    await debugStorage()
    Alert.alert('Debug', 'Check console for storage debug info')
  }

  const isDynamicIsland = hasDynamicIsland()

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.content,
        isDynamicIsland && styles.dynamicIslandPadding
      ]}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>Vinyl Roulette</Text>
          <Text style={styles.subtitle}>
            Connect your Discogs collection to discover your next favorite spin
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎵</Text>
          </View>
          
          <Text style={styles.description}>
            Sign in with your Discogs account to import your vinyl collection and let Vinyl Roulette help you rediscover forgotten gems in your library.
          </Text>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={colors.text.inverse} />
                <Text style={styles.loadingText}>Connecting...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Connect with Discogs</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your collection data is stored locally on your device
          </Text>
        </View>

        {/* Debug Section - Development Only */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Development Tools</Text>
            <View style={styles.debugButtons}>
              <TouchableOpacity 
                style={[styles.debugButton, styles.debugButtonSecondary]} 
                onPress={handleDebugStorage}
              >
                <Text style={styles.debugButtonText}>Debug Storage</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.debugButton, styles.debugButtonDanger]} 
                onPress={handleClearStorage}
              >
                <Text style={styles.debugButtonText}>Clear Storage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  dynamicIslandPadding: {
    paddingTop: spacing.sm,
  },
  
  // Header Section
  header: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  appName: {
    fontSize: typography.fontSize.xxxl * 1.2, // 28px
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    paddingHorizontal: spacing.base,
  },

  // Main Content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.base,
  },
  icon: {
    fontSize: 40,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },

  // Login Button
  loginButton: {
    backgroundColor: colors.accent.success,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.base,
  },
  loginButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  loginButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  privacyNote: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Debug Section (Development Only)
  debugContainer: {
    marginTop: spacing.xl,
    padding: spacing.base,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border.muted,
  },
  debugTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  debugButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  debugButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.base,
    minWidth: 100,
    alignItems: 'center',
  },
  debugButtonSecondary: {
    backgroundColor: colors.accent.warning,
  },
  debugButtonDanger: {
    backgroundColor: colors.status.error,
  },
  debugButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
})

export default DiscogsLoginScreen
