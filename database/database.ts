import SQLite from 'react-native-sqlite-2';
import { createTables, createRecordsTable, createMetadataTable } from './schema';

const db = SQLite.openDatabase('vinyl.db', '1.0', '', 1);

export const initDatabase = (): Promise<void> => {
  console.log('🗄️ Initializing database...');
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          console.log('📝 Creating records table...');
          tx.executeSql(
            createRecordsTable,
            [],
            (_, result) => {
              console.log('✅ Records table created successfully. Insert ID:', result.insertId, 'Rows affected:', result.rowsAffected);
              
              console.log('📝 Creating metadata table...');
              tx.executeSql(
                createMetadataTable,
                [],
                (_, result) => {
                  console.log('✅ Metadata table created successfully. Insert ID:', result.insertId, 'Rows affected:', result.rowsAffected);
                },
                (_, error) => {
                  console.error('❌ Failed to create metadata table:', error);
                  reject(new Error(`Metadata table creation failed: ${error.message}`));
                  return false;
                }
              );
            },
            (_, error) => {
              console.error('❌ Failed to create records table:', error);
              reject(new Error(`Records table creation failed: ${error.message}`));
              return false; // Required for SQLite error handling
            }
          );
        },
        (error) => {
          console.error('❌ Database transaction failed during initialization:', error);
          reject(new Error(`Database initialization transaction failed: ${error.message}`));
        },
        () => {
          console.log('🎉 Database initialization completed successfully');
          resolve();
        }
      );
    } catch (error) {
      console.error('❌ Unexpected error during database initialization:', error);
      reject(new Error(`Unexpected database initialization error: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
};

export const getDB = () => db;

// Safe database initialization with retry logic
export const safeInitDatabase = async (maxRetries: number = 3, retryDelay: number = 1000): Promise<void> => {
  console.log(`🔄 Starting safe database initialization (max ${maxRetries} retries)...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📱 Database initialization attempt ${attempt}/${maxRetries}`);
      await initDatabase();
      console.log('✅ Database initialized successfully!');
      return;
    } catch (error) {
      console.error(`❌ Database initialization attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('🚨 All database initialization attempts failed!');
        throw new Error(`Database initialization failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Check if database is ready
export const isDatabaseReady = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'SELECT name FROM sqlite_master WHERE type="table" AND name="records"',
            [],
            (_, result) => {
              const isReady = result.rows.length > 0;
              console.log(`🔍 Database ready check: ${isReady ? 'Ready ✅' : 'Not ready ❌'}`);
              resolve(isReady);
            },
            (_, error) => {
              console.error('❌ Database ready check failed:', error);
              resolve(false);
              return false;
            }
          );
        },
        (error) => {
          console.error('❌ Database ready check transaction failed:', error);
          resolve(false);
        }
      );
    } catch (error) {
      console.error('❌ Unexpected error during database ready check:', error);
      resolve(false);
    }
  });
};

// Test database functionality
export const testDatabase = (): Promise<void> => {
  console.log('🧪 Testing database functionality...');
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          // Test 1: Check if tables exist
          tx.executeSql(
            'SELECT name FROM sqlite_master WHERE type="table"',
            [],
            (_, result) => {
              console.log('📋 Found tables:');
              for (let i = 0; i < result.rows.length; i++) {
                console.log(`  - ${result.rows.item(i).name}`);
              }
              
              // Test 2: Insert a test record
              tx.executeSql(
                'INSERT INTO records (discogs_id, title, artists, year) VALUES (?, ?, ?, ?)',
                [12345, 'Test Album', 'Test Artist', '2023'],
                (_, result) => {
                  console.log('✅ Test record inserted successfully. Insert ID:', result.insertId, 'Rows affected:', result.rowsAffected);
                  
                  // Test 3: Query the test record
                  tx.executeSql(
                    'SELECT * FROM records WHERE discogs_id = ?',
                    [12345],
                    (_, result) => {
                      console.log('✅ Test record retrieved successfully. Row count:', result.rows.length);
                      if (result.rows.length > 0) {
                        console.log('  Record data:', result.rows.item(0));
                      }
                      
                      // Test 4: Clean up test record
                      tx.executeSql(
                        'DELETE FROM records WHERE discogs_id = ?',
                        [12345],
                        (_, result) => {
                          console.log('✅ Test record deleted successfully. Rows affected:', result.rowsAffected);
                        },
                        (_, error) => {
                          console.error('⚠️ Failed to delete test record:', error);
                          return false;
                        }
                      );
                    },
                    (_, error) => {
                      console.error('❌ Failed to retrieve test record:', error);
                      reject(new Error(`Test record retrieval failed: ${error.message}`));
                      return false;
                    }
                  );
                },
                (_, error) => {
                  console.error('❌ Failed to insert test record:', error);
                  reject(new Error(`Test record insertion failed: ${error.message}`));
                  return false;
                }
              );
            },
            (_, error) => {
              console.error('❌ Failed to check tables:', error);
              reject(new Error(`Table check failed: ${error.message}`));
              return false;
            }
          );
        },
        (error) => {
          console.error('❌ Database test transaction failed:', error);
          reject(new Error(`Database test failed: ${error.message}`));
        },
        () => {
          console.log('🎉 Database test completed successfully!');
          resolve();
        }
      );
    } catch (error) {
      console.error('❌ Unexpected error during database test:', error);
      reject(new Error(`Unexpected database test error: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
};

