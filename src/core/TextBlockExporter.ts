/**
 * `TextBlockExporter#calculateFinalDimension` — the diagram's outer margin
 * applied to whatever the inner `TextBlock` measured, plus the truncating
 * `+1` `SvgGraphics` applies when it sizes the canvas.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:198-202
 *
 * ```java
 * private XDimension2D calculateFinalDimension() {
 *     final XDimension2D dim = textBlock.calculateDimension(stringBounder);
 *     return new XDimension2D(dim.getWidth() + margin.getLeft() + margin.getRight(),
 *             dim.getHeight() + margin.getTop() + margin.getBottom());
 * }
 * ```
 *
 * The recipe spans three upstream classes, which is why it lived duplicated
 * for so long — no single Java file holds all of it:
 *
 * 1. `SvekResult#calculateDimension` produces `dim` (ink + `delta(15,15)`) —
 *    `core/svek/SvekResult.ts#svekDimension`.
 * 2. `TextBlockExporter#calculateFinalDimension` adds the margin, which for
 *    the cuca family is `CucaDiagram#getDefaultMargins()` —
 *    `core/atmp/CucaDiagram.ts`.
 * 3. `SvgGraphics#ensureVisible` truncates: `maxX = (int) (x + 1)`
 *    (`klimt/drawing/svg/SvgGraphics.java:129-135`).
 *
 * The class and state engines each had all three steps inline, in identical
 * arithmetic, differing only in how they built the ink extent — which is
 * genuinely per-engine (they draw different shapes and so have different
 * per-shape ink rules). Only the recipe is shared here; neither engine's ink
 * rules move.
 *
 * **The description engine deliberately does NOT use this.** It walks a real
 * `UGraphic` to a `MinMax` rather than accumulating a plain-geometry ink box,
 * and its `computeDocumentDims` applies the margins WITHOUT the `ensureVisible`
 * truncation. Routing it through here would change its output, which is a
 * behaviour change wearing a consolidation's clothes.
 */

import {
  CUCA_DOCUMENT_MARGIN_TOP,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
} from './atmp/CucaDiagram.js';
import { shiftFragmentBody } from './annotations/coord-shift.js';
import type { RenderFragment } from './dispatcher.js';
import { attrs, group } from './svg.js';
import { mapOutsideInlineDefs } from './svg-defs.js';
import { DEFAULT_SVG_DECIMALS, formatDecimal } from './svg-format.js';
import { resolveScaleFactor } from './scale-command.js';

export interface DocumentDims {
  width: number;
  height: number;
}

/**
 * Step 2 and 3 of the recipe above: add `CucaDiagram`'s default margins to a
 * measured dimension, then apply `SvgGraphics#ensureVisible`'s truncating
 * `(int)(v + 1)` — which for a non-negative `v` is `Math.floor(v + 1)`.
 *
 * Kept separate from {@link import('./svek/SvekResult.js').svekDimension} —
 * rather than folded into one call — because the class engine needs the two
 * halves independently: its chrome path re-applies the margin to a
 * chrome-adjusted raw dimension (`core/annotations/chrome.ts#applyChrome`),
 * so the raw half has to be observable on its own.
 */
export function applyCucaDocumentMargin(dims: DocumentDims): DocumentDims {
  const width = dims.width + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT;
  const height = dims.height + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM;
  return {
    width: Math.floor(width + 1),
    height: Math.floor(height + 1),
  };
}

/** `TitledDiagram#getDefaultMargins()` — `ClockwiseTopRightBottomLeft.same(10)`
 *  (`TitledDiagram.java:274-277`), the margin every non-cuca `TitledDiagram`
 *  (mindmap) exports with. */
const TITLED_DIAGRAM_MARGIN = 10;

/** `SvgGraphics#ensureVisible`'s `maxX = (int) (x + 1)` bump
 *  (`klimt/drawing/svg/SvgGraphics.java:129-135`); `document-shell.ts`
 *  truncates. */
const ENSURE_VISIBLE_BUMP = 1;

// ---------------------------------------------------------------------------
// T6d: scale applied AFTER chrome composition (mission mindmap-engine-port
// batch 6, "zebuzi" residual — decision-journal row 27).
//
// Upstream draws the CHROME-DECORATED `textBlock` through ONE `UGraphic`
// whose `option.scale` is already set BEFORE any drawing happens
// (`TextBlockExporter.java:159-176`; `computeScaleFactor` reads the
// chrome-included `calculateFinalDimension()`, `:198-209`) — every
// primitive `SvgGraphics#format` (`:881-884`) touches, title included, is
// scaled at draw time. This port composes chrome OUTSIDE klimt as a string
// splice (`core/annotations/chrome.ts#applyChrome`), so there is no single
// `UGraphic` left to carry `option.scale` by the time chrome has run. The
// functions below reproduce the SAME numeric result as a post-composition
// pass instead: multiply every geometry-bearing attribute of the ALREADY-
// SERIALIZED, already-margin-shifted body by the resolved factor — the
// eager-arithmetic sibling of `coord-shift.ts#shiftFragmentBody` (which
// does the same trick for the margin TRANSLATE), scoped to the SAME known
// producer vocabulary mindmap's own rect/text/path/polygon draws use
// (grep-verified against every cached `test-results/dot-cache/mindmap/*/
// in.svg`: no ellipse/circle/line, no `cx/cy/x1/y1/x2/y2`).
// ---------------------------------------------------------------------------

