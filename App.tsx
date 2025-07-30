import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import SimpleDiscogsLogin from './components/SimpleDiscogsLogin';
import SimpleDiscogsOAuth from './services/SimpleDiscogsOAuth';
import { DISCOGS_CONSUMER_KEY, DISCOGS_CONSUMER_SECRET } from '@env';

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
  const [oauthService] = useState(new SimpleDiscogsOAuth(CONSUMER_KEY, CONSUMER_SECRET));

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
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
      
      // Get the appropriate auth header
      const authHeader = await oauthService.getAuthHeader();
      
      const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(searchQuery)}&type=release&per_page=50`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VinylRoulette/1.0 +https://github.com/yourapp',
          'Authorization': authHeader || `Discogs key=${CONSUMER_KEY}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
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
          <Text style={styles.subtitle}>Search Discogs Database</Text>
        </View>
        
        {/* Login Section */}
        <SimpleDiscogsLogin
          consumerKey={CONSUMER_KEY}
          consumerSecret={CONSUMER_SECRET}
          onLoginSuccess={handleAuthChange}
          onLoginError={handleAuthError}
        />
        
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
        
        {releases.length > 0 && (
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
});

export default App;
