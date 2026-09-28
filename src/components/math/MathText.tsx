import React, { memo, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SvgAst } from 'react-native-svg';
import { MATH_SCALE } from '../../config/math';
import { spacing } from '../../config/spacing';
import { renderMath, type RenderedMath } from '../../lib/mathRenderer';
import {
  mayContainMath,
  spacedAgainstText,
  splitMath,
  splitTextRuns,
} from '../../utils/mathSegments';

/**
 * A `<Text>` for server content that may carry LaTeX (BKLT-399) — question and
 * answer text, explanations, lesson summaries and key points, Boki answers.
 *
 * Text without a formula renders as exactly the `<Text>` it replaces. Inline
 * math (`$…$`, `\(…\)`) is drawn as an SVG inside the line, sitting on the
 * text's baseline; display math (`$$…$$`, `\[…\]`) gets its own centred row
 * that scrolls sideways when wider than the screen. A formula that does not
 * parse shows its TeX source, like the admin preview.
 *
 * Only what is displayed changes: callers keep comparing and submitting the
 * raw string (an MCQ answer is matched and sent back verbatim).
 *
 * With `numberOfLines` (or `inline`) every formula is drawn inline, so the text
 * stays one paragraph: it still truncates, and can nest inside another Text.
 * Nested, pass it the parent's text style anyway: the text inherits it, but
 * the formulas take their size and colour from `style` alone.
 */

type MathTextProps = Omit<TextProps, 'children'> & {
  children: string | null | undefined;
  /** Draw every formula inline — for a MathText nested inside another Text. */
  inline?: boolean;
};

type Piece = string | { tex: string; math: RenderedMath };
type Block =
  | { kind: 'paragraph'; pieces: Piece[] }
  | { kind: 'display'; tex: string; math: RenderedMath };

const DEFAULT_FONT_SIZE = 14;
/** getTextStyle's line height, for a style that sets none. */
const DEFAULT_LINE_HEIGHT = 1.5;
/** How far a UI font's own glyphs reach above and below the baseline, in font sizes. */
const TEXT_ASCENT = 0.8;
const TEXT_DESCENT = 0.25;

/**
 * Style keys that shape the whole block — its box — rather than the text: a
 * passage's padding has to wrap the display rows too, not repeat under every
 * paragraph between them.
 */
const BOX_KEYS = new Set<string>([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'backgroundColor',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'start',
  'end',
  'zIndex',
]);
const isBoxKey = (key: string) => BOX_KEYS.has(key) || /^(margin|padding|border)/.test(key);

const splitStyle = (style: StyleProp<TextStyle>) => {
  const flat = StyleSheet.flatten(style) ?? {};
  const layout: Record<string, unknown> = {};
  const text: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    (isBoxKey(key) ? layout : text)[key] = value;
  }
  return { flat, layout: layout as ViewStyle, text: text as TextStyle };
};

/**
 * The size RN draws this text at relative to its `fontSize`: text (and its
 * lineHeight) follows the system font size, the formula SVGs have to be scaled
 * by hand to keep up.
 */
const fontScaleFor = (
  { allowFontScaling, maxFontSizeMultiplier }: TextProps,
  systemScale: number,
): number => {
  if (allowFontScaling === false) return 1;
  return maxFontSizeMultiplier && maxFontSizeMultiplier >= 1
    ? Math.min(systemScale, maxFontSizeMultiplier)
    : systemScale;
};

/**
 * The blocks to draw — or, when no formula drew (every one failed to parse,
 * or was empty), the text itself with each failed formula's TeX in its place,
 * the same fallback a paragraph with other formulas gets.
 */
const toBlocks = (source: string, inlineOnly: boolean): Block[] | string => {
  const blocks: Block[] = [];
  const paragraph = (): Piece[] => {
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'paragraph') return last.pieces;
    const pieces: Piece[] = [];
    blocks.push({ kind: 'paragraph', pieces });
    return pieces;
  };

  // A display formula is its own row, so the spaces around it would only
  // indent the text next to it ("…is $$x$$ Which" → "…is" / "Which").
  const pushText = (text: string) => {
    const value = blocks[blocks.length - 1]?.kind === 'display' ? text.trimStart() : text;
    if (value) paragraph().push(value);
  };
  const pushDisplay = (tex: string, math: RenderedMath) => {
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'paragraph') {
      const tail = last.pieces[last.pieces.length - 1];
      if (typeof tail === 'string') {
        const trimmed = tail.trimEnd();
        if (trimmed) last.pieces[last.pieces.length - 1] = trimmed;
        else last.pieces.pop();
      }
      if (last.pieces.length === 0) blocks.pop();
    }
    blocks.push({ kind: 'display', tex, math });
  };

  for (const segment of splitMath(source)) {
    if (segment.kind === 'text') {
      pushText(segment.text);
      continue;
    }
    const display = segment.display && !inlineOnly;
    if (display) {
      const math = renderMath(segment.tex, true);
      if (math) pushDisplay(segment.tex, math);
      else pushText(segment.tex);
      continue;
    }
    // Inline: sentences in `\text{…}` become text that wraps (see splitTextRuns).
    const runs = splitTextRuns(segment.tex);
    const drawn = runs.map((run, index) =>
      run.kind === 'math'
        ? renderMath(spacedAgainstText(run.tex, index > 0, index < runs.length - 1), false)
        : null,
    );
    // The split cut something that only parses whole (`\left( \text{a} \right)`,
    // an environment): draw the formula as one piece, as the admin preview does.
    if (runs.length > 1 && runs.some((run, index) => run.kind === 'math' && !drawn[index])) {
      const whole = renderMath(segment.tex, false);
      if (whole) {
        paragraph().push({ tex: segment.tex, math: whole });
        continue;
      }
    }
    runs.forEach((run, index) => {
      const math = drawn[index];
      if (run.kind === 'text') pushText(run.text);
      else if (math) paragraph().push({ tex: run.tex, math });
      else pushText(run.tex);
    });
  }
  const drew = blocks.some(
    (b) => b.kind === 'display' || b.pieces.some((p) => typeof p !== 'string'),
  );
  // Without a drawn formula there is no display row either, so at most one
  // paragraph of plain strings.
  return drew ? blocks : blocks.flatMap((b) => (b.kind === 'paragraph' ? b.pieces : [])).join('');
};

