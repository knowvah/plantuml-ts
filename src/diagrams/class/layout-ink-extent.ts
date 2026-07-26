/**
 * layout-ink-extent.ts — G2/N5: the `SvekResult`/`TextBlockExporter`
 * document-dimension recipe (svek/SvekResult.java:126-133,
 * core/TextBlockExporter.java:200-202,751-753), ported for CLASS's own
 * pure-string layout (no klimt `UGraphic`, so `renderer-ink-extent.ts`'s
 * `LimitFinder`-over-`UGraphic` approach cannot be reused directly — this
 * module reproduces the SAME per-shape ink rules as plain-geometry math over
 * `ClassifierGeo`/`NamespaceGeo`/`EdgeGeo`/`NoteGeo`).
 *
 * Root-caused: N4 left class's non-degenerate (DOT-driven) path returning
 * `layoutGraph()`'s own raw `result.width`/`result.height` as the document
 * canvas size — dot's own layout-margin convention, unrelated to jar's real
 * SVG dimension formula. Jar-verified (debug instrumentation of a local
 * oracle build, `SvekResult#calculateDimension`/`TextBlockExporter
 * #calculateFinalDimension`/`SvgGraphics#ensureVisible` traced directly, see
 * `plans/g2-class-svg/ledger.md` N5): the REAL chain is
 *
 *  1. `SvekResult#calculateDimension` — a `LimitFinder` ink walk over the
 *     SAME clusters/nodes/edges the real draw pass draws, `.delta(15, 15)`.
 *     Per-shape ink rules (upstream `LimitFinder.java`, ported 1:1 in
 *     `core/klimt/drawing/LimitFinder.ts`):
 *       - Classifier/note box: the visible bordered `URectangle` itself
 *         gets the classic `-1`-inset corners, but `EntityImageClass`'s
 *         header/body composition ALSO draws an invisible full-box
 *         `UEmpty` reservation sized `(widthTotal, heightTotal)`
 *         (`LimitFinder#drawEmpty` — plain bbox, no inset) that strictly
 *         dominates the rect's own max corner by 1px. See `addRectInk`'s
 *         own doc comment below for the jar-verified net rule.
 *       - `UPath` (namespace cluster's DEFAULT rounded-corner outline,
 *         `roundCorner!=0`; edge splines): plain bounding box, no inset.
 *       - `UPolygon` (namespace cluster outline under `skinparam style
 *         strictuml`, `USymbolFolder#asBig`'s `roundCorner=0` branch --
 *         G2 N60, item 42; edge arrowhead extremities -- NOT note shapes,
 *         see G2/N14 correction below): `x` padded by `HACK_X_FOR_POLYGON =
 *         10` on both sides, `y` unpadded. G2 N54: arrowhead extremities are
 *         modeled via `renderer-arrowhead.ts#edgeExtremityInk` -- a REAL
 *         `LimitFinder` walk over each edge's placed `Extremity#drawU`, so
 *         every decor's OWN shape (`UPolygon`/`UEllipse`/`URectangle`/
 *         `UPath`/`ULine`) gets its correct jar rule automatically, not just
 *         the polygon case. Namespace clusters instead dispatch on the
 *         precomputed `NamespaceGeo.inkShape` (`addNamespaceInk` below) --
 *         no klimt shape to walk, since class's namespace outline is a plain
 *         SVG string, not a `UGraphic` draw.
 *       - `URectangle` (namespace cluster outline under `skinparam
 *         packageStyle rect`, `USymbolRectangle#asBig` -- G2 N60, item 42):
 *         `addPoint(x-1,y-1)`, `addPoint(x+w-1, y+h-1)` (no shadow modeled).
 *  2. `TextBlockExporter#calculateFinalDimension` adds the diagram's outer
 *     margin: `CucaDiagram#getDefaultMargins()` = `topRightBottomLeft(0, 5,
 *     5, 0)` (top=0, right=5, bottom=5, left=0) — same recipe already
 *     verified for description (`renderer-ink-extent.ts`, shared upstream
 *     base class), unconditionally +5 width +5 height for the whole cuca
 *     family (component/usecase/class/object/state all share
 *     `CucaDiagram`).
 *  3. `SvgGraphics#ensureVisible` — the REAL draw pass's own bounds tracker
 *     — is seeded with this `minDim` (`ensureVisible(minDim.width,
 *     minDim.height)`) and the SVG root's `width`/`height` are written from
 *     its own `maxX`/`maxY`, each computed as `(int)(v + 1)` — a
 *     truncating "+1" on top of the already-margined dimension. For
 *     positive values this is `Math.floor(v + 1)`, NOT a plain pass-through
 *     of `minDim` — every prior N-iteration's "ink extent + 20" hypothesis
 *     was short by exactly this `+1` (jar-verified: `bipudo-23-xavu432`'s
 *     debug trace gave `minDim = (154.15, 177.0)`, final SVG
 *     `width="155px" height="178px"` = `floor(154.15+1)` / `floor(177+1)`).
 *
 * G2 N46: steps 2+3 above run on the FULLY chrome-composed `TextBlock`
 * (`TitledDiagram#addChrome` → `DiagramChromeFactory.create` → THEN
 * `TextBlockExporter#calculateFinalDimension`/`SvgGraphics#ensureVisible`
 * at export time) — NOT on the raw diagram body before chrome wraps it. See
 * {@link computeClassRawInkDims}'s own doc comment for the full mechanism
 * and jar evidence; that split is what {@link computeClassRawInkDims} /
 * {@link applyClassDocumentMargin} exist to model.
 *
 * NOT modeled (documented simplification, not silently dropped): the SAME
 * `UEmpty`-reservation quirk `addRectInk` found for classifiers has NOT been
 * independently jar-verified for notes (treated with the classic rect-ink
 * rule as an approximation — notes are a small corpus fraction) — usually
 * dominated by the classifier boxes' own ink reach, named remainder for a
 * future iteration, not chased further this iteration. Edge-label/row
 * `UText` ink WAS in this "usually dominated" bucket until G2 N35 found the
 * exception: see `lollipopRowInk` below. G2 N54: edge arrowhead extremities'
 * own ink contribution (formerly named here) is now modeled — see the
 * `UPolygon` bullet above and `renderer-arrowhead.ts#edgeExtremityInk`.
 *
 * NOT for degenerate single-leaf geometries — `EntityImageDegenerated` is a
 * different upstream class with its own dimension formula (see
 * `layout.ts#degenerateSingleClassifier`'s own doc comment).
 *
 * G2/N11: `SvekResult#calculateDimension`'s FIRST step (svek/
 * SvekResult.java:130-134) is NOT just the ink walk above — it ALSO calls
 * `clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY())`
 * (`DotStringFactory#moveDelta`, svek/DotStringFactory.java:653-661), a
 * uniform translate applied ONCE to every already-laid-out node/cluster/edge
 * position so the diagram's own ink extent's top-left corner lands at
 * `(6, 6)` (the SAME `JAR_INK_MARGIN` constant description's own
 * `layout-ink-shift.ts#computeInkShift` already jar-verified, G1b/J1 — this
 * IS the identical upstream mechanism, `SvekResult` is shared base-class
 * machinery for every `CucaDiagram` subtype). `computeClassDocumentDims`
 * above only ever modeled the RETURNED dimension (`minMax.getDimension()
 * .delta(15,15)`, translation-invariant, so the dims-only fix already
 * landed correctly N4→N5) — it never modeled the SIDE EFFECT that shifts
 * every drawn position. `layout.ts#layoutSinglePage` fed `layoutGraph()`'s
 * raw graphviz-normalized positions straight through with NO equivalent
 * shift, leaving every classifier/namespace/edge/note off by a constant
 * per-fixture `(dx, dy)` — jar-verified against `jalexi-21-xoje231` (two
 * bare classifiers, no edges): our raw `rect x="0" y="0"`/`x="94" y="0"`
 * vs jar's `x="7" y="7"`/`x="101" y="7"` — EXACTLY `(+7,+7)` on BOTH boxes
 * (uniform, not per-element), matching `6 - (-1) = 7` (a rect's own ink-min
 * corner is `x-1`, per `addRectInk` above, so an unshifted box sitting at
 * the graph's raw origin `x=0` has ink-min-x `-1`). Confirmed via N10's own
 * `ducoka-05-cuce457` sample (`rect y="0"` vs jar's `y="7"`, same `+7`
 * delta) — this is the SAME already-named "~7-8px multi-component/box
 * position/margin residual" (N7/N10), not a @knowvah/dot-engine coordinate issue:
 * the shift is a PURE post-layout translation this port never applied,
 * independent of dot's own routing accuracy.
 */
