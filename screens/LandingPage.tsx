import React, { useEffect, useMemo, useState, useRef } from 'react'
import { View, Text, Button, StyleSheet, Alert, Image, ActivityIndicator, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthContext } from '../contexts/AuthContext';
import { clearDiscogsToken } from '../services/auth/tokenStorage';
import { useRecordsContext } from '../contexts/RecordsContext'
import BottomNavigation from '../components/BottomNavigation';
import { hasDynamicIsland, getTurntableMarginTop, getContentMarginTop } from '../utils/deviceUtils';
const turntableImage = require('../assets/images/record-player.png');
const recordImage = require('../assets/images/vinyl-record.png'); 

const LandingPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthorized, refreshAuth, username } = useAuthContext();
  const { records, loading, error, refreshCollection, clearError, currentRandomRecord, getRandomRecord } = useRecordsContext();
  const [showTooltip, setShowTooltip] = useState(true);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Dynamic Island detection and spacing
  const isDynamicIsland = hasDynamicIsland();
  
  // Responsive margins based on screen size
  const turntableMarginTop = getTurntableMarginTop();
  const contentMarginTop = getContentMarginTop();

  useEffect(() => {
    if (isAuthorized === false) {
      navigation.navigate('Login');
    }
  }, [isAuthorized, navigation]);

  // Hide tooltip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClearTokens = async () => {
    try {
      await clearDiscogsToken();
      refreshAuth();
      Alert.alert('Tokens cleared', 'Please reauthorize with Discogs.');
    } catch (authError) {
      Alert.alert('Error', 'Failed to clear tokens.');
    }
  };

  const handleRandomRecord = () => {
    if (records.length === 0) {
      Alert.alert('No Records', 'Please wait for your collection to load or refresh if there\'s an error.');
      return;
    }
    
    // Animate rotation and scale
    Animated.parallel([
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ]).start(() => {
      // Reset rotation for next animation
      rotationAnim.setValue(0);
    });
    
    // Delay the record selection slightly for visual effect
    setTimeout(() => {
      getRandomRecord();
    }, 200);
  };

  const handleRefreshCollection = async () => {
    if (!username) {
      Alert.alert('Error', 'No username available for refresh.');
      return;
    }
    
    try {
      await refreshCollection(username);
      Alert.alert('Success', 'Collection refreshed successfully!');
    } catch (refreshError) {
      Alert.alert('Error', 'Failed to refresh collection.');
    }
  };

  // Animated style for turntable
  const animatedStyle = {
    transform: [
      {
        rotate: rotationAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '720deg'], // 2 full rotations (360deg × 2)
        }),
      },
      { scale: scaleAnim }
    ],
  };

  // Memoized parsed artists to avoid repeated JSON parsing
  const displayArtists = useMemo(() => {
    if (!currentRandomRecord?.artists) return '';
    try {
      return JSON.parse(currentRandomRecord.artists).map((a: { name: string }) => a.name).join(', ');
    } catch {
      return 'Unknown Artist';
    }
  }, [currentRandomRecord?.artists]);

  // Dynamic positioning based on screen width
  const getRecordImageStyle = (screenWidth: number) => {
    // Calculate left position as a ratio of screen width
    // Adjust these values based on your turntable image proportions
    const leftPercentage = screenWidth < 375 ? 0.39 : screenWidth < 414 ? 0.415 : 0.425;
    
    return {
      left: screenWidth * leftPercentage - 150, // Subtract half width to center
    };
  };

  // Dynamic record container height based on screen size
  const getRecordContainerStyle = () => {
    // Calculate available space after turntable (200px) and bottom nav (~100px)
    const availableHeight = screenHeight - 200 - 100 - 120; // 120 for header + margins
    
    // For larger screens, limit the container height to prevent excessive blank space
    if (screenHeight > 800) {
      return {
        maxHeight: Math.min(availableHeight, 350),
        minHeight: 250,
      };
    }
    
    // For smaller screens, use flex to fill available space
    return {
      flex: 1,
      minHeight: 200,
    };
  };

  if (loading && records.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your collection...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[
        styles.turntableContainer, 
        { marginTop: turntableMarginTop },
        isDynamicIsland && styles.dynamicIslandPadding
      ]}>
        <TouchableOpacity 
          onPress={handleRandomRecord}
          disabled={records.length === 0 || loading}
          testID="turntable-button"
        >
          <View style={styles.turntableWrapper}>
            <Image source={turntableImage} style={styles.turntableImage} />
            <Animated.Image 
              source={recordImage} 
              style={[styles.recordImage, getRecordImageStyle(screenWidth), animatedStyle]} 
            />
          </View>
        </TouchableOpacity>
        {showTooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Tap for random record</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.content, { marginTop: contentMarginTop }]}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Dismiss" onPress={clearError} />
            <Button title="Retry" onPress={handleRefreshCollection} />
          </View>
        )}

        {currentRandomRecord && (
          <View style={[styles.recordContainer, getRecordContainerStyle()]}>
            <Text style={styles.recordTitle} numberOfLines={3} ellipsizeMode="tail">
              {currentRandomRecord.title} 
            </Text>
            <Text style={styles.artist} >
              {displayArtists}
            </Text>
            <View style={styles.imageContainer}>
              {currentRandomRecord.cover_image ? (
                <Image 
                  source={{ uri: currentRandomRecord.cover_image }} 
                  style={styles.coverImage}
                  onError={() => console.log('Failed to load cover image')}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
            </View>

            <Text style={styles.year}>
              {currentRandomRecord.year}
            </Text>

          </View>
        )}
      </View>
      {/* <View style={styles.buttonContainer}>
          <Button title="Clear Tokens" onPress={handleClearTokens} />
        </View> */}
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d5a4a',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
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
    backgroundColor: '#2d5a4a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 10,
  },
  recordContainer: {
    marginTop: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  recordTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
  },
  artist: {
    marginTop: 8,
    fontSize: 14,
    color: '#f4f1eb',
    textAlign: 'center',
    width: '100%',
  },
  imageContainer: {
    marginTop: 10,
    width: 150,
    height: 150,
    borderRadius: 8,
    alignSelf: 'center',
  },
  coverImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  year: {
    fontSize: 14,
    color: '#f4f1eb',
    textAlign: 'center',
    width: '100%',
    marginTop: 10,
  },
  turntableContainer: {
    position: 'relative',
    width: '100%',
  },
  dynamicIslandPadding: {
    paddingTop: 8,
  },
  turntableWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  turntableImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    position: 'absolute',
  },
  recordImage: {
    width: 300, // Adjust size to match the record on the turntable
    height: 300,
    position: 'absolute',
    top: '50%',
    marginTop: -150, // Half of height to center
    resizeMode: 'contain',
  },
  tooltip: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tooltipText: {
    color: '#f4f1eb',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LandingPage;
