import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTypography } from '../hooks/useTypography';
import { useTheme } from '../context/ThemeContext';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  percentage: number;
  color: string;
  showText?: boolean;
  children?: React.ReactNode;
  containerStyle?: any;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  percentage,
  color,
  showText = true,
  children,
  containerStyle,
}) => {
  const { typography, fontWeight } = useTypography();
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View
      style={[
        { width: size, height: size, justifyContent: 'center', alignItems: 'center' },
        containerStyle,
      ]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.3}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        {children
          ? children
          : showText && (
              <Text
                style={[
                  typography('label'),
                  {
                    fontSize: size * 0.22,
                    ...fontWeight('bold'),
                    color: theme.colors.text,
                  },
                ]}
              >
                {percentage} %
              </Text>
            )}
      </View>
    </View>
  );
};

export default React.memo(CircularProgress);
