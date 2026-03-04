import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getSubjectConfig } from '../utils/subjectTheme';

interface SubjectIconProps {
  subjectName: string;
  size?: number;
  style?: ViewStyle;
  iconStyle?: ImageStyle;
}

const SubjectIcon: React.FC<SubjectIconProps> = ({ subjectName, size = 56, style, iconStyle }) => {
  const { theme } = useTheme();
  const config = getSubjectConfig(subjectName, theme);

  return (
    <View
      style={[
        styles.iconBox,
        {
          width: size,
          height: size,
          borderRadius: size * 0.2, // proportional border radius
          backgroundColor: config.bg,
        },
        style,
      ]}
    >
      {config.localIcon ? (
        <Image
          source={config.localIcon as any}
          style={[
            styles.subjectIcon,
            {
              width: size * 0.5,
              height: size * 0.5,
            },
            iconStyle,
          ]}
        />
      ) : (
        <Ionicons name={config.icon as any} size={size * 0.5} color={config.color} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectIcon: {
    resizeMode: 'contain',
  },
});

export default SubjectIcon;
