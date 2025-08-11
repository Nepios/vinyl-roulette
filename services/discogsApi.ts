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
  date_added: string
  basic_information: {
    title: string
    year: number
    artists: { name: string }[]
    cover_image?: string
    thumb?: string
    resource_url: string
    genres?: string[]
    styles?: string[]
  }
}

export const fetchUserCollection = async (username: string): Promise<CollectionRelease[]> => {
  const token = await getDiscogsToken()
  if (!token) throw new Error('No access token found')
  const folder_id = 0 // 0 is the "All" folder

  const baseUrl = `https://api.discogs.com/users/${username}/collection/folders/${folder_id}/releases`
  let allReleases: CollectionRelease[] = []
  let page = 1
  let hasMorePages = true

  while (hasMorePages) {
    const requestData = {
      url: baseUrl,
      method: 'GET',
      parameters: { sort: 'title', sort_order: 'asc', per_page: '100', page: page.toString() },
    }

    const headers = oauth.toHeader(
      oauth.authorize(requestData, {
        key: token.oauth_token,
        secret: token.oauth_token_secret,
      })
    )

    const response = await axios.get<{ releases: CollectionRelease[], pagination: { pages: number, page: number, per_page: number, items: number } }>(baseUrl, {
      headers: { ...headers },
      params: { sort: 'title', sort_order: 'asc', per_page: '100', page: page.toString() }
    })
    const releases = response.data.releases || []
    allReleases = allReleases.concat(releases)
    
    const pagination = response.data.pagination
    hasMorePages = pagination && page < pagination.pages
    page++
    
    // Add a small delay to be respectful to the API
    if (hasMorePages) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  return allReleases
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
