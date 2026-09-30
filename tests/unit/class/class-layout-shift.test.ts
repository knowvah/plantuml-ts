/**
 * Unit tests for `class-layout-shift.ts` -- the post-dot-layout ink-shift
 * applied to every `EdgeGeo` label field before render. T1b
 * (kexaba-26-kobu577): `labelImage` (a lone-sprite label's resolved PNG)
 * was the ONE field `shiftEdgeExtras`'s cdd-T6 list omitted, so it never
 * left dot-engine's raw pre-shift frame while every sibling field
 * (`label`, `labelLines`, `visibilityIcon`, ...) moved into the document
 * frame -- see `class-edge-label-anchor.ts#spriteLabelAnchor`'s own doc
 * comment for the full mechanism and the jar citation.
 */
import { describe, it, expect } from 'vitest';
import { shiftEdgeGeo } from '../../../src/diagrams/class/class-layout-shift.js';
import type { EdgeGeo } from '../../../src/diagrams/class/class-geo-types.js';

function makeEdge(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'e1',
    points: [{ x: 0, y: 0 }],
    targetDecor: 'triangle',
    sourceDecor: 'none',
    dashed: false,
    from: 'a',
    to: 'b',
    ...overrides,
  };
}

describe('shiftEdgeGeo — labelImage', () => {
  it('shifts labelImage.x/y by (dx,dy), leaving href/width/height untouched', () => {
    const edge = makeEdge({
      labelImage: { href: 'data:image/png;base64,AAA', x: 59.5, y: 107, width: 17, height: 12 },
    });
    const shifted = shiftEdgeGeo(edge, 7, 7);
    expect(shifted.labelImage).toEqual({ href: 'data:image/png;base64,AAA', x: 66.5, y: 114, width: 17, height: 12 });
  });

  it('kexaba-26-kobu577: spriteLabelAnchor pre-shift + shiftEdgeGeo(7,7) reaches the jar-verified (66.5,114)', () => {
    // `spriteLabelAnchor({ width: 17, height: 12 }, { x: 68, y: 113 }, 1)`
    // (this port's own dot-engine `labelX/Y` for kexaba's real edge,
    // marginLabel=1) returns the RAW pre-shift box-origin+marginLabel --
    // `class-edge-label-anchor.test.ts` asserts that formula directly.
    const edge = makeEdge({
      labelImage: { href: 'data:image/png;base64,AAA', x: 59.5, y: 107, width: 17, height: 12 },
    });
    const shifted = shiftEdgeGeo(edge, 7, 7);
    expect(shifted.labelImage?.x).toBe(66.5);
    expect(shifted.labelImage?.y).toBe(114);
  });

  it('leaves labelImage undefined when the edge carries no lone-sprite label', () => {
    const shifted = shiftEdgeGeo(makeEdge(), 7, 7);
    expect(shifted.labelImage).toBeUndefined();
  });
});
