/**
 * cdd3-T22 (E1-3, rideze-59-lizu265): the visibility icon is placed from
 * the member block's TOP, per `PlacementStrategyVisibility#getPositions`
 * (`PlacementStrategyVisibility.java:56-69`):
 *
 *   result.put(ent1.getKey(), new XPoint2D(0, 2 + y + (maxHeight12 - height1) / 2));
 *
 * `y` is the member's own row top and `maxHeight12 = max(iconBlock,
 * memberBlock)` -- so a row taller than the font (an OpenIconic atom's
 * `-3*factor` altitude) centres the icon on its REAL height.
 */
import { describe, it, expect } from 'vitest';
import { buildSectionRows, type SectionRowContext } from '../../../src/diagrams/class/class-member-rows.js';
import { renderRow } from '../../../src/diagrams/class/renderer-classifier-rows.js';
import type { Member } from '../../../src/diagrams/class/ast.js';
import type { MemberRowBuild } from '../../../src/diagrams/class/class-member-creole.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);
const BASELINE_OFFSET = 14 - 14 / 4.5;
const CTX: SectionRowContext = { baselineOffset: BASELINE_OFFSET, iconZoneWidth: 14, fontSize: 14 };
const SECTION_MARGIN_TOP = 4;

function member(): Member {
  return { visibility: '+', name: 'a', isStatic: false, isAbstract: false, visibilityExplicit: true };
}

function build(height: number): MemberRowBuild {
  return { atoms: [], width: 10, height };
}

function iconCy(svg: string): number {
  const ellipse = /<ellipse [^>]*\/>/.exec(svg)?.[0];
  expect(ellipse).toBeDefined();
  return Number(/cy="([^"]*)"/.exec(ellipse!)?.[1]);
}

describe('buildSectionRows — visibility block top (cdd3-T22)', () => {
  it('records the member block top relative to the row baseline and the block height', () => {
    const rows = buildSectionRows([member()], ['+a'], [build(22)], 0, true, CTX);
    expect(rows[0]!.y).toBeCloseTo(SECTION_MARGIN_TOP + BASELINE_OFFSET, 10);
    expect(rows[0]!.visibilityBlockTopDy).toBeCloseTo(-BASELINE_OFFSET, 10);
    expect(rows[0]!.visibilityBlockHeight).toBe(22);
  });

  it('a 22-tall row centres the icon 4 px lower than a 14-tall row ((22 - 14) / 2)', () => {
    const geo = (rows: ClassifierGeo['rows']): ClassifierGeo => ({
      id: 'A',
      kind: 'class',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      dividerYs: [],
      rows,
    });
    const tall = buildSectionRows([member()], ['+a'], [build(22)], 0, true, CTX);
    const plain = buildSectionRows([member()], ['+a'], [build(14)], 0, true, CTX);
    const cyTall = iconCy(renderRow(geo(tall), tall[0]!, theme));
    const cyPlain = iconCy(renderRow(geo(plain), plain[0]!, theme));
    expect(cyTall - cyPlain).toBeCloseTo(4, 10);
  });
});
