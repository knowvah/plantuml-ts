/**
 * T11 (svg-sprite-nanoparser, ADR-5) -- pins that `SvgNanoParser` decomposition
 * gives sprites TWO structurally independent dimension channels: a DECLARED
 * box (what `<svg width=/height=>` says) and an INK box (the union of what
 * actually gets drawn). One sprite cannot prove this -- a single input that
 * happens to draw its full declared box is indistinguishable from a port
 * where the two channels were never actually split. `bi-globe` and
 * `bi-bootstrap-fill` (both `assets/stdlib/bootstrap1.13.1/bootstrap.puml`,
 * both declared 16x16) are the pair that disambiguates it: identical
 * declaration, different ink, for a reason (arc endpoints) that is provable
 * in isolation.
 *
 * Mechanism (jar-verified, `plans/s1l-leaf-sizing/ledger.md` SS "The
 * SVG-sprite ink gap", third/corrected version; figures restated in
 * `src/core/klimt/sprite/SpriteSvg.ts:56-93`'s `svgInkBox` doc comment):
 * `bi-globe`'s outer boundary is drawn as ONE `<path>` whose first two
 * segments are `a8 8 0 1 1 16 0` / `A8 8 0 0 1 0 8` -- a pair of SVG arcs
 * that together trace the full circle. `UPath#addInternal`'s `SEG_ARCTO`
 * branch (`src/core/klimt/shape/UPath.ts`) records ONLY an arc segment's
 * endpoint, never its swept extent, so those two arcs alone contribute the
 * single point pair (0,8)/(16,8) to the path's minmax -- a DEGENERATE
 * (zero-height) box, proven directly in the "arc contributes only its
 * endpoint" describe block below. The path's real y-extent (1.077-14.923,
 * height 13.846) comes entirely from the OTHER, non-arc segments describing
 * the icon's interior detail -- narrower than the full 16-tall circle the
 * arcs actually trace. `bi-bootstrap-fill` has no arcs at all (its outline
 * is Bezier/line only), so its ink reproduces the full declared 16x16.
 *
 * That is the whole story behind the mission's pinned jar figures (usecase
 * ellipse at scale 2.5, both entities in `bootstrap-0`):
 *   bi-globe          -> rx=34.729  ry=28.3832
 *   bi-bootstrap-fill -> rx=37.4784 ry=30.5827
 * Deriving those exact rx/ry values requires the usecase ellipse-fit
 * formula in `usecase-footprint.ts`/`measureUsecase` -- out of THIS task's
 * scope (svg-sprite-nanoparser ADR-3; touching that file is mission stop
 * condition 6, and it is shared with the class engine). What this test pins
 * instead is the geometry those figures are DOWNSTREAM of: the ink box
 * `SvgNanoParser`'s decomposed primitives produce, at the same 2.5 scale,
 * for both sprites -- which is the load-bearing input the ellipse-fit
 * consumes, and the thing this mission's architecture fix (ADR-2) actually
 * changed.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/AtomSprite.java#calculateDimensionSlow
 */
import { describe, expect, it } from 'vitest';
import { SvgNanoParser } from '../../../../../src/core/klimt/sprite/SvgNanoParser.js';
import { pathBBox } from '../../../../../src/core/klimt/sprite/svg-path-bbox.js';
import { svgDimension, svgInkBox } from '../../../../../src/core/klimt/sprite/SpriteSvg.js';
import type { UPath } from '../../../../../src/core/klimt/shape/UPath.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../src/core/klimt/UParam.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

/** Verbatim from `assets/stdlib/bootstrap1.13.1/bootstrap.puml`, `sprite
 *  bi-globe` -- confirmed byte-for-byte against the source file at
 *  authoring time. A single `<path>` whose outline is two arcs (the outer
 *  circle) plus interior Bezier/line detail. */
const BI_GLOBE_D =
  'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z';
const BI_GLOBE_SVG = `<svg width="16" height="16">\n  <path d="${BI_GLOBE_D}"/>\n</svg>`;

/** Verbatim from the same bundle, `sprite bi-bootstrap-fill` -- two `<path>`
 *  elements, no arcs, no `<g>`. Confirmed byte-for-byte against the source
 *  file at authoring time. */
const BI_BOOTSTRAP_FILL_D1 =
  'M6.375 7.125V4.658h1.78c.973 0 1.542.457 1.542 1.237 0 .802-.604 1.23-1.764 1.23zm0 3.762h1.898c1.184 0 1.81-.48 1.81-1.377 0-.885-.65-1.348-1.886-1.348H6.375z';
