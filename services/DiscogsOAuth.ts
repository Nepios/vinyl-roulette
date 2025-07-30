import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

interface DiscogsTokens {
  accessToken: string;
  accessTokenSecret: string;
  refreshToken?: string;
}

class DiscogsOAuth {
  private consumerKey: string;
  private consumerSecret: string;

  constructor(consumerKey: string, consumerSecret: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  // Manual OAuth 1.0a implementation for Discogs
  async initiateOAuth(): Promise<string> {
    try {
      // Step 1: Get request token
      const requestTokenResponse = await fetch('https://api.discogs.com/oauth/request_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.buildOAuthHeader('POST', 'https://api.discogs.com/oauth/request_token', {
            oauth_callback: 'com.vinylroulette://oauth/callback'
          }),
          'User-Agent': 'VinylRoulette/1.0'
        }
      });

      const requestTokenText = await requestTokenResponse.text();
      const requestTokenParams = new URLSearchParams(requestTokenText);
      const requestToken = requestTokenParams.get('oauth_token');
      const requestTokenSecret = requestTokenParams.get('oauth_token_secret');

      if (!requestToken || !requestTokenSecret) {
        throw new Error('Failed to get request token');
      }

      // Store request token secret for later use
      await AsyncStorage.setItem('discogs_request_token_secret', requestTokenSecret);

      // Step 2: Return authorization URL
      return `https://discogs.com/oauth/authorize?oauth_token=${requestToken}`;
    } catch (error) {
      console.error('OAuth initiation error:', error);
      throw error;
    }
  }

  async exchangeCodeForTokens(oauth_token: string, oauth_verifier: string): Promise<DiscogsTokens> {
    try {
      const requestTokenSecret = await AsyncStorage.getItem('discogs_request_token_secret');
      if (!requestTokenSecret) {
        throw new Error('Request token secret not found');
      }

      // Step 3: Exchange for access token
      const accessTokenResponse = await fetch('https://api.discogs.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.buildOAuthHeader('POST', 'https://api.discogs.com/oauth/access_token', {
            oauth_token,
            oauth_verifier
          }, requestTokenSecret),
          'User-Agent': 'VinylRoulette/1.0'
        }
      });

      const accessTokenText = await accessTokenResponse.text();
      const accessTokenParams = new URLSearchParams(accessTokenText);
      const accessToken = accessTokenParams.get('oauth_token');
      const accessTokenSecret = accessTokenParams.get('oauth_token_secret');

      if (!accessToken || !accessTokenSecret) {
        throw new Error('Failed to get access token');
      }

      const tokens: DiscogsTokens = {
        accessToken,
        accessTokenSecret
      };

      // Store tokens securely
      await this.storeTokens(tokens);
      
      // Clean up request token secret
      await AsyncStorage.removeItem('discogs_request_token_secret');

      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  async getStoredTokens(): Promise<DiscogsTokens | null> {
    try {
      const tokensJson = await AsyncStorage.getItem('discogs_tokens');
      return tokensJson ? JSON.parse(tokensJson) : null;
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  }

  async storeTokens(tokens: DiscogsTokens): Promise<void> {
    try {
      await AsyncStorage.setItem('discogs_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('discogs_tokens');
      await AsyncStorage.removeItem('discogs_request_token_secret');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private buildOAuthHeader(method: string, url: string, params: Record<string, string> = {}, tokenSecret?: string): string {
    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: this.generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
      ...params
    };

    // Generate signature
    const signature = this.generateSignature(method, url, oauthParams, tokenSecret);
    oauthParams.oauth_signature = signature;

    // Build header
    const headerParts = Object.entries(oauthParams)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ');

    return `OAuth ${headerParts}`;
  }

  private generateNonce(): string {
    return uuidv4().replace(/-/g, '');
  }

  private generateSignature(method: string, url: string, params: Record<string, string>, tokenSecret?: string): string {
    // Sort and encode parameters
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // Create base string
    const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
    
    // Create signing key
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;

    // Generate HMAC-SHA1 signature
    const signature = CryptoJS.HmacSHA1(baseString, signingKey).toString(CryptoJS.enc.Base64);
    
    return signature;
  }
}

export default DiscogsOAuth;
