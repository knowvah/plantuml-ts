/**
 * Unit tests for the composite-anchor spline clip in the state ink walk —
 * SI31 T5 (G15).
 *
 * Upstream trims a cluster-sourced or cluster-targeted edge back to the
 * cluster rectangle in Java, not through graphviz: `SvekEdge#solveLine`
 * calls `dotPath.simulateCompound(lhead.getRectangleArea(),
 * ltail.getRectangleArea())`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
 * SvekEdge.java:671-672`), with `ltail`/`lhead` non-null exactly when the
 * edge's own start/end DOT id addresses a cluster rather than a real node
 * (`SvekEdge.java:252-258`, `Cluster.CENTER_ID`). The clip runs BEFORE the
 * path is drawn, so `LimitFinder` / `SvekResult#calculateDimension` only
 * ever fold the trimmed curve.
 *
 * This port's `Cluster.CENTER_ID` analogue is
 * `state-composite-classify.ts#zaentId` (`__zaent_<id>`), substituted for a
 * `'cluster'`-kind endpoint by `#edgeEndpointId` — so an endpoint carrying a
 * `__zaent_` id is precisely upstream's non-null `ltail`/`lhead`.
 *
 * `simulateCompound`'s own arithmetic is covered by
 * `tests/unit/core/spline-clip.test.ts`; these tests lock the WIRING — which
 * endpoint ids trigger it, which rectangle it is handed, which branch fires,
 * and that a plain transition still folds its raw spline. Every case runs
 * with `arrowheadInk: 'self-loop'` on a `from !== to` transition so the
 * arrowhead term short-circuits and the resulting box IS the spline fold,
 * with nothing else mixed in.
 */
import { describe, it, expect } from 'vitest';
import {
  newInkBox,
  addTransitionInk,
  buildCompositeAnchorRects,
} from '../../../src/diagrams/state/layout-ink-transition.js';
import { clipSplineStart, clipSplineEnd } from '../../../src/core/spline-clip.js';
import { zaentId } from '../../../src/diagrams/state/state-composite-classify.js';
import type {
  StateNodeGeo,
  TransitionGeo,
} from '../../../src/diagrams/state/state-geo-types.js';

/** A composite at `x=0,y=0,w=100,h=100` holding one leaf well inside it. */
function composite(): StateNodeGeo {
  return {
    id: 'A', kind: 'normal', display: 'A', x: 0, y: 0, width: 100, height: 100,
    headerLines: [{ text: 'A', width: 10 }],
    transitions: [],
    children: [
      {
        id: 'Y', kind: 'normal', display: 'Y', x: 20, y: 20, width: 20, height: 20,
        headerLines: [{ text: 'Y', width: 10 }], children: [], transitions: [],
      },
    ],
  };
}

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

function transition(from: string, to: string, points = SPLINE): TransitionGeo {
  return { from, to, points: points.map((p) => ({ ...p })) };
}

/** The ink box `addTransitionInk` accumulates for one transition, against the
 *  anchor rectangles of a one-composite pass. */
function inkOf(t: TransitionGeo): { minX: number; minY: number; maxX: number; maxY: number } {
  const box = newInkBox();
  addTransitionInk(box, t, false, 'self-loop', buildCompositeAnchorRects([composite()]));
  return box;
}

const maxXOf = (pts: readonly { x: number }[]): number => Math.max(...pts.map((p) => p.x));

describe('buildCompositeAnchorRects', () => {
  it('keys every node, at every depth, by its zaent anchor id', () => {
    const rects = buildCompositeAnchorRects([composite()]);
    expect(rects.get(zaentId('A'))).toEqual(A_RECT);
    expect(rects.get(zaentId('Y'))).toEqual({ x: 20, y: 20, width: 20, height: 20 });
  });

  it('does not key a node by its plain id', () => {
    // A leaf endpoint carries its plain id and must never match a rectangle,
    // which is what keeps `ltail`/`lhead` null for an ordinary transition.
    expect(buildCompositeAnchorRects([composite()]).has('A')).toBe(false);
  });
});

describe('composite-anchor spline clip (SvekEdge.java:671-672)', () => {
  it('folds the RAW spline between two plain nodes', () => {
    // Both endpoint ids are plain, so upstream's `head == null && tail ==
    // null` short-circuit applies (`DotPath.java:419-420`) and the x=160
    // control point still bounds the box.
    expect(inkOf(transition('A', 'Y')).maxX).toBe(160);
  });

  it('applies the TAIL branch against the source cluster rectangle', () => {
    const clipped = clipSplineStart(SPLINE.map((p) => ({ ...p })), A_RECT);
    expect(inkOf(transition(zaentId('A'), 'Y')).maxX).toBe(maxXOf(clipped));
    expect(maxXOf(clipped)).toBeLessThan(160);
  });

  it('applies the HEAD branch against the target cluster rectangle', () => {
    // The same spline reversed ends inside the composite, so upstream sets
    // `lhead` and `DotPath.java:460-489` trims the far end instead.
    const reversed = [...SPLINE].reverse().map((p) => ({ ...p }));
    const clipped = clipSplineEnd(reversed.map((p) => ({ ...p })), A_RECT);
    expect(inkOf(transition('Y', zaentId('A'), reversed)).maxX).toBe(maxXOf(clipped));
    expect(maxXOf(clipped)).toBeLessThan(160);
  });

  it('folds the raw spline when the anchor names no node in this pass', () => {
    // Nothing to clip against — upstream's `ltail` is null for a cluster that
    // is not part of the pass.
    expect(inkOf(transition(zaentId('NotHere'), 'Y')).maxX).toBe(160);
  });

  it('leaves the transition geometry itself untouched', () => {
    // The ink walk must not mutate points the renderer also reads.
    const t = transition(zaentId('A'), 'Y');
    inkOf(t);
    expect(t.points).toEqual(SPLINE);
  });
});
