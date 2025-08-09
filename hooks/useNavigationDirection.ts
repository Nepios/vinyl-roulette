import { useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const useNavigationDirection = () => {
  const navigation = useNavigation<NavigationProp>();
  const previousRouteRef = useRef<string>('Home');

  // Tab order for determining direction
  const tabOrder = ['Home', 'Collection', 'Queue'];

  const getTabIndex = (tabName: string) => {
    return tabOrder.indexOf(tabName);
  };

  const getTransitionDirection = (fromTab: string, toTab: string) => {
    const fromIndex = getTabIndex(fromTab);
    const toIndex = getTabIndex(toTab);
    if (fromIndex < toIndex) {
      return 'slide_from_right'; // Moving forward in tab order - slide in from right
    } else if (fromIndex > toIndex) {
      return 'slide_from_left'; // Moving backward in tab order - slide in from left
    }
    return 'slide_from_right'; // Default
  };

  const navigateWithDirection = (
    targetRoute: keyof RootStackParamList,
    params?: Record<string, unknown>,
  ) => {
    const currentRoute = previousRouteRef.current;
    const direction = getTransitionDirection(currentRoute, targetRoute);

    // Update the previous route
    previousRouteRef.current = targetRoute;

    // Prepare params, only add transitionDirection if the route accepts it
    let finalParams = params || {};
    // Add transitionDirection only for routes that accept it
    if (
      targetRoute === 'Home' ||
      targetRoute === 'Collection' ||
      targetRoute === 'Queue'
      // Add other routes here if needed
    ) {
      finalParams = {
        ...finalParams,
        transitionDirection: direction,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigation.navigate(targetRoute as any, finalParams);
  };

  const setCurrentRoute = (routeName: string) => {
    previousRouteRef.current = routeName;
  };

  return {
    navigateWithDirection,
    setCurrentRoute,
    getTransitionDirection,
  };
};
