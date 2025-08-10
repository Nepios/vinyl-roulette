import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNavigation from '../components/BottomNavigation'
import { hasDynamicIsland } from '../utils/deviceUtils'

const Queue = () => {
  // Dynamic Island detection and spacing
  const isDynamicIsland = hasDynamicIsland()

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.content,
        isDynamicIsland && styles.dynamicIslandPadding
      ]}>
        <Text style={styles.title}>Queue</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This page will contain your music queue in a future update.
        </Text>
      </View>
      <BottomNavigation />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d5a4a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dynamicIslandPadding: {
    paddingTop: 28, // 20 (existing) + 8 (dynamic island)
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4f1eb',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#f4f1eb',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#f4f1eb',
    textAlign: 'center',
    opacity: 0.8,
  },
})

export default Queue