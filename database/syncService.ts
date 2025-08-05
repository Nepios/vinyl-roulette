import { getLastSyncTime, updateLastSyncTime, saveRecords, getAllRecords } from './collectionService';
import { CollectionRelease, fetchUserCollection} from '../services/discogsApi'; // Your remote fetcher

const SYNC_INTERVAL_MS = 1000 * 60 * 60; // 1 hour

export const syncIfStale = async (username: string, force = false): Promise<'fetched' | 'skipped'> => {
  console.log('🔍 Checking if sync is needed...');
  const lastSync = await getLastSyncTime();
  const now = Date.now();
  // const isStale = !lastSync || now - lastSync > SYNC_INTERVAL_MS;
  const isStale = true;
  console.log('isStale:', isStale, 'lastSync:', lastSync ? new Date(lastSync).toISOString() : 'never');

  if (isStale || force) {
    console.log('🔄 Fetching remote collection...');
    const records: CollectionRelease[] = await fetchUserCollection(username);
    console.log(`✅ Fetched ${records.length} records from remote`);
    console.log('Sample records:', records.slice(0, 3));
    saveRecords(records);
    updateLastSyncTime(now);
    return 'fetched';
  } else {
    console.log('✅ Using local cache');
    return 'skipped';
  }
};

