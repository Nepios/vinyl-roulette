import { getLastSyncTime, updateLastSyncTime, saveRecords } from './collectionService';
import { CollectionRelease, fetchUserCollection} from '../services/discogsApi';

const SYNC_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
// const SYNC_INTERVAL_MS = 1000 * 60 * 1; // 1 minutes

export const syncIfStale = async (username: string, force = false): Promise<'fetched' | 'skipped'> => {
  const lastSync = await getLastSyncTime();
  const now = Date.now();
  const timeSinceLastSync = lastSync ? now - lastSync : null;
  const isStale = !lastSync || (timeSinceLastSync !== null && timeSinceLastSync > SYNC_INTERVAL_MS);

  const lastSyncFormatted = lastSync ? new Date(lastSync).toLocaleTimeString() : 'never';
  const timeSinceFormatted = timeSinceLastSync ? `${Math.round(timeSinceLastSync / 1000)}s ago` : 'never';
  
  console.log(`🔄 Sync check for ${username}:`);
  console.log(`   Last sync: ${lastSyncFormatted} (${timeSinceFormatted})`);
  console.log(`   Is stale: ${isStale}, Force: ${force}, Interval: ${SYNC_INTERVAL_MS/1000}s`);

  if (isStale || force) {
    console.log(`📥 Fetching collection from Discogs...`);
    const records: CollectionRelease[] = await fetchUserCollection(username);
    await saveRecords(records);
    updateLastSyncTime(now);
    console.log(`✅ Sync completed: ${records.length} records saved`);
    return 'fetched';
  } else {
    console.log('⏭️ Sync skipped, data is fresh.');
    return 'skipped';
  }
};

