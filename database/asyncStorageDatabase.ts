import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordItem, CollectionRelease, transformCollectionReleasesToRecordItems } from '../types/records';

const RECORDS_KEY = 'vinyl_records';
const METADATA_KEY = 'vinyl_metadata';

export const saveRecords = async (records: RecordItem[]) => {
  try {
    console.log(`💾 Saving ${records.length} records to AsyncStorage...`);
    const recordsJson = JSON.stringify(records);
    await AsyncStorage.setItem(RECORDS_KEY, recordsJson);
    console.log(`🎉 Successfully saved ${records.length} records`);
  } catch (error) {
    console.error('❌ Error saving records:', error);
    throw error;
  }
};

export const saveCollectionReleases = async (releases: CollectionRelease[]) => {
  const recordItems = transformCollectionReleasesToRecordItems(releases);
  await saveRecords(recordItems);
};

export const getAllRecords = async (): Promise<RecordItem[]> => {
  try {
    console.log('📊 Retrieving records from AsyncStorage...');
    const recordsJson = await AsyncStorage.getItem(RECORDS_KEY);
    
    if (recordsJson) {
      const records: RecordItem[] = JSON.parse(recordsJson);
      console.log(`✅ Retrieved ${records.length} records from storage`);
      return records;
    } else {
      console.log('📦 No records found in storage');
      return [];
    }
  } catch (error) {
    console.error('❌ Error retrieving records:', error);
    throw error;
  }
};

export const clearRecords = async () => {
  try {
    await AsyncStorage.removeItem(RECORDS_KEY);
    console.log('✅ All records cleared');
  } catch (error) {
    console.error('❌ Error clearing records:', error);
    throw error;
  }
};

export const getLastSyncTime = async (): Promise<number | null> => {
  try {
    console.log('🕰️ Getting last sync time...');
    const metadataJson = await AsyncStorage.getItem(METADATA_KEY);
    
    if (metadataJson) {
      const metadata = JSON.parse(metadataJson);
      const timestamp = metadata.lastSync;
      if (timestamp) {
        console.log(`✅ Last sync time: ${new Date(timestamp).toISOString()}`);
        return timestamp;
      }
    }
    
    console.log('🆕 No previous sync time found');
    return null;
  } catch (error) {
    console.error('❌ Error getting last sync time:', error);
    throw error;
  }
};

export const updateLastSyncTime = async (timestamp: number) => {
  try {
    const metadata = { lastSync: timestamp };
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    console.log(`✅ Updated sync time to: ${new Date(timestamp).toISOString()}`);
  } catch (error) {
    console.error('❌ Error updating sync time:', error);
    throw error;
  }
};

// Function to check if data exists (equivalent to table check)
export const checkDataExists = async (): Promise<{records: boolean, metadata: boolean}> => {
  try {
    const recordsJson = await AsyncStorage.getItem(RECORDS_KEY);
    const metadataJson = await AsyncStorage.getItem(METADATA_KEY);
    
    const result = {
      records: recordsJson !== null,
      metadata: metadataJson !== null
    };
    
    console.log('Data exists check:', result);
    return result;
  } catch (error) {
    console.error('❌ Error checking data existence:', error);
    throw error;
  }
};