const BI_BOOTSTRAP_FILL_D2 =
  'M4.002 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4zm1.06 12V3.545h3.399c1.587 0 2.543.809 2.543 2.11 0 .884-.65 1.675-1.483 1.816v.1c1.143.117 1.904.931 1.904 2.033 0 1.488-1.084 2.396-2.888 2.396z';
const BI_BOOTSTRAP_FILL_SVG =
  `<svg width="16" height="16">\n` +
  `  <path d="${BI_BOOTSTRAP_FILL_D1}"/>\n` +
  `  <path d="${BI_BOOTSTRAP_FILL_D2}"/>\n` +
  `</svg>`;

/** Just the outer-circle arc pair from `bi-globe`, isolated so the arc's
 *  own contribution to minmax can be checked in isolation from the
 *  interior detail that (in the real sprite) happens to narrow the box
 *  further. If `SEG_ARCTO` contributed the arc's true swept extent, this
 *  would bound a full 16-diameter circle centred at (8,8): [0,16]x[0,16].
 *  If it contributes only the endpoint (upstream's actual rule), the two
 *  arc endpoints (0,8) and (16,8) share one y value, so the box DEGENERATES
 *  to zero height. */
const OUTER_CIRCLE_ONLY_D = 'M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8';
const OUTER_CIRCLE_ONLY_SVG = `<svg width="16" height="16">\n  <path d="${OUTER_CIRCLE_ONLY_D}"/>\n</svg>`;

const DUMMY_PARAM: UParam = {
  getStroke: () => {
    throw new Error('not used in these tests');
  },
  getColor: () => '#000000',
  getBackcolor: () => '#FFFFFF',
  getTranslate: () => {
    throw new Error('not used in these tests');
  },
};

const DUMMY_BOUNDER: StringBounder = {
  calculateDimension: () => {
    throw new Error('not used in these tests');
  },
};

/** Minimal `UGraphic` double that records every drawn shape -- same shape
 *  as `render-atoms.ts`'s (unexported) `SpritePrimitiveCollector`, rebuilt
 *  here since that class is private to its module and this task's
 *  write-set is exactly one new test file (no shared helper may be added).
 *  Every fixture in this file draws `<path>` only, so `drawn` is typed and
 *  cast as `UPath[]`, matching the sibling `SvgNanoParser.test.ts`'s own
 *  convention (`ug.drawn[0] as UPath`). */
class PathCollector implements UGraphic {
  readonly drawn: UShape[];
  private readonly translate: UTranslate;

  constructor(drawn: UShape[] = [], translate: UTranslate = UTranslate.none()) {
    this.drawn = drawn;
    this.translate = translate;
  }

  apply(change: UChange): UGraphic {
    const translate = change instanceof UTranslate ? this.translate.compose(change) : this.translate;
    return new PathCollector(this.drawn, translate);
  }

  draw(shape: UShape): void {
    this.drawn.push(shape);
  }

  getParam(): UParam {
    return DUMMY_PARAM;
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return DUMMY_BOUNDER;
  }
}

/** Union bbox of every drawn `UPath`'s own minmax -- the ink box, as a
 *  faithful decomposition consumer (draw-site code, e.g. `render-atoms.ts`)
 *  would compute it from `DrawablePrimitive[]`. */
function unionBBox(paths: readonly UPath[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const path of paths) {
    minX = Math.min(minX, path.getMinX());
    minY = Math.min(minY, path.getMinY());
    maxX = Math.max(maxX, path.getMaxX());
    maxY = Math.max(maxY, path.getMaxY());
  }
  return { minX, minY, maxX, maxY };
}

/** Both sprites are drawn at the usecase-diagram scale from the jar's own
 *  `bootstrap-0` fixture (`plans/s1l-leaf-sizing/ledger.md`), so the scaled
 *  figures asserted below correspond to what actually reaches the ellipse
 *  fit, not an arbitrary test-only scale. */
const BOOTSTRAP_0_SCALE = 2.5;

/** Tolerance for every geometric assertion below: 1e-9. These are pure,
 *  deterministic floating-point computations (arc-to-Bezier conversion,
 *  affine scale) with no measurement noise to absorb -- the same
 *  tolerance `SvgNanoParser.test.ts` (T8/T13) already uses for identical
 *  reasons. Anything looser would risk masking a real regression; anything
 *  tighter would fail on ordinary IEEE-754 rounding of these irrational
 *  (arc-derived) coordinates. */
const FP_TOLERANCE = 9;

