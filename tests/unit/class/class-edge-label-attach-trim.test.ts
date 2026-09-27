/**
 * cdd4-T8 (jakapi-64-tine258, D8): `SvekEdge#getArrowDirectionInRadianInternal`
 * (`svek/SvekEdge.java:208-217`) measures `dotPath` AFTER `solveLine`'s
 * decoration trim (`SvekEdge.java:558-562`'s `getExtremitySimplier` ->
 * `dotPath.moveStartPoint`/`moveEndPoint`) -- see
 * `../diagnosis/jakapi-64-tine258.md`. `attachEdgeLabel` used to feed
 * `magicArrowAngle` the RAW, untrimmed spline; this pins the fix: the
 * glyph angle must come from the SAME trimmed path
 * `class-ink-dot-path.ts#drawnEdgePoints` already exposes (the renderer's
 * own trim -- jar-verified elsewhere, `nenepe-70-keri784`).
 */
import { describe, it, expect } from 'vitest';
import { attachEdgeLabel, type EdgeGeoTextContext } from '../../../src/diagrams/class/class-edge-label-attach.js';
import { drawnEdgePoints } from '../../../src/diagrams/class/class-ink-dot-path.js';
import type { Relationship } from '../../../src/diagrams/class/ast.js';
import type { DotLayoutResult } from '../../../src/core/graph-layout.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { resolveArrowLabelFont } from '../../../src/core/arrow-label-font.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const measurer = new WidthTableMeasurer();
const labelFont = resolveArrowLabelFont(defaultTheme);
const text: EdgeGeoTextContext = { measurer, labelFont, fontFamily: defaultTheme.fontFamily };

const rel: Relationship = { from: 'A', to: 'B', type: 'association', label: 'has >' };

// A curved, tail-decorated spline (`points[0]` = start, `points[1]` = its
// own control point, NOT collinear with the overall start->end secant) --
// `LimitFinder`'s decoration trim (`movePointsStart`) genuinely rotates
// the jar's post-`solveLine` `dotPath` relative to the raw spline, the
// same way the diamond decoration at jakapi's Group entity rotates the
// `has >` glyph (`../diagnosis/jakapi-64-tine258.md`'s causal chain).
const curvedPoints = [
  { x: 100, y: 100 },
  { x: 100, y: 40 },
  { x: 150, y: 50 },
  { x: 200, y: 100 },
];

function edgeResultFor(points: Array<{ x: number; y: number }>): DotLayoutResult['edges'][number] {
  return { id: 'e0', points, labelX: 260, labelY: 100 };
}

function baseEdge(overrides: Partial<EdgeGeo>): EdgeGeo {
  return { id: 'e0', points: curvedPoints, sourceDecor: 'none', targetDecor: 'none', dashed: false, from: 'A', to: 'B', ...overrides };
}

describe('attachEdgeLabel — magic-arrow angle reads the TRIMMED dotPath (cdd4-T8, jakapi)', () => {
  it('a tail-decorated curved edge yields the SAME glyph as its pre-trimmed, undecorated equivalent', () => {
    const decorated = baseEdge({ sourceDecor: 'diamond' });
    attachEdgeLabel(decorated, rel, edgeResultFor(curvedPoints), text, decorated.points);
    expect(decorated.arrowGlyph).toBeDefined();

    // Independently trim `curvedPoints` the SAME way `LimitFinder`/
    // `solveLine` does, then feed the RESULT through an undecorated edge
    // -- `attachEdgeLabel` must read the identical trimmed path either way.
    const trimmed = drawnEdgePoints(decorated);
    const preTrimmed = baseEdge({ points: trimmed });
    attachEdgeLabel(preTrimmed, rel, edgeResultFor(trimmed), text, preTrimmed.points);

    expect(preTrimmed.arrowGlyph!.points).toEqual(decorated.arrowGlyph!.points);
  });

  it('contrast: the untrimmed points alone give a DIFFERENT glyph (the fixture is not vacuous)', () => {
    const decorated = baseEdge({ sourceDecor: 'diamond' });
    attachEdgeLabel(decorated, rel, edgeResultFor(curvedPoints), text, decorated.points);

    const untrimmed = baseEdge({});
    attachEdgeLabel(untrimmed, rel, edgeResultFor(curvedPoints), text, untrimmed.points);

    expect(untrimmed.arrowGlyph!.points).not.toEqual(decorated.arrowGlyph!.points);
  });
});
