import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../App'
import { useAuthContext } from '../contexts/AuthContext'

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
    switch (screenName) {
      case 'Home':
        return '🏠'
      case 'Collection':
        return '💿'
      case 'Queue':
        return '📝'
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
        <Text style={[styles.icon, isActive('Home') && styles.activeIcon]}>
          {getIcon('Home')}
        </Text>
        <Text style={[styles.label, isActive('Home') && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, isActive('Collection') && styles.activeTab]} 
        onPress={navigateToCollection}
        disabled={!username}
      >
        <Text style={[styles.icon, isActive('Collection') && styles.activeIcon, !username && styles.disabledIcon]}>
          {getIcon('Collection')}
        </Text>
        <Text style={[styles.label, isActive('Collection') && styles.activeLabel, !username && styles.disabledLabel]}>Collection</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, isActive('Queue') && styles.activeTab]} 
        onPress={navigateToQueue}
      >
        <Text style={[styles.icon, isActive('Queue') && styles.activeIcon]}>
          {getIcon('Queue')}
        </Text>
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
    fontSize: 20,
    marginBottom: 4,
  },
  activeIcon: {
    fontSize: 22,
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