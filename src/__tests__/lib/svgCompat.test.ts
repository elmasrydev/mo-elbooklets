import { normalizeSvgXml } from '../../utils/svgCompat';

// Shapes copied from the backend's September 2026 mind-map generator output.
describe('normalizeSvgXml', () => {
  it('drops the embedded-font style block, which react-native-svg cannot use', () => {
    const xml =
      '<svg><defs><style>@font-face{font-family:"Cairo";src:url(data:font/ttf;base64,AAAA)}</style></defs><rect/></svg>';
    expect(normalizeSvgXml(xml)).toBe('<svg><defs></defs><rect/></svg>');
  });

  it('drops every style block, including multi-line ones with attributes', () => {
    const xml = '<svg><style type="text/css">\n.a{fill:red}\n</style><g/><STYLE>x</STYLE></svg>';
    expect(normalizeSvgXml(xml)).toBe('<svg><g/></svg>');
  });

  it('decodes the apostrophe and greater-than entities the parser would show literally', () => {
    expect(normalizeSvgXml('<text>it&apos;s &gt; 3 &#39;a&#39;</text>')).toBe(
      "<text>it's > 3 'a'</text>",
    );
  });

  it('leaves entities that would break the markup untouched', () => {
    const xml = '<text>a &lt; b &amp; "c" &quot;d&quot;</text>';
    expect(normalizeSvgXml(xml)).toBe(xml);
  });

  it('merges adjacent attribute-less spans so a mixed-direction label shapes as one run', () => {
    const xml =
      '<text><tspan x="1587" y="155"><tspan>‏ خطًا‏</tspan><tspan>‎360‎</tspan><tspan>‏عددها ‏</tspan></tspan></text>';
    expect(normalizeSvgXml(xml)).toBe(
      '<text><tspan x="1587" y="155"><tspan>‏ خطًا‏‎360‎‏عددها ‏</tspan></tspan></text>',
    );
  });

  it('keeps whitespace between merged spans, since inside text it is a real space', () => {
    expect(normalizeSvgXml('<tspan>a</tspan> <tspan>b</tspan>')).toBe('<tspan>a b</tspan>');
  });

  it('never merges positioned spans — they are separate lines', () => {
    const xml =
      '<text><tspan x="10" y="20">first</tspan><tspan x="10" y="44">second</tspan></text>';
    expect(normalizeSvgXml(xml)).toBe(xml);
  });

  it('is a no-op on a map from the older generator', () => {
    const xml =
      '<svg viewBox="0 0 1800 900"><text text-anchor="middle"><tspan x="900" y="80">موقع مصر</tspan></text></svg>';
    expect(normalizeSvgXml(xml)).toBe(xml);
  });
});
