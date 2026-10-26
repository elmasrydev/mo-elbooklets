import {
  spacedAgainstText,
  splitAtBreaks,
  splitMath,
  splitTextRuns,
} from '../../utils/mathSegments';

// Expected splits follow KaTeX auto-render's splitAtDelimiters — the admin
// panel's preview — for the four delimiters it is configured with.
describe('splitMath', () => {
  it('returns text without delimiters as one text segment', () => {
    expect(splitMath('Adding c to both sides keeps a < b.')).toEqual([
      { kind: 'text', text: 'Adding c to both sides keeps a < b.' },
    ]);
  });

  it.each([
    ['$x^2$', 'x^2', false],
    ['\\(x^2\\)', 'x^2', false],
    ['$$x^2$$', 'x^2', true],
    ['\\[x^2\\]', 'x^2', true],
  ])('reads %s as a formula', (source, tex, display) => {
    expect(splitMath(source)).toEqual([{ kind: 'math', tex, display }]);
  });

  it('keeps the text around a formula, in Arabic too', () => {
    expect(splitMath('إذا كان $a < b$ فإن $a + c < b + c$')).toEqual([
      { kind: 'text', text: 'إذا كان ' },
      { kind: 'math', tex: 'a < b', display: false },
      { kind: 'text', text: ' فإن ' },
      { kind: 'math', tex: 'a + c < b + c', display: false },
    ]);
  });

  it('opens $$ as display math, not as an empty inline formula', () => {
    expect(splitMath('Solve $$x = \\frac{-b}{2a}$$ now')).toEqual([
      { kind: 'text', text: 'Solve ' },
      { kind: 'math', tex: 'x = \\frac{-b}{2a}', display: true },
      { kind: 'text', text: ' now' },
    ]);
  });

  it('does not close a formula on a delimiter inside braces or after a backslash', () => {
    expect(splitMath('$\\text{costs $5}$ and $a\\$b$')).toEqual([
      { kind: 'math', tex: '\\text{costs $5}', display: false },
      { kind: 'text', text: ' and ' },
      { kind: 'math', tex: 'a\\$b', display: false },
    ]);
  });

  it('keeps a formula spread over several lines', () => {
    expect(splitMath('$$a\n= b$$')).toEqual([{ kind: 'math', tex: 'a\n= b', display: true }]);
  });

  it('leaves an unclosed delimiter as plain text', () => {
    expect(splitMath('Costs $5 today')).toEqual([{ kind: 'text', text: 'Costs $5 today' }]);
    expect(splitMath('$x$ then \\(y')).toEqual([
      { kind: 'math', tex: 'x', display: false },
      { kind: 'text', text: ' then \\(y' },
    ]);
  });

  it('drops an empty formula, which draws nothing in KaTeX either', () => {
    expect(splitMath('a $$ $$ b')).toEqual([{ kind: 'text', text: 'a  b' }]);
  });
});

