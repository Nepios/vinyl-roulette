import React, { useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNavigation from '../components/BottomNavigation'
import { hasDynamicIsland } from '../utils/deviceUtils'
import { useQueueContext } from '../contexts/QueueContext'
import { QueueItem } from '../database/queueService'

const Queue = () => {
  // Dynamic Island detection and spacing
  const isDynamicIsland = hasDynamicIsland()
  const { queue, queueCount, loading, error, removeFromQueue, clearQueue, refreshQueue, clearError } = useQueueContext()

  // Refresh queue when component mounts
  useEffect(() => {
    refreshQueue()
  }, [refreshQueue])

  // Helper function to parse artists
  const parseArtists = useCallback((artistsString: string): string => {
    try {
      return JSON.parse(artistsString).map((a: { name: string }) => a.name).join(', ')
    } catch {
      return 'Unknown Artist'
    }
  }, [])

  const handleRemoveItem = useCallback((item: QueueItem) => {
    Alert.alert(
      'Remove from Queue',
      `Remove "${item.title}" from your queue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromQueue(item.id),
        },
      ]
    )
  }, [removeFromQueue])

  const handleClearQueue = useCallback(() => {
    if (queueCount === 0) return

    Alert.alert(
      'Clear Queue',
      `Remove all ${queueCount} items from your queue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearQueue,
        },
      ]
    )
  }, [clearQueue, queueCount])

  const renderItem = useCallback(({ item, index }: { item: QueueItem; index: number }) => {
    const artists = parseArtists(item.artists)

    return (
      <View style={styles.item}>
        <View style={styles.itemContent}>
          <View style={styles.playOrder}>
            <Text style={styles.playOrderText}>{index + 1}</Text>
          </View>
          
          <View style={styles.imageContainer}>
            {item.cover_image ? (
              <Image 
                source={{ uri: item.cover_image }} 
                style={styles.coverImage}
                onError={() => console.log('Failed to load cover image for:', item.title)}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>?</Text>
              </View>
            )}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1} ellipsizeMode="tail">
              {artists}
            </Text>
            <Text style={styles.year}>{item.year}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }, [parseArtists, handleRemoveItem])

  const renderContent = () => {
    if (loading && queue.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f4f1eb" />
          <Text style={styles.loadingText}>Loading queue...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearError}>
            <Text style={styles.retryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (queue.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your Queue is Empty</Text>
          <Text style={styles.emptyText}>
            Go to the Home screen and swipe right on a random record to add it to your queue!
          </Text>
        </View>
      )
    }

    return (
      <FlatList
        data={queue}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.content,
        isDynamicIsland && styles.dynamicIslandPadding
      ]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Queue ({queueCount})</Text>
          {queueCount > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearQueue}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {renderContent()}
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
    padding: 16,
  },
  dynamicIslandPadding: {
    paddingTop: 24, // 16 (existing) + 8 (dynamic island)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4f1eb',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(123,150, 90, 0.8)',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#f4f1eb',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 16,
  },
  item: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  playOrder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 241, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playOrderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f4f1eb',
  },
  imageContainer: {
    marginRight: 12,
  },
  coverImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(244, 241, 235, 0.5)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f1eb',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: 'rgba(244, 241, 235, 0.8)',
    marginBottom: 2,
  },
  year: {
    fontSize: 11,
    color: 'rgba(244, 241, 235, 0.6)',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123,150, 90, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#f4f1eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#f4f1eb',
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc262f',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(244, 241, 235, 0.2)',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#f4f1eb',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f4f1eb',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(244, 241, 235, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default Queue