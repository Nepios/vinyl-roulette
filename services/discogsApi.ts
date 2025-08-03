import axios from 'axios'
import OAuth from 'oauth-1.0a'
import crypto from 'react-native-crypto'
import { getDiscogsToken } from './auth/tokenStorage'

const consumerKey = process.env.DISCOGS_CONSUMER_KEY
const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET

if (!consumerKey || !consumerSecret) {
  throw new Error('DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET must be defined in environment variables');
}

const oauth = new OAuth({
  consumer: { key: consumerKey, secret: consumerSecret },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

export interface CollectionRelease {
  id: number
  basic_information: {
    title: string
    year: number
    artists: { name: string }[]
  }
}

export const fetchUserCollection = async (username: string): Promise<CollectionRelease[]> => {
  const token = await getDiscogsToken()
  if (!token) throw new Error('No access token found')

  const url = `https://api.discogs.com/users/${username}/collection/folders/0/releases`

  const requestData = {
    url,
    method: 'GET',
  }

  const headers = oauth.toHeader(
    oauth.authorize(requestData, {
      key: token.oauth_token,
      secret: token.oauth_token_secret,
    })
  )

  const response = await axios.get<{ releases: CollectionRelease[] }>(url, {
    headers: { ...headers },
  })

  return response.data.releases
}

export const fetchUserIdentity = async (): Promise<{ username: string }> => {
  const token = await getDiscogsToken()
  if (!token) throw new Error('No access token found')

  const url = 'https://api.discogs.com/oauth/identity'

  const requestData = {
    url,
    method: 'GET',
  }

  const headers = oauth.toHeader(
    oauth.authorize(requestData, {
      key: token.oauth_token,
      secret: token.oauth_token_secret,
    })
  )

  const response = await axios.get<{ username: string }>(url, { 
    headers: { ...headers }
  })
  return response.data
}
