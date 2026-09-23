/**
 * cdd-T35/cdd-B10FU: an edge label's `TextBlockMarged` ink term -- split
 * out of `class-ink-box.ts` (500-line hook cap) purely to keep that file
 * under the cap; a pure move plus the new multi-line sibling, no behavior
 * change to the single-line function.
 */
import type { EdgeGeo } from './layout.js';
import { labelMarginOf } from './class-layout-edge-labels.js';
import { addPoint } from './class-ink-shapes.js';
import type { InkBox } from './class-ink-shapes.js';

/**
 * cdd-T35 (A5/M7): `SvekEdge#addVisibilityModifier` (`svek/SvekEdge.java
 * :372-373`) closes the MAIN label's block by wrapping it in
 * `TextBlockUtils.withMargin(block, marginLabel, marginLabel)` --
 * `marginLabel` is {@link labelMarginOf}'s own 1px/6px split. `withMargin`
 * (`klimt/shape/TextBlockUtils.java:64-68`) builds a `TextBlockMarged`,
 * whose `drawU` (`klimt/shape/TextBlockMarged.java:76-84`) draws an
 * INVISIBLE `UEmpty` sized to the MARGINED block BEFORE drawing the inner
 * label shifted by `(marginLabel, marginLabel)` -- `LimitFinder#drawEmpty`
 * (`klimt/drawing/LimitFinder.java:159-162`) walks that `UEmpty` with NO
 * inset, so it reaches `marginLabel` px further out on EVERY side than the
 * label's own glyph ink `class-ink-box.ts#addEdgeTextInk` already models.
 *
 * `layout-ink-extent.ts`'s own module doc comment (`:73-82`) previously
 * named "edge-label `UText` ink" as a solved exception (G2 N35/G9 T16) but
 * never modeled this SECOND, independent ink source the SAME
 * `TextBlockMarged` wrapper draws -- `class-layout-edge-labels.ts
 * #withLabelMargin` already applies this EXACT margin to the label's
 * GRAPHVIZ LAYOUT box size (so the label's own drawn POSITION already
 * matches jar to sub-0.01px), but nothing fed it into the document's own
 * ink walk. Jar-verified via a debug-instrumented local oracle build
 * (`LimitFinder#addPoint`/`SvekResult#calculateDimension`/`SvgGraphics
 * #ensureVisible` traced directly against `camupi-97-gezi072`, `class a;
 * class b; a --> b : visible`): the real ink walk draws `UEmpty x=19.89
 * y=86.0` immediately before the label's own `UText x=20.89 y=97.11`,
 * reaching `maxX=58.1275` -- exactly `label.x + label.width + 1` (the
 * `UText`-only rule tops out at `57.1275`) -- which is the SAME 1px this
 * port's `minDim` undershot jar's by (`78.1275` margined vs our
 * `77.1275`), the exact defect this task diagnoses.
 *
 * X-only: the `UEmpty`'s Y span (`[86, 101]`, height 15) does NOT line up
 * with `addEdgeTextInk`'s own baseline-derived Y rule (`[85.611,
 * 98.611]`) by any simple offset of `marginLabel` -- the block's own
 * vertical top is a LAYOUT quantity (the marged block's pre-ascent origin),
 * not derivable from the glyph baseline `EdgeGeo.label.y` this port
 * stores, so it stays NOT modeled (documented simplification, not silently
 * dropped, matching this file's own established convention) until a
 * fixture isolates it from the classifier boxes' own dominating Y reach.
 * `label.y` is used as BOTH new points' own y (a value already inside the
 * Y range `addEdgeTextInk` established for the SAME label), so this
 * function only ever WIDENS the box on X, never perturbs Y.
 *
 * Applies to `EdgeGeo.label` only -- the main label -- matching
 * `addVisibilityModifier`'s own single caller (`SvekEdge.java:302`);
 * `tailLabel`/`headLabel` are built straight from `Display.create` and
 * never pass through it (`labelMarginOf`'s own doc comment). Skipped when
 * `e.noteBox` is set: `computeNoteMergedLabelAttrs`
 * (`class-layout-edge-labels.ts`) already bakes this SAME margin into
 * `label.width` for a `note on link` merge (`withLabelMargin`'s own doc
 * comment), so adding it again here would double-count it.
 */
export function addEdgeLabelMarginInk(box: InkBox, e: EdgeGeo): void {
  const label = e.label;
  if (label === undefined || e.noteBox !== undefined) return;
  const m = labelMarginOf(e);
  addPoint(box, label.x - m, label.y);
  addPoint(box, label.x + label.width + m, label.y);
}

/**
 * cdd-B10FU (`dofima`/`jireze`/`sicile`/`lapoma`/`pixexi`): {@link
 * addEdgeLabelMarginInk}'s multi-line twin -- `addVisibilityModifier`
 * wraps the WHOLE `create0` multi-line block REGARDLESS of line count
 * (`SvekEdge.java:296-306`; `hasSeveralGuideLines` only gates the separate
 * `addMagicArrow` call). `min(line.x)`/`max(line.x+line.width)` over every
 * line always recovers the block's true bounding box under any alignment
 * (the widest line touches both edges under left/center; every line's own
 * right edge already equals the block's under right-align) -- no new
 * stored field needed. Y unmodeled, same reason as the single-line
 * sibling: the block's real top needs a `StringMeasurer` this pure-
 * geometry walk was never threaded with.
 */
export function addMultiLineLabelMarginInk(box: InkBox, e: EdgeGeo): void {
  const lines = e.labelLines;
  if (lines === undefined || lines.length === 0 || e.noteBox !== undefined) return;
  const minX = Math.min(...lines.map((l) => l.x));
  const maxX = Math.max(...lines.map((l) => l.x + l.width));
  const m = labelMarginOf(e);
  const y = lines[0]!.y;
  addPoint(box, minX - m, y);
  addPoint(box, maxX + m, y);
}
