import { getDB } from './database';
import { CollectionRelease } from '../services/discogsApi';
import { Record } from '../screens/UserCollection';

export const saveRecords = async (records: CollectionRelease[]) => {
  const db = getDB();
  db.transaction((tx) => {
    for (const rec of records) {
      tx.executeSql(       
        `INSERT INTO records (discogs_id, title, artists, year, thumbnail, resource_url, date_added, genres, styles, cover_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(discogs_id) DO UPDATE SET
           title=excluded.title,
           artists=excluded.artists,
           year=excluded.year,
           thumbnail=excluded.thumbnail,
           resource_url=excluded.resource_url,
           date_added=excluded.date_added,
           genres=excluded.genres,
           styles=excluded.styles,
           cover_image=excluded.cover_image
        `,
        [rec.id, rec.basic_information.title, JSON.stringify(rec.basic_information.artists), rec.basic_information.year, rec.basic_information.thumb, rec.basic_information.resource_url, rec.date_added, JSON.stringify(rec.basic_information.genres), JSON.stringify(rec.basic_information.styles), rec.basic_information.cover_image]
        
      );
    }
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
        resolve(data);
      });
    }, (error) => {
      reject(error);
    });
  });
};

export const getLastSyncTime = (): Promise<number | null> => {
  const db = getDB();

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT value FROM metadata WHERE key = 'lastSync'`,
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              const timestamp = parseInt(result.rows.item(0).value, 10);
              resolve(timestamp);
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        reject(error);
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
