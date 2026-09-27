/**
 * cdd3-T10 (S-6): the strictuml sharp-corner folder `UPolygon`
 * (`USymbolFolder#drawFolder`, roundCorner == 0) resolves its stroke colour
 * like every other klimt shape -- `SvgGraphics#setStrokeColor` writes the
 * resolved hex (`klimt/drawing/svg/SvgGraphics.java`), so guxode-39-
 * dobi371's `skinparam package { borderColor White }` draws `stroke:#FFF`.
 */
import { describe, it, expect } from 'vitest';
import { renderFolderPolygon } from '../../../src/diagrams/class/class-namespace-folder-outline.js';

const POINTS: ReadonlyArray<[number, number]> = [
  [290, 108],
  [305.363, 108],
  [290, 108],
];

describe('renderFolderPolygon stroke resolution (guxode-39-dobi371)', () => {
  it('resolves a named colour to its shortened hex (jar: stroke:#FFF)', () => {
    expect(renderFolderPolygon(POINTS, 'White', 1.5, 'none')).toContain(
      'style="stroke:#FFF;stroke-width:1.5;stroke-linejoin:miter;stroke-miterlimit:10;"',
    );
  });

  it('still shortens a plain #RRGGBB stroke', () => {
    expect(renderFolderPolygon(POINTS, '#181818', 1.5, 'none')).toContain('stroke:#181818;');
    expect(renderFolderPolygon(POINTS, '#FF0000', 1.5, 'none')).toContain('stroke:#F00;');
  });
});
