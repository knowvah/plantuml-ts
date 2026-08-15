/**
 * The transition label's own INK contribution — mission
 * `plans/transition-label-ink/`, T3.
 *
 * Upstream never folds the drawn glyphs, and never the floored DOT
 * reservation. `SvekEdge` wraps every edge label in a `marginLabel` margin
 * (`svek/SvekEdge.java:372-373`), `TextBlockMarged#drawU` draws an `UEmpty`
 * sized to the WHOLE marged block before drawing the glyphs inset by that
 * margin (`klimt/shape/TextBlockMarged.java:79-87`, dimension at `:74-77`),
 * and `LimitFinder#drawEmpty` folds that `UEmpty` at full size with no
 * inset (`klimt/drawing/LimitFinder.java:159-162`). `UEmpty` renders
 * nothing, which is why a composite's ink legitimately exceeds every
 * element visible in the jar's own SVG.
 *
 * **The oracle these numbers come from.** `bemena-23-zebu249`'s
 * `Configuring` composite, whose `EvNewValueSaved` label is the rightmost
 * ink in its scope. In jar's own `in.svg` the glyphs start at `x="262.86"`
 * with `textLength="111.475"`, so the marged box runs
 * `261.86 .. 261.86 + 111.475 + 2*1 = 375.335`; the ink min (a spline
 * control point) is `18`; and `375.335 - 18 + 15 + 20 = 392.335`, which is
 * exactly the `width=5.449097` (x72) jar declares for that node in
 * `svek-2.dot`. Folding the reserved `113` at the glyph anchor instead
 * gives `392.86168` — the +0.527 this mission closed.
 */
import { describe, it, expect } from 'vitest';

import { attachTransitionLabel } from '../../../src/diagrams/state/state-transition-label.js';
import { computeSvekResultGeometry, computeStateDocumentDims } from '../../../src/diagrams/state/layout-ink-extent.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import type { TransitionGeo } from '../../../src/diagrams/state/state-geo-types.js';
import type { Transition } from '../../../src/diagrams/state/ast.js';

const measurer = new WidthTableMeasurer();
/** The transition-label font every state fixture uses (13pt sans). */
const FONT: FontSpec = { family: 'sans-serif', size: 13 };

/** `EvNewValueSaved` at 13pt, the fixture's own label. */
const MEASURED_WIDTH = 111.475;
const MARGIN_LABEL = 1;

function label(centreX: number, centreY: number) {
  const t = { from: 'a', to: 'b', label: 'EvNewValueSaved' } as unknown as Transition;
  return attachTransitionLabel(
    t,
    [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    { labelX: centreX, labelY: centreY },
    FONT,
    measurer,
  );
}

describe('attachTransitionLabel — the marged-box ink extent', () => {
  it('measures the label the jar does (its own textLength), and floors only the DOT reservation', () => {
    const l = label(300.36168, 254.5)!;
    // `(int) dim.getWidth()` — svek/SvekEdge.java:504-507. DOT only.
    expect(l.width).toBe(Math.floor(MEASURED_WIDTH + 2 * MARGIN_LABEL));
    expect(l.width).toBe(113);
    // ...and the ink keeps the UNfloored dimension.
    expect(l.inkBox!.width).toBeCloseTo(MEASURED_WIDTH + 2 * MARGIN_LABEL, 10);
    expect(l.inkBox!.width).toBeCloseTo(113.475, 10);
  });

  it('anchors the ink box one marginLabel left of the glyphs, at the reserved box corner', () => {
    const l = label(300.36168, 254.5)!;
    expect(l.x).toBeCloseTo(300.36168 - 113 / 2 + MARGIN_LABEL, 10);
    expect(l.inkBox!.x).toBeCloseTo(l.x - MARGIN_LABEL, 2);
  });

  it('reproduces the jar box corner exactly, quantized to graphviz own 2dp SVG print', () => {
    // Real graphviz 15.1.1 on jar's own svek-1.dot puts this box corner at
    // 235.61 where the engine carries 235.61168 — PlantUML scrapes `dot
    // -Tsvg`'s text (SvekEdge.java:808-813) and graphviz prints every
    // coordinate through `snprintf(buf, 50, "%.02f", num)`
    // (~/git/graphviz/lib/gvc/gvdevice.c:513-528).
    const l = label(300.36168, 254.5)!;
    expect(l.inkBox!.x).toBe(243.86);
    expect(l.x).toBeCloseTo(244.86168, 5); // the DRAW anchor stays unquantized (D5)
  });

  it('puts the ink box top an ascent + marginLabel above the glyph baseline', () => {
    // Jar cross-check: bemena draws this baseline at y=258.111, and its box
    // top is 247 — a graphviz label centre of 247 + 15/2 = 254.5, which only
    // comes out a clean half-integer for the BOX, never for the glyphs.
    const l = label(300.36168, 254.5)!;
    expect(l.y).toBeCloseTo(258.111111, 5);
    expect(l.inkBox!.y).toBe(247);
    expect(l.inkBox!.height).toBe(15);
    expect(l.inkBox!.y + l.inkBox!.height).toBe(262);
  });
});

describe('computeSvekResultGeometry — the composite ink folds that box', () => {
  /** The label alone, at the fixture's own graphviz-returned centre. */
  function geo(): TransitionGeo {
    const l = label(300.36168, 254.5)!;
    return { from: 'a', to: 'b', points: [{ x: 0, y: 0 }], label: l };
  }

  it('folds corner and corner+dimension (LimitFinder#drawEmpty), not the reserved box at the glyph anchor', () => {
    // ink minX is the `points` entry at 0; maxX is the box right edge.
    // 243.86 + 113.475 = 357.335, and SvekResult adds delta(15,15).
    expect(computeSvekResultGeometry([], [geo()]).width).toBeCloseTo(357.335 + 15, 6);
  });

  it('is 0.527 narrower than the pre-mission reserved-box-at-glyph-anchor fold', () => {
    // 244.86168 + 113 = 357.86168 was the old extent; the delta this
    // mission closed on bemena-23-zebu249 and five sibling fixtures.
    expect(357.86168 + 15 - computeSvekResultGeometry([], [geo()]).width).toBeCloseTo(0.52668, 5);
  });

  it('leaves the document-level (labelInk: false) fold untouched — decision D5', () => {
    // `computeStateDocumentDims` folds the label as a POINT and must not see
    // the box at all; it is jar-verified separately and holds 59 svg pins.
    // Asserted as an invariance, so it fails if that path ever starts
    // reading `inkBox` — the box is 0.475 wider than the reserved 113 and
    // sits at a different corner, so no value could coincide.
    const l = label(300.36168, 254.5)!;
    const withBox = computeStateDocumentDims([], [{ from: 'a', to: 'b', points: [{ x: 0, y: 0 }], label: l }]);
    const withoutBox = computeStateDocumentDims(
      [],
      [{ from: 'a', to: 'b', points: [{ x: 0, y: 0 }], label: { text: l.text, x: l.x, y: l.y } }],
    );
    expect(withBox).toEqual(withoutBox);
  });
});
