import { hasMindMap, resolveMindMapKind, SVG_MIME_TYPE } from '../../utils/mindMap';

describe('resolveMindMapKind', () => {
  it('routes an AI-generated map to the SVG renderer', () => {
    expect(
      resolveMindMapKind('https://api.example.com/storage/104/l-1-mindmap.svg', SVG_MIME_TYPE),
    ).toBe('svg');
  });

  it('routes editor-uploaded rasters to the image renderer', () => {
    for (const mime of ['image/png', 'image/jpeg', 'image/gif', 'image/webp']) {
      expect(resolveMindMapKind('https://api.example.com/map.png', mime)).toBe('raster');
    }
  });

  it('reports none when there is no map, so the section can be skipped entirely', () => {
    expect(resolveMindMapKind(null, null)).toBe('none');
    expect(resolveMindMapKind(undefined, undefined)).toBe('none');
    expect(resolveMindMapKind('', SVG_MIME_TYPE)).toBe('none');
    expect(resolveMindMapKind('   ', SVG_MIME_TYPE)).toBe('none');
  });

  // Payloads cached before mindMapMimeType existed carry a URL and no mime.
  it('falls back to raster for an unknown or missing mime type', () => {
    expect(resolveMindMapKind('https://api.example.com/map.png', null)).toBe('raster');
    expect(resolveMindMapKind('https://api.example.com/map.png', undefined)).toBe('raster');
    expect(resolveMindMapKind('https://api.example.com/map.png', 'application/octet-stream')).toBe(
      'raster',
    );
  });

  it('compares the mime type, never the file extension', () => {
    // A generated map served from a route with no .svg suffix must still be SVG…
    expect(resolveMindMapKind('https://api.example.com/storage/104', SVG_MIME_TYPE)).toBe('svg');
    // …and a .svg-looking URL declared as a raster must not reach SvgUri.
    expect(resolveMindMapKind('https://api.example.com/not-really.svg', 'image/png')).toBe(
      'raster',
    );
  });

  it('tolerates casing and stray whitespace from the server', () => {
    expect(resolveMindMapKind('https://x/y', ' Image/SVG+XML ')).toBe('svg');
  });
});

describe('hasMindMap', () => {
  it('is true only when something is renderable', () => {
    expect(hasMindMap('https://x/y.svg', SVG_MIME_TYPE)).toBe(true);
    expect(hasMindMap('https://x/y.png', 'image/png')).toBe(true);
    expect(hasMindMap(null, null)).toBe(false);
  });
});
