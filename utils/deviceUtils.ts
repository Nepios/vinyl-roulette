import { Dimensions, Platform } from 'react-native';

/**
 * Utility to detect if the device has Dynamic Island (iPhone 14 Pro models and newer)
 */
export const hasDynamicIsland = (): boolean => {
  if (Platform.OS !== 'ios') return false;

  const { width, height } = Dimensions.get('window');
  
  // iPhone 14 Pro: 393x852 points (1179x2556 pixels)
  // iPhone 14 Pro Max: 430x932 points (1290x2796 pixels)
  // iPhone 15 Pro: 393x852 points (1179x2556 pixels)  
  // iPhone 15 Pro Max: 430x932 points (1290x2796 pixels)
  // iPhone 16 Pro: 402x874 points (1206x2622 pixels)
  // iPhone 16 Pro Max: 440x956 points (1320x2868 pixels)
  
  const dynamicIslandDevices = [
    // iPhone 14 Pro
    { width: 393, height: 852 },
    // iPhone 14 Pro Max  
    { width: 430, height: 932 },
    // iPhone 15 Pro (same as 14 Pro)
    { width: 393, height: 852 },
    // iPhone 15 Pro Max (same as 14 Pro Max)
    { width: 430, height: 932 },
    // iPhone 16 Pro
    { width: 402, height: 874 },
    // iPhone 16 Pro Max
    { width: 440, height: 956 },
  ];

  // Check both orientations
  const currentDimensions = { width: Math.min(width, height), height: Math.max(width, height) };
  
  return dynamicIslandDevices.some(device => 
    device.width === currentDimensions.width && device.height === currentDimensions.height
  );
};

/**
 * Get the appropriate top padding for Dynamic Island devices
 */
export const getDynamicIslandTopPadding = (): number => {
  return hasDynamicIsland() ? 8 : 0; // Additional padding for Dynamic Island
};

/**
 * Check if device has notch (including Dynamic Island)
 */
export const hasNotch = (): boolean => {
  if (Platform.OS !== 'ios') return false;

  const { width, height } = Dimensions.get('window');
  const currentDimensions = { width: Math.min(width, height), height: Math.max(width, height) };

  // All devices with notch or Dynamic Island
  const notchDevices = [
    // iPhone X, XS, 11 Pro
    { width: 375, height: 812 },
    // iPhone XR, 11, 12, 12 Pro, 13, 13 Pro, 14, 15, 16
    { width: 390, height: 844 },
    // iPhone XS Max, 11 Pro Max
    { width: 414, height: 896 },
    // iPhone 12 Pro Max, 13 Pro Max
    { width: 428, height: 926 },
    // iPhone 14 Plus, 15 Plus, 16 Plus
    { width: 414, height: 896 },
    // iPhone 14 Pro (Dynamic Island)
    { width: 393, height: 852 },
    // iPhone 14 Pro Max (Dynamic Island)
    { width: 430, height: 932 },
    // iPhone 16 Pro (Dynamic Island)
    { width: 402, height: 874 },
    // iPhone 16 Pro Max (Dynamic Island)
    { width: 440, height: 956 },
  ];

  return notchDevices.some(device => 
    device.width === currentDimensions.width && device.height === currentDimensions.height
  );
};

/**
 * Screen size categories for responsive design
 */
export enum ScreenSize {
  SMALL = 'small',     // iPhone SE, iPhone 8 and smaller
  MEDIUM = 'medium',   // iPhone 12/13/14/15/16 standard sizes
  LARGE = 'large',     // iPhone Plus/Pro Max sizes
}

/**
 * Detect screen size category
 */
export const getScreenSize = (): ScreenSize => {
  const { width, height } = Dimensions.get('window');
  const screenHeight = Math.max(width, height);
  
  if (screenHeight <= 667) {
    // iPhone SE (568), iPhone 8 (667)
    return ScreenSize.SMALL;
  } else if (screenHeight <= 844) {
    // iPhone 12/13/14/15/16 (844), iPhone X/XS/11 Pro (812)
    return ScreenSize.MEDIUM;
  } else {
    // iPhone Plus (736), Pro Max (926+)
    return ScreenSize.LARGE;
  }
};

/**
 * Check if device is small screen (iPhone SE, iPhone 8 and smaller)
 */
export const isSmallScreen = (): boolean => {
  return getScreenSize() === ScreenSize.SMALL;
};

/**
 * Get responsive margin for turntable container
 */
export const getTurntableMarginTop = (): number => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case ScreenSize.SMALL:
      return 0; // Remove margin on small screens for more space
    case ScreenSize.MEDIUM:
      return 5; // Reduced margin for medium screens
    case ScreenSize.LARGE:
      return 10; // Standard margin for large screens
    default:
      return 10;
  }
};

/**
 * Get responsive margin for content container
 */
export const getContentMarginTop = (): number => {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case ScreenSize.SMALL:
      return 0; // Remove margin on small screens for more space
    case ScreenSize.MEDIUM:
      return 5; // Standard margin for medium screens
    case ScreenSize.LARGE:
      return 5; // Standard margin for large screens
    default:
      return 5;
  }
};