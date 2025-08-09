import React, { useEffect, ReactNode } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'

const { width: screenWidth } = Dimensions.get('window')

interface AnimatedScreenWrapperProps {
  children: ReactNode
  transitionDirection?: 'slide_from_left' | 'slide_from_right' | 'none'
  onTransitionComplete?: () => void
}

const AnimatedScreenWrapper: React.FC<AnimatedScreenWrapperProps> = ({
  children,
  transitionDirection = 'none',
  onTransitionComplete,
}) => {
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (transitionDirection === 'none') return

    // Set initial position based on transition direction
    if (transitionDirection === 'slide_from_left') {
      translateX.value = -screenWidth
    } else if (transitionDirection === 'slide_from_right') {
      translateX.value = screenWidth
    }

    opacity.value = 0

    // Animate to center position
    translateX.value = withTiming(0, {
      duration: 300,
    }, (finished) => {
      if (finished && onTransitionComplete) {
        runOnJS(onTransitionComplete)()
      }
    })
    
    opacity.value = withTiming(1, {
      duration: 300,
    })
  }, [transitionDirection, translateX, opacity, onTransitionComplete])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }
  })

  if (transitionDirection === 'none') {
    return <View style={styles.container}>{children}</View>
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default AnimatedScreenWrapper