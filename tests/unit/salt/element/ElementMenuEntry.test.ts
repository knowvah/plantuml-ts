/**
 * `ElementMenuEntry` (ElementMenuEntry.java:50-98) against the 1.2026.8beta1
 * jar, deterministic text on (`scripts/oracle-render.sh`):
 *
 * - `fixtures/menu-bar-popups.puml` — a bar `File | Edit | - | Source` and
 *   popups under File (`Open | - | Save`), Source (`Build`), Edit (`Copy`).
 *   The `Open` popup background is `29.325` wide (its widest entry) and the
 *   File popup is `29` high: 12 + 5 (the `-` entry, java:64-66) + 12.
 */
import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { ElementMenuEntry } from '../../../../src/diagrams/salt/element/ElementMenuEntry.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { CELL, drawAt, jarShapes, shapes } from './menu-tab-test-support.js';

function entry(text: string): ElementMenuEntry {
  return new ElementMenuEntry(text, FONT_12, new SaltDictionary());
}

/** `#BBB`, the colour `AbstractElement#getColorBB` builds (AbstractElement.java:59-61). */
function colorBB(): HColorSimple {
  const color = HColorSet.instance().getColorOrWhite('#B');
  if (!(color instanceof HColorSimple)) throw new Error('#B is not a simple colour');
  return color;
}

function draw(e: ElementMenuEntry, zIndex = 0): string[] {
  return shapes(drawAt(e, CELL, new XDimension2D(100, 50), [zIndex]));
}

describe('ElementMenuEntry#getPreferredDimension (java:63-68)', () => {
  it('measures "Open" as the jar popup does: 29.325 x 12', () => {
    const dim = entry('Open').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(29.325, 3);
    expect(dim.getHeight()).toBe(12);
  });

  it('is 10 x 5 for the separator "-" (java:64-66)', () => {
    const dim = entry('-').getPreferredDimension(stringBounder, 3, 4);
    expect(dim.getWidth()).toBe(10);
    expect(dim.getHeight()).toBe(5);
  });
});

describe('ElementMenuEntry#drawU (java:70-77)', () => {
  it('draws the jar <text> for "File" at the cell origin, with no background', () => {
    expect(draw(entry('File'))).toEqual([jarShapes('menu-bar-popups')[1]]);
  });

  it('draws at every z-index (java:70 has no zIndex test)', () => {
    expect(draw(entry('File'), 1)).toEqual(draw(entry('File'), 0));
  });

  it('draws the "-" text itself; only a popup turns it into a line', () => {
    expect(draw(entry('-'))).toEqual([jarShapes('menu-bar-popups')[3]?.replace('66.125', '6')]);
  });

  it('paints the background first at the preferred dimension when one is set (java:72-75)', () => {
    const e = entry('Open');
    const bb = colorBB();
    e.setBackground(bb);
    expect(draw(e)).toEqual([
      '<rect x="6" y="6" width="29.325" height="12" fill="#BBB" style="stroke:#000;stroke-width:1;"/>',
      '<text x="6" y="15.333" fill="#000" font-size="12" textLength="29.325">Open</text>',
    ]);
  });
});

describe('ElementMenuEntry accessors (java:79-97)', () => {
  it('starts at x 0 with no background', () => {
    const e = entry('Edit');
    expect(e.getX()).toBe(0);
    expect(e.getBackground()).toBeUndefined();
  });

  it('round-trips x, background and text', () => {
    const e = entry('Edit');
    const bb = colorBB();
    e.setX(35.425);
    e.setBackground(bb);
    expect(e.getX()).toBe(35.425);
    expect(e.getBackground()).toBe(bb);
    expect(e.getText()).toBe('Edit');
  });
});
