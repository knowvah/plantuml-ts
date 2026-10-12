/**
 * `ElementTabBar` (ElementTabBar.java:50-152) against the 1.2026.8beta1 jar,
 * deterministic text on (`scripts/oracle-render.sh`), each bar the only cell
 * of a borderless pyramid (`menu-tab-test-support.ts`):
 *
 * - `fixtures/tab-horizontal.puml` — `General | <b>Fullscreen | Saving`: each
 *   tab is text + 2 + 3 + 10 wide (margins, java:56-58), so the bar is
 *   42.675 + 55.425 + 36.75 + 3 x 15 = 179.85 wide; the last hline ends at
 *   6 + 179.85 = 185.85.
 * - `fixtures/tab-vertical.puml` — `Tab 1` / `Longer tab` / `T3` on separate
 *   lines (the factory's `setVertical(true)`): the widest tab (57.3) sets
 *   every hline, and the bar is 3 x (12 + 15) = 81 high.
 */
import { describe, expect, it } from 'vitest';
import { ElementTabBar } from '../../../../src/diagrams/salt/element/ElementTabBar.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawInCell, jarShapes, shapes } from './menu-tab-test-support.js';

function tabs(vertical: boolean, ...names: string[]): ElementTabBar {
  const t = new ElementTabBar(FONT_12, new SaltDictionary());
  for (const n of names) t.addTab(n);
  t.setVertical(vertical);
  return t;
}

const horizontal = (): ElementTabBar => tabs(false, 'General', '<b>Fullscreen', 'Saving');
const vertical = (): ElementTabBar => tabs(true, 'Tab 1', 'Longer tab', 'T3');

describe('ElementTabBar#getPreferredDimension (java:72-89, 117-126)', () => {
  it('horizontal: sums text width + 15 per tab, keeps the tallest: 179.85 x 12', () => {
    const dim = horizontal().getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(179.85, 3);
    expect(dim.getHeight()).toBe(12);
  });

  it('vertical: keeps the widest, sums text height + 15 per tab: 57.3 x 81', () => {
    const dim = vertical().getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(57.3, 3);
    expect(dim.getHeight()).toBe(81);
  });
});

describe('ElementTabBar#drawU (java:91-115, 128-142)', () => {
  it('horizontal: draws the jar tabs and their outlines', () => {
    expect(shapes(drawInCell(horizontal()))).toEqual(jarShapes('tab-horizontal'));
  });

  it('vertical: draws the jar tabs and their outlines', () => {
    expect(shapes(drawInCell(vertical()))).toEqual(jarShapes('tab-vertical'));
  });

  it('draws nothing at z-index 1 (java:92-93)', () => {
    expect(shapes(drawInCell(horizontal(), [1]))).toEqual([]);
  });
});

describe('ElementTabBar#isVertical (java:144-150)', () => {
  it('is horizontal until set', () => {
    const t = new ElementTabBar(FONT_12, new SaltDictionary());
    expect(t.isVertical()).toBe(false);
    t.setVertical(true);
    expect(t.isVertical()).toBe(true);
  });
});
