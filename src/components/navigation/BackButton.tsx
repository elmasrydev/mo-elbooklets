import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Unified back button used across all stack screens.
 * RTL-aware arrow direction. Uses navigation.goBack() by default.
 */
const BackButton: React.FC<BackButtonProps> = ({ onPress, color, size = 22, style }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isRTL } = useLanguage();

  const iconColor = color || theme.colors.headerText;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default React.memo(BackButton);
