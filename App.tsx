import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DiscogsLoginScreen from './screens/DiscogsLoginScreen'
import UserCollection from './screens/UserCollection'

export type RootStackParamList = {
  Login: undefined;
  Collection: { username: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={DiscogsLoginScreen}
          options={{ title: 'Login with Discogs' }}
        />
        <Stack.Screen name="Collection" component={UserCollection} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
