import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { COLORS } from '../../config/colors';
import { MindMapViewMode } from '../../utils/mindMapHtml';

type MindMapWebViewProps = {
  /** A document from `svgDocument`. */
  html: string;
  mode: MindMapViewMode;
  /** The map has rendered. */
  onLoad: () => void;
  onError: () => void;
  testID?: string;
};

/**
 * Renders a lesson's SVG mind map in a WebView (BKLT-174).
 *
 * Why not react-native-svg, which the rest of the app uses for SVG: it draws on
 * the app's main thread, and it redraws the whole map on mount, every time the
 * map scrolls back into view and on every rotation — the generator's drop
 * shadows through CoreImage on top. Profiling the lesson screen on the
 * simulator put 7.6 s of a 25 s open-and-scroll window into that drawing: the
 * "freeze until the video loads". A WebView renders in its own process, so the
 * map costs the app's main thread nothing, and it renders exactly as designed —
 * embedded font, shadows, Arabic/number direction — with native, vector-sharp
 * zoom in the viewer.
 *
 * JavaScript is off (the document is static markup from our own backend) and
 * any navigation away from it is refused.
 */
const MindMapWebView: React.FC<MindMapWebViewProps> = ({ html, mode, onLoad, onError, testID }) => {
  // The OS can kill a WebView's content process under memory pressure, which
  // leaves a blank white view on iOS and an unusable one on Android.
  // Remounting brings the map back.
  const [processGeneration, setProcessGeneration] = useState(0);
  const restart = () => setProcessGeneration((n) => n + 1);
  const zoomable = mode === 'viewer';

  return (
    <WebView
      key={processGeneration}
      testID={testID}
      source={{ html }}
      originWhitelist={['*']}
      javaScriptEnabled={false}
      // A link inside the SVG must not navigate the map away.
      onShouldStartLoadWithRequest={(request) => !/^https?:/i.test(request.url)}
      scrollEnabled={zoomable}
      bounces={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      setBuiltInZoomControls={zoomable}
      setDisplayZoomControls={false}
      onLoad={onLoad}
      onError={onError}
      onContentProcessDidTerminate={restart}
      onRenderProcessGone={restart}
      style={styles.web}
    />
  );
};

const styles = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});

export default MindMapWebView;
