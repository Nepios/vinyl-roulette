import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthContext } from '../contexts/AuthContext';
import { clearDiscogsToken } from '../services/auth/tokenStorage';

const LandingPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthorized, refreshAuth, username } = useAuthContext();


  React.useEffect(() => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Landing Page</Text>
      <Button title="Go to My Collection" onPress={() => navigation.navigate('Collection', { username })} />
      <Button title="Clear Tokens" onPress={handleClearTokens} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default LandingPage;