/** Matches a JS-`Number`-parseable numeric token — same shape as
 *  `coord-shift.ts#NUMBER_RE`, this module's translate-only sibling. */
const SCALE_NUMBER_RE = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g;

/** Path-data command letters this codebase ever emits (`coord-shift.ts
 *  #PATH_COMMAND_RE`'s own doc comment — always absolute/uppercase). Not
 *  imported from `coord-shift.ts` (unexported there, and out of this
 *  task's write-set) — the pattern itself is a shared literal, not
 *  behavior, so a second copy carries no drift risk. */
const PATH_COMMAND_RE = /([MLCQAZ])([^MLCQAZ]*)/g;

/**
 * `SvgGraphics.java#format`'s HALF_UP-at-3-decimals rounding
 * (`svg-format.ts#formatDecimal`), applied to an already-serialized —
 * therefore already-once-rounded — numeric token. A pure translation
 * (`shiftNumberToken`, `coord-shift.ts`) never needs a second rounding
 * pass (adding an integer margin to an N-decimal value stays exact at N
 * decimals); a genuine multiply does. Journaled tradeoff: this can
 * double-round relative to scaling the diagram's true (pre-serialization)
 * double, differing from upstream only when an intermediate value sits
 * within one part in 10^3 of a rounding boundary — no corpus fixture
 * measured so far exhibits it (T6d's own measurement pass).
 */
function scaleToken(raw: string, factor: number): string {
  return formatDecimal(Number(raw) * factor, DEFAULT_SVG_DECIMALS);
}

/** `points="x,y x,y ..."` / `points="x,y,x,y,..."` — every token scales by
 *  the SAME factor regardless of x/y parity (unlike `coord-shift.ts
 *  #shiftPoints`, which must track parity since a translation's dx/dy can
 *  differ): a `scale` factor is always uniform — `ScaleWidthAndHeight`
 *  already reduces two axes to one `Math.min` before `resolveScaleFactor`
 *  ever reaches this module (`scale-command.ts`'s own doc comment). */
function scalePoints(value: string, factor: number): string {
  return value.replace(SCALE_NUMBER_RE, (token) => scaleToken(token, factor));
}

/**
 * `d="M#,# C#,# ..."` — mirrors `coord-shift.ts#shiftPathD`'s per-command
 * argument layout, but an `A` command's SCALE shape differs from its
 * TRANSLATION shape: `rx,ry,x-axis-rotation,large-arc-flag,sweep-flag,x,y`
 * — the two radii (indices 0,1) and the endpoint (indices 5,6) scale; the
 * rotation angle (index 2) and the two 0/1 flags (indices 3,4) do not (an
 * angle and a boolean are dimensionless under a uniform scale, unlike
 * under a translation where only the flags/angle were already excluded).
 */
function scalePathD(value: string, factor: number): string {
  return value.replace(PATH_COMMAND_RE, (segment, command: string, args: string) => {
    if (command === 'Z') return segment;
    let index = 0;
    const scaledArgs = args.replace(SCALE_NUMBER_RE, (token: string) => {
      const i = index;
      index += 1;
      if (command === 'A' && i >= 2 && i <= 4) return token;
      return scaleToken(token, factor);
    });
    return command + scaledArgs;
  });
}

/** `style="stroke:#181818;stroke-width:1.5;stroke-miterlimit:10;"` — only
 *  `stroke-width` (a length, `SvgGraphics.java#setStrokeWidth:557` scales
 *  it via the same `format()`) scales; the color and the dimensionless
 *  `stroke-miterlimit` ratio do not. */
function scaleStyleAttr(value: string, factor: number): string {
  return value.replace(
    /stroke-width:(-?\d+(?:\.\d+)?)/,
    (_match, width: string) => `stroke-width:${scaleToken(width, factor)}`,
  );
}

/** Attribute names mindmap's own producer vocabulary ever carries a
 *  scalable value for (see this section's own doc comment for the grep
 *  evidence). `font-weight` (a CSS weight token) and anything inside
 *  `style` besides `stroke-width` are deliberately excluded. */
const SCALABLE_ATTR_RE = /\b(x|y|width|height|rx|ry|font-size|textLength|points|d|style)="([^"]*)"/g;

