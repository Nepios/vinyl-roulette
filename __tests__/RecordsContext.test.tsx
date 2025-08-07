import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { RecordsProvider, useRecordsContext } from '../contexts/RecordsContext';
import { Record } from '../types/Record';
import * as database from '../database/database';
import * as syncService from '../database/syncService';
import * as collectionService from '../database/collectionService';

// Mock all database dependencies
jest.mock('../database/database');
jest.mock('../database/syncService');
jest.mock('../database/collectionService');

const mockInitDatabase = database.initDatabase as jest.MockedFunction<typeof database.initDatabase>;
const mockSyncIfStale = syncService.syncIfStale as jest.MockedFunction<typeof syncService.syncIfStale>;
const mockGetAllRecords = collectionService.getAllRecords as jest.MockedFunction<typeof collectionService.getAllRecords>;

// Mock data
const mockRecords: Record[] = [
  {
    id: 1,
    discogs_id: 101,
    title: 'Test Album 1',
    year: 2020,
    artists: JSON.stringify([{ name: 'Test Artist 1' }]),
    resource_url: 'https://api.discogs.com/releases/101',
    cover_image: 'https://example.com/cover1.jpg',
    thumb: 'https://example.com/thumb1.jpg',
    date_added: '2023-01-01',
  },
  {
    id: 2,
    discogs_id: 102,
    title: 'Test Album 2',
    year: 2021,
    artists: JSON.stringify([{ name: 'Test Artist 2' }]),
    resource_url: 'https://api.discogs.com/releases/102',
    cover_image: 'https://example.com/cover2.jpg',
    thumb: 'https://example.com/thumb2.jpg',
    date_added: '2023-01-02',
  },
];

// Helper function to simulate renderHook behavior
function renderHook<TResult>(
  callback: () => TResult,
  options?: { wrapper?: React.ComponentType<{ children: React.ReactNode }> }
) {
  let result: { current: TResult; error?: Error } = { current: undefined as any };
  let renderer: ReactTestRenderer.ReactTestRenderer;
  
  function TestComponent() {
    try {
      result.current = callback();
      result.error = undefined;
    } catch (error) {
      result.error = error as Error;
    }
    return null;
  }

  const WrapperComponent = options?.wrapper || React.Fragment;
  
  // Use act to ensure the component renders properly
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      React.createElement(WrapperComponent, {}, React.createElement(TestComponent))
    );
  });

  return {
    result,
    rerender: () => {
      ReactTestRenderer.act(() => {
        renderer.update(
          React.createElement(WrapperComponent, {}, React.createElement(TestComponent))
        );
      });
    },
    unmount: () => {
      ReactTestRenderer.act(() => {
        renderer.unmount();
      });
    },
  };
}

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecordsProvider>{children}</RecordsProvider>
);