import type { ClassifierGeo, EdgeGeo, NamespaceGeo } from './layout.js';
import type { NoteGeo } from './note-layout.js';

/** `CucaDiagram#getDefaultMargins()` (net/atmp/CucaDiagram.java:719-722) —
 *  "Strange numbers here for backwards compatibility": top=0, right=5,
 *  bottom=5, left=0. Same constants as `renderer-ink-extent.ts` (shared
 *  upstream base class); duplicated here rather than imported since class
 *  has no klimt dependency and this module must stay klimt-free. */
import {
  buildInkBox,
  DOCUMENT_MARGIN_TOP, DOCUMENT_MARGIN_RIGHT, DOCUMENT_MARGIN_BOTTOM, DOCUMENT_MARGIN_LEFT,
  INK_DELTA, JAR_INK_MARGIN,
} from './class-ink-box.js';

export interface ClassDocumentDims {
  readonly width: number;
  readonly height: number;
}

/**
 * G2 N66 (near-zero harvest, `vinujo-78-kapo329`): `<rect>` dims for
 * `skinparam diagramBorderColor` -- jar's `TextBlockExporter
 * #maybeDrawBorder` (`core/TextBlockExporter.java:215-232`) draws the
 * border rect at the PRE-floor margined dims (`calculateFinalDimension`'s
 * OWN raw result), NOT the final truncated canvas size {@link
 * applyClassDocumentMargin} returns -- minus the stroke thickness on each
 * axis (`URectangle.build(dim.width - stroke.getThickness(), dim.height -
 * stroke.getThickness())`). `x`/`y` are always `(0,0)` -- the border is the
 * OUTERMOST draw, at no prior `UGraphic` translate. Jar-verified byte-exact
 * against `vinujo-78-kapo329` (`rawWidth=109.7875` -> margined
 * `114.7875` -> rect width `113.7875`; `rawHeight=62` -> margined `67` ->
 * rect height `66`, jar's real golden `<rect x="0" y="0" width="113.7875"
 * height="66" fill="none" style="stroke:#000000;stroke-width:1;"/>`).
 * `thickness` defaults to jar's own `UStroke.simple()` (1) -- `LineParam
 * .diagramBorder`/`CornerParam.diagramBorder` (explicit thickness/round-
 * corner overrides) are NOT modeled, zero corpus reach for either
 * (`theme.ts#diagramBorderColor`'s own doc comment).
 */
