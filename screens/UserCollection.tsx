import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../App'
import { Image } from 'react-native'
import { initDatabase } from '../database/database'
import { getAllRecords } from '../database/collectionService'
import { syncIfStale } from '../database/syncService'
import { useRecordsContext } from '../contexts/RecordsContext'

type CollectionScreenRouteProp = RouteProp<RootStackParamList, 'Collection'>

export interface Record {
  id: number
  discogs_id: number
  date_added?: string
  title: string
  year: number
  artists: string
  cover_image?: string
  thumb?: string
  resource_url: string
}

const UserCollection = () => {
  const { records, setRecords } = useRecordsContext()
  const [loading, setLoading] = useState(true)
  const route = useRoute<CollectionScreenRouteProp>()
  const username = route.params?.username
  
  useEffect(() => {
    const bootstrap = async () => {
      try {
        initDatabase(); 
        await syncIfStale(username); 
        console.log('Database initialized and synced for user:', username);
        const data = await getAllRecords(); 
        console.log('Fetched records:', data.length, data);
        setRecords(data);
      } catch (e) {
        console.error('Error initializing app:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [username, setRecords]);

  if (!username) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noUserText}>
          Error: Missing username parameter.
        </Text>
      </View>
    )
  }


  const renderItem = ({ item }: { item: Record }) => {
    if (!item) return null;
    return (
      <View style={styles.item}>
        <Text style={styles.title}>
          {item.title} ({item.year})
        </Text>
        <Text style={styles.artist}>{JSON.parse(item.artists).map((a: { name: string }) => a.name).join(', ')}</Text>
        {item.cover_image && <Image source={{ uri: item.cover_image }} style={styles.coverImage} />}
      </View>
    )
  }

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />
  }

  return (
    <FlatList
      data={records}
      keyExtractor={item => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 100,
  },
  list: {
    padding: 16,
  },
  item: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  artist: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  noUserText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20
  },
  coverImage: {
    marginTop: 8,
    width: 100,
    height: 100,
    borderRadius: 4,
  },
})

export default UserCollection

