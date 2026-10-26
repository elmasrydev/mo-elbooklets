import { renderMath } from '../../lib/mathRenderer';

// Runs the real MathJax: the conversion is plain JS, so Node renders exactly
// what the app will.
describe('renderMath', () => {
  it('sizes a fraction from its viewBox, reaching below the baseline', () => {
    const math = renderMath('\\frac{1}{2}', false);

    expect(math).not.toBeNull();
    expect(math!.widthEm).toBeGreaterThan(0);
    // A fraction's denominator hangs below the baseline, but not the whole height.
    expect(math!.depthEm).toBeGreaterThan(0);
    expect(math!.depthEm).toBeLessThan(math!.heightEm);
  });

  it('draws a display formula differently from the same TeX inline', () => {
    const inline = renderMath('\\sum_{i=1}^{n} i', false)!;
    const display = renderMath('\\sum_{i=1}^{n} i', true)!;

    // Display style stacks the limits above and below the sum.
    expect(display.heightEm).toBeGreaterThan(inline.heightEm);
  });

  it.each([
    ['a missing brace', '\\frac{1}{'],
    ['an unknown macro', '\\notamacro{x}'],
  ])('returns null for %s, so the source is shown instead', (_case, tex) => {
    expect(renderMath(tex, false)).toBeNull();
  });

  it('keeps a definition inside its own formula, as KaTeX does', () => {
    // Defined and used in one formula: fine.
    expect(renderMath('\\newcommand{\\R}{\\mathbb{R}} x \\in \\R', false)).not.toBeNull();
    // Gone for the next formula…
    expect(renderMath('y \\in \\R', false)).toBeNull();
    // …and a redefinition does not break later ones (`\frac{3}` alone would fail).
    renderMath('\\let\\sqrt\\frac', false);
    expect(renderMath('\\sqrt{3}', false)).not.toBeNull();
  });

  it('accepts the same label in two formulas', () => {
    expect(renderMath('a \\label{eq}', true)).not.toBeNull();
    expect(renderMath('b \\label{eq}', true)).not.toBeNull();
  });

  it.each(['30\\degree', '\\sqrt[3]{x}', '\\cancel{x}', '\\color{red}{x}', '\\dfrac{a}{b}'])(
    'renders %s, a macro KaTeX editors use for school math',
    (tex) => {
      expect(renderMath(tex, false)).not.toBeNull();
    },
  );
});
