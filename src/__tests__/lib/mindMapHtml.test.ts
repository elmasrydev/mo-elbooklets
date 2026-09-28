import { svgDocument } from '../../utils/mindMapHtml';

const MAP = '<svg viewBox="0 0 1800 940" width="1800" height="940"><text>موقع مصر</text></svg>';

describe('svgDocument', () => {
  it('embeds the SVG exactly as downloaded, so fonts and shadows render as designed', () => {
    expect(svgDocument(MAP, 'preview')).toContain(`<body>${MAP}</body>`);
  });

  it('lets the student zoom the fullscreen viewer up to 5x', () => {
    const html = svgDocument(MAP, 'viewer');
    expect(html).toContain('user-scalable=yes');
    expect(html).toContain('maximum-scale=5');
  });
});