export function computeClassBorderRectDims(
  rawDims: ClassDocumentDims,
  thickness: number,
): ClassDocumentDims {
  const marginedWidth = rawDims.width + DOCUMENT_MARGIN_LEFT + DOCUMENT_MARGIN_RIGHT;
  const marginedHeight = rawDims.height + DOCUMENT_MARGIN_TOP + DOCUMENT_MARGIN_BOTTOM;
  return { width: marginedWidth - thickness, height: marginedHeight - thickness };
}

/**
 * G2 N46: the ink-walk HALF of {@link computeClassDocumentDims} only —
 * `SvekResult#calculateDimension`'s own `.delta(15, 15)` ink box, WITHOUT
 * `CucaDiagram#getDefaultMargins()`'s `(0, 5, 5, 0)` OR `SvgGraphics
 * #ensureVisible`'s truncating `+1`. Jar-verified (debug-instrumented local
 * oracle build, `DecorateEntityImage.java` printf'd its own `dimOriginal`/
 * `dimText1`/`dimTotal` fields, `plans/g2-class-svg/ledger.md` N46): the
 * `TextBlock` `DiagramChromeFactory.create` receives as `raw` — and every
 * `DecorateEntityImage#getTextX` centering computation title/legend/
 * caption/header/footer runs against — is THIS un-margined, un-quirked
 * value, NOT the final (margined) canvas size `computeClassDocumentDims`
 * below returns. `TextBlockExporter#calculateFinalDimension`'s margin/quirk
 * step runs LAST, on the FULLY chrome-composed result — i.e. margin is
 * applied AFTER chrome, not before it. This port previously fed the
 * ALREADY-margined `computeClassDocumentDims` result into
 * `core/annotations/chrome.ts#applyChrome` as the "original" diagram body
 * size, so title/caption/header/footer text sat `(DOCUMENT_MARGIN_LEFT +
 * DOCUMENT_MARGIN_RIGHT + 1) / 2` too far right for CENTER alignment (and
 * analogously wrong for RIGHT) — reach: every titled/caption'd/legend'd/
 * header'd/footer'd class fixture whose chrome text is narrower than the
 * diagram body (`vofatu-71-garo486`/`takove-63-tizi841`, both jar-verified
 * byte-exact once this raw/final split is threaded through
 * `ClassGeometry.rawWidth`/`rawHeight` → `RenderFragment.preChromeWidth`/
 * `preChromeHeight` → `chrome.ts#applyChrome`'s "original" input, with
 * {@link applyClassDocumentMargin} re-applied to chrome's OWN (now raw-
 * based) output in `index.ts#applyAnnotationChrome`'s class-specific
 * branch). Exported (not merged back into `computeClassDocumentDims`) so
 * BOTH the no-chrome fast path (still calls the combined function, zero
 * behavior change) and the chrome path (needs the raw half on its own) stay
 * correct.
 */
