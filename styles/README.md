# VinylRoulette Theme System

This directory contains the centralized theme system for VinylRoulette, providing consistent colors, typography, spacing, and styling across all components.

## Usage

### Basic Import

```typescript
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
```

### Colors

The color system is organized into semantic categories:

```typescript
// Primary brand colors
colors.primary.background        // '#2d5a4a' - Main dark green
colors.primary.text             // '#f4f1eb' - Light cream text

// Status colors
colors.status.error             // '#c62828' - Error red
colors.status.success           // '#4CAF50' - Success green
colors.status.loading           // '#0000ff' - Loading blue

// Text variations
colors.text.primary             // '#f4f1eb' - Main text
colors.text.secondary           // '#666' - Gray text
colors.text.muted               // '#999' - Light gray
colors.text.disabled            // Semi-transparent primary text

// Background variations
colors.background.primary       // '#2d5a4a' - Main app background
colors.background.card          // Semi-transparent white for cards
colors.background.overlay       // Dark overlay for tooltips

// Navigation specific
colors.navigation.activeTab     // '#ffffff' - Active tab
colors.navigation.inactiveTab   // '#f4f1eb' - Inactive tab

// Gesture feedback (for swipe animations)
colors.gesture.accept           // Green tint for right swipe
colors.gesture.reject           // Pink tint for left swipe
colors.gesture.neutral          // Neutral state
```

### Typography

```typescript
// Font sizes
typography.fontSize.xs          // 10
typography.fontSize.sm          // 12
typography.fontSize.base        // 14
typography.fontSize.lg          // 16
typography.fontSize.xl          // 18

// Font weights
typography.fontWeight.normal    // '400'
typography.fontWeight.medium    // '500'
typography.fontWeight.semibold  // '600'
typography.fontWeight.bold      // 'bold'
```

### Spacing

```typescript
spacing.xs                      // 4
spacing.sm                      // 8
spacing.base                    // 16
spacing.lg                      // 24
spacing.xl                      // 32
```

### Border Radius

```typescript
borderRadius.none               // 0
borderRadius.sm                 // 4
borderRadius.base               // 8
borderRadius.lg                 // 12
borderRadius.xl                 // 16
borderRadius.full               // 9999
```

### Shadows

```typescript
shadows.none                    // No shadow
shadows.sm                      // Light shadow
shadows.base                    // Standard shadow
shadows.lg                      // Heavy shadow
```

## Examples

### Basic Component Styling

```typescript
import { colors, spacing, typography, borderRadius } from '../styles/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.base,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.base,
  },
});
```

### Button Components

```typescript
const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent.success,
    color: colors.text.inverse,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
  },
  secondary: {
    backgroundColor: colors.accent.info,
    color: colors.text.inverse,
  },
  danger: {
    backgroundColor: colors.status.error,
    color: colors.text.inverse,
  },
});
```

### Gesture Feedback

```typescript
const recordCardAnimatedStyle = {
  transform: [{ translateX }],
  backgroundColor: translateX.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [
      colors.gesture.reject,  // Left swipe - red tint
      colors.gesture.neutral, // Neutral state
      colors.gesture.accept   // Right swipe - green tint
    ],
    extrapolate: 'clamp',
  }),
};
```

## Benefits

1. **Consistency**: All components use the same color palette and styling
2. **Maintainability**: Change colors in one place to update entire app
3. **Scalability**: Easy to add new color variations or themes
4. **Type Safety**: TypeScript ensures you're using valid theme values
5. **Performance**: Pre-defined values avoid inline style calculations

## Best Practices

1. **Always use theme values**: Avoid hardcoded colors and measurements
2. **Use semantic names**: Choose colors based on meaning, not appearance
3. **Test accessibility**: Ensure sufficient contrast ratios
4. **Document custom colors**: If you add new colors, update this documentation
5. **Consider dark mode**: The system can be extended for multiple themes

## Migration Guide

To migrate existing hardcoded styles to the theme system:

1. Replace color hex codes:
   ```typescript
   // Before
   color: '#f4f1eb'
   
   // After
   color: colors.text.primary
   ```

2. Replace spacing values:
   ```typescript
   // Before
   padding: 16
   
   // After
   padding: spacing.base
   ```

3. Use semantic color names:
   ```typescript
   // Before
   backgroundColor: '#2d5a4a'
   
   // After
   backgroundColor: colors.background.primary
   ```

## Future Enhancements

- Dark mode support
- High contrast mode
- User customizable themes
- Animated theme transitions
- Platform-specific variations (iOS vs Android)