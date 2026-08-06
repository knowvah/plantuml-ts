/**
 * Unit tests for the shadow-ink reservation mechanism — mission
 * skin-file-loading Batch 2 (D3's rendering half, STATE-scoped).
 *
 * `layout-ink-extent.ts#addStateBoxInk` (private) is exercised through the
 * two public ink-extent entry points it feeds: `computeStateDocumentDims`
 * (the top-level document canvas) and `computeSvekResultGeometry` (a
 * wrapped autonom composite's own DOT-fed node size — the mechanism that
 * closes `nimana-36-veco708`'s size-backlog entry, `oracle/goldens/state/
 * size-backlog.json`'s own note). Both share the SAME `addStateBoxInk`
 * rule, so one set of hand-derived expected values (below) exercises it
 * from both call sites.
 *
 * Hand-derivation for a single `x=0,y=0,w=100,h=50` leaf (see
 * `layout-ink-extent.ts#addStateBoxInk`'s own doc comment for the rule):
 *   shadow=0: minX=-1,minY=-1,maxX=max(100,99)=100,maxY=49
 *   shadow=4: maxX=max(100,100-1+8=107)=107, maxY=max(49,49+8=57)=57
 *     -- +7 on X (the shadow rect's own `x+w-1+2*shadow` only barely beats
 *        the pre-existing UNSHADOWED divider-line point `x+w`), +8 on Y
 *        (the divider line never dominates the Y axis at all, matching
 *        `addStateBoxInk`'s own doc comment).
 */
import { describe, it, expect } from 'vitest';
import { computeStateDocumentDims, computeSvekResultGeometry } from '../../../src/diagrams/state/layout-ink-extent.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';

/** `headerLines` is REQUIRED for this derivation to hold: it is what makes
 *  `renderer-box.ts#renderNormal` draw the divider `<line>` whose uninset
 *  `x + w` ink the `maxX=max(100,99)=100` step above assumes. A leaf WITHOUT
 *  it renders through `renderUnmeasuredFallback` (box + centred text, no
 *  divider) and correctly contributes only the rect's own `x + w - 1` — see
 *  the no-divider describe block at the bottom of this file. */
function leaf(shadowing?: number): StateNodeGeo {
  return {
    id: 's1', kind: 'normal', display: 's1', x: 0, y: 0, width: 100, height: 50,
    children: [], transitions: [],
    headerLines: [{ text: 's1', width: 20 }],
    ...(shadowing !== undefined ? { shadowing } : {}),
  };
}

describe('addStateBoxInk shadow reservation — computeStateDocumentDims', () => {
  it('reserves no extra ink when shadowing is absent', () => {
    expect(computeStateDocumentDims([leaf()], [])).toEqual({ width: 122, height: 71 });
  });

  it('reserves no extra ink when shadowing is explicitly 0', () => {
    expect(computeStateDocumentDims([leaf(0)], [])).toEqual({ width: 122, height: 71 });
  });

  it('reserves +7 width / +8 height for a shadowing=4 leaf (asymmetric per-axis rule)', () => {
    expect(computeStateDocumentDims([leaf(4)], [])).toEqual({ width: 129, height: 79 });
  });

  it('scales the reservation with a different shadowing magnitude (shadowing=1 -> +2/+2)', () => {
    // shadow=1: maxX=max(100,100-1+2=101)=101 (+1 vs baseline 100),
    // maxY=max(49,49+2=51)=51 (+2 vs baseline 49) -> width +1, height +2.
    expect(computeStateDocumentDims([leaf(1)], [])).toEqual({ width: 123, height: 73 });
  });
});

describe('addStateBoxInk shadow reservation — computeSvekResultGeometry (the nimana-36-veco708 mechanism)', () => {
  it('reserves no extra ink when shadowing is absent', () => {
    const geom = computeSvekResultGeometry([leaf()], []);
    expect(geom.width).toBe(116);
    expect(geom.height).toBe(65);
  });

  it('reserves +7 width / +8 height for a shadowing=4 leaf, growing a wrapped autonom pass own reported size', () => {
    const geom = computeSvekResultGeometry([leaf(4)], []);
    expect(geom.width).toBe(123);
    expect(geom.height).toBe(73);
  });
});

describe('addStateBoxInk shadow reservation — composite (children.length > 0) box shares the same rule', () => {
  function composite(shadowing?: number): StateNodeGeo {
    return {
      id: 'c1', kind: 'normal', display: 'c1', x: 0, y: 0, width: 100, height: 50,
      children: [
        { id: 'child', kind: 'normal', display: 'child', x: 10, y: 10, width: 20, height: 20, children: [], transitions: [] },
      ],
      transitions: [],
      ...(shadowing !== undefined ? { shadowing } : {}),
    };
  }

  it('reserves the composite own shadow ink identically to a leaf box', () => {
    const unshadowed = computeStateDocumentDims([composite()], []);
    const shadowed = computeStateDocumentDims([composite(4)], []);
    expect(shadowed.width).toBe(unshadowed.width + 7);
    expect(shadowed.height).toBe(unshadowed.height + 8);
  });
});

/**
 * The DIVIDER-LINE precondition on `addStateBoxInk`'s uninset max-X.
 *
 * Upstream draws two separate shapes for a described leaf state and
 * `LimitFinder` walks BOTH: the outline `URectangle` (`drawRectangle` —
 * `addPoint(x + w - 1, ...)`) and the divider `ULine` (`drawULine` —
 * `addPoint(x + dx, ...)`, no `-1`), so the line's uninset right edge
 * dominates the rect's inset one. A box that draws NO divider contributes
 * only the rect's corner.
 *
 * Jar-verified in BOTH directions on real corpus fixtures:
 *   - `jocela-05-niba392` — divider present, `<line x2="65.0625">` equals the
 *     rect's own `x+width` exactly; needs `x + w` (0 diffs).
 *   - `bilare-19-fufe539` — `hide empty description` routes every state to
 *     `EntityImageStateEmptyDescription.drawU` ("rect ONLY, no divider"), and
 *     the jar's own SVG contains ZERO `<line>` elements; needs `x + w - 1`,
 *     which yields the jar's document width 361 exactly (was 362).
 */
describe('addStateBoxInk divider-line precondition on the uninset max-X', () => {
  const base = { id: 's1', kind: 'normal' as const, display: 's1', x: 0, y: 0, width: 100, height: 50, children: [], transitions: [] };

  it('uses the uninset x+w when the box draws a divider (headerLines present)', () => {
    const withDivider: StateNodeGeo = { ...base, headerLines: [{ text: 's1', width: 20 }] };
    expect(computeStateDocumentDims([withDivider], [])).toEqual({ width: 122, height: 71 });
  });

  it('uses the rect-inset x+w-1 for an empty-description box (no divider drawn)', () => {
    const empty: StateNodeGeo = { ...base, headerLines: [{ text: 's1', width: 20 }], emptyDescription: true };
    expect(computeStateDocumentDims([empty], [])).toEqual({ width: 121, height: 71 });
  });

  it('uses the rect-inset x+w-1 for an unmeasured box (fallback renderer, no divider)', () => {
    expect(computeStateDocumentDims([{ ...base }], [])).toEqual({ width: 121, height: 71 });
  });
});