export function computeClassRawInkDims(
  classifiers: readonly ClassifierGeo[],
  namespaces: readonly NamespaceGeo[],
  edges: readonly EdgeGeo[],
  notes: readonly NoteGeo[],
): ClassDocumentDims {
  const box = buildInkBox(classifiers, namespaces, edges, notes);
  if (!Number.isFinite(box.minX)) return { width: 0, height: 0 };

  return {
    width: box.maxX - box.minX + INK_DELTA,
    height: box.maxY - box.minY + INK_DELTA,
  };
}

/**
 * G2 N46: the margin/quirk HALF of {@link computeClassDocumentDims} —
 * `CucaDiagram#getDefaultMargins()` (0, 5, 5, 0) then `SvgGraphics
 * #ensureVisible`'s truncating `(int)(v + 1)`. Applied to the raw ink dims
 * for the no-chrome fast path (via {@link computeClassDocumentDims}) and
 * RE-applied to `core/annotations/chrome.ts#applyChrome`'s raw-based output
 * for the chrome path (`index.ts#applyAnnotationChrome`) — see {@link
 * computeClassRawInkDims}'s doc comment for the full mechanism.
 */
export function applyClassDocumentMargin(dims: ClassDocumentDims): ClassDocumentDims {
  const finalWidth = dims.width + DOCUMENT_MARGIN_LEFT + DOCUMENT_MARGIN_RIGHT;
  const finalHeight = dims.height + DOCUMENT_MARGIN_TOP + DOCUMENT_MARGIN_BOTTOM;

  // `SvgGraphics#ensureVisible`: `(int)(v + 1)` — a truncating cast, which
  // for non-negative `v` is `Math.floor`.
  return {
    width: Math.floor(finalWidth + 1),
    height: Math.floor(finalHeight + 1),
  };
}

/**
 * The `SvekResult`/`TextBlockExporter`/`SvgGraphics` recipe (see this
 * module's own doc comment), applied to class's own plain-geometry
 * `ClassifierGeo`/`NamespaceGeo`/`EdgeGeo`/`NoteGeo` arrays instead of a
 * klimt `UGraphic` draw pass. Returns `{width: 0, height: 0}` for an empty
 * diagram (no ink at all) rather than `NaN` from an unbounded `Infinity`
 * box.
 */
export function computeClassDocumentDims(
  classifiers: readonly ClassifierGeo[],
  namespaces: readonly NamespaceGeo[],
  edges: readonly EdgeGeo[],
  notes: readonly NoteGeo[],
): ClassDocumentDims {
  const raw = computeClassRawInkDims(classifiers, namespaces, edges, notes);
  // Empty diagram (no ink at all): stay {0, 0} rather than applying margin
  // to nothing -- `computeClassRawInkDims`'s own `{width: 0, height: 0}`
  // sentinel (no ink walked) is indistinguishable in VALUE from "1x1 ink at
  // the origin", but only the former should skip margin/quirk entirely.
  if (raw.width === 0 && raw.height === 0) return raw;
  return applyClassDocumentMargin(raw);
}

export interface InkShift {
  readonly dx: number;
  readonly dy: number;
}

/**
 * G2/N11: `SvekResult#calculateDimension`'s `moveDelta(6 - minMax.getMinX(),
 * 6 - minMax.getMinY())` (svek/SvekResult.java:133) — the uniform translate
 * that must be applied to EVERY classifier/namespace/edge/note position
 * (post-dot-layout, pre-render) so the diagram's own ink extent's top-left
 * corner lands at `(JAR_INK_MARGIN, JAR_INK_MARGIN)`. Mirrors description's
 * `layout-ink-shift.ts#computeInkShift` (G1b/J1, same upstream `SvekResult`
 * mechanism) — reimplemented against class's plain-geometry ink walk
 * (`buildInkBox`, shared with `computeClassDocumentDims`) rather than a
 * klimt `UGraphic` draw pass, since class renders pure-string (no klimt
 * dependency, per this module's own doc comment).
 *
 * Returns `{dx: 0, dy: 0}` for an empty diagram (no ink at all) — mirrors
 * `computeClassDocumentDims`'s own `{width: 0, height: 0}` empty-diagram
 * case, and is a correct no-op shift regardless (nothing to translate).
 */
export function computeClassInkShift(
  classifiers: readonly ClassifierGeo[],
  namespaces: readonly NamespaceGeo[],
  edges: readonly EdgeGeo[],
  notes: readonly NoteGeo[],
): InkShift {
  const box = buildInkBox(classifiers, namespaces, edges, notes);
  if (!Number.isFinite(box.minX)) return { dx: 0, dy: 0 };
  return {
    dx: JAR_INK_MARGIN - box.minX,
    dy: JAR_INK_MARGIN - box.minY,
  };
}
