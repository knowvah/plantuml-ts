/**
 * cdd-T17 (M8): the role label's SECOND anchor per end -- direct unit
 * tests for `roleLabelAnchors` (`class-edge-role-label-anchor.ts`,
 * re-exported from `class-edge-label-anchor.ts`) and its wiring into
 * `attachPortLabels`, isolated from the full `renderClass` pipeline (per
 * `~/.claude/rules/testability.md`).
 *
 * `SvekEdge.java:1023-1030` + `drawRoleLabel` (`:1025-1063`): the role
 * mirrors the ALREADY-PLACED quantifier box across the line direction --
 * `mugobo-34-fede498`'s vertical `User "owner which is very long"/1 --
 * "0..n"/items Item` link is the corpus's only reach (both ends: `<--`
 * path `M149.23,55.26 C...149.23,114.79`, a perfectly vertical line).
 * Every position asserted below is read off that fixture's own oracle SVG
 * (`plans/class-divergence-drive/measurements/out/mugobo-34-fede498.jar.svg`),
 * via `WidthTableMeasurer` (confirmed to reproduce jar's own widths
 * byte-for-byte for this fixture's four cardinality/role strings) -- never
 * fitted.
 */
import { describe, it, expect } from 'vitest';
import {
  roleLabelAnchors,
  attachPortLabels,
  placeQuantifierBox,
} from '../../../src/diagrams/class/class-edge-label-anchor.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';

const measurer = new WidthTableMeasurer();
const font = { family: 'sans-serif', size: 13 };

function baseEdgeGeo(points: Array<{ x: number; y: number }>): EdgeGeo {
  return {
    id: 'edge-0',
    points,
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: 'User',
    to: 'Item',
  };
}

describe('T17 (M8) — roleLabelAnchors, vertical mirror (mugobo-34-fede498)', () => {
  // jar's real path: M149.23,55.26 C...149.23,114.79 -- a perfectly
  // vertical line, so `thisEndpoint.x` is the SAME 149.23 for both ends.
  const thisEnd = { x: 149.23, y: 55.26 };
  const otherEnd = { x: 149.23, y: 114.79 };

  it('mirrors the tail role ("1") to jar\'s exact x=151.23, sharing the quantifier\'s own baseline y=73.253', () => {
    // The tail quantifier ("owner which is very long") box, placed exactly
    // where jar's own <text x="6" y="73.253" textLength="127.319"> sits --
    // pos.x=6 (jar's own value) and pos.y derived from jar's baseline via
    // the SAME `font.size - descent` formula `placeQuantifierBox` itself
    // uses (not re-derived here -- this is the codebase's pre-existing,
    // unchanged baseline convention).
    const baselineOffset = font.size - measurer.getDescent(font, 'owner which is very long');
    const quantifierBox = {
      pos: { x: 6, y: 73.253 - baselineOffset },
      maxWidth: measurer.measure('owner which is very long', font).width,
      totalHeight: 13,
    };
    const lines = roleLabelAnchors('1', quantifierBox, { thisEnd, otherEnd }, measurer, font);
    expect(lines).toHaveLength(1);
    // qCenterX = 6 + 127.31875/2 = 69.66 < lineX = 149.23 -> role x =
    // lineX + gap(2) = 151.23, exactly jar's <text x="151.23">1</text>.
    expect(lines[0]!.x).toBeCloseTo(151.23, 6);
    expect(lines[0]!.y).toBeCloseTo(73.253, 3);
    expect(lines[0]!.text).toBe('1');
  });

  it('mirrors the head role ("items") to jar\'s exact x=151.23, sharing the quantifier\'s own baseline y=104.032', () => {
    const baselineOffset = font.size - measurer.getDescent(font, '0..n');
    const quantifierBox = {
      pos: { x: 125.618, y: 104.032 - baselineOffset },
      maxWidth: measurer.measure('0..n', font).width,
      totalHeight: 13,
    };
    // Head end mirrors FROM the head's own endpoint (points.at(-1)) toward
    // the tail (points[0]) -- `attachPortLabels` passes this reversed pair.
    const lines = roleLabelAnchors('items', quantifierBox, { thisEnd: otherEnd, otherEnd: thisEnd }, measurer, font);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.x).toBeCloseTo(151.23, 6);
    expect(lines[0]!.y).toBeCloseTo(104.032, 3);
    expect(lines[0]!.text).toBe('items');
  });
});

