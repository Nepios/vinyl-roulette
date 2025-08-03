import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import DiscogsLoginScreen from './screens/DiscogsLoginScreen'
import UserCollection from './screens/UserCollection'
import LandingPage from './screens/LandingPage'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Collection: { username: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isAuthorized, username, loading } = useAuthContext()

  // Show loading screen while checking authorization
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
          options={{ title: 'Home' }}
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
      <AppNavigator />
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
