import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useCommonStyles } from '../hooks/useCommonStyles';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, rightAction, style }) => {
  const common = useCommonStyles();

  return (
    <View style={[common.header, style]}>
      {/* Text Container aligned properly via common styles */}
      <View style={common.headerTextWrapper}>
        <Text style={common.headerTitle}>{title}</Text>
        {!!subtitle && <Text style={common.headerSubtitle}>{subtitle}</Text>}
      </View>

      {/* Right Action */}
      {!!rightAction && (
        <View style={[styles.rightActionContainer, common.marginStart(12)]}>{rightAction}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rightActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenHeader;
