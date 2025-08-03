import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator, SafeAreaView, Linking } from 'react-native';
import DiscogsLogin from './components/DiscogsLogin';
import UserCollection from './screens/UserCollection';
import DiscogsOAuth from './services/DiscogsOAuth';
import { DISCOGS_CONSUMER_KEY, DISCOGS_CONSUMER_SECRET } from '@env';
import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'
import { Buffer } from 'buffer'

global.Buffer = Buffer


interface DiscogsRelease {
  id: number;
  title: string;
  year: number;
  country: string;
  label: string[];
  genre: string[];
  thumb: string;
}

// Use imported environment variables
const CONSUMER_KEY = DISCOGS_CONSUMER_KEY;
const CONSUMER_SECRET = DISCOGS_CONSUMER_SECRET;

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [releases, setReleases] = useState<DiscogsRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'collection'>('search');
  const [oauthService] = useState(new DiscogsOAuth(CONSUMER_KEY, CONSUMER_SECRET));

  const handleAuthChange = (tokens: { accessToken: string; accessTokenSecret: string }) => {
    setIsAuthenticated(true);
    console.log('User authenticated successfully with OAuth tokens');
  };

  const handleAuthError = (error: string) => {
    Alert.alert('Authentication Error', error);
  };

  const searchDiscogs = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', searchQuery);
      
      // Get OAuth tokens if available
      const tokens = await oauthService.getStoredTokens();
      let authHeader;
      
      if (tokens && isAuthenticated) {
        // Use OAuth authorization for authenticated requests
        const oauthParams = {
          oauth_consumer_key: CONSUMER_KEY,
          oauth_token: tokens.accessToken,
          oauth_nonce: Math.random().toString(36).substring(7),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
          oauth_version: '1.0'
        };
        
        // For simplicity, we'll use basic auth header format
        // In production, you'd want to implement full OAuth signing
        authHeader = `Discogs key=${CONSUMER_KEY}, secret=${CONSUMER_SECRET}`;
      } else {
        // Use consumer key for basic requests
        authHeader = `Discogs key=${CONSUMER_KEY}, secret=${CONSUMER_SECRET}`;
      }
      
      const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(searchQuery)}&type=release&per_page=50`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VinylRoulette/1.0 +https://github.com/yourapp',
          'Authorization': authHeader
        }
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      
      if (response.ok) {
        if (data.results && data.results.length > 0) {
          setReleases(data.results);
        } else {
          Alert.alert('No Results', `No releases found for "${searchQuery}". Try a different search term.`);
          setReleases([]);
        }
      } else {
        // Handle API errors
        const errorMessage = data.message || `API Error: ${response.status}`;
        console.error('API Error:', errorMessage);
        Alert.alert('API Error', errorMessage);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', `Failed to search Discogs: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (releaseId: number) => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to add items to your collection.');
      return;
    }

    try {
      const tokens = await oauthService.getStoredTokens();
      if (!tokens) {
        Alert.alert('Error', 'No OAuth tokens found. Please log in again.');
        return;
      }

      // Import the addToCollection function dynamically
      const { addToCollection } = await import('./discogsIntegration');
      
      Alert.alert(
        'Add to Collection',
        'Are you sure you want to add this release to your collection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: async () => {
              try {
                await addToCollection(releaseId, tokens);
                Alert.alert('Success', 'Release added to your collection!');
              } catch (error) {
                console.error('Error adding to collection:', error);
                Alert.alert('Error', 'Failed to add release to collection. Please ensure you are properly authenticated.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleAddToCollection:', error);
      Alert.alert('Error', 'Failed to add to collection.');
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <ScrollView 
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>VinylRoulette</Text>
          <Text style={styles.subtitle}>
            {isAuthenticated ? 'Search Discogs & Manage Collection' : 'Search Discogs Database'}
          </Text>
        </View>
        
        {/* Login Section */}
        <DiscogsLogin
          consumerKey={CONSUMER_KEY}
          consumerSecret={CONSUMER_SECRET}
          onLoginSuccess={handleAuthChange}
          onLoginError={handleAuthError}
        />
        
        {/* Navigation Tabs */}
        {isAuthenticated && (
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'search' && styles.activeTab]}
              onPress={() => setActiveTab('search')}
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'collection' && styles.activeTab]}
              onPress={() => setActiveTab('collection')}
            >
              <Text style={[styles.tabText, activeTab === 'collection' && styles.activeTabText]}>My Collection</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Search Tab Content */}
        {activeTab === 'search' && (
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for albums, artists, or labels..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchDiscogs}
            />
            
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={searchDiscogs}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Collection Tab Content */}
        {activeTab === 'collection' && (
          <UserCollection 
            oauthService={oauthService}
            isAuthenticated={isAuthenticated}
          />
        )}
        
        {/* Search Results - only show on search tab */}
        {activeTab === 'search' && releases.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Search Results ({releases.length})</Text>
            
            {releases.map((release) => (
              <View key={release.id} style={styles.releaseItem}>
                <Text style={styles.releaseTitle}>{release.title}</Text>
                <Text style={styles.releaseInfo}>
                  {release.year ? `${release.year} • ` : ''}
                  {release.country || 'Unknown Country'}
                </Text>
                {release.label && release.label.length > 0 && (
                  <Text style={styles.releaseLabel}>
                    Label: {release.label.join(', ')}
                  </Text>
                )}
                {release.genre && release.genre.length > 0 && (
                  <Text style={styles.releaseGenre}>
                    Genre: {release.genre.join(', ')}
                  </Text>
                )}
                
                {/* Add to Collection button for authenticated users */}
                {isAuthenticated && (
                  <TouchableOpacity 
                    style={styles.addToCollectionButton}
                    onPress={() => handleAddToCollection(release.id)}
                  >
                    <Text style={styles.addToCollectionText}>+ Add to Collection</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  releaseItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6600',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  releaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  releaseInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  releaseLabel: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  releaseGenre: {
    fontSize: 12,
    color: '#FF6600',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FF6600',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  addToCollectionButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  addToCollectionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default App;
