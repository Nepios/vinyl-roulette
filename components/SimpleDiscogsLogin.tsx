import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import SimpleDiscogsOAuth from '../services/SimpleDiscogsOAuth';

interface SimpleDiscogsLoginProps {
  consumerKey: string;
  consumerSecret: string;
  onLoginSuccess: (isAuthenticated: boolean) => void;
  onLoginError: (error: string) => void;
}

const SimpleDiscogsLogin: React.FC<SimpleDiscogsLoginProps> = ({
  consumerKey,
  consumerSecret,
  onLoginSuccess,
  onLoginError,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [oauthService] = useState(new SimpleDiscogsOAuth(consumerKey, consumerSecret));

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const authenticated = await oauthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      onLoginSuccess(authenticated);
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  };

  const handleGetToken = async () => {
    setShowInstructions(true);
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Please enter a valid token');
      return;
    }

    try {
      await oauthService.storePersonalToken(tokenInput.trim());
      setIsAuthenticated(true);
      setShowTokenInput(false);
      setShowInstructions(false);
      setTokenInput('');
      onLoginSuccess(true);
      Alert.alert('Success', 'You are now authenticated with Discogs!');
    } catch (error) {
      console.error('Error saving token:', error);
      onLoginError('Failed to save authentication token');
    }
  };

  const handleLogout = async () => {
    try {
      await oauthService.clearTokens();
      setIsAuthenticated(false);
      onLoginSuccess(false);
      Alert.alert('Success', 'You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const openDiscogsSettings = () => {
    Linking.openURL('https://www.discogs.com/settings/developers');
  };

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>✅ Connected to Discogs</Text>
        <Text style={styles.description}>
          You can now access your collection and add records to your wishlist.
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Discogs</Text>
      <Text style={styles.description}>
        Get authenticated access to view your collection, add to wishlist, and more.
      </Text>

      <TouchableOpacity style={styles.loginButton} onPress={handleGetToken}>
        <Text style={styles.buttonText}>Get Discogs Token</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.loginButton, { backgroundColor: '#666' }]} 
        onPress={() => setShowTokenInput(true)}
      >
        <Text style={styles.buttonText}>I Have a Token</Text>
      </TouchableOpacity>

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Get Your Discogs Token</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.stepTitle}>Step 1: Open Discogs Developer Settings</Text>
            <TouchableOpacity style={styles.linkButton} onPress={openDiscogsSettings}>
              <Text style={styles.linkText}>Open Discogs Settings →</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Step 2: Generate a Personal Access Token</Text>
            <Text style={styles.stepText}>
              1. Scroll down to "Personal access tokens"
              {'\n'}2. Click "Generate new token"
              {'\n'}3. Give it a name like "VinylRoulette"
              {'\n'}4. Copy the generated token
            </Text>

            <Text style={styles.stepTitle}>Step 3: Enter Token in App</Text>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => {
                setShowInstructions(false);
                setShowTokenInput(true);
              }}
            >
              <Text style={styles.buttonText}>I Have My Token</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Token Input Modal */}
      <Modal
        visible={showTokenInput}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Your Token</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowTokenInput(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tokenInputContainer}>
            <Text style={styles.inputLabel}>Paste your Discogs Personal Access Token:</Text>
            <TextInput
              style={styles.tokenInput}
              value={tokenInput}
              onChangeText={setTokenInput}
              placeholder="Your token will be a long string..."
              multiline
              autoCorrect={false}
              autoCapitalize="none"
            />
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveToken}>
              <Text style={styles.buttonText}>Save Token</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  instructionsContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 15,
  },
  linkButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  tokenInputContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
  },
});

export default SimpleDiscogsLogin;
