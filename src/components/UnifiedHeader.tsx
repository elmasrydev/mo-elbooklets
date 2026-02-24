import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCommonStyles } from '../hooks/useCommonStyles';

interface UnifiedHeaderProps {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  centerAlign?: boolean;
  showBorder?: boolean;
  style?: ViewStyle;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  leftContent,
  rightContent,
  centerAlign = false,
  showBorder = false,
  style,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const common = useCommonStyles();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const renderLeft = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.backButtonBackground}>
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={22}
              color={theme.colors.headerText || '#fff'}
            />
          </View>
        </TouchableOpacity>
      );
    }
    return leftContent || null;
  };

  const HEADER_CONTENT_HEIGHT = 54; // Standard fixed design height

  const renderTitle = () => {
    if (!title) return null;
    if (typeof title === 'string') {
      return (
        <Text style={[common.headerTitle, centerAlign ? { textAlign: 'center' } : undefined]}>
          {title}
        </Text>
      );
    }
    return title;
  };

  const renderSubtitle = () => {
    if (!subtitle) return null;
    if (typeof subtitle === 'string') {
      return (
        <Text style={[common.headerSubtitle, centerAlign ? { textAlign: 'center' } : undefined]}>
          {subtitle}
        </Text>
      );
    }
    return subtitle;
  };

  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.headerBackground,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: showBorder ? 1 : 0,
      height: insets.top + HEADER_CONTENT_HEIGHT,
      paddingTop: insets.top,
      flexDirection: common.rowDirection,
    },
    !centerAlign ? { justifyContent: 'flex-start' as const } : undefined,
    style,
  ];

  if (centerAlign) {
    return (
      <View style={containerStyle as any}>
        <View style={[styles.sideContainer, { alignItems: 'flex-start' }]}> {renderLeft()} </View>
        <View style={styles.centerContainer}>
          {renderTitle()}
          {renderSubtitle()}
        </View>
        <View style={[styles.sideContainer, { alignItems: 'flex-end' }]}> {rightContent} </View>
      </View>
    );
  }

  // Default left/right-aligned
  return (
    <View style={containerStyle as any}>
      {renderLeft()}
      <View
        style={[styles.flex1, showBackButton || leftContent ? common.marginStart(12) : undefined]}
      >
        {renderTitle()}
        {renderSubtitle()}
      </View>
      {rightContent && (
        <View style={{ alignItems: 'flex-end', marginLeft: 'auto' }}> {rightContent} </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 8,
    paddingHorizontal: 20, // matches layout.screenPadding
    alignItems: 'center',
  },
  sideContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
    justifyContent: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

export default UnifiedHeader;
