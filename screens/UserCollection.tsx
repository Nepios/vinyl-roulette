import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { CollectionRelease } from '../services/discogsApi'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../App'
import { Image } from 'react-native'
import { initDatabase } from '../database/database'
import { getAllRecords } from '../database/collectionService'
import { syncIfStale } from '../database/syncService'

type CollectionScreenRouteProp = RouteProp<RootStackParamList, 'Collection'>

export interface Record {
  id: number
  discogs_id: number
  date_added?: string
  title: string
  year: number
  artists: { name: string }[]
  cover_image?: string
  thumb?: string
  resource_url: string
}

const UserCollection = () => {
  const [releases, setReleases] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const route = useRoute<CollectionScreenRouteProp>()
  const username = route.params?.username

  // useEffect(() => {
  //   const load = async () => {
  //     try {
  //       const data = await fetchUserCollection(username)
  //       console.log('collection data:', data)
  //       getDB() // Ensure DB is initialized
  //       setReleases(data)
  //     } catch (err) {
  //       console.error(err)
  //       Alert.alert('Error', 'Could not load collection')
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   load()
  // }, [username])


  
  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.log('bootstrapping UserCollection...')
        initDatabase(); // ✅ sets up tables
        await syncIfStale(); // ✅ syncs with Discogs if stale
        const data = await getAllRecords(); // ✅ read from local
        console.log(`✅ Loaded ${data.length} records from local DB`);
        console.log('data sample:', data);
        // transform data to match Record interface if needed
        // const transformedData = data.map(item => ({
        //   id: item.id,
        //   discogs_id: item.discogs_id,
        //   date_added: item.date_added,
        //   title: item.title,
        //   year: item.year,
        //   artists: item.artists,
        //   cover_image: item.cover_image,
        //   thumb: item.thumb,
        //   resource_url: item.resource_url,
        // }));
        setReleases(data);
      } catch (e) {
        console.error('Error initializing app:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [username]);

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
        {/* <Text style={styles.artist}>{item.artists?.map(a => a.name)}</Text> */}
        {item.cover_image && <Image source={{ uri: item.cover_image }} style={styles.coverImage} />}
      </View>
    )
  }

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />
  }

  return (
    <FlatList
      data={releases}
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

