import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, Button, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthContext } from '../contexts/AuthContext';
import { clearDiscogsToken } from '../services/auth/tokenStorage';
import { getRandomRecord } from '../utils/recordUtils';
import { useRecordsContext } from '../contexts/RecordsContext'
import { Record } from '../types/Record';

const LandingPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthorized, refreshAuth, username } = useAuthContext();
  const { records, loading, error, refreshCollection, clearError } = useRecordsContext();
  const [randomRecord, setRandomRecord] = useState<Record | null>(null);

  useEffect(() => {
    if (isAuthorized === false) {
      navigation.navigate('Login');
    }
  }, [isAuthorized, navigation]);

  const handleClearTokens = async () => {
    try {
      await clearDiscogsToken();
      refreshAuth();
      Alert.alert('Tokens cleared', 'Please reauthorize with Discogs.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear tokens.');
    }
  };

  const handleRandomRecord = () => {
    if (records.length === 0) {
      Alert.alert('No Records', 'Please wait for your collection to load or refresh if there\'s an error.');
      return;
    }
    
    const random = getRandomRecord(records);
    setRandomRecord(random);
  };

  const handleRefreshCollection = async () => {
    if (!username) {
      Alert.alert('Error', 'No username available for refresh.');
      return;
    }
    
    try {
      await refreshCollection(username);
      Alert.alert('Success', 'Collection refreshed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh collection.');
    }
  };

  // Memoized parsed artists to avoid repeated JSON parsing
  const displayArtists = useMemo(() => {
    if (!randomRecord?.artists) return '';
    try {
      return JSON.parse(randomRecord.artists).map((a: { name: string }) => a.name).join(', ');
    } catch {
      return 'Unknown Artist';
    }
  }, [randomRecord?.artists]);

  if (loading && records.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Dismiss" onPress={clearError} />
          <Button title="Retry" onPress={handleRefreshCollection} />
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Collection: {records.length} records</Text>
        {loading && <Text style={styles.loadingText}>Syncing...</Text>}
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Random Record" 
          onPress={handleRandomRecord}
          disabled={records.length === 0 || loading}
        />
        <Button 
          title="Go to My Collection" 
          onPress={() => navigation.navigate('Collection', { username: username ?? '' })}
          disabled={!username}
        />
        <Button 
          title="Refresh Collection" 
          onPress={handleRefreshCollection}
          disabled={!username || loading}
        />
        <Button title="Clear Tokens" onPress={handleClearTokens} />
      </View>

      {randomRecord && (
        <View style={styles.recordContainer}>
          <Text style={styles.recordTitle} numberOfLines={2} ellipsizeMode="tail">
            {randomRecord.title} 
          </Text>
          <View style={styles.imageContainer}>
            {randomRecord.cover_image ? (
              <Image 
                source={{ uri: randomRecord.cover_image }} 
                style={styles.coverImage}
                onError={() => console.log('Failed to load cover image')}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>
          <Text style={styles.artist} numberOfLines={2} ellipsizeMode="tail">
            {displayArtists}
          </Text>
          <Text style={styles.year} numberOfLines={2} ellipsizeMode="tail">
            {randomRecord.year}
          </Text>

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 10,
  },
  recordContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 300,
    minHeight: 220,
  },
  recordTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    height: 50, // Fixed height for 2 lines
    width: '100%',
  },
  artist: {
    marginTop: 30,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    height: 40, // Fixed height for 2 lines
    width: '100%',
  },
  imageContainer: {
    marginTop: 12,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  year: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    width: '100%',
  },
});

export default LandingPage;

