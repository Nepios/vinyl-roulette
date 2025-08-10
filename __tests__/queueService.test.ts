import { addToQueue, getQueue, removeFromQueue, clearQueue, isInQueue, getQueueCount } from '../database/queueService';
import { Record } from '../types/Record';

// Mock the database
const mockExecuteSql = jest.fn();
const mockTransaction = jest.fn();
const mockDB = {
  transaction: mockTransaction,
};

jest.mock('../database/database', () => ({
  getDB: () => mockDB,
}));

describe('Queue Service', () => {
  const mockRecord: Record = {
    id: 1,
    discogs_id: 123456,
    title: 'Test Album',
    artists: JSON.stringify([{ name: 'Test Artist' }]),
    year: 2023,
    cover_image: 'http://example.com/cover.jpg',
    thumb: 'http://example.com/thumb.jpg',
    resource_url: 'http://example.com/resource',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToQueue', () => {
    it('should add a record to the queue with correct play order', async () => {
      const mockResult = { rows: { item: jest.fn().mockReturnValue({ next_order: 3 }) } };
      
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        // First call for getting next order
        mockExecuteSql.mockImplementationOnce((_query, _params, success) => {
          success(null, mockResult);
        });
        
        // Second call for inserting
        mockExecuteSql.mockImplementationOnce((_query, params, success) => {
          expect(params).toEqual([mockRecord.id, 3]);
          success(null, { rowsAffected: 1 });
        });
        
        callback(mockTx);
        successCallback();
      });

      await addToQueue(mockRecord);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockExecuteSql).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors when adding to queue', async () => {
      mockTransaction.mockImplementation((callback, errorCallback) => {
        errorCallback(new Error('Database error'));
      });

      await expect(addToQueue(mockRecord)).rejects.toThrow('Queue add transaction failed: Database error');
    });
  });

  describe('getQueue', () => {
    it('should return queue items with joined record data', async () => {
      const mockQueueItems = [
        {
          id: 1,
          record_id: 1,
          date_added: '2023-01-01',
          play_order: 1,
          discogs_id: 123456,
          title: 'Test Album',
          artists: JSON.stringify([{ name: 'Test Artist' }]),
          year: 2023,
          cover_image: 'http://example.com/cover.jpg',
          thumb: 'http://example.com/thumb.jpg',
          resource_url: 'http://example.com/resource',
        },
      ];

      mockTransaction.mockImplementation((callback, errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((_query, _params, success) => {
          const mockResult = {
            rows: {
              length: 1,
              item: jest.fn().mockReturnValue(mockQueueItems[0]),
            },
          };
          success(null, mockResult);
        });
        
        callback(mockTx);
        if (successCallback) successCallback();
      });

      const result = await getQueue();

      expect(result).toEqual(mockQueueItems);
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [],
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should handle empty queue', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((_query, _params, success) => {
          const mockResult = { rows: { length: 0, item: jest.fn() } };
          success(null, mockResult);
        });
        
        callback(mockTx);
        successCallback();
      });

      const result = await getQueue();
      expect(result).toEqual([]);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove item from queue by id', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((query, params, success) => {
          expect(query).toContain('DELETE FROM queue WHERE id = ?');
          expect(params).toEqual([1]);
          success(null, { rowsAffected: 1 });
        });
        
        callback(mockTx);
        successCallback();
      });

      await removeFromQueue(1);

      expect(mockExecuteSql).toHaveBeenCalledWith(
        'DELETE FROM queue WHERE id = ?',
        [1],
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should handle removing non-existent item', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((_query, _params, success) => {
          success(null, { rowsAffected: 0 });
        });
        
        callback(mockTx);
        successCallback();
      });

      await removeFromQueue(999);
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('clearQueue', () => {
    it('should remove all items from queue', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((query, params, success) => {
          expect(query).toBe('DELETE FROM queue');
          expect(params).toEqual([]);
          success(null, { rowsAffected: 3 });
        });
        
        callback(mockTx);
        successCallback();
      });

      await clearQueue();

      expect(mockExecuteSql).toHaveBeenCalledWith(
        'DELETE FROM queue',
        [],
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('isInQueue', () => {
    it('should return true when record is in queue', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((query, params, success) => {
          expect(query).toContain('SELECT id FROM queue WHERE record_id = ?');
          expect(params).toEqual([1]);
          
          const mockResult = { rows: { length: 1 } };
          success(null, mockResult);
        });
        
        callback(mockTx);
        successCallback();
      });

      const result = await isInQueue(1);
      expect(result).toBe(true);
    });

    it('should return false when record is not in queue', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((_query, _params, success) => {
          const mockResult = { rows: { length: 0 } };
          success(null, mockResult);
        });
        
        callback(mockTx);
        successCallback();
      });

      const result = await isInQueue(1);
      expect(result).toBe(false);
    });
  });

  describe('getQueueCount', () => {
    it('should return correct queue count', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((query, _params, success) => {
          expect(query).toContain('SELECT COUNT(*) as count FROM queue');
          
          const mockResult = { rows: { item: jest.fn().mockReturnValue({ count: 5 }) } };
          success(null, mockResult);
        });
        
        callback(mockTx);
        successCallback();
      });

      const result = await getQueueCount();
      expect(result).toBe(5);
    });

    it('should return 0 for empty queue', async () => {
      mockTransaction.mockImplementation((callback, _errorCallback, successCallback) => {
        const mockTx = { executeSql: mockExecuteSql };
        
        mockExecuteSql.mockImplementation((_query, _params, success) => {
          const mockResult = { rows: { item: jest.fn().mockReturnValue({ count: 0 }) } };
          success(null, mockResult);
        });
        
        callback(mockTx);
        successCallback();
      });

      const result = await getQueueCount();
      expect(result).toBe(0);
    });
  });
});