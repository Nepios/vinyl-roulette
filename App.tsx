import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import DiscogsLoginScreen from './screens/DiscogsLoginScreen'
import UserCollection from './screens/UserCollection'
import LandingPage from './screens/LandingPage'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import { RecordsProvider, useRecordsContext } from './contexts/RecordsContext'

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Collection: { username: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { username, loading: authLoading, isAuthorized } = useAuthContext()
  const { loadCollection, loading: recordsLoading, initialized } = useRecordsContext()

  // Load collection once when user is authorized and username is available
  useEffect(() => {
    if (isAuthorized && username && !initialized && !recordsLoading) {
      console.log('🚀 Initial collection load for authenticated user:', username)
      loadCollection(username)
    }
  }, [isAuthorized, username, initialized, recordsLoading, loadCollection])

  // Show loading screen while checking authorization or loading initial data
  if (authLoading) {
    return (
      <View style={styles.loadingContainer} testID="loading-container">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
      >
        <Stack.Screen
          name="Home"
          component={LandingPage}
          options={{ title: 'Vinyl Roulette' }}
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
          options={{ title: 'My Collection' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <RecordsProvider>
        <AppNavigator />
      </RecordsProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})

export default App
