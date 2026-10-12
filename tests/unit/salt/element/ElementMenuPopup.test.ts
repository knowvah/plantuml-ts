/**
 * `ElementMenuPopup` (ElementMenuPopup.java:50-96) against the 1.2026.8beta1
 * jar, deterministic text on (`scripts/oracle-render.sh`):
 *
 * - `fixtures/menu-bar-popups.puml` — the File popup (`Open | - | Save`) is
 *   drawn by `ElementMenuBar` at (6, 18) into its own preferred dimension
 *   (ElementMenuBar.java:126-127): `<rect x="6" y="18" width="29.325"
 *   height="29">`, `Open`, the separator line at 18 + 12 + 5/2 = 32.5, `Save`.
 */
import { describe, expect, it } from 'vitest';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { ElementMenuPopup } from '../../../../src/diagrams/salt/element/ElementMenuPopup.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawAt, groupsByRect, jarShapes, shapes } from './menu-tab-test-support.js';

/** Where the jar's bar placed the File popup: cell (6, 6) + bar height 12. */
const FILE_POPUP = { dx: 6, dy: 18 };

function popup(...entries: string[]): ElementMenuPopup {
  const p = new ElementMenuPopup(FONT_12, new SaltDictionary());
  for (const e of entries) p.addEntry(e);
  return p;
}

/** The jar's File popup: the z-index 1 group whose background sits at x 6. */
function jarFilePopup(): string[] {
  const group = groupsByRect(jarShapes('menu-bar-popups').slice(5)).find((g) => g[0]?.includes('x="6" y="18"'));
  if (group === undefined) throw new Error('fixture lost the File popup');
  return group;
}

describe('ElementMenuPopup#getPreferredDimension (java:65-74)', () => {
  it('is the widest entry by the summed heights: 29.325 x 29 for Open | - | Save', () => {
    const dim = popup('Open', '-', 'Save').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(29.325, 3);
    expect(dim.getHeight()).toBe(29);
  });

  it('is 0 x 0 with no entries', () => {
    const dim = popup().getPreferredDimension(stringBounder, 0, 0);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([0, 0]);
  });
});

describe('ElementMenuPopup#drawU (java:76-94)', () => {
  it('draws the jar File popup at z-index 1 into its preferred dimension', () => {
    const p = popup('Open', '-', 'Save');
    const dim = p.getPreferredDimension(stringBounder, 6, 18);
    expect(shapes(drawAt(p, FILE_POPUP, dim, [1]))).toEqual(jarFilePopup());
  });

  it('spans the separator line over dimToUse, not the preferred width (java:88)', () => {
    const svg = drawAt(popup('Open', '-', 'Save'), FILE_POPUP, new XDimension2D(50, 29), [1]);
    expect(shapes(svg)[2]).toBe('<line x1="6" y1="32.5" x2="56" y2="32.5" style="stroke:#000;stroke-width:1;"/>');
  });

  it('draws nothing at z-index 0 (java:77-78)', () => {
    expect(shapes(drawAt(popup('Open'), FILE_POPUP, new XDimension2D(30, 12), [0]))).toEqual([]);
  });
});
