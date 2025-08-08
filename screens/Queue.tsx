import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import BottomNavigation from '../components/BottomNavigation'

const Queue = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Queue</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This page will contain your music queue in a future update.
        </Text>
      </View>
      <BottomNavigation />
    </View>
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