describe('SvgNanoParser -- declared-vs-ink channel independence (T11, ADR-5)', () => {
  describe('acceptance criterion 1 -- bi-globe: primitives reproduce svgInkBox (the jar-verified ink box)', () => {
    it("decomposes bi-globe's single <path> to a UPath whose minmax equals pathBBox scaled by 2.5", () => {
      const collector = new PathCollector();
      new SvgNanoParser(BI_GLOBE_SVG).drawU(collector, BOOTSTRAP_0_SCALE, undefined, undefined);

      expect(collector.drawn).toHaveLength(1);
      const box = unionBBox(collector.drawn as UPath[]);
      const unscaled = pathBBox(BI_GLOBE_D)!;

      expect(box.minX).toBeCloseTo(unscaled.minX * BOOTSTRAP_0_SCALE, FP_TOLERANCE);
      expect(box.minY).toBeCloseTo(unscaled.minY * BOOTSTRAP_0_SCALE, FP_TOLERANCE);
      expect(box.maxX).toBeCloseTo(unscaled.maxX * BOOTSTRAP_0_SCALE, FP_TOLERANCE);
      expect(box.maxY).toBeCloseTo(unscaled.maxY * BOOTSTRAP_0_SCALE, FP_TOLERANCE);

      // Exact measured values (2026-07-30, this port): {0, 2.6925, 40, 37.3075}.
      // Width 40 = declared 16 * scale; height 34.615 = ink 13.846 * scale --
      // narrower than the declared 40, which is the whole point: this is the
      // geometry that feeds the jar's rx=34.729/ry=28.3832 (SpriteSvg.ts:56-93,
      // ledger "The SVG-sprite ink gap" third version). Deriving rx/ry
      // themselves needs the ellipse-fit formula in usecase-footprint.ts,
      // out of this task's scope (ADR-3, stop condition 6).
      expect(box.minX).toBeCloseTo(0, FP_TOLERANCE);
      expect(box.minY).toBeCloseTo(2.6925, FP_TOLERANCE);
      expect(box.maxX).toBeCloseTo(40, FP_TOLERANCE);
      expect(box.maxY).toBeCloseTo(37.3075, FP_TOLERANCE);

      // Also reproduces svgInkBox's own (unscaled) computation exactly --
      // the T5 ADR-1 equivalence proof extended to the scaled draw path.
      const ink = svgInkBox(BI_GLOBE_SVG)!;
      expect(box.maxX - box.minX).toBeCloseTo(ink.width * BOOTSTRAP_0_SCALE, FP_TOLERANCE);
      expect(box.maxY - box.minY).toBeCloseTo(ink.height * BOOTSTRAP_0_SCALE, FP_TOLERANCE);
    });
  });

  describe('acceptance criterion 2 -- bi-bootstrap-fill: identical declaration, DIFFERENT ink than bi-globe', () => {
    it('decomposes both <path>s to a union box matching the FULL declared 16x16, scaled', () => {
      const collector = new PathCollector();
      new SvgNanoParser(BI_BOOTSTRAP_FILL_SVG).drawU(collector, BOOTSTRAP_0_SCALE, undefined, undefined);

      expect(collector.drawn).toHaveLength(2);
      const box = unionBBox(collector.drawn as UPath[]);

      // Exact measured values: {0.005, 0, 40.005, 40} -- the 0.005 offset is
      // a real sub-pixel artifact of D2's own path data (its first point is
      // x=4.002, not exactly at the left edge; the cubic control geometry
      // pushes minX to 0.002 unscaled), not a scale-related error --
      // confirmed against pathBBox(BI_BOOTSTRAP_FILL_D2) directly below.
      expect(box.minX).toBeCloseTo(0.005, FP_TOLERANCE);
      expect(box.minY).toBeCloseTo(0, FP_TOLERANCE);
      expect(box.maxX).toBeCloseTo(40.005, FP_TOLERANCE);
      expect(box.maxY).toBeCloseTo(40, FP_TOLERANCE);

      const unscaledD2 = pathBBox(BI_BOOTSTRAP_FILL_D2)!;
      expect(box.minX).toBeCloseTo(unscaledD2.minX * BOOTSTRAP_0_SCALE, FP_TOLERANCE);
      expect(box.maxX).toBeCloseTo(unscaledD2.maxX * BOOTSTRAP_0_SCALE, FP_TOLERANCE);

      // THE central assertion: at IDENTICAL scale and IDENTICAL declared
      // dimensions, bi-bootstrap-fill's ink height (40, full box) differs
      // from bi-globe's (34.615, narrowed by the arc-endpoint rule) --
      // this is the jar's rx=37.4784/ry=30.5827 vs rx=34.729/ry=28.3832
      // pair, and it is why one input could never prove the channels are
      // independent: a test using only bi-globe (or only bi-bootstrap-fill)
      // cannot distinguish "ink correctly computed" from "ink accidentally
      // equals declared for every sprite".
      const globeCollector = new PathCollector();
      new SvgNanoParser(BI_GLOBE_SVG).drawU(globeCollector, BOOTSTRAP_0_SCALE, undefined, undefined);
      const globeBox = unionBBox(globeCollector.drawn as UPath[]);
      expect(box.maxY - box.minY).not.toBeCloseTo(globeBox.maxY - globeBox.minY, 1);
      expect(box.maxY - box.minY).toBeGreaterThan(globeBox.maxY - globeBox.minY);
    });
  });

  describe('acceptance criterion 3 -- declared box is IDENTICAL (16x16) for both, while ink differs', () => {
    it('svgDimension reports 16x16 for both sprites regardless of their different ink', () => {
      // svgDimension (SpriteSvg.ts) is the DECLARED channel: it reads only
      // the <svg width=/height=> attributes/viewBox, never a <path> d=.
      // This is a structurally SEPARATE computation from unionBBox above --
      // proving the two channels cannot recollapse, since nothing here
      // routes through path geometry at all.
      expect(svgDimension(BI_GLOBE_SVG, 'width')).toBe(16);
      expect(svgDimension(BI_GLOBE_SVG, 'height')).toBe(16);
      expect(svgDimension(BI_BOOTSTRAP_FILL_SVG, 'width')).toBe(16);
      expect(svgDimension(BI_BOOTSTRAP_FILL_SVG, 'height')).toBe(16);

      // Ink, by contrast, is only equal to the declared box for ONE of the
      // two (bi-bootstrap-fill). If the two channels ever recollapse (e.g.
      // someone routes ink back through `width`/`height`, ADR-2's explicit
      // non-goal), bi-globe's ink height would silently become 40 (the
      // declared, scaled value) instead of 34.615 -- this assertion is the
      // one that would catch that regression.
      const globeCollector = new PathCollector();
      new SvgNanoParser(BI_GLOBE_SVG).drawU(globeCollector, BOOTSTRAP_0_SCALE, undefined, undefined);
      const globeInk = unionBBox(globeCollector.drawn as UPath[]);
      const declaredHeightScaled = svgDimension(BI_GLOBE_SVG, 'height')! * BOOTSTRAP_0_SCALE;

      expect(globeInk.maxY - globeInk.minY).toBeCloseTo(34.615, FP_TOLERANCE);
      expect(globeInk.maxY - globeInk.minY).not.toBeCloseTo(declaredHeightScaled, 1);
      expect(globeInk.maxY - globeInk.minY).toBeLessThan(declaredHeightScaled);
    });
  });

  describe('acceptance criterion 4 -- the arc-endpoint mechanism behind criterion 3, isolated', () => {
    it("bi-globe's outer circle (drawn as two arcs) degenerates to a ZERO-HEIGHT box in isolation", () => {
      // The full circle these two arcs trace has radius 8 centred at (8,8),
      // so its TRUE extent is [0,16]x[0,16] -- a 16-tall shape. If
      // UPath#addInternal's SEG_ARCTO branch contributed that swept extent,
      // this isolated fixture's box would be 16 tall. Instead, upstream's
      // rule (ported verbatim, ADR-1) contributes ONLY each arc's endpoint:
      // (0,8) for the move-to and both arc's shared endpoint, (16,8) for
      // the midpoint, (0,8) again closing it -- every recorded y value is
      // 8, so the box's height is exactly 0. This is the mechanism that
      // lets the REST of bi-globe's path (the interior detail, y in
      // [1.077, 14.923]) solely determine the sprite's real ink height,
      // narrower than the full 16-tall circle the arcs actually draw.
      const collector = new PathCollector();
      new SvgNanoParser(OUTER_CIRCLE_ONLY_SVG).drawU(collector, 1, undefined, undefined);

      expect(collector.drawn).toHaveLength(1);
      const box = unionBBox(collector.drawn as UPath[]);

      expect(box.minX).toBeCloseTo(0, FP_TOLERANCE);
      expect(box.maxX).toBeCloseTo(16, FP_TOLERANCE);
      expect(box.minY).toBeCloseTo(8, FP_TOLERANCE);
      expect(box.maxY).toBeCloseTo(8, FP_TOLERANCE);
      expect(box.maxY - box.minY).toBeCloseTo(0, FP_TOLERANCE);

      // Cross-check against pathBBox directly -- ADR-1's equivalence proof
      // (T5) applied to this isolated fixture, not just the full sprite.
      const direct = pathBBox(OUTER_CIRCLE_ONLY_D)!;
      expect(box.minX).toBeCloseTo(direct.minX, FP_TOLERANCE);
      expect(box.maxX).toBeCloseTo(direct.maxX, FP_TOLERANCE);
      expect(box.minY).toBeCloseTo(direct.minY, FP_TOLERANCE);
      expect(box.maxY).toBeCloseTo(direct.maxY, FP_TOLERANCE);
    });
  });
});
