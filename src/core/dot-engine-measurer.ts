/**
 * The single install point for `@knowvah/dot-engine`'s text measurer.
 *
 * plantuml-ts is a pure SVG library — no DOM, no canvas. @knowvah/dot-engine
 * otherwise auto-selects a canvas-backed text measurer when a `document` is
 * present (jsdom, browsers), which both violates that guarantee and is
 * unimplemented under jsdom. Pin its built-in lookup-table measurer:
 * canvas-free and deterministic across Node, Workers, and the browser.
 *
 * `setTextMeasurer` sets a MODULE-GLOBAL inside the engine, so every consumer
 * shares whichever install ran last. Importing this module for its side effect
 * is how a consumer opts in.
 *
 * NOT yet the only install point: `core/graph-layout.ts` and
 * `diagrams/description/frontier-shadow-layout.ts` each still run the identical
 * `setTextMeasurer(new LutTextMeasurer())` at module load. Same measurer, same
 * argument, so the duplication is inert — whichever import order wins installs
 * the same object. Folding those two into this module was deliberately NOT done
 * here: `graph-layout.ts` carries three pre-existing complexity-hook violations
 * (`parseNodeRenderCenters`, `extractPortLabelPositions`, `shiftToOrigin`), so
 * any edit to it is blocked until those are refactored, and refactoring them is
 * out of scope for the `@startdot` passthrough.
 *
 * How much the choice matters differs sharply by consumer:
 *
 *  - `core/graph-layout.ts` (the svek family's layout seam): edge-label sizing
 *    only — nodes are laid out `fixedsize` from caller-supplied metrics.
 *  - `diagrams/dot/` (`@startdot` passthrough): EVERYTHING. That path hands raw
 *    DOT to the engine and emits the engine's own SVG verbatim, so the engine
 *    measures every node label itself. Measured against the pinned oracle jar
 *    on the five cached `@startdot` fixtures: the default (`EstimateTextMeasurer`)
 *    produces 8/5/4/36/33 diffs; `LutTextMeasurer` produces 0/0/0/0/0. The
 *    lookup table is what reproduces graphviz's own built-in Times metrics.
 */
import { setTextMeasurer, LutTextMeasurer } from '@knowvah/dot-engine';
import type { TextMeasurer, TextSize, TextVariantFlags } from '@knowvah/dot-engine';

/**
 * `_dim_<x>_<y>_` — upstream's own escape from text measurement.
 *
 * @see ~/git/plantuml/src/main/java/smetana/core/Macro.java:1292-1305
 *
 * A record cell's size normally comes from measuring its label, but the json
 * family already knows each cell's exact dimensions before layout and must not
 * have them re-derived. Upstream solves this by encoding them INTO the label
 * and decoding them in `hackInitDimensionFromLabel` — Smetana cannot measure
 * text at all, so the sentinel is its only route.
 *
 * This port keeps the same mechanism rather than inventing a parallel one, so
 * the label `SmetanaForJson` builds is the label this port builds. Note the
 * group order is upstream's, and it is transposed like everything else in this
 * family: group 1 lands in `x`, group 2 in `y`, and `SmetanaForJson` emits
 * `_dim_<lineHeight>_<colWidth>_`.
 */
const DIM_SENTINEL = /^_dim_([.\d]+)_([\d.]+)_$/;

/**
 * The lookup-table measurer, plus upstream's `_dim_` decoding.
 *
 * Strictly additive: a label that is not the sentinel is measured exactly as
 * before, so class/description/state/dot layout is untouched. Only the json
 * family emits such labels. Upstream carries the identical exposure — a user
 * whose own text is literally `_dim_1_2_` would hit the same branch there.
 */
class DimAwareLutMeasurer implements TextMeasurer {
  private readonly lut = new LutTextMeasurer();

  measure(
    text: string,
    fontname: string,
    fontsize: number,
    flags?: TextVariantFlags,
  ): TextSize {
    const m = DIM_SENTINEL.exec(text);
    if (m !== null) return { w: Number(m[1]), h: Number(m[2]) };
    return this.lut.measure(text, fontname, fontsize, flags);
  }
}

setTextMeasurer(new DimAwareLutMeasurer());