describe('T17 (M8) — roleLabelAnchors, degenerate (zero-length) line', () => {
  it('places the role directly below the quantifier box, no gap (SvekEdge.java:1041-1043)', () => {
    const quantifierBox = { pos: { x: 10, y: 20 }, maxWidth: 40, totalHeight: 13 };
    const samePoint = { x: 5, y: 5 };
    const lines = roleLabelAnchors('r', quantifierBox, { thisEnd: samePoint, otherEnd: samePoint }, measurer, font);
    expect(lines).toHaveLength(1);
    // top-left = (qBox.x, qBox.y + qBox.totalHeight) = (10, 33); the role's
    // own per-line x offset is 0 for a single-char, single-line block.
    expect(lines[0]!.x).toBeCloseTo(10, 6);
  });
});

describe('T17 (M8) — attachPortLabels: additive role alongside a real quantifier', () => {
  const rel = parseRelationshipLine('User "owner which is very long"/1 -- "0..n"/items Item')!;

  it('parses fromRole/toRole from the mugobo-shaped source line', () => {
    expect(rel).toMatchObject({
      from: 'User',
      to: 'Item',
      fromMultiplicity: 'owner which is very long',
      fromRole: '1',
      toMultiplicity: '0..n',
      toRole: 'items',
    });
  });

  it('populates BOTH quantifierLines (fallback-free) and roleLines (additive) per end', () => {
    const edgeGeo = baseEdgeGeo([
      { x: 149.23, y: 55.26 },
      { x: 149.23, y: 114.79 },
    ]);
    attachPortLabels(
      edgeGeo,
      rel,
      { id: 'edge-0', points: [], tailLabelX: 69.65, tailLabelY: 68.2, headLabelX: 136.42, headLabelY: 110.5 },
      { measurer, fontFamily: 'sans-serif', nodes: [] },
    );
    expect(edgeGeo.quantifierLines).toBeDefined();
    expect(edgeGeo.quantifierLines![0][0]!.text).toBe('owner which is very long');
    expect(edgeGeo.quantifierLines![1][0]!.text).toBe('0..n');
    expect(edgeGeo.roleLines).toBeDefined();
    expect(edgeGeo.roleLines![0]).toHaveLength(1);
    expect(edgeGeo.roleLines![0][0]!.text).toBe('1');
    expect(edgeGeo.roleLines![1][0]!.text).toBe('items');
    // Both roles mirror to the SAME x on this perfectly-vertical line.
    expect(edgeGeo.roleLines![0][0]!.x).toBeCloseTo(edgeGeo.roleLines![1][0]!.x, 3);
  });
});

describe('T17 (M8) — attachPortLabels: fallback (role, no multiplicity) draws via quantifierLines, not roleLines', () => {
  it('an end with a role but no multiplicity draws the role through the quantifier-line path', () => {
    const rel = parseRelationshipLine('A "1" -- /owner B')!;
    expect(rel.toMultiplicity).toBeUndefined();
    expect(rel.toRole).toBe('owner');

    const edgeGeo = baseEdgeGeo([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ]);
    attachPortLabels(
      edgeGeo,
      rel,
      { id: 'edge-0', points: [], tailLabelX: 10, tailLabelY: 10, headLabelX: 10, headLabelY: 90 },
      { measurer, fontFamily: 'sans-serif', nodes: [] },
    );
    expect(edgeGeo.quantifierLines![1][0]!.text).toBe('owner');
    // No ADDITIVE role possible without a head multiplicity to mirror
    // against -- roleLines stays undefined (no entry pushed for either end).
    expect(edgeGeo.roleLines).toBeUndefined();
  });
});

describe('T17 (M8) — placeQuantifierBox is still exported and usable directly (re-export surface)', () => {
  it('places a single-line box centred on the given point', () => {
    const box = placeQuantifierBox('1', { x: 100, y: 100 }, measurer, font);
    expect(box.lines).toEqual(['1']);
    expect(box.pos.x).toBeLessThan(100);
  });
});
