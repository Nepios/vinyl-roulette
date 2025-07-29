import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import DiscogsOAuth from '../services/DiscogsOAuth';

interface DiscogsLoginProps {
  consumerKey: string;
  consumerSecret: string;
  onLoginSuccess: (tokens: { accessToken: string; accessTokenSecret: string }) => void;
  onLoginError: (error: string) => void;
}

const DiscogsLogin: React.FC<DiscogsLoginProps> = ({
  consumerKey,
  consumerSecret,
  onLoginSuccess,
  onLoginError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [oauthService] = useState(new DiscogsOAuth(consumerKey, consumerSecret));

  useEffect(() => {
    checkExistingTokens();
    setupDeepLinkListener();
  }, []);

  const checkExistingTokens = async () => {
    try {
      const tokens = await oauthService.getStoredTokens();
      if (tokens) {
        setIsLoggedIn(true);
        onLoginSuccess(tokens);
      }
    } catch (error) {
      console.error('Error checking tokens:', error);
    }
  };

  const setupDeepLinkListener = () => {
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      if (url.includes('com.vinylroulette://oauth/callback')) {
        handleOAuthCallback(url);
      }
    };

    // Listen for deep link events
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  };

  const handleOAuthCallback = async (url: string) => {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const oauth_token = urlParams.get('oauth_token');
      const oauth_verifier = urlParams.get('oauth_verifier');

      if (oauth_token && oauth_verifier) {
        setIsLoading(true);
        const tokens = await oauthService.exchangeCodeForTokens(oauth_token, oauth_verifier);
        setIsLoggedIn(true);
        onLoginSuccess(tokens);
      } else {
        throw new Error('Missing OAuth parameters in callback');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      onLoginError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateLogin = async () => {
    try {
      setIsLoading(true);
      const authUrl = await oauthService.initiateOAuth();
      
      // Open the authorization URL in the browser
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
      } else {
        throw new Error('Cannot open authorization URL');
      }
    } catch (error) {
      console.error('Login initiation error:', error);
      Alert.alert(
        'Login Error',
        error instanceof Error ? error.message : 'Failed to initiate login'
      );
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await oauthService.clearTokens();
      setIsLoggedIn(false);
      Alert.alert('Success', 'You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>✅ Connected to Discogs</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Discogs</Text>
      <Text style={styles.description}>
        Login with your Discogs account to access your collection and search the database.
      </Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.loginButton} onPress={initiateLogin}>
          <Text style={styles.buttonText}>Login with Discogs</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  logoutButton: {
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default DiscogsLogin;
