import { getLastSyncTime, updateLastSyncTime, saveRecords } from './collectionService';
import { CollectionRelease, fetchUserCollection} from '../services/discogsApi';

// const SYNC_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
const SYNC_INTERVAL_MS = 1000 * 60 * 1; // 5 minutes

export const syncIfStale = async (username: string, force = false): Promise<'fetched' | 'skipped'> => {
  const lastSync = await getLastSyncTime();
  const now = Date.now();
  const isStale = !lastSync || now - lastSync > SYNC_INTERVAL_MS;
  console.log(`Last sync: ${lastSync}, Now: ${now}, Is stale: ${isStale}, Force: ${force}`);

  if (isStale || force) {
    const records: CollectionRelease[] = await fetchUserCollection(username);
    await saveRecords(records);
    updateLastSyncTime(now);
    return 'fetched';
  } else {
    console.log('⏭️ Sync skipped, data is fresh.');
    return 'skipped';
  }
};

