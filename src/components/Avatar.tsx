import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
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
  /** Show a spinner over the image while it downloads (e.g., on the Profile avatar). */
  showLoading?: boolean;
  style?: StyleProp<ViewStyle & ImageStyle>;
}

const SPINNER_COLOR = '#004A9A';

/**
 * Single source of truth for user avatars across the app.
 * Renders the backend image when available, otherwise a colored-initials circle.
 * With `showLoading`, a spinner is shown over the image until it finishes loading.
 */
const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size,
  ring,
  ringWidth = 2,
  fontScale = 0.4,
  showLoading = false,
  style,
}) => {
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(!!uri);

  useEffect(() => {
    setErrored(false);
    setLoading(!!uri);
  }, [uri]);

  const base: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(ring ? { borderWidth: ringWidth, borderColor: ring } : null),
  };

  const showImage = !!uri && !errored;

  return (
    <View
      style={[base, showImage ? styles.imageWrap : { backgroundColor: avatarColor(name) }, style]}
    >
      {showImage ? (
        <>
          <Image
            source={{ uri: uri as string }}
            style={StyleSheet.absoluteFill as StyleProp<ImageStyle>}
            resizeMode="cover"
            onLoad={() => setLoading(false)}
            onError={() => {
              setErrored(true);
              setLoading(false);
            }}
          />
          {showLoading && loading ? <ActivityIndicator size="small" color={SPINNER_COLOR} /> : null}
        </>
      ) : (
        <Text
          style={[styles.initials, { fontSize: Math.round(size * fontScale) }]}
          numberOfLines={1}
        >
          {getAvatarInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageWrap: { backgroundColor: '#DBEAFA', overflow: 'hidden' },
  initials: { color: '#ffffff', fontWeight: '700' },
});

export default React.memo(Avatar);
