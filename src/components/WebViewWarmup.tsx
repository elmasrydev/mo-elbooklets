import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Pays WebKit's one-time start-up cost behind the boot spinner — iOS only.
 *
 * The first WebView navigation in an app session runs WebKit's single-sign-on
 * check (`SOAuthorizationCoordinator::tryAuthorize`) synchronously on the main
 * thread — 0.43 s when profiled on the simulator. The first WebView a student
 * met was the lesson's mind map, so that stall landed on the lesson as it
 * opened. A hidden 1×1 WebView loading an empty document at launch takes the
 * hit while the app is still booting; every later WebView starts warm (the
 * fullscreen viewer, the second WebView of a session, measured 0.03 s).
 *
 * Not on Android: it has no such check, and a WebView constructed at launch
 * crashes the app outright on a phone whose system WebView is being updated or
 * is disabled — react-native-webview does not guard the constructor. That risk
 * belongs to the lesson that shows a map, not to every launch of every user.
 *
 * It unmounts itself once the document has loaded, failed to load, or lost its
 * content process — either way the start-up work is done.
 */
const WebViewWarmup: React.FC = () => {
  const [warm, setWarm] = useState(Platform.OS !== 'ios');
  if (warm) return null;
  const finish = () => setWarm(true);

  return (
    <View
      style={styles.hidden}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <WebView
        source={{ html: '<html></html>' }}
        javaScriptEnabled={false}
        onLoad={finish}
        onError={finish}
        onContentProcessDidTerminate={finish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default WebViewWarmup;
