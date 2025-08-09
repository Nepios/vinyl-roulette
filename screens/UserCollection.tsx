import React, { useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  RefreshControl,
} from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../App'
import { Image } from 'react-native'
import { useRecordsContext } from '../contexts/RecordsContext'
import { Record } from '../types/Record'
import BottomNavigation from '../components/BottomNavigation'

type CollectionScreenRouteProp = RouteProp<RootStackParamList, 'Collection'>

const UserCollection = () => {
  const { records, loading, error, refreshCollection, clearError } = useRecordsContext()
  const route = useRoute<CollectionScreenRouteProp>()
  const username = route.params?.username

  const handleRefresh = useCallback(async () => {
    if (!username) return
    await refreshCollection(username)
  }, [username, refreshCollection])

  // Helper function to parse artists (using useCallback to prevent recreating renderItem)
  const parseArtists = useCallback((artistsString: string): string => {
    try {
      return JSON.parse(artistsString).map((a: { name: string }) => a.name).join(', ')
    } catch {
      return 'Unknown Artist'
    }
  }, [])

  const renderItem = useCallback(({ item }: { item: Record }) => {
    if (!item) return null

    const artists = parseArtists(item.artists)

    return (
      <View style={styles.item}>
        <Text style={styles.title}>
          {item.title} ({item.year})
        </Text>
        <Text style={styles.artist}>{artists}</Text>
        {item.cover_image && (
          <Image 
            source={{ uri: item.cover_image }} 
            style={styles.coverImage}
            onError={() => console.log('Failed to load cover image for:', item.title)}
          />
        )}
      </View>
    )
  }, [parseArtists])

  const renderContent = () => {
    if (!username) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: Missing username parameter.
          </Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Dismiss" onPress={clearError} />
          <Button title="Retry" onPress={handleRefresh} />
        </View>
      )
    }

    if (loading && records.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading your collection...</Text>
        </View>
      )
    }

    if (records.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No records found in your collection.</Text>
          <Button title="Refresh" onPress={handleRefresh} />
        </View>
      )
    }

    return (
      <FlatList
        data={records}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {records.length} record{records.length !== 1 ? 's' : ''} in your collection
            </Text>
          </View>
        }
      />
    )
  }

  return (
    <View style={styles.container}>
      {renderContent()}
      <BottomNavigation />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d5a4a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d5a4a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2d5a4a',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2d5a4a',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    padding: 16,
    backgroundColor: '#2d5a4a',
  },
  header: {
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  item: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  artist: {
    marginTop: 4,
    fontSize: 14,
    color: '#f4f1eb',
    textAlign: 'center',
  },
  coverImage: {
    marginTop: 12,
    width: 120,
    height: 120,
    borderRadius: 8,
    alignSelf: 'center',
  },
})

export default UserCollection