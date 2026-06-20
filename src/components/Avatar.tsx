import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { avatarColor, getAvatarInitials } from '../utils/avatar';

interface AvatarProps {
  /** Backend avatar image URL. When absent (or it fails to load), colored initials are shown. */
  uri?: string | null;
  /** Used for the initials fallback + deterministic color. */
  name: string;
  size: number;
  /** Optional ring/border color. */
  ring?: string;
  ringWidth?: number;
  /** Initials font size as a fraction of `size` (default 0.4). */
  fontScale?: number;
  style?: StyleProp<ViewStyle & ImageStyle>;
}

/**
 * Single source of truth for user avatars across the app.
 * Renders the backend image when available, otherwise a colored-initials circle.
 * Uses RN Image (memory/disk cached) — no extra native dependency.
 */
const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size,
  ring,
  ringWidth = 2,
  fontScale = 0.4,
  style,
}) => {
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [uri]);

  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(ring ? { borderWidth: ringWidth, borderColor: ring } : null),
  };

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={[base, styles.imageBg, style]}
        onError={() => setErrored(true)}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[base, styles.center, { backgroundColor: avatarColor(name) }, style]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * fontScale) }]} numberOfLines={1}>
        {getAvatarInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  imageBg: { backgroundColor: '#DBEAFA' },
  initials: { color: '#ffffff', fontWeight: '700' },
});

export default React.memo(Avatar);