describe('RecordsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useRecordsContext', () => {
    it('should throw error when used outside RecordsProvider', () => {
      const { result } = renderHook(() => useRecordsContext());
      
      expect(result.error).toEqual(
        Error('useRecordsContext must be used within a RecordsProvider')
      );
    });

    it('should provide context values when used within RecordsProvider', () => {
      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      expect(result.current).toMatchObject({
        records: [],
        loading: false,
        error: null,
        initialized: false,
        loadCollection: expect.any(Function),
        refreshCollection: expect.any(Function),
        clearError: expect.any(Function),
      });
    });
  });

  describe('RecordsProvider', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      expect(result.current.records).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.initialized).toBe(false);
    });
  });

  describe('loadCollection', () => {
    it('should load collection successfully', async () => {
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(mockInitDatabase).toHaveBeenCalledTimes(1);
      expect(mockSyncIfStale).toHaveBeenCalledWith('testuser', false);
      expect(mockGetAllRecords).toHaveBeenCalledTimes(1);
      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.initialized).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty username', async () => {
      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('');
      });

      expect(result.current.error).toBe('Username is required to load collection');
      expect(mockInitDatabase).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state during operation', async () => {
      let resolveInit: () => void;
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve;
      });
      
      mockInitDatabase.mockReturnValue(initPromise);
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      // Start loading (don't await yet)
      const loadPromise = result.current.loadCollection('testuser');

      // Wait a tick to let loading state be set
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check loading state is true
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      // Resolve the promise
      resolveInit!();
      
      // Wait for the operation to complete
      await ReactTestRenderer.act(async () => {
        await loadPromise;
      });

      // Check final state
      expect(result.current.loading).toBe(false);
      expect(result.current.records).toEqual(mockRecords);
    });

    it('should handle database initialization error', async () => {
      const errorMessage = 'Database init failed';
      mockInitDatabase.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.records).toEqual([]);
      expect(result.current.initialized).toBe(false);
    });

    it('should handle sync service error', async () => {
      const errorMessage = 'Sync failed';
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.records).toEqual([]);
      expect(result.current.initialized).toBe(false);
    });

    it('should handle getAllRecords error', async () => {
      const errorMessage = 'Get records failed';
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.records).toEqual([]);
      expect(result.current.initialized).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      mockInitDatabase.mockRejectedValue('String error');

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.error).toBe('Failed to load collection');
      expect(result.current.loading).toBe(false);
    });

    it('should prevent duplicate loading for same user', async () => {
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      // First load
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      // Reset mocks to verify they're not called again
      jest.clearAllMocks();

      // Second load for same user (should be skipped)
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(mockInitDatabase).not.toHaveBeenCalled();
      expect(mockSyncIfStale).not.toHaveBeenCalled();
      expect(mockGetAllRecords).not.toHaveBeenCalled();
    });

    it('should allow force reload for same user', async () => {
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      // First load
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      // Reset mocks
      jest.clearAllMocks();
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue([...mockRecords, {
        id: 3,
        discogs_id: 103,
        title: 'New Album',
        year: 2022,
        artists: JSON.stringify([{ name: 'New Artist' }]),
        resource_url: 'https://api.discogs.com/releases/103',
      }]);

      // Force reload (should execute)
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser', true);
      });

      expect(mockInitDatabase).toHaveBeenCalledTimes(1);
      expect(mockSyncIfStale).toHaveBeenCalledWith('testuser', true);
      expect(mockGetAllRecords).toHaveBeenCalledTimes(1);
      expect(result.current.records).toHaveLength(3);
    });

    it('should prevent simultaneous loading operations', async () => {
      let resolveInit: () => void;
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve;
      });
      
      mockInitDatabase.mockReturnValue(initPromise);
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      // Start first load (don't wrap in act)
      const load1Promise = result.current.loadCollection('testuser');

      // Start second load while first is in progress
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      // Only one database init should be called
      expect(mockInitDatabase).toHaveBeenCalledTimes(1);

      // Resolve first load
      resolveInit!();
      
      // Wait for first load to complete
      await ReactTestRenderer.act(async () => {
        await load1Promise;
      });

      expect(result.current.records).toEqual(mockRecords);
    });
  });

  describe('refreshCollection', () => {
    it('should call loadCollection with force=true', async () => {
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.refreshCollection('testuser');
      });

      expect(mockSyncIfStale).toHaveBeenCalledWith('testuser', true);
      expect(result.current.records).toEqual(mockRecords);
    });

    it('should handle refresh errors', async () => {
      const errorMessage = 'Refresh failed';
      mockInitDatabase.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.refreshCollection('testuser');
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockInitDatabase.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      // Create an error
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      ReactTestRenderer.act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple users', async () => {
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      // Load for first user
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('user1');
      });

      expect(result.current.records).toEqual(mockRecords);

      // Reset mocks
      jest.clearAllMocks();
      const user2Records = [mockRecords[0]];
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(user2Records);

      // Load for second user (should execute since it's a different user)
      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('user2');
      });

      expect(mockInitDatabase).toHaveBeenCalledTimes(1);
      expect(result.current.records).toEqual(user2Records);
    });

    it('should handle error recovery', async () => {
      // First call fails
      mockInitDatabase.mockRejectedValueOnce(new Error('First error'));
      
      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.error).toBe('First error');
      expect(result.current.initialized).toBe(false);

      // Second call succeeds
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('fetched');
      mockGetAllRecords.mockResolvedValue(mockRecords);

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser', true);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.initialized).toBe(true);
    });

    it('should handle empty collection', async () => {
      mockInitDatabase.mockResolvedValue();
      mockSyncIfStale.mockResolvedValue('skipped');
      mockGetAllRecords.mockResolvedValue([]);

      const { result } = renderHook(() => useRecordsContext(), { wrapper });

      await ReactTestRenderer.act(async () => {
        await result.current.loadCollection('testuser');
      });

      expect(result.current.records).toEqual([]);
      expect(result.current.initialized).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });
});