import OAuth from 'oauth-1.0a'
import axios from 'axios'
import crypto from 'react-native-crypto'

const consumerKey = process.env.DISCOGS_CONSUMER_KEY
const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET
const callbackUrl = 'vinylroulette://oauth-callback'

console.log('Loading OAuth config - Consumer Key exists:', !!consumerKey, 'Consumer Secret exists:', !!consumerSecret)

if (!consumerKey || !consumerSecret) {
  console.error('Missing OAuth credentials:', { 
    consumerKey: consumerKey ? 'Present' : 'Missing', 
    consumerSecret: consumerSecret ? 'Present' : 'Missing' 
  })
  throw new Error('DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET must be defined in environment variables');
}

const oauth = new OAuth({
  consumer: { key: consumerKey, secret: consumerSecret },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

export const getRequestToken = async (): Promise<{ oauth_token: string; oauth_token_secret: string }> => {
  console.log('getRequestToken called')
  
  const url = 'https://api.discogs.com/oauth/request_token'
  const requestData = {
    url,
    method: 'POST',
    data: { oauth_callback: callbackUrl },
  }
  
  console.log('Request token data:', requestData)
  
  const authData = oauth.authorize(requestData)
  const headers = oauth.toHeader(authData)
  
  console.log('Request token headers:', headers)
  
  try {
    const res = await axios({
      method: 'POST',
      url: url,
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'VinylRoulette/1.0',
      },
      data: `oauth_callback=${encodeURIComponent(callbackUrl)}`,
    })
    
    console.log('Request token response:', res.data)
    
    const parts = Object.fromEntries(res.data.split('&').map((s: string) => s.split('=')))
    
    console.log('Parsed request token parts:', parts)
    
    return {
      oauth_token: parts.oauth_token,
      oauth_token_secret: parts.oauth_token_secret,
    }
  } catch (error) {
    console.error('Request token request failed:', error.response?.data || error.message)
    console.error('Request headers:', headers)
    console.error('Request URL:', url)
    throw error
  }
}

export const getAccessToken = async (
  oauth_token: string,
  oauth_token_secret: string,
  oauth_verifier: string
): Promise<{ oauth_token: string; oauth_token_secret: string }> => {
  console.log('getAccessToken called with:', { oauth_token, oauth_verifier })
  
  const url = 'https://api.discogs.com/oauth/access_token'
  
  // Create the request data with oauth_verifier
  const requestData = {
    url,
    method: 'POST',
    data: {
      oauth_verifier,
    },
  }
  
  console.log('Request data:', requestData)
  
  // Generate OAuth signature with the request token
  const authData = oauth.authorize(requestData, {
    key: oauth_token,
    secret: oauth_token_secret,
  })
  
  console.log('Generated auth data:', authData)
  
  const headers = oauth.toHeader(authData)
  console.log('Generated headers:', headers)
  
  try {
    // Send POST request with form data
    const res = await axios({
      method: 'POST',
      url: url,
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'VinylRoulette/1.0',
      },
      data: `oauth_verifier=${encodeURIComponent(oauth_verifier)}`,
    })
    
    console.log('Access token response:', res.data)
    
    const parts = Object.fromEntries(res.data.split('&').map((s: string) => s.split('=')))
    return {
      oauth_token: parts.oauth_token,
      oauth_token_secret: parts.oauth_token_secret,
    }
  } catch (error) {
    console.error('Access token request failed:', error.response?.data || error.message)
    console.error('Request headers:', headers)
    console.error('Request URL:', url)
    throw error
  }
}
