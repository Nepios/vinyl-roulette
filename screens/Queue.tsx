import React, { useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BottomNavigation from '../components/BottomNavigation'
import { hasDynamicIsland } from '../utils/deviceUtils'
import { useQueueContext } from '../contexts/QueueContext'
import { QueueItem } from '../database/queueService'
import { colors, spacing, borderRadius, shadows, typography } from '../styles/theme'

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
          <ActivityIndicator size="large" color={colors.text.primary} />
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
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.base,
  },
  dynamicIslandPadding: {
    paddingTop: spacing.lg, // 16 (existing) + 8 (dynamic island)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.accent.success,
    borderRadius: borderRadius.sm,
  },
  clearButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  list: {
    paddingBottom: spacing.base,
  },
  item: {
    marginBottom: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.base,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  playOrder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  playOrderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  imageContainer: {
    marginRight: spacing.sm,
  },
  coverImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text.disabled,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  artist: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary.muted,
    marginBottom: 2,
  },
  year: {
    fontSize: 11,
    color: colors.secondary.muted,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.queue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing.base,
    fontSize: typography.fontSize.base,
  },
  retryButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary.background,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.secondary.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default Queue