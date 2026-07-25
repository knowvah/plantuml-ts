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

function leaf(shadowing?: number): StateNodeGeo {
  return {
    id: 's1', kind: 'normal', display: 's1', x: 0, y: 0, width: 100, height: 50,
    children: [], transitions: [],
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
