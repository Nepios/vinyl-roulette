import React, { useEffect, useMemo, useState, useRef } from 'react'
import { View, Text, Button, StyleSheet, Alert, Image, ActivityIndicator, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthContext } from '../contexts/AuthContext';
import { useRecordsContext } from '../contexts/RecordsContext';
import { useQueueContext } from '../contexts/QueueContext';
import BottomNavigation from '../components/BottomNavigation';
import { hasDynamicIsland, getTurntableMarginTop, getContentMarginTop } from '../utils/deviceUtils';
import { colors, spacing, borderRadius, shadows, typography } from '../styles/theme';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const turntableImage = require('../assets/images/record-player.png');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const recordImage = require('../assets/images/vinyl-record.png');

const LandingPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthorized, username } = useAuthContext();
  const { records, loading, error, refreshCollection, clearError, currentRandomRecord, getRandomRecord, clearRandomRecord } = useRecordsContext();
  const { addToQueue, refreshQueue } = useQueueContext();
  const [showTooltip, setShowTooltip] = useState(true);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  
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

  // Refresh queue on component mount
  useEffect(() => {
    if (isAuthorized) {
      refreshQueue();
    }
  }, [isAuthorized, refreshQueue]);

  // Hide tooltip after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // const handleClearTokens = async () => {
  //   try {
  //     await clearDiscogsToken();
  //     refreshAuth();
  //     Alert.alert('Tokens cleared', 'Please reauthorize with Discogs.');
  //   } catch (authError) {
  //     Alert.alert('Error', 'Failed to clear tokens.');
  //   }
  // };

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

  // const handleAddToQueue = async (showAlert: boolean = true) => {
  //   if (!currentRandomRecord) {
  //     if (showAlert) Alert.alert('No Record', 'Please select a random record first.');
  //     return false;
  //   }

  //   const success = await addToQueue(currentRandomRecord);
  //   if (success) {
  //     if (showAlert) {
  //       Alert.alert('Added to Queue', `"${currentRandomRecord.title}" has been added to your queue!`);
  //     }
      
  //     // Clear current record immediately, then get new one
  //     clearRandomRecord();
  //     setTimeout(() => {
  //       getRandomRecord();
  //     }, 200);
      
  //     return true;
  //   } else {
  //     return false;
  //   }
  // };

  // const handleRejectRecord = () => {
  //   if (currentRandomRecord) {
      
  //     // Clear current record immediately, then get new one
  //     clearRandomRecord();
  //     setTimeout(() => {
  //       getRandomRecord();
  //     }, 300);
  //   }
  // };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = async (event: { nativeEvent: { state: number; translationX: number } }) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: tx } = event.nativeEvent;
      
      // If swiped right more than 100px, add to queue
      if (tx > 100 && currentRandomRecord) {
        // Save the record to add, but don't clear yet
        const recordToAdd = currentRandomRecord;
        
        // Animate slide right and trigger turntable spin
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotationAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(async () => {
          // Clear the record after animation completes
          clearRandomRecord();
          // Reset position and rotation instantly (off-screen)
          translateX.setValue(0);
          rotationAnim.setValue(0);
          // Add to queue without alert (silent)
          const success = await addToQueue(recordToAdd);
          if (success) {
            // Get new record after successful add
            setTimeout(() => {
              getRandomRecord();
            }, 100);
          } else {
            // If add failed, still get a new record
            setTimeout(() => {
              getRandomRecord();
            }, 100);
          }
        });
      } 
      // If swiped left more than 100px, reject record
      else if (tx < -100 && currentRandomRecord) {
        // Animate slide left and trigger turntable spin
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotationAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Clear the record after animation completes
          clearRandomRecord();
          // Reset position and rotation instantly (off-screen)
          translateX.setValue(0);
          rotationAnim.setValue(0);
          // Get new record after rejection
          setTimeout(() => {
            getRandomRecord();
          }, 100);
        });
      } 
      // If swipe wasn't far enough, reset position
      else {
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
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

  // Animated style for record card with color feedback
  const recordCardAnimatedStyle = {
    transform: [{ translateX }],
    backgroundColor: translateX.interpolate({
      inputRange: [-100, 0, 100],
      outputRange: [colors.gesture.reject, colors.gesture.neutral, colors.gesture.accept],
      extrapolate: 'clamp',
    }),
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
  const getRecordImageStyle = (width: number) => {
    // Calculate left position as a ratio of screen width
    // Adjust these values based on your turntable image proportions
    const leftPercentage = width < 375 ? 0.39 : width < 414 ? 0.415 : 0.425;
    
    return {
      left: width * leftPercentage - 150, // Subtract half width to center
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

  // Dynamic cover image size based on screen dimensions
  const getCoverImageStyle = () => {
    // For small screens (like iPhone SE), reduce image size to fit more content
    if (screenHeight <= 667 || screenWidth <= 375) { // iPhone SE and similar
      return {
        width: 120,
        height: 120,
      };
    }
    
    // For medium screens, use slightly smaller size
    if (screenHeight <= 736) { // iPhone 8 Plus and similar
      return {
        width: 140,
        height: 140,
      };
    }
    
    // Default size for larger screens
    return {
      width: 150,
      height: 150,
    };
  };

  // Get container style for cover image based on dynamic size
  const getImageContainerStyle = () => {
    const imageStyle = getCoverImageStyle();
    // Reduce top margin on small screens to save space
    const marginTop = screenHeight <= 667 ? 6 : 10;
    
    return {
      marginTop,
      width: imageStyle.width,
      height: imageStyle.height,
      borderRadius: borderRadius.base,
      alignSelf: 'center' as const,
    };
  };

  // Dynamic text styles for better fit on small screens
  const getResponsiveTextStyles = () => {
    if (screenHeight <= 667 || screenWidth <= 375) { // Small screens
      return {
        title: {
          fontSize: typography.fontSize.lg, // Slightly smaller than xl
          marginBottom: 4,
        },
        artist: {
          fontSize: typography.fontSize.sm, // Smaller than base
          marginTop: 4,
        },
        year: {
          marginTop: 6,
          fontSize: typography.fontSize.sm,
        },
      };
    }
    
    // Default sizes for larger screens
    return {
      title: {
        fontSize: typography.fontSize.xl,
        marginBottom: 0,
      },
      artist: {
        fontSize: typography.fontSize.base,
        marginTop: spacing.sm,
      },
      year: {
        marginTop: 10,
        fontSize: typography.fontSize.base,
      },
    };
  };

  if (loading && records.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.status.loading} />
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
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View style={[
              styles.recordContainer, 
              getRecordContainerStyle(),
              recordCardAnimatedStyle
            ]}>
              <Text style={[styles.recordTitle, getResponsiveTextStyles().title]} numberOfLines={3} ellipsizeMode="tail">
                {currentRandomRecord.title} 
              </Text>
              <Text style={[styles.artist, getResponsiveTextStyles().artist]}>
                {displayArtists}
              </Text>
              <View style={getImageContainerStyle()}>
                {currentRandomRecord.cover_image ? (
                  <Image 
                    source={{ uri: currentRandomRecord.cover_image }} 
                    style={[styles.coverImage, getCoverImageStyle()]}
                  />
                ) : (
                  <View style={[styles.placeholderImage, getCoverImageStyle()]}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.year, getResponsiveTextStyles().year]}>
                {currentRandomRecord.year === 0 ? 'Unknown' : currentRandomRecord.year}
              </Text>
              
              <Text style={styles.swipeHint}>
                ← Swipe left to skip | Swipe right to queue →
              </Text>
            </Animated.View>
          </PanGestureHandler>
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
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: spacing.base,
    paddingTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: colors.status.errorBackground,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    marginBottom: spacing.base,
    alignItems: 'center',
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 10,
  },
  recordContainer: {
    marginTop: 0,
    padding: spacing.base,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.base,
    width: '100%',
    justifyContent: 'space-around',
    overflow: 'hidden',
    minHeight: 300,
  },
  recordTitle: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xl,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
    color: colors.text.tertiary,
  },
  artist: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlign: 'center',
    width: '100%',
  },
  imageContainer: {
    // Dynamic dimensions handled by getImageContainerStyle()
  },
  coverImage: {
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    // Dynamic dimensions handled by getCoverImageStyle()
  },
  placeholderImage: {
    borderRadius: borderRadius.base,
    backgroundColor: colors.background.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderStyle: 'dashed',
    // Dynamic dimensions handled by getCoverImageStyle()
  },
  placeholderText: {
    color: colors.text.muted,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  year: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlign: 'center',
    width: '100%',
    marginTop: 10,
  },
  swipeHint: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary.muted,
    textAlign: 'center',
    width: '100%',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  turntableContainer: {
    position: 'relative',
    width: '100%',
  },
  dynamicIslandPadding: {
    paddingTop: spacing.sm,
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
    backgroundColor: colors.background.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border.muted,
  },
  tooltipText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

export default LandingPage;
