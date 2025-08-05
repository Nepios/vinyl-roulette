import { getDB } from './database';
import { CollectionRelease } from '../services/discogsApi';
import { Record } from '../screens/UserCollection';

export const saveRecords = (records: CollectionRelease[]) => {
  const db = getDB();
  db.transaction((tx) => {
    for (const rec of records) {
      tx.executeSql(
        `INSERT OR REPLACE INTO records (id, discogs_id, title, artists, year, thumbnail, resource_url, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [null, rec.id, rec.basic_information.title, JSON.stringify(rec.basic_information.artists), rec.basic_information.year, rec.basic_information.thumb, rec.basic_information.resource_url, rec.date_added]
      );
    }
  }, (error) => {
    console.error('❌ Failed to save records:', error);
  })
};

export const getAllRecords = (): Promise<Record[]> => {
  const db = getDB();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(`SELECT * FROM records ORDER BY title ASC`, [], (_, results) => {
        const len = results.rows.length;
        const data: Record[] = [];

        for (let i = 0; i < len; i++) {
          data.push(results.rows.item(i));
        }
        console.log(`✅ Retrieved ${len} records from local DB`);
        console.log('Sample records:', data.slice(0, 3));
        resolve(data);
      });
    }, (error) => {
      console.error('❌ Failed to get records:', error);
      reject(error);
    });
  });
};

export const getLastSyncTime = (): Promise<number | null> => {
  console.log('🔍 getting last sync time from metadata...');
  const db = getDB();

  console.log('🔍 db object:', db);

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT value FROM metadata WHERE key = 'lastSync'`,
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              const timestamp = parseInt(result.rows.item(0).value, 10);
              console.log('✅ Retrieved last sync time:', new Date(timestamp).toISOString());
              resolve(timestamp);
            } else {
              console.log('ℹ️ No previous sync time found');
              resolve(null);
            }
          },
          (_, error) => {
            console.error('❌ Failed to execute SELECT query for last sync time:', error);
            reject(error);
            return false; // Required for SQLite error handling
          }
        );
      },
      (error) => {
        console.error('❌ Database transaction failed for getLastSyncTime:', error);
        reject(error);
      },
      () => {
        console.log('✅ getLastSyncTime transaction completed successfully');
      }
    );
  });
};

export const updateLastSyncTime = (timestamp: number): void => {
  const db = getDB();
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT OR REPLACE INTO metadata (key, value) VALUES ('lastSync', ?)`,
      [timestamp.toString()]
    );
  });
};
