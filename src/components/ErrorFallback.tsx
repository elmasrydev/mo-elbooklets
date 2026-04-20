import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar as RNStatusBar,
  ImageBackground,
  Image,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';

const ErrorFallback: React.FC<{ onRetry: () => void; error?: Error | null }> = ({
  onRetry,
  error,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const typoContext = useTypography();

  const { theme, borderRadius, isDark } = themeContext;
  const { typography, fontWeight } = typoContext;

  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  return (
    <ImageBackground
      source={require('../../assets/new-splash-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <RNStatusBar barStyle={statusBarStyle} translucent backgroundColor="transparent" />

        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.centerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '15' }]}>
              <Ionicons name="alert-circle" size={80} color={theme.colors.error} />
            </View>

            <Text
              style={[
                styles.title,
                typography('h2'),
                fontWeight('bold'),
                { color: theme.colors.text },
              ]}
            >
              {t('common.error_boundary_title')}
            </Text>

            <Text
              style={[
                styles.message,
                typography('h2'),
                fontWeight('bold'),
                { color: theme.colors.text },
              ]}
            >
              {t('common.error_boundary_message')}
            </Text>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.desc, typography('body'), { color: theme.colors.buttonPrimary }]}
              >
                {t('common.error_boundary_desc')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary, borderRadius: borderRadius.xl },
            ]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={[typography('body'), fontWeight('bold'), styles.buttonText]}>
              {t('common.error_boundary_retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 140,
    height: 120,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  card: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  desc: {
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
  },
});

export default ErrorFallback;
