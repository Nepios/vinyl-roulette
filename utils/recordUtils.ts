import { Record } from '../types/Record';

export interface RecordSelectionResult {
  count: number;
  selectedRecord: Record | null;
}

export const getRecordCountAndRandomSelection = (records: Record[]): RecordSelectionResult => {
  const count = records.length;
  
  if (count === 0) {
    return {
      count: 0,
      selectedRecord: null,
    };
  }
  
  const randomIndex = Math.floor(Math.random() * count);
  const selectedRecord = records[randomIndex];
  
  return {
    count,
    selectedRecord,
  };
};

export const getRandomRecord = (records: Record[]): Record | null => {
  if (records.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * records.length);
  return records[randomIndex];
};

export const hasRecords = (records: Record[]): boolean => {
  return records.length > 0;
};

export const getRecordCount = (records: Record[]): number => {
  return records.length;
};