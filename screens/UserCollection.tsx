import React, { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../App'
import { useRecordsContext } from '../contexts/RecordsContext'
import { Record } from '../types/Record'
import BottomNavigation from '../components/BottomNavigation'
import { hasDynamicIsland } from '../utils/deviceUtils'
import { colors, spacing, borderRadius, shadows, typography } from '../styles/theme'

type CollectionScreenRouteProp = RouteProp<RootStackParamList, 'Collection'>

const UserCollection = () => {
  const { records, loading, error, refreshCollection, clearError } = useRecordsContext()
  const route = useRoute<CollectionScreenRouteProp>()
  const username = route.params?.username
  
  // Dynamic Island detection and spacing
  const isDynamicIsland = hasDynamicIsland()

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
        <View style={styles.itemContent}>
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
            <Text style={styles.year}>
              {item.year === 0 ? 'Unknown' : item.year}
            </Text>
          </View>
        </View>
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
          <Text style={styles.headerTitle}>
            Collection ({records.length})
          </Text>
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
    paddingTop: spacing.lg,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.secondary.muted,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
})

export default UserCollection