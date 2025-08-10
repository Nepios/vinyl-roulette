import { getDB } from './database';
import { Record } from '../types/Record';

export interface QueueItem {
  id: number;
  record_id: number;
  date_added: string;
  play_order: number | null;
  // Joined record data
  discogs_id: number;
  title: string;
  artists: string;
  year: number;
  cover_image?: string;
  thumb?: string;
  resource_url: string;
}

/**
 * Add a record to the queue
 */
export const addToQueue = async (record: Record): Promise<void> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Get the next play_order (max + 1)
        tx.executeSql(
          'SELECT COALESCE(MAX(play_order), 0) + 1 as next_order FROM queue',
          [],
          (_tx, result) => {
            const nextOrder = result.rows.item(0).next_order;
            
            // Insert the record into queue
            tx.executeSql(
              'INSERT INTO queue (record_id, play_order) VALUES (?, ?)',
              [record.id, nextOrder],
              () => {
                console.log(`✅ Added "${record.title}" to queue`);
              },
              (_, error) => {
                reject(new Error(`Failed to add record to queue: ${error.message}`));
                return false;
              }
            );
          },
          (_, error) => {
            reject(new Error(`Failed to get next play order: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue add transaction failed: ${error.message}`));
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Get all items in the queue, ordered by play_order
 */
export const getQueue = (): Promise<QueueItem[]> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            q.id,
            q.record_id,
            q.date_added,
            q.play_order,
            r.discogs_id,
            r.title,
            r.artists,
            r.year,
            r.cover_image,
            r.thumb,
            r.resource_url
          FROM queue q
          JOIN records r ON q.record_id = r.id
          ORDER BY q.play_order ASC`,
          [],
          (_, result) => {
            const items: QueueItem[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              items.push(result.rows.item(i));
            }
            resolve(items);
          },
          (_, error) => {
            reject(new Error(`Failed to get queue: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue get transaction failed: ${error.message}`));
      }
    );
  });
};

/**
 * Remove an item from the queue
 */
export const removeFromQueue = async (queueId: number): Promise<void> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'DELETE FROM queue WHERE id = ?',
          [queueId],
          (_, result) => {
            if (result.rowsAffected > 0) {
              console.log(`✅ Removed item ${queueId} from queue`);
            }
          },
          (_, error) => {
            reject(new Error(`Failed to remove from queue: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue remove transaction failed: ${error.message}`));
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Clear the entire queue
 */
export const clearQueue = async (): Promise<void> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'DELETE FROM queue',
          [],
          (_, result) => {
            console.log(`✅ Cleared queue (${result.rowsAffected} items removed)`);
          },
          (_, error) => {
            reject(new Error(`Failed to clear queue: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue clear transaction failed: ${error.message}`));
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Check if a record is already in the queue
 */
export const isInQueue = async (recordId: number): Promise<boolean> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT id FROM queue WHERE record_id = ? LIMIT 1',
          [recordId],
          (_, result) => {
            resolve(result.rows.length > 0);
          },
          (_, error) => {
            reject(new Error(`Failed to check queue: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue check transaction failed: ${error.message}`));
      }
    );
  });
};

/**
 * Get queue count
 */
export const getQueueCount = (): Promise<number> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM queue',
          [],
          (_, result) => {
            resolve(result.rows.item(0).count);
          },
          (_, error) => {
            reject(new Error(`Failed to get queue count: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue count transaction failed: ${error.message}`));
      }
    );
  });
};