import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { layout } from '../config/layout';

interface UnifiedHeaderProps {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  centerAlign?: boolean;
  showBorder?: boolean;
  isModal?: boolean;
  style?: ViewStyle;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  leftContent,
  rightContent,
  centerAlign = true,
  showBorder = false,
  isModal = false,
  style,
}) => {
  const navigation = useNavigation();
  const { theme, spacing, borderRadius } = useTheme();
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

  const currentStyles = styles(theme, spacing, borderRadius);

  const renderLeft = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity
          style={currentStyles.iconButton}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={currentStyles.backButtonBackground}>
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={spacing.icon.md}
              color={theme.colors.headerText}
            />
          </View>
        </TouchableOpacity>
      );
    }
    return leftContent || null;
  };

  const HEADER_CONTENT_HEIGHT = isModal ? 57 : 50;
  const effectiveCenterAlign = centerAlign;

  const renderTitle = () => {
    if (!title) return null;
    if (typeof title === 'string') {
      return (
        <Text
          numberOfLines={1}
          style={[
            common.headerTitle,
            { lineHeight: undefined },
            effectiveCenterAlign ? { textAlign: 'center' } : undefined,
          ]}
        >
          {title}
        </Text>
      );
    }
    return title;
  };

  const sidePadding = layout.screenPadding;
  const headerTop = isModal ? 0 : insets.top;
  const totalHeight = headerTop + HEADER_CONTENT_HEIGHT;

  const containerStyle: ViewStyle[] = [
    currentStyles.container,
    {
      backgroundColor: theme.colors.headerBackground,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: showBorder ? 1 : 0,
      height: totalHeight,
      paddingTop: headerTop,
      paddingHorizontal: sidePadding,
    },
    style as ViewStyle,
  ];

  if (effectiveCenterAlign) {
    return (
      <View style={containerStyle}>
        {/* Centered Layer - Absolute */}
        <View
          style={{
            position: 'absolute',
            top: headerTop,
            left: 0,
            right: 0,
            height: HEADER_CONTENT_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: sidePadding + 50,
            zIndex: 0,
          }}
          pointerEvents="none"
        >
          {renderTitle()}
        </View>

        {/* Action Layer - Row */}
        <View
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%', zIndex: 1 }}
        >
          <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
            {renderLeft()}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
            {rightContent}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%' }}>
        <View style={{ justifyContent: 'center' }}> {renderLeft()} </View>
        <View
          style={[
            { flex: 1, justifyContent: 'center' },
            showBackButton || leftContent ? common.marginStart(spacing.sm) : undefined,
          ]}
        >
          {renderTitle()}
        </View>
        {rightContent && (
          <View style={{ alignItems: 'flex-end', marginLeft: 'auto', justifyContent: 'center' }}>
            {rightContent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    iconButton: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonBackground: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.headerText + '26',
    },
  });

export default UnifiedHeader;
