import { getDB } from './database';
import { createQueueTable } from './schema';

/**
 * Database migration to rename thumbnail column to thumb
 * This ensures compatibility between the schema and Record type interface
 */
export const migrateThumbnailToThumb = (): Promise<void> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Check if the old thumbnail column exists
        tx.executeSql(
          "PRAGMA table_info(records)",
          [],
          (_tx, result) => {
            const columns = [];
            for (let i = 0; i < result.rows.length; i++) {
              columns.push(result.rows.item(i).name);
            }
            
            // If thumbnail column exists but thumb doesn't, we need to migrate
            if (columns.includes('thumbnail') && !columns.includes('thumb')) {
              // Add the thumb column
              tx.executeSql(
                "ALTER TABLE records ADD COLUMN thumb TEXT",
                [],
                () => {
                  // Copy data from thumbnail to thumb
                  tx.executeSql(
                    "UPDATE records SET thumb = thumbnail",
                    [],
                    () => {
                      console.log('✅ Database migration completed: thumbnail -> thumb');
                    },
                    (_, error) => {
                      reject(new Error(`Failed to copy thumbnail data: ${error.message}`));
                      return false;
                    }
                  );
                },
                (_, error) => {
                  reject(new Error(`Failed to add thumb column: ${error.message}`));
                  return false;
                }
              );
            } else {
              console.log('✅ Database schema is up to date');
            }
          },
          (_tx, error) => {
            reject(new Error(`Failed to check table schema: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Database migration transaction failed: ${error.message}`));
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Create queue table if it doesn't exist
 */
export const createQueueTableMigration = (): Promise<void> => {
  const db = getDB();
  
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Check if queue table exists
        tx.executeSql(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='queue'",
          [],
          (_tx, result) => {
            if (result.rows.length === 0) {
              // Queue table doesn't exist, create it
              tx.executeSql(
                createQueueTable,
                [],
                () => {
                  console.log('✅ Queue table created successfully');
                },
                (_, error) => {
                  reject(new Error(`Failed to create queue table: ${error.message}`));
                  return false;
                }
              );
            } else {
              console.log('✅ Queue table already exists');
            }
          },
          (_tx, error) => {
            reject(new Error(`Failed to check queue table existence: ${error.message}`));
            return false;
          }
        );
      },
      (error) => {
        reject(new Error(`Queue table migration transaction failed: ${error.message}`));
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    await migrateThumbnailToThumb();
    await createQueueTableMigration();
    console.log('✅ All database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};