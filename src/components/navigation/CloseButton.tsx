import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../config/colors';
import { useTheme } from '../../context/ThemeContext';

interface CloseButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** `header` sits in a screen header; `floating` hovers over fullscreen content. */
  variant?: 'header' | 'floating';
  accessibilityLabel?: string;
  testID?: string;
}

const CloseButton: React.FC<CloseButtonProps> = ({
  onPress,
  color,
  size,
  style,
  variant = 'header',
  accessibilityLabel,
  testID,
}) => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius } = useTheme();

  const iconColor = color || theme.colors.headerText;
  const iconSize = size || spacing.icon.md;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  const currentStyles = styles(theme, borderRadius);

  return (
    <TouchableOpacity
      style={[currentStyles.container, variant === 'floating' && currentStyles.floating, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Ionicons name="close" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = (theme: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.headerText + '26',
    },
    // Larger, raised and above its siblings, so it stays legible and tappable
    // over a white map or diagram.
    floating: {
      width: 44,
      height: 44,
      zIndex: 10,
      elevation: 10,
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });

export default React.memo(CloseButton);
