import { DiscogsClient } from '@lionralfs/discogs-client';

interface DiscogsTokens {
  accessToken: string;
  accessTokenSecret: string;
}

// Create a function to initialize client with tokens
function createDiscogsClient(tokens?: DiscogsTokens): DiscogsClient {
  if (tokens) {
    return new DiscogsClient({
      userAgent: 'VinylRoulette/1.0 +https://github.com/Nepios/vinyl-roulette',
      auth: {
        method: 'oauth',
        consumerKey: process.env.DISCOGS_CONSUMER_KEY || '',
        consumerSecret: process.env.DISCOGS_CONSUMER_SECRET || '',
        accessToken: tokens.accessToken,
        accessTokenSecret: tokens.accessTokenSecret,
      }
    });
  } else {
    // For public endpoints that don't require authentication
    return new DiscogsClient({
      userAgent: 'VinylRoulette/1.0 +https://github.com/Nepios/vinyl-roulette'
    });
  }
}

export async function getUserIdentity(tokens?: DiscogsTokens) {
  try {
    const client = createDiscogsClient(tokens);
    const response = await client.getIdentity();
    console.log(`Logged in as: ${response.data.username}`);
    return response.data;
  } catch (err) {
    console.error('Error getting user identity:', err);
    throw err;
  }
}

export async function searchReleases(
  artist: string, 
  releaseTitle: string, 
  tokens?: DiscogsTokens
): Promise<any[]> {
  try {
    const client = createDiscogsClient(tokens);
    const db = client.database();
    
    // Perform a database search
    const result = await db.search({
      artist,
      release_title: releaseTitle,
      per_page: 20
    });

    return result.data.results;
  } catch (err) {
    console.error('Discogs API Error:', err);
    throw err;
  }
}

export async function getUserCollection(tokens: DiscogsTokens, username: string) {
  try {
    const client = createDiscogsClient(tokens);
    const result = await client.user().collection().getReleases(username);
    return result.data.releases;
  } catch (err) {
    console.error('Error getting user collection:', err);
    throw err;
  }
}

export async function addToCollection(tokens: DiscogsTokens, releaseId: number) {
  try {
    const client = createDiscogsClient(tokens);
    const userIdentity = await getUserIdentity(tokens);
    const result = await client.user().collection().addRelease(userIdentity.username, releaseId);
    return result.data;
  } catch (err) {
    console.error('Error adding to collection:', err);
    throw err;
  }
}

