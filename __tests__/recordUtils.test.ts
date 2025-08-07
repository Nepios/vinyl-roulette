import { getRecordCountAndRandomSelection, getRandomRecord, hasRecords, getRecordCount } from '../utils/recordUtils';
import { Record } from '../types/Record';

describe('recordUtils', () => {
  const mockRecords: Record[] = [
    {
      id: 1,
      discogs_id: 101,
      title: 'Album One',
      year: 2020,
      artists: JSON.stringify([{ name: 'Artist One' }]),
      resource_url: 'https://api.discogs.com/releases/101',
      cover_image: 'https://example.com/cover1.jpg',
      thumb: 'https://example.com/thumb1.jpg',
      date_added: '2023-01-01',
    },
    {
      id: 2,
      discogs_id: 102,
      title: 'Album Two',
      year: 2021,
      artists: JSON.stringify([{ name: 'Artist Two' }]),
      resource_url: 'https://api.discogs.com/releases/102',
      cover_image: 'https://example.com/cover2.jpg',
      thumb: 'https://example.com/thumb2.jpg',
      date_added: '2023-01-02',
    },
    {
      id: 3,
      discogs_id: 103,
      title: 'Album Three',
      year: 2022,
      artists: JSON.stringify([{ name: 'Artist Three' }]),
      resource_url: 'https://api.discogs.com/releases/103',
      cover_image: 'https://example.com/cover3.jpg',
      thumb: 'https://example.com/thumb3.jpg',
      date_added: '2023-01-03',
    },
  ];

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
  });

  describe('getRecordCountAndRandomSelection', () => {
    it('should return count 0 and null record for empty array', () => {
      const result = getRecordCountAndRandomSelection([]);
      
      expect(result.count).toBe(0);
      expect(result.selectedRecord).toBeNull();
    });

    it('should return correct count and a record for non-empty array', () => {
      const result = getRecordCountAndRandomSelection(mockRecords);
      
      expect(result.count).toBe(3);
      expect(result.selectedRecord).not.toBeNull();
      expect(mockRecords).toContain(result.selectedRecord);
    });

    it('should return the only record when array has one item', () => {
      const singleRecord = [mockRecords[0]];
      const result = getRecordCountAndRandomSelection(singleRecord);
      
      expect(result.count).toBe(1);
      expect(result.selectedRecord).toBe(mockRecords[0]);
    });

    it('should select first record when Math.random returns 0', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      
      const result = getRecordCountAndRandomSelection(mockRecords);
      
      expect(result.selectedRecord).toBe(mockRecords[0]);
    });

    it('should select last record when Math.random returns close to 1', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      
      const result = getRecordCountAndRandomSelection(mockRecords);
      
      expect(result.selectedRecord).toBe(mockRecords[2]);
    });

    it('should select middle record for middle random value', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const result = getRecordCountAndRandomSelection(mockRecords);
      
      expect(result.selectedRecord).toBe(mockRecords[1]);
    });
  });

  describe('getRandomRecord', () => {
    it('should return null for empty array', () => {
      const result = getRandomRecord([]);
      
      expect(result).toBeNull();
    });

    it('should return a record from the array', () => {
      const result = getRandomRecord(mockRecords);
      
      expect(result).not.toBeNull();
      expect(mockRecords).toContain(result);
    });

    it('should return the only record when array has one item', () => {
      const singleRecord = [mockRecords[1]];
      const result = getRandomRecord(singleRecord);
      
      expect(result).toBe(mockRecords[1]);
    });

    it('should select correct record based on Math.random value', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.33);
      
      const result = getRandomRecord(mockRecords);
      
      expect(result).toBe(mockRecords[0]);
    });

    it('should handle different random values correctly', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.8);
      
      const result = getRandomRecord(mockRecords);
      
      expect(result).toBe(mockRecords[2]);
    });
  });

  describe('hasRecords', () => {
    it('should return false for empty array', () => {
      const result = hasRecords([]);
      
      expect(result).toBe(false);
    });

    it('should return true for non-empty array', () => {
      const result = hasRecords(mockRecords);
      
      expect(result).toBe(true);
    });

    it('should return true for array with one item', () => {
      const result = hasRecords([mockRecords[0]]);
      
      expect(result).toBe(true);
    });
  });

  describe('getRecordCount', () => {
    it('should return 0 for empty array', () => {
      const result = getRecordCount([]);
      
      expect(result).toBe(0);
    });

    it('should return correct count for non-empty array', () => {
      const result = getRecordCount(mockRecords);
      
      expect(result).toBe(3);
    });

    it('should return 1 for single item array', () => {
      const result = getRecordCount([mockRecords[0]]);
      
      expect(result).toBe(1);
    });

    it('should handle large arrays', () => {
      const largeArray = new Array(1000).fill(mockRecords[0]);
      const result = getRecordCount(largeArray);
      
      expect(result).toBe(1000);
    });
  });

  describe('Random distribution', () => {
    it('should distribute selections across all records over multiple calls', () => {
      const selections = new Set();
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = getRandomRecord(mockRecords);
        if (result) {
          selections.add(result.id);
        }
      }
      
      expect(selections.size).toBeGreaterThan(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle records with minimal required fields', () => {
      const minimalRecord: Record = {
        id: 999,
        discogs_id: 999,
        title: 'Minimal Record',
        year: 2023,
        artists: JSON.stringify([{ name: 'Minimal Artist' }]),
        resource_url: 'https://api.discogs.com/releases/999',
      };

      const result = getRandomRecord([minimalRecord]);
      
      expect(result).toBe(minimalRecord);
      expect(result?.cover_image).toBeUndefined();
      expect(result?.thumb).toBeUndefined();
      expect(result?.date_added).toBeUndefined();
    });

    it('should handle records with all optional fields', () => {
      const fullRecord: Record = {
        id: 888,
        discogs_id: 888,
        title: 'Full Record',
        year: 2023,
        artists: JSON.stringify([{ name: 'Full Artist' }]),
        resource_url: 'https://api.discogs.com/releases/888',
        cover_image: 'https://example.com/cover.jpg',
        thumb: 'https://example.com/thumb.jpg',
        date_added: '2023-12-01',
      };

      const result = getRecordCountAndRandomSelection([fullRecord]);
      
      expect(result.selectedRecord).toBe(fullRecord);
      expect(result.selectedRecord?.cover_image).toBe('https://example.com/cover.jpg');
      expect(result.selectedRecord?.thumb).toBe('https://example.com/thumb.jpg');
      expect(result.selectedRecord?.date_added).toBe('2023-12-01');
    });
  });
});