function scaleFragmentAttr(name: string, value: string, factor: number): string {
  if (name === 'points') return attrs([['points', scalePoints(value, factor)]]).trimStart();
  if (name === 'd') return attrs([['d', scalePathD(value, factor)]]).trimStart();
  if (name === 'style') return attrs([['style', scaleStyleAttr(value, factor)]]).trimStart();
  return attrs([[name, scaleToken(value, factor)]]).trimStart();
}

/**
 * Multiplies every geometry-bearing attribute of an already-serialized
 * MINDMAP fragment body by `factor` — see this section's own doc comment
 * for the full mechanism. `factor === 1` is a fast-path no-op (byte-
 * identical), matching `coord-shift.ts#shiftFragmentBody`'s own
 * `dx===0 && dy===0` fast path. Steps over inline `<linearGradient>`/
 * `<filter>` defs (`mapOutsideInlineDefs`, `svg-defs.ts`) exactly as
 * `shiftFragmentBody` does — their `x1`/`y1`/etc are objectBoundingBox
 * percentages, never document coordinates.
 */
export function scaleFragmentBody(body: string, factor: number): string {
  if (factor === 1) return body;
  return mapOutsideInlineDefs(body, (segment) =>
    segment.replace(SCALABLE_ATTR_RE, (_match, name: string, value: string) => scaleFragmentAttr(name, value, factor)),
  );
}

/**
 * The `TextBlockExporter#exportTo` tail for a `TitledDiagram` fragment:
 *
 * - no chrome (`bodyWrapped` unset): the engine already exported its text
 *   block through klimt (margin translate, `calculateFinalDimension`,
 *   scale), so only the single content `<g>` is added;
 * - chrome composed (`annotations/chrome.ts#applyChrome` wrapped the body):
 *   the engine handed chrome its RAW text block, as upstream's
 *   `DiagramChromeFactory.create` receives it, and the margin comes after —
 *   `ug.apply(new UTranslate(margin.getLeft(), margin.getTop()))`
 *   (`TextBlockExporter.java:173`) and `calculateFinalDimension`
 *   (`:198-202`), then `ensureVisible`. `scaleFragmentBody` (T6d) runs
 *   LAST, after the margin shift — matching upstream's own ordering, since
 *   `computeScaleFactor` reads `calculateFinalDimension()`'s (i.e. the
 *   POST-margin, POST-chrome) dimension, NOT the raw pre-chrome text
 *   block: resolving `fragment.scaleSpec` against the pre-chrome body
 *   alone is measurably wrong (jar-verified against zebuzi — the title's
 *   extra width changes `ScaleWidthAndHeight`'s `Math.min(w-ratio,
 *   h-ratio)` result, giving 1.682 instead of the golden's 1.495).
 *
 *   Two DISTINCT derived quantities, not one (jar-verified — conflating
 *   them into a single truncated value under-scaled zebuzi by ~0.2%,
 *   1.492 vs the golden 1.495): `computeScaleFactor(dim)` (`:184-188`)
 *   reads `dim` — the RAW double `calculateFinalDimension()` returns, with
 *   NO `ensureVisible` bump — as BOTH the scale ratio's denominator AND
 *   (separately) the seed `ensureVisible(dim.width, dim.height)` truncates
 *   to `maxX`/`maxY` (`SvgGraphics.java:143`, `:129-135`'s `(int)(x+1)`)
 *   for the CANVAS size. `dimWidth`/`dimHeight` below are that raw,
 *   un-bumped `dim`; `unscaledWidth`/`unscaledHeight` are the SEPARATE,
 *   `+1`-bumped-then-truncated `maxX`/`maxY` the canvas size is built
 *   from — scale resolves against the former, `width`/`height` multiply
 *   the latter.
 */
export function finalizeTitledDiagramFragment(fragment: RenderFragment): RenderFragment {
  if (fragment.bodyWrapped !== true) return { ...fragment, body: group(fragment.body) };
  const shifted = shiftFragmentBody(fragment.body, TITLED_DIAGRAM_MARGIN, TITLED_DIAGRAM_MARGIN);
  const dimWidth = fragment.width + 2 * TITLED_DIAGRAM_MARGIN;
  const dimHeight = fragment.height + 2 * TITLED_DIAGRAM_MARGIN;
  const unscaledWidth = Math.trunc(dimWidth + ENSURE_VISIBLE_BUMP);
  const unscaledHeight = Math.trunc(dimHeight + ENSURE_VISIBLE_BUMP);
  const scale = resolveScaleFactor(fragment.scaleSpec, dimWidth, dimHeight, fragment.dpi);
  return {
    ...fragment,
    body: scaleFragmentBody(shifted, scale),
    width: unscaledWidth * scale,
    height: unscaledHeight * scale,
  };
}
