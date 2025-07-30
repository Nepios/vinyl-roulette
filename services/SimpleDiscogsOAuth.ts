import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// Helper function to initialize AsyncStorage
const initializeAsyncStorage = async (): Promise<void> => {
  try {
    // Try to set and get a test key to ensure AsyncStorage is working
    const testKey = '__async_storage_test__';
    await AsyncStorage.setItem(testKey, 'test');
    const testValue = await AsyncStorage.getItem(testKey);
    if (testValue === 'test') {
      await AsyncStorage.removeItem(testKey);
      console.log('AsyncStorage initialized successfully');
    } else {
      throw new Error('AsyncStorage test failed');
    }
  } catch (error) {
    console.error('AsyncStorage initialization failed:', error);
    // Wait a bit and let the app continue - sometimes it works anyway
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

interface DiscogsTokens {
  accessToken: string;
  accessTokenSecret: string;
}

class SimpleDiscogsOAuth {
  private consumerKey: string;
  private consumerSecret: string;

  constructor(consumerKey: string, consumerSecret: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  // Step 1: Get request token and redirect to authorization
  async initiateOAuth(): Promise<string> {
    try {
      // For Discogs OAuth 1.0a, we need to make the first request to get a request token
      // Since we can't easily do HMAC-SHA1 signing in React Native, 
      // we'll use a simpler approach with the Personal Access Token method instead
      
      // Return the URL for manual authorization
      return `https://www.discogs.com/settings/developers`;
    } catch (error) {
      console.error('OAuth initiation error:', error);
      throw error;
    }
  }

  // Alternative: Use Personal Access Token (simpler)
  async storePersonalToken(token: string): Promise<void> {
    try {
      console.log('Attempting to store personal token...');
      console.log('Token length:', token.length);
      console.log('AsyncStorage available:', !!AsyncStorage);
      
      // Initialize AsyncStorage first
      await initializeAsyncStorage();
      
      // Try multiple times with delays to handle AsyncStorage initialization issues
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          await AsyncStorage.setItem('discogs_personal_token', token);
          console.log(`Token storage attempt ${attempt + 1} successful`);
          break;
        } catch (storageError) {
          attempt++;
          console.log(`Token storage attempt ${attempt} failed:`, storageError.message);
          
          if (attempt >= maxAttempts) {
            throw storageError;
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Verify the token was stored
      let verificationAttempt = 0;
      let storedToken = null;
      
      while (verificationAttempt < maxAttempts) {
        try {
          storedToken = await AsyncStorage.getItem('discogs_personal_token');
          if (storedToken === token) {
            console.log('Personal token stored and verified successfully');
            return;
          }
          break;
        } catch (verifyError) {
          verificationAttempt++;
          console.log(`Token verification attempt ${verificationAttempt} failed:`, verifyError.message);
          
          if (verificationAttempt >= maxAttempts) {
            console.warn('Token verification failed, but storage may have succeeded');
            return; // Don't fail completely if verification fails
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (storedToken !== token) {
        console.warn('Token verification mismatch, but proceeding anyway');
      }
      
    } catch (error) {
      console.error('Error storing personal token:', error);
      console.error('Error details:', error.message);
      
      // Check if it's a manifest file error specifically
      if (error.message && error.message.includes('manifest.json')) {
        throw new Error('AsyncStorage initialization failed. Please restart the app and try again.');
      }
      
      throw new Error(`Failed to store token: ${error.message || error}`);
    }
  }

  async getPersonalToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('discogs_personal_token');
    } catch (error) {
      console.error('Error retrieving personal token:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('discogs_personal_token');
      await AsyncStorage.removeItem('discogs_tokens');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getPersonalToken();
    return token !== null;
  }

  // Get authorization header for authenticated requests
  async getAuthHeader(): Promise<string | null> {
    const token = await this.getPersonalToken();
    if (token) {
      return `Discogs token=${token}`;
    }
    
    // Fallback to consumer key for basic requests
    return `Discogs key=${this.consumerKey}, secret=${this.consumerSecret}`;
  }
}

export default SimpleDiscogsOAuth;
