import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  marginBottom?: number;
  marginTop?: number;
  marginHorizontal?: number;
  marginRight?: number;
  marginLeft?: number;
}

/**
 * Base Skeleton Loader Component
 * Creates a shimmer/pulse animation effect for loading states
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  marginBottom = 0,
  marginTop = 0,
  marginHorizontal = 0,
  marginRight = 0,
  marginLeft = 0,
}) => {
  const { isDark } = useTheme();
  const shimmerAnim = React.useRef(new Animated.Value(0.3)).current;

  // Use elegant gray shades mapping to the app theme context
  const backgroundColor = isDark ? '#374151' : '#E5E7EB'; // gray-700 / gray-200

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerAnim]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor,
          width: width as any,
          height,
          borderRadius,
          marginBottom,
          marginTop,
          marginHorizontal,
          marginRight,
          marginLeft,
          opacity: shimmerAnim,
        },
      ]}
    />
  );
};

// ============================================================================
// Composed Skeletons
// ============================================================================

/**
 * Generic List Item Skeleton
 */
export const ListItemSkeleton: React.FC<{ marginHorizontal?: number }> = ({
  marginHorizontal = 0,
}) => {
  const { isDark, theme } = useTheme();
  const cardBg = isDark ? theme.colors.card : '#ffffff';
  const borderColor = theme.colors.border;

  return (
    <View
      style={[
        styles.card,
        { marginHorizontal, backgroundColor: cardBg, borderColor, borderWidth: 1 },
      ]}
    >
      <SkeletonLoader width="70%" height={16} borderRadius={4} marginBottom={12} />
      <SkeletonLoader width="40%" height={12} borderRadius={4} />
      <View style={{ position: 'absolute', right: 16, top: 16 }}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

export const GenericListSkeleton: React.FC<{ numItems?: number }> = ({ numItems = 5 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: numItems }).map((_, index) => (
        <View key={index} style={{ marginBottom: 12 }}>
          <ListItemSkeleton />
        </View>
      ))}
    </View>
  );
};

/**
 * Card Skeleton (for Home/Social cards)
 */
export const CardSkeleton: React.FC<{ marginHorizontal?: number }> = ({
  marginHorizontal = 0,
}) => {
  const { isDark, theme } = useTheme();
  const cardBg = isDark ? theme.colors.card : '#ffffff';
  const borderColor = theme.colors.border;

  return (
    <View
      style={[
        styles.largeCard,
        { marginHorizontal, backgroundColor: cardBg, borderColor, borderWidth: 1 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <SkeletonLoader width={40} height={40} borderRadius={20} marginRight={12} />
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="60%" height={14} borderRadius={4} marginBottom={8} />
          <SkeletonLoader width="30%" height={12} borderRadius={4} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={14} borderRadius={4} marginBottom={8} />
      <SkeletonLoader width="80%" height={14} borderRadius={4} marginBottom={16} />
      
      {/* Bottom actions mock */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor }}>
        <SkeletonLoader width={60} height={24} borderRadius={12} />
        <SkeletonLoader width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

export const CardListSkeleton: React.FC<{ numItems?: number }> = ({ numItems = 3 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: numItems }).map((_, index) => (
        <View key={index} style={{ marginBottom: 16 }}>
          <CardSkeleton />
        </View>
      ))}
    </View>
  );
};

/**
 * Quiz Screen Skeleton
 */
export const QuizScreenSkeleton: React.FC = () => {
  const { isDark, theme } = useTheme();
  const cardBg = isDark ? theme.colors.card : '#ffffff';
  const borderColor = theme.colors.border;

  return (
    <View style={{ padding: 16, paddingTop: 24, paddingBottom: 60, gap: 16 }}>
      {/* Header Info */}
      <View style={[styles.largeCard, { backgroundColor: cardBg, borderColor, borderWidth: 1, padding: 24 }]}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <SkeletonLoader width={80} height={80} borderRadius={40} marginBottom={16} />
          <SkeletonLoader width="50%" height={20} borderRadius={4} marginBottom={8} />
          <SkeletonLoader width="70%" height={14} borderRadius={4} />
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <SkeletonLoader width={40} height={14} borderRadius={4} marginBottom={8} />
            <SkeletonLoader width={60} height={20} borderRadius={4} />
          </View>
          <View style={{ width: 1, backgroundColor: borderColor, marginHorizontal: 16 }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <SkeletonLoader width={40} height={14} borderRadius={4} marginBottom={8} />
            <SkeletonLoader width={60} height={20} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Title */}
      <SkeletonLoader width="40%" height={20} borderRadius={4} marginBottom={4} marginTop={12} />

      {/* List items */}
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  largeCard: {
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
