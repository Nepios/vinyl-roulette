import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DiscogsLogin from './components/DiscogsLogin';
import { getUserIdentity, searchReleases } from './discogsIntegration';
import { DISCOGS_CONSUMER_KEY, DISCOGS_CONSUMER_SECRET } from '@env';

interface DiscogsTokens {
  accessToken: string;
  accessTokenSecret: string;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [showLogin, setShowLogin] = useState(false);
  const [tokens, setTokens] = useState<DiscogsTokens | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const testAsyncStorage = async () => {
    try {
      await AsyncStorage.setItem('test_key', 'test_value');
      const value = await AsyncStorage.getItem('test_key');
      Alert.alert('AsyncStorage Test', `Stored and retrieved: ${value}`);
    } catch (error) {
      Alert.alert('AsyncStorage Error', `Error: ${error}`);
    }
  };

  const handleLoginSuccess = async (newTokens: DiscogsTokens) => {
    setTokens(newTokens);
    try {
      const identity = await getUserIdentity(newTokens);
      setUserInfo(identity);
      Alert.alert('Login Success', `Welcome, ${identity.username}!`);
    } catch (error) {
      console.error('Failed to get user identity:', error);
      Alert.alert('Login Warning', 'Logged in but failed to get user info');
    }
  };

  const handleLoginError = (error: string) => {
    Alert.alert('Login Error', error);
  };

  const testDiscogsSearch = async () => {
    if (!tokens) {
      Alert.alert('Error', 'Please login to Discogs first');
      return;
    }

    try {
      const results = await searchReleases('Pink Floyd', 'The Dark Side of the Moon', tokens);
      if (results.length > 0) {
        Alert.alert('Search Success', `Found ${results.length} results for Pink Floyd - The Dark Side of the Moon`);
      } else {
        Alert.alert('Search Result', 'No results found');
      }
    } catch (error) {
      Alert.alert('Search Error', `Failed to search: ${error}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text style={styles.title}>VinylRoulette</Text>
      <Text style={styles.subtitle}>Discogs OAuth Integration Test</Text>
      
      {userInfo && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>Logged in as: {userInfo.username}</Text>
        </View>
      )}
      
      <DiscogsLogin
        consumerKey={DISCOGS_CONSUMER_KEY}
        consumerSecret={DISCOGS_CONSUMER_SECRET}
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
      />
      
      {tokens && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#4CAF50' }]} 
          onPress={testDiscogsSearch}
        >
          <Text style={styles.buttonText}>Test Discogs Search</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#2196F3' }]} 
        onPress={testAsyncStorage}
      >
        <Text style={styles.buttonText}>Test AsyncStorage</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  userInfoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  userInfoText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});

export default App;
