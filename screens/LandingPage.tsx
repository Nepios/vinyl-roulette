import React, { useEffect, useMemo } from 'react'
import { View, Text, Button, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthContext } from '../contexts/AuthContext';
import { clearDiscogsToken } from '../services/auth/tokenStorage';
import { useRecordsContext } from '../contexts/RecordsContext'
import BottomNavigation from '../components/BottomNavigation';

const LandingPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthorized, refreshAuth, username } = useAuthContext();
  const { records, loading, error, refreshCollection, clearError, currentRandomRecord, getRandomRecord } = useRecordsContext();

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
    } catch (authError) {
      Alert.alert('Error', 'Failed to clear tokens.');
    }
  };

  const handleRandomRecord = () => {
    if (records.length === 0) {
      Alert.alert('No Records', 'Please wait for your collection to load or refresh if there\'s an error.');
      return;
    }
    
    getRandomRecord();
  };

  const handleRefreshCollection = async () => {
    if (!username) {
      Alert.alert('Error', 'No username available for refresh.');
      return;
    }
    
    try {
      await refreshCollection(username);
      Alert.alert('Success', 'Collection refreshed successfully!');
    } catch (refreshError) {
      Alert.alert('Error', 'Failed to refresh collection.');
    }
  };

  // Memoized parsed artists to avoid repeated JSON parsing
  const displayArtists = useMemo(() => {
    if (!currentRandomRecord?.artists) return '';
    try {
      return JSON.parse(currentRandomRecord.artists).map((a: { name: string }) => a.name).join(', ');
    } catch {
      return 'Unknown Artist';
    }
  }, [currentRandomRecord?.artists]);

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
      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Dismiss" onPress={clearError} />
            <Button title="Retry" onPress={handleRefreshCollection} />
          </View>
        )}
        <View style={styles.buttonContainer}>
          <Button 
            title="Random Record" 
            onPress={handleRandomRecord}
            disabled={records.length === 0 || loading}
          />
          <Button 
            title="Refresh Collection" 
            onPress={handleRefreshCollection}
            disabled={!username || loading}
          />
          <Button title="Clear Tokens" onPress={handleClearTokens} />
        </View>

        {currentRandomRecord && (
          <View style={styles.recordContainer}>
            <Text style={styles.recordTitle} >
              {currentRandomRecord.title} 
            </Text>
            <Text style={styles.artist} >
              {displayArtists}
            </Text>
            <View style={styles.imageContainer}>
              {currentRandomRecord.cover_image ? (
                <Image 
                  source={{ uri: currentRandomRecord.cover_image }} 
                  style={styles.coverImage}
                  onError={() => console.log('Failed to load cover image')}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
            </View>

            <Text style={styles.year}>
              {currentRandomRecord.year}
            </Text>

          </View>
        )}
      </View>
      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d5a4a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d5a4a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#2d5a4a',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    minHeight: 300,
  },
  recordTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
  },
  artist: {
    marginTop: 8,
    fontSize: 14,
    color: '#f4f1eb',
    textAlign: 'center',
    width: '100%',
  },
  imageContainer: {
    marginTop: 10,
    width: 150,
    height: 150,
    borderRadius: 8,
    alignSelf: 'center',
  },
  coverImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#f4f1eb',
    textAlign: 'center',
    width: '100%',
    marginTop: 10,
  },
});

export default LandingPage;
