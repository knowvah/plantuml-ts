/**
 * Unit tests for the composite-anchor spline clip — SI32 T2, which moved it
 * out of the ink walk (SI31 T5's `layout-ink-transition.ts#clipTransitionPoints`)
 * and into `TransitionGeo` CONSTRUCTION, once per layout result.
 *
 * Upstream trims a cluster-sourced or cluster-targeted edge back to the
 * cluster rectangle in Java, not through graphviz: `SvekEdge#solveLine`
 * REASSIGNS
 *
 *   dotPath = dotPath.simulateCompound(lhead == null ? null : lhead.getRectangleArea(),
 *                                      ltail == null ? null : ltail.getRectangleArea());
 *
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java
 * :671-672`), inside the edge loop of `DotStringFactory#solve`
 * (`DotStringFactory.java:458-459`). Only afterwards does
 * `GraphvizImageBuilder.java:287-288` construct the `SvekResult` whose
 * `calculateDimension` measures and whose `drawU` draws — so measure and draw
 * see the SAME trimmed curve, at every nesting level
 * (`dot/CucaDiagramSimplifierState.java:57-71` rebuilds each autarkic group
 * through its own `GroupMakerState#getImage()`).
 *
 * This port's `Cluster.CENTER_ID` analogue is
 * `state-composite-classify.ts#zaentId` (`__zaent_<id>`), substituted for a
 * `'cluster'`-kind endpoint by `#resolveEndpoint` — so an endpoint carrying a
 * `__zaent_` id is precisely upstream's non-null `ltail`/`lhead`.
 *
 * `simulateCompound`'s own arithmetic is covered by
 * `tests/unit/core/spline-clip.test.ts`; these tests lock the WIRING — where
 * the rectangles come from (D2': the layout's own cluster boxes), which
 * branch fires, that the label is attached from the UNCLIPPED points (D1'a),
 * that the ink walk no longer clips (so the clip happens exactly once), and
 * that arrowheads follow the clipped path (D3, `SvekEdge.java:679-684`).
 */
import { describe, it, expect } from 'vitest';
import {
  clusterAnchorRectsOf,
  clipTransitionSpline,
} from '../../../src/diagrams/state/state-transition-clip.js';
import { newInkBox, addTransitionInk } from '../../../src/diagrams/state/layout-ink-transition.js';
import { buildLevelTransitionGeos } from '../../../src/diagrams/state/state-composite-pass.js';
import { transitionArrowheadInk } from '../../../src/diagrams/state/renderer-arrowhead.js';
import { attachTransitionLabel } from '../../../src/diagrams/state/state-transition-label.js';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import { clipSplineStart, clipSplineEnd } from '../../../src/core/spline-clip.js';
import { zaentId } from '../../../src/diagrams/state/state-composite-classify.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import type { DotLayoutResult } from '../../../src/core/graph-layout.js';
import type { PassAccumulator } from '../../../src/diagrams/state/state-composite-pass-types.js';
import type { State, StateDiagramAST } from '../../../src/diagrams/state/ast.js';
import type { StateNodeGeo, TransitionGeo } from '../../../src/diagrams/state/state-geo-types.js';

const A_RECT = { x: 0, y: 0, width: 100, height: 100 };

/** One cubic in the `1 + 3*n` graphviz-spline shape: it starts INSIDE the
 *  composite, throws its second control point out to `x = 160` (60 px past
 *  the composite's `x + width` frontier) and ends outside at `(50, -40)`.
 *  That control point is the shape of the `fovafu-44-mifu394` defect — it
 *  belongs to the segment upstream discards. */
const SPLINE = [
  { x: 50, y: 50 },
  { x: 90, y: 40 },
  { x: 160, y: -10 },
  { x: 50, y: -40 },
];

const spline = (): Array<{ x: number; y: number }> => SPLINE.map((p) => ({ ...p }));
const reversedSpline = (): Array<{ x: number; y: number }> => [...SPLINE].reverse().map((p) => ({ ...p }));
const maxXOf = (pts: readonly { x: number }[]): number => Math.max(...pts.map((p) => p.x));

/** A one-cluster layout result: cluster `cluster0` occupies {@link A_RECT},
 *  and the single edge `edge-0` carries {@link SPLINE}. */
function result(overrides: Partial<DotLayoutResult> = {}): DotLayoutResult {
  return {
    nodes: [], width: 200, height: 200,
    edges: [{ id: 'edge-0', points: spline() }],
    clusters: [{ id: 'cluster0', ...A_RECT }],
    ...overrides,
  };
}

/** The same result with no `clusters` field at all — the flat pipeline's
 *  shape (`state-dot-graph.ts#buildDotGraph` emits no clusters). */
function resultWithoutClusters(): DotLayoutResult {
  return { nodes: [], width: 200, height: 200, edges: [{ id: 'edge-0', points: spline() }] };
}

