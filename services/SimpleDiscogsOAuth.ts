import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

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
      await AsyncStorage.setItem('discogs_personal_token', token);
      console.log('Personal token stored successfully');
    } catch (error) {
      console.error('Error storing personal token:', error);
      throw error;
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
    return `Discogs key=${this.consumerKey}`;
  }
}

export default SimpleDiscogsOAuth;
