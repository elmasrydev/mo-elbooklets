import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

interface CloseButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: ViewStyle;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onPress, color, size, style }) => {
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
      style={[currentStyles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
  });

export default CloseButton;
