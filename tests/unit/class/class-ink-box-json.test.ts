/**
 * T2b (json-canvas-width-1px): `addJsonBodyInk` -- a `kind: 'json'`-specific
 * ink rule, dispatching on whether `c.jsonBody` contains an `hline` item
 * (object bodies always draw one per member, array bodies with >= 2
 * elements draw one between elements -- `TextBlockCucaJSon.java:168,174,
 * 215-220`, reaching `x+w`) versus a primitive/1-element-array root, whose
 * `URectangle` alone bounds the leaf at `x+w-1`
 * (`EntityImageJson.java:192`).
 */
import { describe, it, expect } from 'vitest';
import { computeClassRawInkDims } from '../../../src/diagrams/class/layout-ink-extent.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/layout.js';

function jsonLeaf(overrides: Partial<ClassifierGeo>): ClassifierGeo {
  return {
    id: 'J',
    kind: 'json',
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    dividerYs: [],
    rows: [],
    ...overrides,
  };
}

describe('addJsonBodyInk (T2b)', () => {
  it('a primitive-root json leaf (no hline) bounds at x+w-1, not x+w', () => {
    const dims = computeClassRawInkDims([jsonLeaf({ x: 10, y: 10, width: 100, height: 40 })], [], [], []);
    // No ink shape reaches x+w=110; the rect's own `-1` inset corner is the
    // real max: 109. Raw = extent (109 - 9 = 100 wide, 40 - 9 = ... ) +
    // SvekResult's `.delta(15,15)`.
    expect(dims.width).toBe(109 - 9 + 15);
  });

  it('an object-root json leaf (hline present) bounds at x+w, one px wider than the primitive case', () => {
    const primitive = computeClassRawInkDims([jsonLeaf({ x: 10, y: 10, width: 100, height: 40 })], [], [], []);
    const withObject = computeClassRawInkDims(
      [
        jsonLeaf({
          x: 10,
          y: 10,
          width: 100,
          height: 40,
          jsonBody: [{ kind: 'hline', x: 10, y: 30, width: 100 }],
        }),
      ],
      [],
      [],
      [],
    );
    expect(withObject.width).toBe(primitive.width + 1);
  });

  it('height is unaffected by the hline dispatch (this task is width-only)', () => {
    const primitive = computeClassRawInkDims([jsonLeaf({ x: 10, y: 10, width: 100, height: 40 })], [], [], []);
    const withObject = computeClassRawInkDims(
      [
        jsonLeaf({
          x: 10,
          y: 10,
          width: 100,
          height: 40,
          jsonBody: [{ kind: 'hline', x: 10, y: 30, width: 100 }],
        }),
      ],
      [],
      [],
      [],
    );
    expect(withObject.height).toBe(primitive.height);
  });
});
