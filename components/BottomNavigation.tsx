import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../App'
import { useAuthContext } from '../contexts/AuthContext'
import { House, Disc, Turntable } from 'lucide-react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const BottomNavigation = () => {
  const navigation = useNavigation<NavigationProp>()
  const { username, isAuthorized } = useAuthContext()

  // Handle route safely for tests
  let routeName = 'Home'
  try {
    const route = useRoute()
    routeName = route.name
  } catch (error) {
    // If useRoute fails (in tests), default to 'Home'
    console.error('Error getting route name in BottomNavigation:', error);
    routeName = 'Home'
  }

  // Don't show bottom nav on login screen or if not authorized
  if (routeName === 'Login' || !isAuthorized) {
    return null
  }

  const navigateToHome = () => {
    navigation.navigate('Home')
  }

  const navigateToCollection = () => {
    if (username) {
      navigation.navigate('Collection', { username })
    }
  }

  const navigateToQueue = () => {
    navigation.navigate('Queue')
  }

  const isActive = (screenName: string) => {
    return routeName === screenName
  }

  const getIconColor = (screenName: string, disabled = false) => {
    if (disabled) return 'rgba(244, 241, 235, 0.5)'
    return isActive(screenName) ? '#ffffff' : '#f4f1eb'
  }

  const getIcon = (screenName: string) => {
    const isScreenActive = isActive(screenName)
    const size = isScreenActive ? 22 : 20
    
    switch (screenName) {
      case 'Home':
        return <House color={getIconColor('Home')} size={size} />
      case 'Collection':
        return <Disc color={getIconColor('Collection', !username)} size={size} />
      case 'Queue':
        return <Turntable color={getIconColor('Queue')} size={size} />
      default:
        return '❓'
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.tab, isActive('Home') && styles.activeTab]} 
        onPress={navigateToHome}
      >
        <View style={[styles.icon, isActive('Home') && styles.activeIcon]}>
          {getIcon('Home')}
        </View>
        <Text style={[styles.label, isActive('Home') && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, isActive('Collection') && styles.activeTab]} 
        onPress={navigateToCollection}
        disabled={!username}
      >
        <View style={[styles.icon, isActive('Collection') && styles.activeIcon, !username && styles.disabledIcon]}>
          {getIcon('Collection')}
        </View>
        <Text style={[styles.label, isActive('Collection') && styles.activeLabel, !username && styles.disabledLabel]}>Collection</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, isActive('Queue') && styles.activeTab]} 
        onPress={navigateToQueue}
      >
        <View style={[styles.icon, isActive('Queue') && styles.activeIcon]}>
          {getIcon('Queue')}
        </View>
        <Text style={[styles.label, isActive('Queue') && styles.activeLabel]}>Queue</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(45, 90, 74, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: {
    // Active icon styling handled by getIcon function
  },
  disabledIcon: {
    opacity: 0.5,
  },
  label: {
    fontSize: 12,
    color: '#f4f1eb',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledLabel: {
    opacity: 0.5,
  },
})

export default BottomNavigation