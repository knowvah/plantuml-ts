/**
 * A2s R2f puvono-84-doro361 / sekame-22-meze147 (width half): the member-row
 * visibility-icon zone is `circledCharacterRadius + 3`, NOT a hardcoded 14 —
 * 14 is only the DEFAULT-radius value (resolveBadgeRadius(17/3+6=11) + 3).
 * `skinparam CircledCharacterRadius 8` must shrink the zone to 11 (-3px),
 * jar-verified via the R2e probe.
 * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:155-157 (smallIcon = getCircledCharacterRadius() + 3)
 * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:397-399 (PlacementStrategyVisibility col2, same expression)
 */
import { describe, it, expect } from 'vitest';
import {
  sectionWidth,
  buildSectionRows,
  rowIconZoneWidth,
  ROW_TEXT_LEFT_MARGIN,
  type SectionRowContext,
} from '../../../src/diagrams/class/class-member-rows.js';
import type { Member } from '../../../src/diagrams/class/ast.js';

const NAME_MARGIN_TOTAL = 6; // class-badge.ts — 6px each side around the widest row

function member(): Member {
  return { visibility: '+', name: 'a', isStatic: false, isAbstract: false, visibilityExplicit: true };
}

describe('rowIconZoneWidth — radius + 3 (MethodsOrFieldsArea.java:157)', () => {
  it('default badge radius 11 keeps the historical 14px zone', () => {
    expect(rowIconZoneWidth(11)).toBe(14);
  });
  it('skinparam CircledCharacterRadius 8 yields an 11px zone', () => {
    expect(rowIconZoneWidth(8)).toBe(11);
  });
});

describe('sectionWidth — icon zone follows the resolved badge radius', () => {
  const builds = [{ atoms: [], width: 50, height: 14 }];

  it('reserves radius+3 (11) instead of 14 for radius 8', () => {
    expect(sectionWidth(builds, true, rowIconZoneWidth(8))).toBe(50 + 11 + NAME_MARGIN_TOTAL * 2);
  });

  it('keeps the default 14 zone when the zone param is omitted (default radius)', () => {
    expect(sectionWidth(builds, true)).toBe(50 + 14 + NAME_MARGIN_TOTAL * 2);
  });

  it('no icon: zone contributes nothing regardless of radius', () => {
    expect(sectionWidth(builds, false, rowIconZoneWidth(8))).toBe(50 + NAME_MARGIN_TOTAL * 2);
  });
});

describe('buildSectionRows — indent follows the resolved icon zone', () => {
  function ctx(iconZoneWidth: number): SectionRowContext {
    return { baselineOffset: 11, iconZoneWidth };
  }

  it('icon section indents by margin + zone (6 + 11 = 17 for radius 8)', () => {
    const m = member();
    const rows = buildSectionRows([m], ['a'], [{ atoms: [], width: 10, height: 14 }], 0, true, ctx(rowIconZoneWidth(8)));
    expect(rows[0]!.indent).toBe(ROW_TEXT_LEFT_MARGIN + 11);
  });

  it('default radius reproduces the historical 20px indent', () => {
    const m = member();
    const rows = buildSectionRows([m], ['a'], [{ atoms: [], width: 10, height: 14 }], 0, true, ctx(rowIconZoneWidth(11)));
    expect(rows[0]!.indent).toBe(20);
  });

  it('no-icon section keeps the bare 6px margin', () => {
    const m = member();
    const rows = buildSectionRows([m], ['a'], [{ atoms: [], width: 10, height: 14 }], 0, false, ctx(rowIconZoneWidth(8)));
    expect(rows[0]!.indent).toBe(ROW_TEXT_LEFT_MARGIN);
  });
});