const CLUSTERS_WITH_ANCHOR = [{ id: 'cluster0', nodeIds: ['X', 'Y', zaentId('A')] }];

describe('clusterAnchorRectsOf (D2’ — SvekEdge.java:671, lhead/ltail.getRectangleArea())', () => {
  it('keys the zaent anchor by its OWN cluster’s layout box', () => {
    const rects = clusterAnchorRectsOf(CLUSTERS_WITH_ANCHOR, result());
    expect(rects.get(zaentId('A'))).toEqual(A_RECT);
  });

  it('keys nothing for a plain member id', () => {
    // A leaf endpoint carries its plain id and must never match a rectangle,
    // which is what keeps `ltail`/`lhead` null for an ordinary transition.
    const rects = clusterAnchorRectsOf(CLUSTERS_WITH_ANCHOR, result());
    expect(rects.has('X')).toBe(false);
    expect(rects.has('A')).toBe(false);
    expect(rects.size).toBe(1);
  });

  it('is empty when the pass declared no clusters (the flat pipeline)', () => {
    expect(clusterAnchorRectsOf(undefined, resultWithoutClusters()).size).toBe(0);
    expect(clusterAnchorRectsOf([], result()).size).toBe(0);
  });

  it('is empty when the layout returned no cluster boxes at all', () => {
    expect(clusterAnchorRectsOf(CLUSTERS_WITH_ANCHOR, resultWithoutClusters()).size).toBe(0);
  });

  it('omits an anchor whose cluster the layout returned no box for', () => {
    // Upstream's null `ltail`/`lhead`: nothing to clip against.
    const rects = clusterAnchorRectsOf([{ id: 'clusterZ', nodeIds: [zaentId('Z')] }], result());
    expect(rects.has(zaentId('Z'))).toBe(false);
  });
});

describe('clipTransitionSpline (SvekEdge.java:671-672)', () => {
  const rects = clusterAnchorRectsOf(CLUSTERS_WITH_ANCHOR, result());

  it('returns the SAME array when neither endpoint addresses a cluster', () => {
    // `head == null && tail == null -> return this` (klimt/shape/DotPath.java).
    const pts = spline();
    expect(clipTransitionSpline(pts, 'X', 'Y', rects)).toBe(pts);
  });

  it('applies the TAIL branch against the source cluster rectangle', () => {
    const clipped = clipTransitionSpline(spline(), zaentId('A'), 'Y', rects);
    expect(clipped).toEqual(clipSplineStart(spline(), A_RECT));
    expect(maxXOf(clipped)).toBeLessThan(160);
  });

  it('applies the HEAD branch against the target cluster rectangle', () => {
    const clipped = clipTransitionSpline(reversedSpline(), 'Y', zaentId('A'), rects);
    expect(clipped).toEqual(clipSplineEnd(reversedSpline(), A_RECT));
    expect(maxXOf(clipped)).toBeLessThan(160);
  });

  it('applies TAIL first, then HEAD, matching the argument evaluation order', () => {
    const both = clipTransitionSpline(spline(), zaentId('A'), zaentId('A'), rects);
    expect(both).toEqual(clipSplineEnd(clipSplineStart(spline(), A_RECT), A_RECT));
  });
});

// ---------------------------------------------------------------------------
// The single call site, per construction path
// ---------------------------------------------------------------------------

/** A pass whose one edge runs from composite `A`'s zaent anchor to leaf `Y`,
 *  with no font/measurer — the measurer-less arm that
 *  `state-transition-label.ts:386-394` falls back to
 *  `perpendicularOffsetLabel(points)` on (D1'a's whole reason to exist). */
function accumulator(label?: string): PassAccumulator {
  return {
    nodes: [], clusters: CLUSTERS_WITH_ANCHOR, edges: [{ id: 'edge-0', from: zaentId('A'), to: 'Y' }],
    edgeSources: [{ t: { from: 'A', to: 'Y', ...(label !== undefined ? { label } : {}) }, edgeId: 'edge-0' }],
  };
}