// Shapes copied from production Math explanations (Grade 5, 2026-09-28), which
// wrap whole sentences in `\text{…}` inside one inline formula.
describe('splitTextRuns', () => {
  it('turns a sentence in \\text into text, so it can wrap', () => {
    expect(splitTextRuns(' \\text{A thousandth is one part of 1,000 equal pieces.} ')).toEqual([
      { kind: 'text', text: 'A thousandth is one part of 1,000 equal pieces.' },
    ]);
  });

  it('keeps the math between text groups as math', () => {
    expect(
      splitTextRuns(' \\text{ gas prices like } 6.75 \\text{ LE, which are decimal numbers.} '),
    ).toEqual([
      { kind: 'text', text: ' gas prices like ' },
      { kind: 'math', tex: '6.75' },
      { kind: 'text', text: ' LE, which are decimal numbers.' },
    ]);
  });

  it('leaves a formula without \\text, or with \\text inside a group, as one piece of math', () => {
    expect(splitTextRuns('6.75')).toEqual([{ kind: 'math', tex: '6.75' }]);
    expect(splitTextRuns('\\frac{\\text{apples}}{2}')).toEqual([
      { kind: 'math', tex: '\\frac{\\text{apples}}{2}' },
    ]);
  });

  it('draws \\text as TeX does: escapes unescaped, bare braces dropped, spaces collapsed', () => {
    expect(splitTextRuns('\\text{50\\% of {the}\n  price}')).toEqual([
      { kind: 'text', text: '50% of the price' },
    ]);
  });

  it('leaves as math a \\text that is a script argument or holds commands or $…$', () => {
    expect(splitTextRuns('v_\\text{max} = 5')).toEqual([
      { kind: 'math', tex: 'v_\\text{max} = 5' },
    ]);
    expect(splitTextRuns('\\text{area $\\pi r^2$}')).toEqual([
      { kind: 'math', tex: '\\text{area $\\pi r^2$}' },
    ]);
    expect(splitTextRuns('\\text{\\textbf{Note}}')).toEqual([
      { kind: 'math', tex: '\\text{\\textbf{Note}}' },
    ]);
  });
});

describe('spacedAgainstText', () => {
  it('keeps the space an edge operator had against the text beside it', () => {
    expect(spacedAgainstText('= 5 +', true, true)).toBe('{}= 5 +{}');
    expect(spacedAgainstText('\\times 3', true, false)).toBe('{}\\times 3');
  });

  it('leaves a formula-edge sign unary and other math unchanged', () => {
    expect(spacedAgainstText('-5', false, true)).toBe('-5');
    expect(spacedAgainstText('6.75', true, true)).toBe('6.75');
    expect(spacedAgainstText('\\timesx', true, false)).toBe('\\timesx');
  });
});

// Where TeX lets a line break inside inline math: after a top-level relation or
// binary operator. The first case is Boki's production square-root answer.
describe('splitAtBreaks', () => {
  it.each([
    [
      '\\sqrt{2} \\sqrt{8} = \\sqrt{(2 \\times 8)} = \\sqrt{16} = 4',
      ['\\sqrt{2} \\sqrt{8} =', '\\sqrt{(2 \\times 8)} =', '\\sqrt{16} =', '4'],
    ],
    ['x^2 + 5x - 36 = 0', ['x^2 +', '5x -', '36 =', '0']],
    ['a \\leq b \\neq c', ['a \\leq', 'b \\neq', 'c']],
  ])('breaks %s after each top-level operator', (tex, chunks) => {
    expect(splitAtBreaks(tex)).toEqual(chunks);
  });

  it.each([
    ['a unary sign', 'x = -3', ['x =', '-3']],
    ['a script argument', 'x^-1 + 2', ['x^-1 +', '2']],
    ['\\left…\\right', '\\left( a + b \\right) = c', ['\\left( a + b \\right) =', 'c']],
    ['an environment', '\\begin{cases} x = 1 \\end{cases}', ['\\begin{cases} x = 1 \\end{cases}']],
    ['a \\right delimiter', '\\left< a \\right> = b', ['\\left< a \\right> =', 'b']],
  ])('never breaks after %s', (_case, tex, chunks) => {
    expect(splitAtBreaks(tex)).toEqual(chunks);
  });

  it.each([
    ['an infix fraction', 'a + b \\over c + d'],
    ['a style switch', '\\displaystyle \\frac{1}{2} = \\frac{2}{4}'],
    ['a colour switch', '\\color{red} x + 1 = 2'],
  ])('keeps a formula with %s whole', (_case, tex) => {
    expect(splitAtBreaks(tex)).toEqual([tex]);
  });

  it('still breaks around a switch scoped by braces', () => {
    expect(splitAtBreaks('{\\color{red} x} + 1 = 2')).toEqual(['{\\color{red} x} +', '1 =', '2']);
  });
});
