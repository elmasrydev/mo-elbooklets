import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ColorTheme, COLOR_THEME_DISPLAY_COLORS } from '../config/colors';

interface ColorThemePickerProps {
  compact?: boolean;
}

const COLOR_THEMES: ColorTheme[] = ['green', 'purple', 'blue', 'orange'];

const ColorThemePicker: React.FC<ColorThemePickerProps> = ({ compact = false }) => {
  const { theme, colorTheme, setColorTheme } = useTheme();
  const { isRTL } = useLanguage();

  const handleSelectTheme = (newTheme: ColorTheme) => {
    if (newTheme !== colorTheme) {
      setColorTheme(newTheme);
    }
  };

  return (
    <View style={[
      styles.container,
      { flexDirection: isRTL ? 'row-reverse' : 'row' }
    ]}>
      {COLOR_THEMES.map((themeOption) => {
        const isSelected = colorTheme === themeOption;
        const displayColor = COLOR_THEME_DISPLAY_COLORS[themeOption];
        
        return (
          <TouchableOpacity
            key={themeOption}
            style={[
              styles.colorOption,
              compact && styles.colorOptionCompact,
              { backgroundColor: displayColor },
              isSelected && styles.colorOptionSelected,
              isSelected && { borderColor: theme.colors.text },
            ]}
            onPress={() => handleSelectTheme(themeOption)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginTop:10,
  },
  colorOptionCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  colorOptionSelected: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ColorThemePicker;
