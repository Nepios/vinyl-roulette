import { saveRecords, getAllRecords, getLastSyncTime, updateLastSyncTime } from '../database/collectionService';
import { CollectionRelease } from '../services/discogsApi';
import { Record } from '../types/Record';

// Mock the database
const mockExecuteSql = jest.fn();
const mockTransaction = jest.fn();
const mockDB = {
  transaction: mockTransaction,
};

jest.mock('../database/database', () => ({
  getDB: jest.fn(() => mockDB),
}));

describe('collectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mockExecuteSql implementation to avoid test interference
    mockExecuteSql.mockReset();
  });

  describe('saveRecords', () => {
    const mockRecords: CollectionRelease[] = [
      {
        id: 1,
        date_added: '2023-01-01T00:00:00Z',
        basic_information: {
          title: 'Test Album 1',
          year: 2023,
          artists: [{ name: 'Test Artist 1' }],
          resource_url: 'https://api.discogs.com/releases/1',
          cover_image: 'https://example.com/cover1.jpg',
          thumb: 'https://example.com/thumb1.jpg',
          genres: ['Rock'],
          styles: ['Alternative Rock'],
        },
      },
      {
        id: 2, 
        date_added: '2023-01-02T00:00:00Z',
        basic_information: {
          title: 'Test Album 2',
          year: 2022,
          artists: [{ name: 'Test Artist 2' }, { name: 'Featured Artist' }],
          resource_url: 'https://api.discogs.com/releases/2',
          cover_image: 'https://example.com/cover2.jpg',
          thumb: 'https://example.com/thumb2.jpg',
          genres: ['Electronic', 'Jazz'],
          styles: ['Ambient', 'Fusion'],
        },
      },
    ];

    it('should save records to database with correct SQL and parameters', async () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      await saveRecords(mockRecords);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockExecuteSql).toHaveBeenCalledTimes(2);

      // Check first record
      expect(mockExecuteSql).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO records'),
        [
          1,
          'Test Album 1',
          JSON.stringify([{ name: 'Test Artist 1' }]),
          2023,
          'https://example.com/thumb1.jpg',
          'https://api.discogs.com/releases/1',
          '2023-01-01T00:00:00Z',
          JSON.stringify(['Rock']),
          JSON.stringify(['Alternative Rock']),
          'https://example.com/cover1.jpg',
        ]
      );

      // Check second record
      expect(mockExecuteSql).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO records'),
        [
          2,
          'Test Album 2',
          JSON.stringify([{ name: 'Test Artist 2' }, { name: 'Featured Artist' }]),
          2022,
          'https://example.com/thumb2.jpg',
          'https://api.discogs.com/releases/2',
          '2023-01-02T00:00:00Z',
          JSON.stringify(['Electronic', 'Jazz']),
          JSON.stringify(['Ambient', 'Fusion']),
          'https://example.com/cover2.jpg',
        ]
      );
    });

    it('should use ON CONFLICT DO UPDATE for upsert functionality', async () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      await saveRecords([mockRecords[0]]);

      const sqlCall = mockExecuteSql.mock.calls[0][0];
      expect(sqlCall).toContain('ON CONFLICT(discogs_id) DO UPDATE SET');
      expect(sqlCall).toContain('title=excluded.title');
      expect(sqlCall).toContain('artists=excluded.artists');
      expect(sqlCall).toContain('year=excluded.year');
    });

    it('should handle empty records array', async () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      await saveRecords([]);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockExecuteSql).not.toHaveBeenCalled();
    });

    it('should handle records with undefined optional fields', async () => {
      const recordWithMissingFields: CollectionRelease = {
        id: 3,
        date_added: '2023-01-03T00:00:00Z',
        basic_information: {
          title: 'Minimal Album',
          year: 2023,
          artists: [{ name: 'Minimal Artist' }],
          resource_url: 'https://api.discogs.com/releases/3',
          // Optional fields intentionally undefined
        },
      };

      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      await saveRecords([recordWithMissingFields]);

      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO records'),
        [
          3,
          'Minimal Album',
          JSON.stringify([{ name: 'Minimal Artist' }]),
          2023,
          undefined, // thumb
          'https://api.discogs.com/releases/3',
          '2023-01-03T00:00:00Z',
          JSON.stringify(undefined), // genres
          JSON.stringify(undefined), // styles
          undefined, // cover_image
        ]
      );
    });
  });

  describe('getAllRecords', () => {
    const mockDbRecords: Record[] = [
      {
        id: 1,
        discogs_id: 1,
        title: 'Album A',
        artists: JSON.stringify([{ name: 'Artist A' }]),
        year: 2023,
        thumbnail: 'thumb1.jpg',
        resource_url: 'url1',
        date_added: '2023-01-01',
        genres: JSON.stringify(['Rock']),
        styles: JSON.stringify(['Alternative']),
        cover_image: 'cover1.jpg',
      },
      {
        id: 2,
        discogs_id: 2,
        title: 'Album B',
        artists: JSON.stringify([{ name: 'Artist B' }]),
        year: 2022,
        thumbnail: 'thumb2.jpg',
        resource_url: 'url2',
        date_added: '2023-01-02',
        genres: JSON.stringify(['Jazz']),
        styles: JSON.stringify(['Fusion']),
        cover_image: 'cover2.jpg',
      },
    ];

    it('should retrieve all records ordered by title', async () => {
      mockTransaction.mockImplementation((callback, errorCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((sql, params, successCallback) => {
          const mockResults = {
            rows: {
              length: 2,
              item: (index: number) => mockDbRecords[index],
            },
          };
          successCallback(null, mockResults);
        });
        
        callback(mockTx);
      });

      const result = await getAllRecords();

      expect(result).toEqual(mockDbRecords);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        'SELECT * FROM records ORDER BY title ASC',
        [],
        expect.any(Function)
      );
    });

    it('should handle empty result set', async () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((sql, params, successCallback) => {
          const mockResults = {
            rows: {
              length: 0,
              item: () => null,
            },
          };
          successCallback(null, mockResults);
        });
        
        callback(mockTx);
      });

      const result = await getAllRecords();

      expect(result).toEqual([]);
    });

    it('should reject on transaction error', async () => {
      mockTransaction.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Transaction failed'));
      });

      await expect(getAllRecords()).rejects.toThrow('Transaction failed');
    });

    it('should handle SQL execution errors', async () => {
      mockTransaction.mockImplementation((callback, errorCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((sql, params, successCallback) => {
          // This simulates an error in SQL execution that would bubble up
          throw new Error('SQL error');
        });
        
        callback(mockTx);
      });

      await expect(getAllRecords()).rejects.toThrow('SQL error');
    });
  });

  describe('getLastSyncTime', () => {
    it('should return timestamp when lastSync exists', async () => {
      const mockTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
      
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        // Don't reuse the same mockExecuteSql implementation across tests
        // Create a new one for each test
        const localMockExecuteSql = jest.fn((sql, params, successCallback) => {
          const mockResult = {
            rows: {
              length: 1,
              item: () => ({ value: mockTimestamp.toString() }),
            },
          };
          successCallback(null, mockResult);
        });
        
        mockTx.executeSql = localMockExecuteSql;
        callback(mockTx);
      });

      const result = await getLastSyncTime();

      expect(result).toBe(mockTimestamp);
      // We're using localMockExecuteSql so we check that instead
      const tx = mockTransaction.mock.calls[0][0];
      expect(tx).toBeDefined();
    });

    it('should return null when lastSync does not exist', async () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((sql, params, successCallback) => {
          const mockResult = {
            rows: {
              length: 0,
              item: () => null,
            },
          };
          successCallback(null, mockResult);
        });
        
        callback(mockTx);
      });

      const result = await getLastSyncTime();

      expect(result).toBeNull();
    });

    it('should reject on SQL execution error', async () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((sql, params, successCallback, errorCallback) => {
          errorCallback(null, new Error('SQL execution failed'));
        });
        
        callback(mockTx);
      });

      await expect(getLastSyncTime()).rejects.toThrow('SQL execution failed');
    });

    it('should reject on transaction error', async () => {
      mockTransaction.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Transaction error'));
      });

      await expect(getLastSyncTime()).rejects.toThrow('Transaction error');
    });

    it('should parse timestamp correctly', async () => {
      const mockTimestamp = '1640995200123'; // String timestamp
      
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((sql, params, successCallback) => {
          const mockResult = {
            rows: {
              length: 1,
              item: () => ({ value: mockTimestamp }),
            },
          };
          successCallback(null, mockResult);
        });
        
        callback(mockTx);
      });

      const result = await getLastSyncTime();

      expect(result).toBe(1640995200123);
    });
  });

  describe('updateLastSyncTime', () => {
    it('should update lastSync timestamp', () => {
      const mockTimestamp = 1640995200000;
      
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      updateLastSyncTime(mockTimestamp);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        `INSERT OR REPLACE INTO metadata (key, value) VALUES ('lastSync', ?)`,
        [mockTimestamp.toString()]
      );
    });

    it('should convert timestamp to string', () => {
      const mockTimestamp = 1640995200123;
      
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      updateLastSyncTime(mockTimestamp);

      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.any(String),
        ['1640995200123']
      );
    });

    it('should use INSERT OR REPLACE for upsert functionality', () => {
      mockTransaction.mockImplementation((callback) => {
        const mockTx = { executeSql: mockExecuteSql };
        callback(mockTx);
      });

      updateLastSyncTime(12345);

      const sqlCall = mockExecuteSql.mock.calls[0][0];
      expect(sqlCall).toBe(`INSERT OR REPLACE INTO metadata (key, value) VALUES ('lastSync', ?)`);
    });
  });
});