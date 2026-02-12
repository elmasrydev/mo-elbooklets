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

/**
 * Close button for modal screens. Shows an ✕ icon.
 * Uses navigation.goBack() by default.
 */
const CloseButton: React.FC<CloseButtonProps> = ({ onPress, color, size = 20, style }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();

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
      style= { [styles.container, style]}
    onPress = { handlePress }
    activeOpacity = { 0.7}
    hitSlop = {{ top: 8, bottom: 8, left: 8, right: 8 }
}
    >
    <Ionicons name="close" size = { size } color = { iconColor } />
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

export default CloseButton;
