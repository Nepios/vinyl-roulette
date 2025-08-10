import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DiscogsLoginScreen from './screens/DiscogsLoginScreen';
import UserCollection from './screens/UserCollection';
import LandingPage from './screens/LandingPage';
import Queue from './screens/Queue';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { RecordsProvider, useRecordsContext } from './contexts/RecordsContext';
import { getDynamicIslandTopPadding } from './utils/deviceUtils';

export type RootStackParamList = {
  Home: { transitionDirection?: 'slide_from_left' | 'slide_from_right' } | undefined;
  Login: { transitionDirection?: 'slide_from_left' | 'slide_from_right' } | undefined;
  Collection: { username: string; transitionDirection?: 'slide_from_left' | 'slide_from_right' };
  Queue: { transitionDirection?: 'slide_from_left' | 'slide_from_right' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { username, loading: authLoading, isAuthorized } = useAuthContext();
  const {
    loadCollection,
    loading: recordsLoading,
    initialized,
  } = useRecordsContext();

  // Load collection once when user is authorized and username is available
  useEffect(() => {
    if (isAuthorized && username && !initialized && !recordsLoading) {
      console.log(
        '🚀 Initial collection load for authenticated user:',
        username,
      );
      loadCollection(username);
    }
  }, [isAuthorized, username, initialized, recordsLoading, loadCollection]);

  // Show loading screen while checking authorization or loading initial data
  if (authLoading) {
    return (
      <View style={styles.loadingContainer} testID="loading-container">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={() => ({
          animation: 'slide_from_right', // Default animation
          customAnimationOnGesture: true,
          fullScreenGestureEnabled: true,
          headerShown: false, // Hide the header completely
        })}
      >
        <Stack.Screen
          name="Home"
          component={LandingPage}
          options={({ route }) => ({
            title: 'Vinyl Roulette',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#2d5a4a',
            },
            headerTintColor: '#f4f1eb',
            headerTitleStyle: {
              fontWeight: '600',
              paddingTop: getDynamicIslandTopPadding(),
            },
            animation:
              route.params?.transitionDirection === 'slide_from_left'
                ? 'slide_from_left'
                : 'slide_from_right',
          })}
        />
        <Stack.Screen
          name="Login"
          component={DiscogsLoginScreen}
          options={{ title: 'Login with Discogs' }}
        />
        <Stack.Screen
          name="Collection"
          component={UserCollection}
          initialParams={username ? { username } : undefined}
          options={({ route }) => ({
            title: 'My Collection',
            animation:
              route.params?.transitionDirection === 'slide_from_left'
                ? 'slide_from_left'
                : 'slide_from_right',
          })}
        />
        <Stack.Screen
          name="Queue"
          component={Queue}
          options={({ route }) => ({
            title: 'Queue',
            animation:
              route.params?.transitionDirection === 'slide_from_left'
                ? 'slide_from_left'
                : 'slide_from_right',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RecordsProvider>
          <AppNavigator />
        </RecordsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default App;
