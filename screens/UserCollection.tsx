import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Button,
} from 'react-native'
import { fetchUserCollection, CollectionRelease } from '../services/discogsApi'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { clearDiscogsToken } from '../services/auth/tokenStorage'
import { useAuthContext } from '../contexts/AuthContext'
import { RootStackParamList } from '../App'

type CollectionScreenRouteProp = RouteProp<RootStackParamList, 'Collection'>

const UserCollection = () => {
  const [releases, setReleases] = useState<CollectionRelease[]>([])
  const [loading, setLoading] = useState(true)
  const route = useRoute<CollectionScreenRouteProp>()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { refreshAuth } = useAuthContext()
  const username = route.params?.username

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDiscogsToken()
              refreshAuth()
              navigation.navigate('Login')
            } catch (error) {
              console.error('Error during logout:', error)
              Alert.alert('Error', 'Could not logout properly')
            }
          }
        }
      ]
    )
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUserCollection(username)
        setReleases(data)
      } catch (err) {
        console.error(err)
        Alert.alert('Error', 'Could not load collection')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [username])

  if (!username) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noUserText}>
          Error: Missing username parameter.
        </Text>
      </View>
    )
  }


  const renderItem = ({ item }: { item: CollectionRelease }) => {
    const info = item.basic_information
    return (
      <View style={styles.item}>
        <Text style={styles.title}>
          {info.title} ({info.year})
        </Text>
        <Text style={styles.artist}>{info.artists.map(a => a.name).join(', ')}</Text>
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
})

export default UserCollection

