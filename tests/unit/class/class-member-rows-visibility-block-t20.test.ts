/**
 * CDD T20 (A5/M6): `buildSectionRows`'s `visibilityBlockHeight` field --
 * the WRAPPED member's own total block height, `PlacementStrategyVisibility
 * .java:56-62`'s real `height2` term (the member's whole TextBlock, not one
 * physical line). Only set on the row that also draws the icon (the
 * member's FIRST physical row), and only when it differs from that row's
 * own single-line height.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyVisibility.java:56-69
 */
import { describe, it, expect } from 'vitest';
import { buildSectionRows, type SectionRowContext } from '../../../src/diagrams/class/class-member-rows.js';
import type { Member } from '../../../src/diagrams/class/ast.js';
import type { MemberRowBuild } from '../../../src/diagrams/class/class-member-creole.js';

function member(explicit: boolean): Member {
  return { visibility: '+', name: 'a', isStatic: false, isAbstract: false, visibilityExplicit: explicit };
}

function build(height: number): MemberRowBuild {
  return { atoms: [], width: 10, height };
}

const CTX: SectionRowContext = { baselineOffset: 0, iconZoneWidth: 14 };

describe('buildSectionRows — visibilityBlockHeight', () => {
  it('a single-line explicit-visibility member gets NO visibilityBlockHeight (equals its own height)', () => {
    const m = member(true);
    const rows = buildSectionRows([m], ['+a'], [build(14)], 0, true, CTX);
    expect(rows[0]!.visibilityIcon).toBe('+');
    expect(rows[0]!.visibilityBlockHeight).toBeUndefined();
  });

  it('a 4-physical-line wrapped member carries the SUM as visibilityBlockHeight on row 1 only', () => {
    const m = member(true);
    const members = [m, m, m, m];
    const texts = ['line1', 'line2', 'line3', 'line4'];
    const builds = [build(14), build(14), build(14), build(14)];
    const rows = buildSectionRows(members, texts, builds, 0, true, CTX);
    expect(rows).toHaveLength(4);
    expect(rows[0]!.visibilityIcon).toBe('+');
    expect(rows[0]!.visibilityBlockHeight).toBe(56);
    // Continuation rows never draw a SECOND icon (pre-existing `showIcon`
    // gate) and therefore never carry the field either.
    expect(rows[1]!.visibilityIcon).toBeUndefined();
    expect(rows[1]!.visibilityBlockHeight).toBeUndefined();
    expect(rows[2]!.visibilityBlockHeight).toBeUndefined();
    expect(rows[3]!.visibilityBlockHeight).toBeUndefined();
  });

  it('a non-explicit member (no icon at all) never carries the field regardless of wrapping', () => {
    const m = member(false);
    const rows = buildSectionRows([m, m], ['a', 'b'], [build(14), build(14)], 0, true, CTX);
    expect(rows[0]!.visibilityIcon).toBeUndefined();
    expect(rows[0]!.visibilityBlockHeight).toBeUndefined();
  });

  it('two DIFFERENT consecutive members each get their own total, not merged', () => {
    const m1 = member(true);
    const m2 = member(true);
    const rows = buildSectionRows([m1, m1, m2], ['a1', 'a2', 'b1'], [build(14), build(14), build(20)], 0, true, CTX);
    expect(rows[0]!.visibilityBlockHeight).toBe(28); // m1: 14 + 14
    expect(rows[2]!.visibilityBlockHeight).toBeUndefined(); // m2: single row, 20 === 20
  });
});
