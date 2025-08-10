// Mock SQLite before importing to avoid initialization issues
jest.mock('react-native-sqlite-2', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((txCallback, errorCallback, successCallback) => {
      const tx = {
        executeSql: jest.fn((sql, params, successCb, errorCb) => {
          // Mock successful SQL execution
          if (successCb) {
            successCb(null, { rows: { length: 1, item: () => ({}) } });
          }
        })
      };
      
      try {
        txCallback(tx);
        if (successCallback) {
          successCallback();
        }
      } catch (error) {
        if (errorCallback) {
          errorCallback(error);
        }
      }
    })
  }))
}));

describe('database', () => {
  let dbModule: any;
  
  beforeAll(() => {
    // Import after mocking
    dbModule = require('../database/database');
  });
  
  describe('Module Structure', () => {
    it('should have all expected exported functions', () => {
      expect(typeof dbModule).toBe('object');
      expect(typeof dbModule.initDatabase).toBe('function');
      expect(typeof dbModule.getDB).toBe('function');
      expect(typeof dbModule.safeInitDatabase).toBe('function');
      expect(typeof dbModule.isDatabaseReady).toBe('function');
      expect(typeof dbModule.testDatabase).toBe('function');
    });
    
    it('should export functions with correct signatures', () => {
      expect(dbModule.initDatabase.length).toBe(0);
      expect(dbModule.getDB.length).toBe(0);
      expect(dbModule.safeInitDatabase.length).toBe(0); // Has default parameters
      expect(dbModule.isDatabaseReady.length).toBe(0);
      expect(dbModule.testDatabase.length).toBe(0);
    });
  });
  
  describe('Function Behavior', () => {
    it('should return promises for async functions', () => {
      expect(dbModule.initDatabase()).toBeInstanceOf(Promise);
      expect(dbModule.safeInitDatabase()).toBeInstanceOf(Promise);
      expect(dbModule.isDatabaseReady()).toBeInstanceOf(Promise);
      expect(dbModule.testDatabase()).toBeInstanceOf(Promise);
    });
    
    it('should return database instance from getDB', () => {
      const db = dbModule.getDB();
      expect(db).toBeDefined();
      expect(typeof db.transaction).toBe('function');
    });
    
    it('should handle retry parameters in safeInitDatabase', async () => {
      // Test with custom parameters
      const promise1 = dbModule.safeInitDatabase(3, 100);
      expect(promise1).toBeInstanceOf(Promise);
      
      // Test with default parameters
      const promise2 = dbModule.safeInitDatabase();
      expect(promise2).toBeInstanceOf(Promise);
      
      // Let the promises resolve/reject
      await promise1.catch(() => {});
      await promise2.catch(() => {});
    }, 10000); // Increase timeout
  });
  
  describe('Database Operations', () => {
    it('should resolve initDatabase successfully', async () => {
      await expect(dbModule.initDatabase()).resolves.toBeUndefined();
    });
    
    it('should resolve isDatabaseReady', async () => {
      const result = await dbModule.isDatabaseReady();
      expect(typeof result).toBe('boolean');
    });
    
    it('should resolve testDatabase successfully', async () => {
      await expect(dbModule.testDatabase()).resolves.toBeUndefined();
    });
  });
  
  describe('Schema', () => {
    it('should import schema modules without errors', () => {
      expect(() => {
        require('../database/schema');
      }).not.toThrow();
      
      const schema = require('../database/schema');
      expect(typeof schema.createRecordsTable).toBe('string');
      expect(typeof schema.createMetadataTable).toBe('string');
      expect(schema.createRecordsTable.includes('CREATE TABLE')).toBe(true);
      expect(schema.createMetadataTable.includes('CREATE TABLE')).toBe(true);
      expect(schema.createRecordsTable.includes('records')).toBe(true);
      expect(schema.createMetadataTable.includes('metadata')).toBe(true);
    });
    
    it('should have proper SQL table definitions', () => {
      const schema = require('../database/schema');
      
      // Check records table has expected columns
      expect(schema.createRecordsTable.includes('discogs_id')).toBe(true);
      expect(schema.createRecordsTable.includes('title')).toBe(true);
      expect(schema.createRecordsTable.includes('artists')).toBe(true);
      expect(schema.createRecordsTable.includes('year')).toBe(true);
      
      // Check metadata table structure
      expect(schema.createMetadataTable.includes('key')).toBe(true);
      expect(schema.createMetadataTable.includes('value')).toBe(true);
      expect(schema.createMetadataTable.includes('PRIMARY KEY')).toBe(true);
      
      // Check queue table structure
      expect(schema.createQueueTable.includes('record_id')).toBe(true);
      expect(schema.createQueueTable.includes('play_order')).toBe(true);
      expect(schema.createQueueTable.includes('FOREIGN KEY')).toBe(true);
      expect(schema.createQueueTable.includes('REFERENCES records')).toBe(true);
      
      // Check createTables array
      expect(Array.isArray(schema.createTables)).toBe(true);
      expect(schema.createTables.length).toBe(3);
    });
  });
});
