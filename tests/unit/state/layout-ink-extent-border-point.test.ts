/**
 * Feature: a border-point composite reserves canvas OUTSIDE the frame it draws.
 *
 * G9/T8: `Cluster#drawU` reassigns `rectangleArea` from a `FrontierCalculator`
 * seeded with each child cluster's CURRENT rectangle (`Cluster.java:344-345,
 * 410-436`), and `drawU` runs at least twice — once through
 * `TextBlockUtils.getMinMax` inside `SvekResult#calculateDimension`, then for
 * the real render. `SvekResult#drawU` walks `allCluster()` parents-first, so
 * the ink pass frontiers a parent against its children's RAW graphviz boxes
 * and the draw pass against their corrected ones. The canvas therefore keeps
 * room the frame never covers.
 *
 * `temuxi-28-cega322` is the ground truth: its module frame draws at y=88 with
 * the raw box 81px higher, jar's ink minimum lands at `rawTop - 1`, and the
 * document is 418 tall against 368 for the same drawing without the band.
 *
 * This file pins the ink ARITHMETIC on a hand-built geometry;
 * `state-composite-geo.ts#borderPointInkOverflow` decides when the overflow
 * exists at all, and the corpus is what checks that.
 */
import { describe, it, expect } from 'vitest';
import { computeStateDocumentDims } from '../../../src/diagrams/state/layout-ink-extent.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';

function leaf(id: string, x: number, y: number): StateNodeGeo {
  return { id, kind: 'normal', display: id, x, y, width: 40, height: 30, children: [], transitions: [] };
}

function composite(overrides: Partial<StateNodeGeo> = {}): StateNodeGeo {
  return {
    id: 'outer',
    kind: 'normal',
    display: 'outer',
    x: 100,
    y: 100,
    width: 200,
    height: 120,
    children: [leaf('a', 120, 130)],
    transitions: [],
    ...overrides,
  };
}

describe('computeStateDocumentDims — border-point composite ink overflow', () => {
  /** The same drawing with no reservation — the deltas below are measured
   *  against this, since the absolute numbers also carry the rect ink rule,
   *  `INK_DELTA`, the document margins and `ensureVisible`'s truncating `+1`,
   *  none of which this feature touches. */
  const baseline = computeStateDocumentDims([composite()], []);

  it('reserves nothing extra when the two passes agree', () => {
    expect(baseline).toEqual({ width: 222, height: 141 });
  });

  it('grows the canvas by the overflow, on the side that overflows', () => {
    // temuxi's own module: 81px of raw box above the frame it draws.
    const dims = computeStateDocumentDims(
      [composite({ inkOverflow: { top: 81, right: 0, bottom: 0, left: 0 } })],
      [],
    );
    expect(dims.height - baseline.height).toBe(81);
    expect(dims.width).toBe(baseline.width);
  });

  it('accumulates all four sides independently', () => {
    const dims = computeStateDocumentDims(
      [composite({ inkOverflow: { top: 10, right: 7, bottom: 3, left: 5 } })],
      [],
    );
    expect(dims.height - baseline.height).toBe(13);
    expect(dims.width - baseline.width).toBe(12);
  });

  it('leaves a composite without the field byte-identical', () => {
    const withField = composite({ inkOverflow: { top: 0, right: 0, bottom: 0, left: 0 } });
    expect(computeStateDocumentDims([withField], [])).toEqual(
      computeStateDocumentDims([composite()], []),
    );
  });
});

/**
 * Feature: a border point's LABEL reserves jar's text ink, not its layout box.
 *
 * `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:217-225`) records a
 * `UText`'s ink from the BASELINE it is drawn at: `[y - (height - 1.5),
 * y + 1.5]`. A text block's own box is `[y - ascent, y - ascent + height]`, so
 * at 14pt the two differ by `fontSize/4.5 - 1.5 = 1.611` at each edge.
 *
 * That 1.611 was a rigid offset on eight cached border-point fixtures — jar's
 * entire drawing sat that much lower than ours, because its canvas reserved
 * more above the topmost label. `lulozu-10-bopu547` was 134 tall against
 * jar's 136.
 */
describe('computeStateDocumentDims — a border point`s label ink', () => {
  const pin = (o: Partial<StateNodeGeo> = {}): StateNodeGeo => ({
    id: 'p',
    kind: 'normal',
    display: 'p',
    x: 100,
    y: 100,
    width: 12,
    height: 12,
    children: [],
    transitions: [],
    stereotype: 'inputPin',
    headerLines: [{ text: 'p', width: 40 }],
    borderPointLabelHeight: 14,
    borderPointLabelAbove: true,
    ...o,
  });

  it('reserves only the symbol when there is no label', () => {
    // `addBarInk`: [99, 111]. 12 + INK_DELTA 15 + bottom margin 5, +1 truncating.
    expect(computeStateDocumentDims([pin({ headerLines: [] })], []).height).toBe(33);
  });

  it('reserves the label ABOVE from its baseline, not its box top', () => {
    // box top 100 - 12 - 14 = 74; baseline 74 + textAscent(14) = 84.889;
    // ink top = baseline - (14 - 1.5) = 72.389 — 1.611 ABOVE the box top.
    // Union with the symbol's [99, 111] gives 38.611, + 15 + 5, +1 → 59.
    expect(computeStateDocumentDims([pin()], []).height).toBe(59);
  });

  it('reserves the label BELOW down to baseline + 1.5, not box top + height', () => {
    // box top 100 + 12 = 112; baseline 122.889; ink bottom = 124.389 — 1.611
    // ABOVE the box's own bottom (126). Union with [99, 111] gives 25.389.
    expect(computeStateDocumentDims([pin({ borderPointLabelAbove: false })], []).height).toBe(46);
  });
});
