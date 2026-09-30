/**
 * cdd6 T3f (fokudi-24-limo685): `FolderTabPaint.strokeDasharray` -- the
 * empty-package leaf's `style.getStroke(colors)` carries the LineStyle dash
 * (`EntityImageEmptyPackage.java:108`), which `USymbolFolder#drawFolder`
 * applies to BOTH the outline and the tab line (jar fokudi: `stroke-dasharray:
 * 7,7` on the `<path>` and the `<line>`; `SvgGraphics#styleMe` order
 * stroke, width, dasharray, then the polygon's own suffix).
 */
import { describe, it, expect } from 'vitest';
import {
  renderFolderTabShape,
  type FolderTabPaint,
} from '../../../src/diagrams/class/class-namespace-folder-outline.js';
import type { NamespaceGeo } from '../../../src/diagrams/class/layout.js';

// fokudi's leaf geometry (jar: path M8.5,6 ... L86.725,51.5; tab line y=26).
const GEO = { x: 6, y: 6, wtitle: 66.725, htitle: 20, width: 80.725, height: 48 } as unknown as NamespaceGeo;
const PAINT: FolderTabPaint = {
  strictUml: false,
  border: '#181818',
  strokeWidth: 0.5,
  fill: '#F1F1F1',
  roundCorner: 5,
  marginX3: 7,
  strokeDasharray: '7,7',
};

describe('renderFolderTabShape dash (fokudi-24-limo685)', () => {
  it('dashes the outline path and the tab line', () => {
    const { outline, hline } = renderFolderTabShape(GEO, PAINT);
    // `path()`/`line()` emit presentation attributes; the comparator reads
    // them against the jar's `style=` form.
    expect(outline).toContain('stroke="#181818" stroke-width="0.5" stroke-dasharray="7,7"/>');
    expect(hline).toBe(
      '<line x1="6" y1="26" x2="79.725" y2="26" stroke="#181818" stroke-width="0.5" stroke-dasharray="7,7"/>',
    );
  });

  it('dashes the strictuml polygon before its linejoin suffix', () => {
    const { outline } = renderFolderTabShape(GEO, { ...PAINT, strictUml: true });
    expect(outline).toContain('style="stroke:#181818;stroke-width:0.5;stroke-dasharray:7,7;stroke-linejoin:miter;');
  });

  it('draws no dash when the paint carries none', () => {
    const { strokeDasharray: _unused, ...plain } = PAINT;
    const { outline, hline } = renderFolderTabShape(GEO, plain);
    expect(outline + hline).not.toContain('dasharray');
  });
});