describe('buildLevelTransitionGeos — solve()’s own edge loop (DotStringFactory.java:458-459)', () => {
  it('stores CLIPPED points on the TransitionGeo', () => {
    const [geo] = buildLevelTransitionGeos(accumulator(), result());
    expect(geo!.points).toEqual(clipSplineStart(spline(), A_RECT));
    expect(maxXOf(geo!.points)).toBeLessThan(160);
  });

  it('attaches the label from the UNCLIPPED points (D1’a)', () => {
    // Upstream's label is `getXY(fullSvg, noteLabelColor)`
    // (`SvekEdge.java:742-746`) and is never derived from `dotPath`; this
    // port's measurer-less fallback IS point-derived, so it must keep seeing
    // the pre-clip list or the clip would move labels.
    const [geo] = buildLevelTransitionGeos(accumulator('go'), result());
    const unclipped = attachTransitionLabel({ from: 'A', to: 'Y', label: 'go' }, spline(), undefined, undefined, undefined);
    expect(geo!.label).toEqual(unclipped);
    // ...and that is genuinely a different answer from the clipped list, so
    // the assertion above is not vacuous.
    const clippedLabel = attachTransitionLabel(
      { from: 'A', to: 'Y', label: 'go' }, clipSplineStart(spline(), A_RECT), undefined, undefined, undefined);
    expect(clippedLabel).not.toEqual(unclipped);
  });

  it('does not clip a transition whose endpoints address no cluster', () => {
    const acc = accumulator();
    acc.edges = [{ id: 'edge-0', from: 'X', to: 'Y' }];
    expect(buildLevelTransitionGeos(acc, result())[0]!.points).toEqual(SPLINE);
  });
});

describe('the ink walk no longer clips (SI31 T5’s clipTransitionPoints is gone)', () => {
  it('folds transition.points verbatim, even for a zaent endpoint', () => {
    // If the clip still lived here it would run a SECOND time. Handing
    // `addTransitionInk` an unclipped spline whose tail id addresses a
    // cluster must now fold the raw x=160 control point.
    const t: TransitionGeo = { from: zaentId('A'), to: 'Y', points: spline() };
    const box = newInkBox();
    addTransitionInk(box, t, false, 'self-loop');
    expect(box.maxX).toBe(160);
  });
});

describe('arrowheads derive from the clipped path (D3 — SvekEdge.java:679-684)', () => {
  it('anchors the head extremity on the CLIPPED end point', () => {
    // `:682-684` builds extremity2 from `dotPath.getEndPoint()` AFTER
    // `:671-672` reassigned `dotPath`, so the marker sits on the cluster
    // frontier, not at the in-cluster anchor.
    const acc = accumulator();
    acc.edges = [{ id: 'edge-0', from: 'Y', to: zaentId('A') }];
    acc.edgeSources = [{ t: { from: 'Y', to: 'A' }, edgeId: 'edge-0' }];
    const [geo] = buildLevelTransitionGeos(acc, result({ edges: [{ id: 'edge-0', points: reversedSpline() }] }));
    const clipped = clipSplineEnd(reversedSpline(), A_RECT);
    expect(geo!.points).toEqual(clipped);

    const ink = transitionArrowheadInk(geo!)!;
    const rawInk = transitionArrowheadInk({ from: 'Y', to: 'A', points: reversedSpline() })!;
    const end = clipped[clipped.length - 1]!;
    expect(ink.minX).toBeLessThanOrEqual(end.x);
    expect(ink.maxX).toBeGreaterThanOrEqual(end.x);
    expect(ink).not.toEqual(rawInk);
  });
});

// ---------------------------------------------------------------------------
// End to end: the renderer's own points are clipped
// ---------------------------------------------------------------------------

const st = (id: string, o: Partial<State> = {}): State =>
  ({ id, display: id, kind: 'normal', children: [], concurrentRegions: [], transitions: [], ...o });

/** T1's own reachability case: a NON-autarkic composite (`Inner`) classified
 *  `'cluster'`, so `resolveEndpoint` rewrites `P --> Inner` to
 *  `P --> __zaent_Inner`, and both the anchor edge and `Inner`'s rectangle sit
 *  in `Outer`'s own pass. */
function nestedClusterDiagram(): StateDiagramAST {
  const inner = st('Inner', { children: [st('I1'), st('I2')], transitions: [{ from: 'I1', to: 'I2' }] });
  const outer = st('Outer', { children: [inner, st('P')], transitions: [{ from: 'I1', to: 'P' }, { from: 'P', to: 'Inner' }] });
  return { states: [outer], transitions: [] };
}

function findNode(nodes: readonly StateNodeGeo[], id: string): StateNodeGeo | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

describe('layoutState — the geometry the RENDERER holds is already clipped', () => {
  it('stops a __zaent_ transition outside the target cluster’s box', () => {
    const geo = layoutState(nestedClusterDiagram(), defaultTheme, new FormulaMeasurer());
    const outer = findNode(geo.states, 'Outer')!;
    const inner = findNode(geo.states, 'Inner')!;
    const anchored = outer.transitions.find((t) => t.to === zaentId('Inner'))!;
    expect(anchored).toBeDefined();
    // Unclipped, graphviz routes this edge to the anchor POINT *inside* the
    // cluster (`ClusterDotString.java:149`); clipped, it stops short of the
    // frontier.
    const end = anchored.points[anchored.points.length - 1]!;
    expect(end.y).toBeLessThan(inner.y);
  });
});
