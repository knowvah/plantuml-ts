/**
 * CDD T6FU (T20 M6 follow-up) — `renderer-classifier-rows.ts#renderRow`
 * carried the SAME wrapped-member visibility-icon bug T20 fixed in
 * `renderer-classifier-box.ts`'s own icon path: it centred the icon on the
 * member's FIRST physical line instead of on the whole wrapped block.
 *
 * `PlacementStrategyVisibility#getPositions` (java:56-69) pairs each
 * member's icon block with its TEXT block and centres BOTH on the pair's
 * own `maxHeight12`:
 *
 *   final double maxHeight12 = Math.max(height1, height2);
 *   result.put(ent1.getKey(), new XPoint2D(0, 2 + y + (maxHeight12 - height1) / 2));
 *
 * where `height2` is the member's WHOLE wrapped TextBlock. T20's ported
 * form is a closed-form baseline shift of `(blockHeight - fontSize) / 2`
 * applied to the row's first-line baseline, leaving `visibilityIconOriginY`
 * (which couples the single-line ascent/descent basis to its own
 * `maxHeight12` term) untouched.
 *
 * `renderRow`'s icon branch is reached from `renderer.ts:108` and
 * `renderer-body-enhanced.ts:90,116`; NEITHER layout populates
 * `visibilityBlockHeight` today (only `class-member-rows.ts#iconRowFields`
 * does, and those rows take the `renderer-classifier-box.ts` primitive
 * path), so no corpus fixture currently exercises this. These tests assert
 * the PORTED RULE directly on hand-built row geometry rather than through a
 * fixture that does not yet exist.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyVisibility.java:56-69
 */
import { describe, it, expect } from 'vitest';
import { renderRow, attributeFontSize } from '../../../src/diagrams/class/renderer-classifier-rows.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);

function geoWithRow(row: ClassifierGeo['rows'][number]): ClassifierGeo {
  return { id: 'A', kind: 'class', x: 10, y: 20, width: 200, height: 80, dividerYs: [], rows: [row] };
}

const BASE_ROW: ClassifierGeo['rows'][number] = {
  text: '+wrappedMember()',
  y: 30,
  indent: 0,
  visibilityIcon: '+',
  visibilityIsField: false,
};

function iconCy(svg: string): number {
  const ellipse = /<ellipse [^>]*\/>/.exec(svg)?.[0];
  expect(ellipse).toBeDefined();
  return Number(/cy="([^"]*)"/.exec(ellipse!)?.[1]);
}

describe('T6FU: renderRow centres a wrapped member icon on the whole block', () => {
  const fontSize = attributeFontSize(theme);

  it('shifts the icon down by half the block height over one line', () => {
    const blockHeight = fontSize * 4;
    const unwrapped = iconCy(renderRow(geoWithRow(BASE_ROW), BASE_ROW, theme));
    const wrappedRow = { ...BASE_ROW, visibilityBlockHeight: blockHeight };
    const wrapped = iconCy(renderRow(geoWithRow(wrappedRow), wrappedRow, theme));
    expect(wrapped - unwrapped).toBeCloseTo((blockHeight - fontSize) / 2, 6);
  });

  it('leaves a row with no `visibilityBlockHeight` byte-identical', () => {
    const before = renderRow(geoWithRow(BASE_ROW), BASE_ROW, theme);
    const same = { ...BASE_ROW, visibilityBlockHeight: fontSize };
    expect(renderRow(geoWithRow(same), same, theme)).toBe(before);
  });

  it('scales the shift with the block height (linear in `maxHeight12`)', () => {
    const cy = (h: number): number => {
      const row = { ...BASE_ROW, visibilityBlockHeight: h };
      return iconCy(renderRow(geoWithRow(row), row, theme));
    };
    expect(cy(fontSize * 3) - cy(fontSize * 2)).toBeCloseTo(fontSize / 2, 6);
    expect(cy(fontSize * 4) - cy(fontSize * 2)).toBeCloseTo(fontSize, 6);
  });
});
