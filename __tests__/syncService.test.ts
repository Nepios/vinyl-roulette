import { syncIfStale } from '../database/syncService';
import * as collectionService from '../database/collectionService';
import * as discogsApi from '../services/discogsApi';

// Mock the dependencies
jest.mock('../database/collectionService');
jest.mock('../services/discogsApi');

const mockGetLastSyncTime = collectionService.getLastSyncTime as jest.MockedFunction<typeof collectionService.getLastSyncTime>;
const mockUpdateLastSyncTime = collectionService.updateLastSyncTime as jest.MockedFunction<typeof collectionService.updateLastSyncTime>;
const mockSaveRecords = collectionService.saveRecords as jest.MockedFunction<typeof collectionService.saveRecords>;
const mockFetchUserCollection = discogsApi.fetchUserCollection as jest.MockedFunction<typeof discogsApi.fetchUserCollection>;

describe('syncService', () => {
  const mockUsername = 'testuser';
  const mockRecords: discogsApi.CollectionRelease[] = [
    {
      id: 1,
      date_added: '2023-01-01T00:00:00Z',
      basic_information: {
        title: 'Test Album',
        year: 2023,
        artists: [{ name: 'Test Artist' }],
        resource_url: 'https://api.discogs.com/releases/1',
        cover_image: 'https://example.com/cover.jpg',
        thumb: 'https://example.com/thumb.jpg',
        genres: ['Rock'],
        styles: ['Alternative Rock'],
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000000); // Fixed timestamp
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Silence console logs
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('syncIfStale', () => {
    it('should fetch data when no previous sync exists', async () => {
      mockGetLastSyncTime.mockResolvedValue(null);
      mockFetchUserCollection.mockResolvedValue(mockRecords);
      mockSaveRecords.mockResolvedValue(undefined);
      mockUpdateLastSyncTime.mockReturnValue(undefined);

      const result = await syncIfStale(mockUsername);

      expect(result).toBe('fetched');
      expect(mockGetLastSyncTime).toHaveBeenCalledTimes(1);
      expect(mockFetchUserCollection).toHaveBeenCalledWith(mockUsername);
      expect(mockSaveRecords).toHaveBeenCalledWith(mockRecords);
      expect(mockUpdateLastSyncTime).toHaveBeenCalledWith(1000000000);
    });

    it('should fetch data when sync is stale', async () => {
      const staleTimestamp = 1000000000 - (1000 * 60 * 2); // 2 minutes ago (stale)
      mockGetLastSyncTime.mockResolvedValue(staleTimestamp);
      mockFetchUserCollection.mockResolvedValue(mockRecords);
      mockSaveRecords.mockResolvedValue(undefined);
      mockUpdateLastSyncTime.mockReturnValue(undefined);

      const result = await syncIfStale(mockUsername);

      expect(result).toBe('fetched');
      expect(mockFetchUserCollection).toHaveBeenCalledWith(mockUsername);
      expect(mockSaveRecords).toHaveBeenCalledWith(mockRecords);
      expect(mockUpdateLastSyncTime).toHaveBeenCalledWith(1000000000);
    });

    it('should skip sync when data is fresh', async () => {
      const freshTimestamp = 1000000000 - (1000 * 30); // 30 seconds ago (fresh)
      mockGetLastSyncTime.mockResolvedValue(freshTimestamp);

      const result = await syncIfStale(mockUsername);

      expect(result).toBe('skipped');
      expect(mockFetchUserCollection).not.toHaveBeenCalled();
      expect(mockSaveRecords).not.toHaveBeenCalled();
      expect(mockUpdateLastSyncTime).not.toHaveBeenCalled();
    });

    it('should force sync even when data is fresh', async () => {
      const freshTimestamp = 1000000000 - (1000 * 30); // 30 seconds ago (fresh)
      mockGetLastSyncTime.mockResolvedValue(freshTimestamp);
      mockFetchUserCollection.mockResolvedValue(mockRecords);
      mockSaveRecords.mockResolvedValue(undefined);
      mockUpdateLastSyncTime.mockReturnValue(undefined);

      const result = await syncIfStale(mockUsername, true);

      expect(result).toBe('fetched');
      expect(mockFetchUserCollection).toHaveBeenCalledWith(mockUsername);
      expect(mockSaveRecords).toHaveBeenCalledWith(mockRecords);
      expect(mockUpdateLastSyncTime).toHaveBeenCalledWith(1000000000);
    });

    it('should handle errors from getLastSyncTime', async () => {
      mockGetLastSyncTime.mockRejectedValue(new Error('Database error'));

      await expect(syncIfStale(mockUsername)).rejects.toThrow('Database error');
      expect(mockFetchUserCollection).not.toHaveBeenCalled();
      expect(mockSaveRecords).not.toHaveBeenCalled();
      expect(mockUpdateLastSyncTime).not.toHaveBeenCalled();
    });

    it('should handle errors from fetchUserCollection', async () => {
      mockGetLastSyncTime.mockResolvedValue(null);
      mockFetchUserCollection.mockRejectedValue(new Error('API error'));

      await expect(syncIfStale(mockUsername)).rejects.toThrow('API error');
      expect(mockSaveRecords).not.toHaveBeenCalled();
      expect(mockUpdateLastSyncTime).not.toHaveBeenCalled();
    });

    it('should handle errors from saveRecords', async () => {
      mockGetLastSyncTime.mockResolvedValue(null);
      mockFetchUserCollection.mockResolvedValue(mockRecords);
      mockSaveRecords.mockRejectedValue(new Error('Save error'));

      await expect(syncIfStale(mockUsername)).rejects.toThrow('Save error');
      expect(mockUpdateLastSyncTime).not.toHaveBeenCalled();
    });

    it('should log sync status correctly', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const staleTimestamp = 1000000000 - (1000 * 60 * 2); // 2 minutes ago (stale)
      
      mockGetLastSyncTime.mockResolvedValue(staleTimestamp);
      mockFetchUserCollection.mockResolvedValue(mockRecords);
      mockSaveRecords.mockResolvedValue(undefined);
      mockUpdateLastSyncTime.mockReturnValue(undefined);

      await syncIfStale(mockUsername);

      // Check that sync logging includes the username
      expect(consoleLogSpy).toHaveBeenCalledWith(`🔄 Sync check for ${mockUsername}:`);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Is stale: true, Force: false'));
      expect(consoleLogSpy).toHaveBeenCalledWith('📥 Fetching collection from Discogs...');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Sync completed: 1 records saved');
    });

    it('should log skip message when sync is skipped', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const freshTimestamp = 1000000000 - (1000 * 30); // 30 seconds ago (fresh)
      
      mockGetLastSyncTime.mockResolvedValue(freshTimestamp);

      await syncIfStale(mockUsername);

      expect(consoleLogSpy).toHaveBeenCalledWith('⏭️ Sync skipped, data is fresh.');
    });

    it('should handle empty collection from API', async () => {
      mockGetLastSyncTime.mockResolvedValue(null);
      mockFetchUserCollection.mockResolvedValue([]);
      mockSaveRecords.mockResolvedValue(undefined);
      mockUpdateLastSyncTime.mockReturnValue(undefined);

      const result = await syncIfStale(mockUsername);

      expect(result).toBe('fetched');
      expect(mockSaveRecords).toHaveBeenCalledWith([]);
      expect(mockUpdateLastSyncTime).toHaveBeenCalledWith(1000000000);
    });

    it('should use correct sync interval (1 minute)', async () => {
      // Test that the sync interval is 1 minute (60,000 ms)
      const justOverOneMinute = 1000000000 - (1000 * 60 + 1); // Just over 1 minute ago
      const justUnderOneMinute = 1000000000 - (1000 * 59); // 59 seconds ago
      
      // Should be stale when over 1 minute
      mockGetLastSyncTime.mockResolvedValue(justOverOneMinute);
      mockFetchUserCollection.mockResolvedValue(mockRecords);
      mockSaveRecords.mockResolvedValue(undefined);
      mockUpdateLastSyncTime.mockReturnValue(undefined);

      let result = await syncIfStale(mockUsername);
      expect(result).toBe('fetched');

      jest.clearAllMocks();

      // Should not be stale at just under 1 minute
      mockGetLastSyncTime.mockResolvedValue(justUnderOneMinute);

      result = await syncIfStale(mockUsername);
      expect(result).toBe('skipped');
      expect(mockFetchUserCollection).not.toHaveBeenCalled();
    });
  });
});