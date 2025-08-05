import SQLite from 'react-native-sqlite-2';
import { createTables, createRecordsTable, createMetadataTable } from './schema';

const db = SQLite.openDatabase('vinyl.db', '1.0', '', 1);

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            createRecordsTable,
            [],
            () => {
              tx.executeSql(
                createMetadataTable,
                [],
                () => {},
                (_, error) => {
                  reject(new Error(`Metadata table creation failed: ${error.message}`));
                  return false;
                }
              );
            },
            (_, error) => {
              reject(new Error(`Records table creation failed: ${error.message}`));
              return false;
            }
          );
        },
        (error) => {
          reject(new Error(`Database initialization failed: ${error.message}`));
        },
        () => {
          resolve();
        }
      );
    } catch (error) {
      reject(new Error(`Unexpected database initialization error: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
};

export const getDB = () => db;

export const safeInitDatabase = async (maxRetries: number = 3, retryDelay: number = 1000): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await initDatabase();
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Database initialization failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

export const isDatabaseReady = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT name FROM sqlite_master WHERE type="table" AND name="records"',
            [],
            (_, result) => {
              resolve(result.rows.length > 0);
            },
            () => {
              resolve(false);
              return false;
            }
          );
        },
        () => {
          resolve(false);
        }
      );
    } catch (error) {
      resolve(false);
    }
  });
};

export const testDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const testId = 12345;
    
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT name FROM sqlite_master WHERE type="table"',
            [],
            () => {
              tx.executeSql(
                'INSERT INTO records (discogs_id, title, artists, year) VALUES (?, ?, ?, ?)',
                [testId, 'Test Album', 'Test Artist', '2023'],
                () => {
                  tx.executeSql(
                    'SELECT * FROM records WHERE discogs_id = ?',
                    [testId],
                    () => {
                      tx.executeSql(
                        'DELETE FROM records WHERE discogs_id = ?',
                        [testId],
                        () => {},
                        () => false
                      );
                    },
                    (_, error) => {
                      reject(new Error(`Test record retrieval failed: ${error.message}`));
                      return false;
                    }
                  );
                },
                (_, error) => {
                  reject(new Error(`Test record insertion failed: ${error.message}`));
                  return false;
                }
              );
            },
            (_, error) => {
              reject(new Error(`Table check failed: ${error.message}`));
              return false;
            }
          );
        },
        (error) => {
          reject(new Error(`Database test failed: ${error.message}`));
        },
        () => {
          resolve();
        }
      );
    } catch (error) {
      reject(new Error(`Unexpected database test error: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
};

