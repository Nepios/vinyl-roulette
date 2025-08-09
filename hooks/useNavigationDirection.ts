import { useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../App'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const useNavigationDirection = () => {
  const navigation = useNavigation<NavigationProp>()
  const previousRouteRef = useRef<string>('Home')
  
  // Tab order for determining direction
  const tabOrder = ['Home', 'Collection', 'Queue']
  
  const getTabIndex = (tabName: string) => {
    return tabOrder.indexOf(tabName)
  }
  
  const getTransitionDirection = (fromTab: string, toTab: string) => {
    const fromIndex = getTabIndex(fromTab)
    const toIndex = getTabIndex(toTab)
    
    if (fromIndex < toIndex) {
      return 'slide_from_right' // Moving right (forward)
    } else if (fromIndex > toIndex) {
      return 'slide_from_left' // Moving left (backward)
    }
    return 'slide_from_right' // Default
  }
  
  const navigateWithDirection = (targetRoute: keyof RootStackParamList, params?: Record<string, unknown>) => {
    const currentRoute = previousRouteRef.current
    const direction = getTransitionDirection(currentRoute, targetRoute)
    
    // Update the previous route
    previousRouteRef.current = targetRoute
    
    // Navigate with custom animation
    navigation.navigate(targetRoute, {
      ...params,
      _transitionDirection: direction,
    } as Parameters<typeof navigation.navigate>[1])
  }
  
  const setCurrentRoute = (routeName: string) => {
    previousRouteRef.current = routeName
  }
  
  return {
    navigateWithDirection,
    setCurrentRoute,
    getTransitionDirection,
  }
}