import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ViewStyle } from 'react-native';
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
  centerAlign = false,
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
  const effectiveCenterAlign = centerAlign || isModal || !showBackButton;

  const renderTitle = () => {
    if (!title) return null;
    if (typeof title === 'string') {
      return (
        <Text
          style={[common.headerTitle, effectiveCenterAlign ? { textAlign: 'center' } : undefined]}
        >
          {title}
        </Text>
      );
    }
    return title;
  };

  const renderSubtitle = () => null;

  const containerStyle = [
    currentStyles.container,
    {
      backgroundColor: theme.colors.headerBackground,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: showBorder ? 1 : 0,
      height: (isModal ? 0 : insets.top) + HEADER_CONTENT_HEIGHT,
      paddingTop: isModal ? 0 : insets.top,
      flexDirection: common.rowDirection,
    },
    !effectiveCenterAlign ? { justifyContent: 'flex-start' as const } : undefined,
    style,
  ];

  if (effectiveCenterAlign) {
    return (
      <View style={containerStyle as any}>
        <View style={[currentStyles.sideContainer, { alignItems: 'flex-start' }]}>
          {renderLeft()}
        </View>
        <View style={currentStyles.centerContainer}>
          {renderTitle()}
          {renderSubtitle()}
        </View>
        <View style={[currentStyles.sideContainer, { alignItems: 'flex-end' }]}>
          {rightContent}
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle as any}>
      {renderLeft()}
      <View
        style={[
          currentStyles.flex1,
          showBackButton || leftContent ? common.marginStart(spacing.sm) : undefined,
        ]}
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

const styles = (theme: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingBottom: spacing.sm,
      paddingHorizontal: layout.screenPadding,
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
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.headerText + '26',
    },
  });

export default UnifiedHeader;
