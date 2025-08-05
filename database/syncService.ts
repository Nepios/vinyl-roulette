import { getLastSyncTime, updateLastSyncTime, saveRecords, getAllRecords } from './collectionService';
import { CollectionRelease, fetchUserCollection} from '../services/discogsApi'; // Your remote fetcher

const SYNC_INTERVAL_MS = 1000 * 60 * 60; // 1 hour

export const syncIfStale = async (username: string, force = false): Promise<'fetched' | 'skipped'> => {
  const lastSync = await getLastSyncTime();
  const now = Date.now();
  const isStale = !lastSync || now - lastSync > SYNC_INTERVAL_MS;

  if (isStale || force) {
    const records: CollectionRelease[] = await fetchUserCollection(username);
    saveRecords(records);
    updateLastSyncTime(now);
    return 'fetched';
  } else {
    console.log('⏭️ Sync skipped, data is fresh.');
    return 'skipped';
  }
};