const svgSize = (math: RenderedMath, em: number) => ({
  width: math.widthEm * em,
  height: math.heightEm * em,
});

/**
 * The line height a paragraph needs for its inline formulas, or `undefined`
 * when they all fit the text's own extent (`x^2`, `a < b`). A fraction reaches
 * higher and lower than the text around it, and the lines open by just that
 * much — otherwise it would overlap the lines next to it.
 */
const lineHeightFor = (pieces: Piece[], em: number, textStyle: TextStyle, fontSize: number) => {
  let above = 0;
  let below = 0;
  for (const piece of pieces) {
    if (typeof piece === 'string') continue;
    above = Math.max(above, (piece.math.heightEm - piece.math.depthEm) * em);
    below = Math.max(below, piece.math.depthEm * em);
  }
  const extra =
    Math.max(0, above - TEXT_ASCENT * fontSize) + Math.max(0, below - TEXT_DESCENT * fontSize);
  if (extra <= 0) return undefined;
  return (textStyle.lineHeight ?? fontSize * DEFAULT_LINE_HEIGHT) + extra;
};

type FormulaProps = { tex: string; math: RenderedMath; em: number; color?: string };

const InlineFormula: React.FC<FormulaProps> = ({ tex, math, em, color }) => (
  <View
    testID="math-inline"
    accessible
    accessibilityLabel={tex}
    // An inline view sits with its bottom on the baseline; move it down by the
    // formula's depth so the formula's own baseline lines up with the text's.
    style={[svgSize(math, em), { transform: [{ translateY: math.depthEm * em }] }]}
  >
    <SvgAst ast={math.ast} override={{ ...svgSize(math, em), color }} />
  </View>
);

const DisplayFormula: React.FC<FormulaProps> = ({ tex, math, em, color }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.displayRow}
    testID="math-display"
  >
    <View accessible accessibilityLabel={tex} style={svgSize(math, em)}>
      <SvgAst ast={math.ast} override={{ ...svgSize(math, em), color }} />
    </View>
  </ScrollView>
);

const MathText: React.FC<MathTextProps> = ({
  children,
  style,
  numberOfLines,
  inline = false,
  ...textProps
}) => {
  const { fontScale } = useWindowDimensions();
  const source = children ?? '';
  const inlineOnly = inline || numberOfLines !== undefined;
  const blocks = useMemo(
    () => (mayContainMath(source) ? toBlocks(source, inlineOnly) : source),
    [source, inlineOnly],
  );

  if (typeof blocks === 'string') {
    return (
      <Text style={style} numberOfLines={numberOfLines} {...textProps}>
        {blocks}
      </Text>
    );
  }

  const { flat, layout, text: textStyle } = splitStyle(style);
  const fontSize = flat.fontSize ?? DEFAULT_FONT_SIZE;
  // Style units, which RN itself scales with the system font size (lineHeight
  // included); the SVGs are drawn at `em`, already scaled.
  const styleEm = fontSize * MATH_SCALE;
  const em = styleEm * fontScaleFor(textProps, fontScale);
  const color = typeof flat.color === 'string' ? flat.color : undefined;

  const renderParagraph = (pieces: Piece[], key: number, paragraphStyle: StyleProp<TextStyle>) => {
    const lineHeight = lineHeightFor(pieces, styleEm, flat, fontSize);
    return (
      <Text
        key={key}
        style={[paragraphStyle, lineHeight !== undefined && { lineHeight }]}
        numberOfLines={numberOfLines}
        {...(blocks.length === 1 ? textProps : undefined)}
      >
        {pieces.map((piece, index) =>
          typeof piece === 'string' ? (
            piece
          ) : (
            <InlineFormula key={index} tex={piece.tex} math={piece.math} em={em} color={color} />
          ),
        )}
      </Text>
    );
  };

  if (blocks.length === 1 && blocks[0].kind === 'paragraph') {
    return renderParagraph(blocks[0].pieces, 0, style);
  }

  return (
    <View style={layout} testID={textProps.testID}>
      {blocks.map((block, index) =>
        block.kind === 'paragraph' ? (
          renderParagraph(block.pieces, index, textStyle)
        ) : (
          <DisplayFormula key={index} tex={block.tex} math={block.math} em={em} color={color} />
        ),
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  displayRow: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});

export default memo(MathText);
