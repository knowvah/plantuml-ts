/**
 * `ElementMenuBar` (ElementMenuBar.java:51-131) against the 1.2026.8beta1
 * jar, deterministic text on (`scripts/oracle-render.sh`), each bar the only
 * cell of a borderless pyramid (`menu-tab-test-support.ts`):
 *
 * - `fixtures/menu-bar-popups.puml` — `File | Edit | - | Source` with popups
 *   under File, Source and Edit. Bar background `129.15` = preferred 128.15
 *   (19.425 + 20.7 + 10 + 38.025 + 4 x 10) + 1.
 * - `fixtures/menu-bar-order.puml` — `File | Edit`, Edit's popup added first.
 * - `fixtures/menu-bar-missing.puml` — a sub-entry under `C`, which is no bar
 *   entry: the jar crashes in `getElementMenuEntry` (ElementMenuBar.java:87).
 *
 * Popup draw order: upstream keeps popups in a `HashMap` keyed by entries
 * with identity hash codes (java:54), so the jar's z-index 1 order varies
 * run to run (four renders of `menu-bar-popups` drew Source/Edit/File,
 * File/Source/Edit, Source/Edit/File, Source/File/Edit). The tests compare
 * the popups as a set; the port's order is insertion order.
 */
import { describe, expect, it } from 'vitest';
import { ElementMenuBar } from '../../../../src/diagrams/salt/element/ElementMenuBar.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawInCell, groupsByRect, jarShapes, jarSvg, shapes } from './menu-tab-test-support.js';

/** The bar's z-index 0 output in `menu-bar-popups`: background + 4 entries. */
const POPUPS_Z0 = 5;
/** The bar's z-index 0 output in `menu-bar-order`: background + 2 entries. */
const ORDER_Z0 = 3;

function bar(entries: readonly string[], subs: readonly (readonly [string, string])[] = []): ElementMenuBar {
  const b = new ElementMenuBar(FONT_12, new SaltDictionary());
  for (const e of entries) b.addEntry(e);
  for (const [s, sub] of subs) b.addSubEntry(s, sub);
  return b;
}

/** The `menu-bar-popups` bar, built in the order `ElementFactoryMenu` feeds it. */
function popupsBar(): ElementMenuBar {
  return bar(
    ['File', 'Edit', '-', 'Source'],
    [
      ['File', 'Open'],
      ['File', '-'],
      ['File', 'Save'],
      ['Source', 'Build'],
      ['Edit', 'Copy'],
    ],
  );
}

function sorted(groups: string[][]): string[] {
  return groups.map((g) => g.join('\n')).sort();
}

describe('ElementMenuBar#getPreferredDimension (java:90-99)', () => {
  it('sums entry widths + 10 each and keeps the tallest: 128.15 x 12', () => {
    const dim = popupsBar().getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(128.15, 3);
    expect(dim.getHeight()).toBe(12);
  });

  it('is 0 x 0 with no entries', () => {
    const dim = bar([]).getPreferredDimension(stringBounder, 0, 0);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([0, 0]);
  });
});

describe('ElementMenuBar#drawU at z-index 0 (java:107-116)', () => {
  it('paints the dimToUse background and the entries 10 apart, as the jar does', () => {
    expect(shapes(drawInCell(popupsBar(), [0]))).toEqual(jarShapes('menu-bar-popups').slice(0, POPUPS_Z0));
  });
});

describe('ElementMenuBar#drawU at z-index 1 (java:118-130)', () => {
  it('draws every popup under its entry, below the bar (the jar popups, as a set)', () => {
    const port = groupsByRect(shapes(drawInCell(popupsBar())).slice(POPUPS_Z0));
    const jar = groupsByRect(jarShapes('menu-bar-popups').slice(POPUPS_Z0));
    expect(port).toHaveLength(3);
    expect(sorted(port)).toEqual(sorted(jar));
  });

  it('draws the popups in insertion order', () => {
    const b = bar(
      ['File', 'Edit'],
      [
        ['Edit', 'Copy'],
        ['File', 'New'],
      ],
    );
    const port = shapes(drawInCell(b));
    expect(port.slice(0, ORDER_Z0)).toEqual(jarShapes('menu-bar-order').slice(0, ORDER_Z0));
    expect(port.slice(ORDER_Z0)).toEqual(jarShapes('menu-bar-order').slice(ORDER_Z0));
  });

  it('places a popup at x 0 when z-index 0 never ran setX (java:113, 127)', () => {
    const port = shapes(drawInCell(bar(['File', 'Edit'], [['Edit', 'Copy']]), [1]));
    expect(port[0]).toBe(
      '<rect x="6" y="18" width="28.05" height="12" fill="#DDD" style="stroke:#000;stroke-width:1;"/>',
    );
  });

  it('turns every popup owner #BBB, seen only if z-index 0 is drawn again (java:119-120)', () => {
    const rects = shapes(drawInCell(popupsBar(), [0, 1, 0]))
      .slice(POPUPS_Z0)
      .filter((s) => s.includes('fill="#BBB"'));
    expect(rects).toEqual([
      '<rect x="6" y="6" width="19.425" height="12" fill="#BBB" style="stroke:#000;stroke-width:1;"/>',
      '<rect x="35.425" y="6" width="20.7" height="12" fill="#BBB" style="stroke:#000;stroke-width:1;"/>',
      '<rect x="86.125" y="6" width="38.025" height="12" fill="#BBB" style="stroke:#000;stroke-width:1;"/>',
    ]);
  });

  it('draws nothing at z-index 2', () => {
    expect(shapes(drawInCell(popupsBar(), [2]))).toEqual([]);
  });
});

describe('ElementMenuBar#addSubEntry (java:67-88)', () => {
  it('throws IllegalArgumentException for a sub-entry under no bar entry, as the jar crashes', () => {
    expect(jarSvg('menu-bar-missing')).toContain('ElementMenuBar.getElementMenuEntry(ElementMenuBar.java:87)');
    expect(() => bar(['A', 'B'], [['C', 'x']])).toThrow('IllegalArgumentException');
  });

  it('matches the first entry with equal text', () => {
    const b = bar(['File', 'File'], [['File', 'Open']]);
    const port = shapes(drawInCell(b));
    expect(port.at(-2)).toBe(
      '<rect x="6" y="18" width="29.325" height="12" fill="#DDD" style="stroke:#000;stroke-width:1;"/>',
    );
  });
});
