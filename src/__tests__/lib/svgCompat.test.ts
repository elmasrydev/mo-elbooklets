import { normalizeSvgXml } from '../../utils/svgCompat';

// Shapes copied from the backend's September 2026 mind-map generator output, plus the
// quiz-image shapes the code review of 2026-09-14 caught the first version of these rules
// mangling (regressions — keep them).
describe('normalizeSvgXml', () => {
  // Regression: CoreImage filter rendering on the main thread froze the lesson
  // screen for seconds per draw (profiled on the simulator, 2026-09-14).
  it('drops filter definitions and every reference to them', () => {
    const xml =
      '<svg><defs><filter id="shadow" x="-10%" y="-20%"><feDropShadow dx="0" dy="3" stdDeviation="4"/></filter></defs>' +
      '<rect x="1" filter="url(#shadow)" fill="#fff"/><circle r="4" filter=\'url(#shadow)\'/></svg>';
    expect(normalizeSvgXml(xml)).toBe(
      '<svg><defs></defs><rect x="1" fill="#fff"/><circle r="4"/></svg>',
    );
  });

  it.each([
    [
      'filter',
      '<svg><defs><filter id="a"/></defs><g><rect/><text>Label</text></g><defs><filter id="b"><feDropShadow/></filter></defs></svg>',
      '<svg><defs></defs><g><rect/><text>Label</text></g><defs></defs></svg>',
    ],
    [
      'style',
      '<svg><style/><rect/><text>Label</text><style>.a{}</style></svg>',
      '<svg><rect/><text>Label</text></svg>',
    ],
  ])(
    'drops a self-closing %s without swallowing the drawing up to the next one',
    (_tag, xml, expected) => {
      expect(normalizeSvgXml(xml)).toBe(expected);
    },
  );

  it('drops the embedded-font style block, which react-native-svg cannot use', () => {
    const xml =
      '<svg><defs><style>@font-face{font-family:"Cairo";src:url(data:font/ttf;base64,AAAA)}</style></defs><rect/></svg>';
    expect(normalizeSvgXml(xml)).toBe('<svg><defs></defs><rect/></svg>');
  });

  it('drops every style block, including multi-line ones with attributes', () => {
    const xml = '<svg><style type="text/css">\n.a{fill:red}\n</style><g/><STYLE>x</STYLE></svg>';
    expect(normalizeSvgXml(xml)).toBe('<svg><g/></svg>');
  });

  it('decodes the apostrophe and greater-than entities the parser would show literally in text', () => {
    expect(normalizeSvgXml('<text>it&apos;s &gt; 3 &#39;a&#39;</text>')).toBe(
      "<text>it's > 3 'a'</text>",
    );
  });

  it('merges adjacent bare spans so a mixed-direction label shapes as one run', () => {
    const xml =
      '<text><tspan x="1587" y="155"><tspan>‏ خطًا‏</tspan><tspan>‎360‎</tspan><tspan>‏عددها ‏</tspan></tspan></text>';
    expect(normalizeSvgXml(xml)).toBe(
      '<text><tspan x="1587" y="155"><tspan>‏ خطًا‏‎360‎‏عددها ‏</tspan></tspan></text>',
    );
  });

  it.each([' ', '\n    '])(
    'collapses %j between merged spans to one space, as a browser does',
    (gap) => {
      expect(normalizeSvgXml(`<tspan>a</tspan>${gap}<tspan>b</tspan>`)).toBe('<tspan>a b</tspan>');
    },
  );

  it.each([
    [
      'positioned lines',
      '<text><tspan x="10" y="20">first</tspan><tspan x="10" y="44">second</tspan></text>',
    ],
    [
      'a styled span followed by a bare one',
      '<text><tspan font-weight="bold">Note:</tspan><tspan> rest</tspan></text>',
    ],
    ['entities that would break the markup', '<text>a &lt; b &amp; "c" &quot;d&quot;</text>'],
    [
      'an apostrophe entity inside a single-quoted attribute',
      "<text font-family='Nunito&apos;s Sans'>A</text>",
    ],
    ['the word filter= inside a label', '<text>Set filter="none" first</text>'],
    [
      'look-alike attributes such as filterUnits',
      '<svg><mask filterUnits="userSpaceOnUse"/></svg>',
    ],
    [
      'a map from the older generator',
      '<svg viewBox="0 0 1800 900"><text text-anchor="middle"><tspan x="900" y="80">موقع مصر</tspan></text></svg>',
    ],
  ])('leaves %s untouched', (_case, xml) => {
    expect(normalizeSvgXml(xml)).toBe(xml);
  });
});
