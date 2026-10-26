import React, { memo, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
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
  splitAtBreaks,
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
 * An inline formula wider than this (in em of the formula) is drawn in pieces
 * the line can break between (`splitAtBreaks`); a shorter one stays whole.
 */
const BREAKABLE_WIDTH_EM = 5;
/** Lets the line break between two pieces of one formula. */
const ZERO_WIDTH_SPACE = '\u200B';
/**
 * Brackets a split formula's pieces. Each piece is an inline view, which bidi
 * treats as a neutral character: in an Arabic (right-to-left) paragraph a run
 * of them would take the paragraph's direction and the equation would read
 * backwards. Strong left-to-right marks on both sides keep the run in order.
 */
const LEFT_TO_RIGHT_MARK = '\u200e';
/** Keeps a full stop or comma on the line of the formula before it. */
const WORD_JOINER = '\u2060';
const CLOSING_PUNCTUATION = /^[.,;:!?)\]}%،؛؟]/;

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
    if (!value) return;
    const pieces = paragraph();
    const previous = pieces[pieces.length - 1];
    const gluesToFormula =
      previous !== undefined && (typeof previous !== 'string' || previous === LEFT_TO_RIGHT_MARK);
    pieces.push(gluesToFormula && CLOSING_PUNCTUATION.test(value) ? WORD_JOINER + value : value);
  };
  /**
   * A long inline formula goes in as pieces the line can break between; each
   * keeps the spacing its trailing operator had against the next piece
   * (`spacedAgainstText`), while a sign that opens a piece stays unary
   * (`x = -3` → `x =`, `-3`). If a piece does not render alone, the formula
   * goes in whole.
   */
  const pushFormula = (
    tex: string,
    math: RenderedMath,
    textBefore: boolean,
    textAfter: boolean,
  ) => {
    const chunks = math.widthEm > BREAKABLE_WIDTH_EM ? splitAtBreaks(tex) : [tex];
    const drawnChunks = chunks.map((chunk, index) =>
      renderMath(
        spacedAgainstText(chunk, index === 0 && textBefore, textAfter || index < chunks.length - 1),
        false,
      ),
    );
    const pieces = paragraph();
    if (chunks.length < 2 || drawnChunks.some((chunk) => !chunk)) {
      pieces.push({ tex, math });
      return;
    }
    pieces.push(LEFT_TO_RIGHT_MARK);
    drawnChunks.forEach((chunk, index) => {
      if (index > 0) pieces.push(ZERO_WIDTH_SPACE);
      pieces.push({ tex: chunks[index], math: chunk! });
    });
    pieces.push(LEFT_TO_RIGHT_MARK);
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
        pushFormula(segment.tex, whole, false, false);
        continue;
      }
    }
    runs.forEach((run, index) => {
      const math = drawn[index];
      if (run.kind === 'text') pushText(run.text);
      else if (math) pushFormula(run.tex, math, index > 0, index < runs.length - 1);
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
 * for the style's own. RN gives every line of a paragraph the same height, so
 * raising it for one formula spaces out every line (the gaps on Boki's
 * square-root answer). A formula therefore takes only a text line's room
 * (`InlineFormula`) and its ink may use the line's leading — a root or a
 * fraction fits there. Only one that reaches past it (a nested fraction) still
 * opens the lines, by the overshoot.
 */
const lineHeightFor = (pieces: Piece[], em: number, textStyle: TextStyle, fontSize: number) => {
  const lineHeight = textStyle.lineHeight ?? fontSize * DEFAULT_LINE_HEIGHT;
  const leading = Math.max(0, (lineHeight - (TEXT_ASCENT + TEXT_DESCENT) * fontSize) / 2);
  // Above, the ink may also cross into the previous line's descender zone,
  // which holds only the odd descender; below, only into the leading.
  const roomAbove = (TEXT_ASCENT + TEXT_DESCENT) * fontSize + leading;
  const roomBelow = TEXT_DESCENT * fontSize + leading;
  let overshoot = 0;
  for (const piece of pieces) {
    if (typeof piece === 'string') continue;
    const above = (piece.math.heightEm - piece.math.depthEm) * em;
    const below = piece.math.depthEm * em;
    overshoot = Math.max(
      overshoot,
      Math.max(0, above - roomAbove) + Math.max(0, below - roomBelow),
    );
  }
  return overshoot > 0 ? lineHeight + overshoot : undefined;
};

type FormulaProps = { tex: string; math: RenderedMath; em: number; color?: string };

/**
 * An inline view sits with its bottom on the baseline, and its height is what
 * the line makes room for. So the view is at most a text line's ascent tall
 * (`lineAscent`) and the SVG hangs from it: its baseline on the text's, the
 * ink above and below spilling into the leading instead of growing the line.
 */
const InlineFormula: React.FC<FormulaProps & { lineAscent: number }> = ({
  tex,
  math,
  em,
  color,
  lineAscent,
}) => {
  const size = svgSize(math, em);
  const depth = math.depthEm * em;
  return (
    <View
      testID="math-inline"
      accessible
      accessibilityLabel={tex}
      style={{ width: size.width, height: Math.min(size.height - depth, lineAscent) }}
    >
      <View style={[styles.hanging, size, { bottom: -depth }]}>
        <SvgAst ast={math.ast} override={{ ...size, color }} />
      </View>
    </View>
  );
};

const lengthOf = (...values: unknown[]): number => {
  const value = values.find((candidate) => candidate !== undefined);
  return typeof value === 'number' ? value : 0;
};

/** What padding and borders take from a laid-out width, leaving the text's own. */
const horizontalInset = (style: StyleProp<TextStyle>): number => {
  const flat = StyleSheet.flatten(style) ?? {};
  return (
    lengthOf(flat.paddingLeft, flat.paddingStart, flat.paddingHorizontal, flat.padding) +
    lengthOf(flat.paddingRight, flat.paddingEnd, flat.paddingHorizontal, flat.padding) +
    lengthOf(flat.borderLeftWidth, flat.borderStartWidth, flat.borderWidth) +
    lengthOf(flat.borderRightWidth, flat.borderEndWidth, flat.borderWidth)
  );
};

type ParagraphProps = {
  pieces: Piece[];
  style: StyleProp<TextStyle>;
  numberOfLines?: number;
  textProps?: TextProps;
  em: number;
  lineAscent: number;
  color?: string;
};

/**
 * One paragraph of text and inline formulas. A single piece wider than the
 * paragraph (a long fraction, which cannot break) is scaled down to fit once
 * the paragraph's width is known, rather than running past its edge.
 */
const MathParagraph: React.FC<ParagraphProps> = ({
  pieces,
  style,
  numberOfLines,
  textProps,
  em,
  lineAscent,
  color,
}) => {
  // The width a formula has to fit, kept only while one is wider than it: a
  // paragraph whose formulas all fit never re-renders on layout.
  const [width, setWidth] = useState<number>();
  const onLayout = (event: LayoutChangeEvent) => {
    const available = event.nativeEvent.layout.width - horizontalInset(style);
    const widest = pieces.reduce(
      (max, piece) => (typeof piece === 'string' ? max : Math.max(max, piece.math.widthEm * em)),
      0,
    );
    setWidth(widest > available ? available : undefined);
    textProps?.onLayout?.(event);
  };
  return (
    <Text {...textProps} style={style} numberOfLines={numberOfLines} onLayout={onLayout}>
      {pieces.map((piece, index) => {
        if (typeof piece === 'string') return piece;
        const natural = piece.math.widthEm * em;
        const fit = width !== undefined && natural > width ? width / natural : 1;
        return (
          <InlineFormula
            key={index}
            tex={piece.tex}
            math={piece.math}
            em={em * fit}
            color={color}
            lineAscent={lineAscent}
          />
        );
      })}
    </Text>
  );
};

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

  const lineAscent = TEXT_ASCENT * fontSize * (em / styleEm);

  const renderParagraph = (pieces: Piece[], key: number, paragraphStyle: StyleProp<TextStyle>) => {
    const lineHeight = lineHeightFor(pieces, styleEm, flat, fontSize);
    return (
      <MathParagraph
        key={key}
        pieces={pieces}
        style={[paragraphStyle, lineHeight !== undefined && { lineHeight }]}
        numberOfLines={numberOfLines}
        textProps={blocks.length === 1 ? textProps : undefined}
        em={em}
        lineAscent={lineAscent}
        color={color}
      />
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
  hanging: {
    position: 'absolute',
    left: 0,
  },
  displayRow: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});

export default memo(MathText);
