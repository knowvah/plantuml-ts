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
import type { ClockwiseTopRightBottomLeft } from './klimt/geom/ClockwiseTopRightBottomLeft.js';
import { attrs, group } from './svg.js';
import { mapOutsideInlineDefs } from './svg-defs.js';
import { DEFAULT_SVG_DECIMALS, formatDecimal } from './svg-format.js';
import { resolveScaleFactor } from './scale-command.js';
import { scaleShadowFilterDefs } from './svg-defs-scale.js';

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
 *  `stroke-width` and `stroke-dasharray` (lengths, `SvgGraphics.java
 *  #setStrokeWidth:557-562` scales both via the same `format()`) scale; the
 *  color and the dimensionless `stroke-miterlimit` ratio do not. */
function scaleStyleAttr(value: string, factor: number): string {
  return value
    .replace(/stroke-width:(-?\d+(?:\.\d+)?)/, (_match, width: string) => `stroke-width:${scaleToken(width, factor)}`)
    .replace(
      /stroke-dasharray:([\d.,\s]+)/,
      (_match, dashes: string) => `stroke-dasharray:${scalePoints(dashes, factor)}`,
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
  return formatScaledFragmentBody(body, factor);
}

/** {@link scaleFragmentBody} without its factor-1 fast path: every token is
 *  re-formatted even at 1 -- for a body drawn with its numbers deferred
 *  (`RenderFragment.numbersDeferred`), where this pass is the single
 *  `SvgGraphics#format` (`SvgGraphics.java:468-475`). */
export function formatScaledFragmentBody(body: string, factor: number): string {
  return mapOutsideInlineDefs(body, (segment) =>
    segment.replace(SCALABLE_ATTR_RE, (_match, name: string, value: string) => scaleFragmentAttr(name, value, factor)),
  );
}

/**
 * T6h: the placeholder a MINDMAP producer puts where its raw text block
 * goes when it hands the block over as {@link RenderFragment.drawBodyAt}.
 * Chrome composition (`annotations/coord-shift.ts#shiftFragmentBody`)
 * shifts its `translate` exactly (unrounded `String(a + dx)`), so after the
 * margin shift it carries the block's final `(dx, dy)` in the document.
 */
export const BODY_ANCHOR = '<g data-body-anchor="" transform="translate(0,0)"/>';
// The captures exclude `"`, `<` and `)`: a translate value is a number, so
// no real match changes. The exclusion stops a capture from running into
// the next anchor, which made a scan quadratic in the anchor count
// (CodeQL js/polynomial-redos, alert 23).
const BODY_ANCHOR_RE = /<g data-body-anchor="" transform="translate\(([^,)"<]+),([^)"<]+)\)"\/>/;

/**
 * add4-T3b (ACT-SCALE): the attributes `formatScaledFragmentBody`'s mindmap
 * vocabulary ({@link SCALABLE_ATTR_RE}) does not name, which a body drawn with
 * its numbers deferred (activity, description, sequence) also carries. Every
 * one is a `SvgGraphics#format`-ed length (`SvgGraphics.java:468-475`): ellipse
 * centres, line endpoints, and the dash pattern (`setStrokeWidth`, `:557-562`).
 * `stroke-width="..."` is NOT listed: the mindmap regex's `\bwidth` alternative
 * already matches it after the `-` (pinned by `assemble-svg-activity-scale
 * .test.ts`), so listing it here would scale it twice.
 */
export const ACTIVITY_EXTRA_SCALABLE_ATTR_RE = /(?<![\w-])(cx|cy|x1|y1|x2|y2|stroke-dasharray)="([^"]*)"/g;
const EXTRA_NUMBER_RE = /-?\d+(?:\.\d+)?/g;

function scaleExtraNumbers(value: string, factor: number): string {
  return value.replace(EXTRA_NUMBER_RE, (token) => formatDecimal(Number(token) * factor, DEFAULT_SVG_DECIMALS));
}

/** The whole composed body at `factor` -- upstream draws it through ONE scaled
 *  `UGraphic` (`TextBlockExporter.java:165-177`). Inline defs are stepped over,
 *  as `scaleFragmentBody` does (gradient `x1`/`y1` are objectBoundingBox
 *  fractions). Each number is formatted here, once, after the multiply
 *  (`SvgGraphics.java:468-475`) -- the body was drawn deferred
 *  (`RenderFragment.numbersDeferred`), so this runs at factor 1 too. */
export function scaleActivityBody(body: string, factor: number): string {
  return mapOutsideInlineDefs(formatScaledFragmentBody(body, factor), (segment) =>
    segment.replace(ACTIVITY_EXTRA_SCALABLE_ATTR_RE, (_m, name: string, value: string) =>
      attrs([[name, scaleExtraNumbers(value, factor)]]).trimStart(),
    ),
  );
}

/** One text run of the body at `factor`: the single deferred format pass when
 *  the producer drew deferred, the legacy regex scale of formatted numbers
 *  otherwise. */
function scaleBodyText(fragment: RenderFragment, text: string, factor: number): string {
  return fragment.numbersDeferred === true ? scaleActivityBody(text, factor) : scaleFragmentBody(text, factor);
}

/**
 * The margin-shifted, scaled chromed body of a producer that handed chrome its
 * RAW text block ({@link RenderFragment.exportMargin}). With a
 * {@link RenderFragment.drawBodyAt} producer the chrome strings around
 * {@link BODY_ANCHOR} are post-multiplied, and the anchor is replaced by the
 * raw text block drawn through klimt at `factor` from the anchor's
 * translate -- upstream draws the whole chromed document through one scaled
 * `UGraphic` (TextBlockExporter.java:165-176), so the body's numbers are
 * rounded once, after the scale.
 */
function scaleMarginedBody(
  fragment: RenderFragment,
  body: string,
  margin: ClockwiseTopRightBottomLeft,
  factor: number,
): string {
  const shifted = shiftFragmentBody(body, margin.getLeft(), margin.getTop());
  if (fragment.drawBodyAt === undefined) return scaleBodyText(fragment, shifted, factor);
  const anchor = BODY_ANCHOR_RE.exec(shifted);
  if (anchor === null) throw new Error('exportTo: drawBodyAt set but the body anchor is missing');
  const before = shifted.slice(0, anchor.index);
  const after = shifted.slice(anchor.index + anchor[0].length);
  const drawn = fragment.drawBodyAt(factor, Number(anchor[1]), Number(anchor[2]));
  return scaleBodyText(fragment, before, factor) + drawn + scaleBodyText(fragment, after, factor);
}

/** A width x height pair: the export's dimension, or its canvas. */
interface Extent {
  readonly width: number;
  readonly height: number;
}

/**
 * `TextBlockExporter#calculateFinalDimension` (`:198-203`) and the canvas
 * `SvgGraphics` sizes from it (`ensureVisible`'s `(int)(v + 1)`,
 * `SvgGraphics.java:129-135`). Exactly two arms:
 *
 * - `exportMargin` set: the producer handed over the RAW chromed block, so
 *   `dim` is its `width`/`height` plus the margin (`:200-202`) and the canvas
 *   is `trunc(dim + 1)` (mindmap, wbs, salt);
 * - otherwise the producer already baked its margin: `dim` is
 *   `exportedDimension` when set (`document-margin.ts#applyDocumentMargin`,
 *   chrome plus margin before `ensureVisible`), else the fragment's own
 *   `width`/`height`, and those already ARE the `ensureVisible` integers, so
 *   they are the canvas (activity, description, sequence).
 */
function exportExtents(fragment: RenderFragment): { dim: Extent; canvas: Extent } {
  const margin = fragment.exportMargin;
  if (margin === undefined) return { dim: fragment.exportedDimension ?? fragment, canvas: fragment };
  const dim = {
    width: fragment.width + margin.getLeft() + margin.getRight(),
    height: fragment.height + margin.getTop() + margin.getBottom(),
  };
  return {
    dim,
    canvas: {
      width: Math.trunc(dim.width + ENSURE_VISIBLE_BUMP),
      height: Math.trunc(dim.height + ENSURE_VISIBLE_BUMP),
    },
  };
}

/**
 * The ONE `TextBlockExporter#exportTo` tail (`core/TextBlockExporter.java:
 * 159-177`) for every engine whose chrome is composed OUTSIDE klimt as a
 * string splice: mindmap, wbs, salt, activity, description and sequence.
 * `body` is the producer's body after its own pre-draw rects
 * (`SvgGraphics`'s constructor `paintBackcolor` and `maybeDrawBorder` run
 * BEFORE `textBlock.drawU(ug)`, `:168-176`); a producer with none passes
 * `fragment.body`.
 *
 * - `dim = calculateFinalDimension()` (`:160`, `:198-203`), see
 *   {@link exportExtents};
 * - `factor = computeScaleFactor(dim)` (`:165`, `:205-209`):
 *   `scale.getScale(dim.w, dim.h) * dpi / 96`, via {@link resolveScaleFactor};
 * - the body is drawn through one `UGraphic` at `factor` (`:169-177`):
 *   `exportMargin` shifts it by `(left, top)` (`:173`), `drawBodyAt` redraws
 *   the raw block at `factor`, `numbersDeferred` runs the single
 *   `SvgGraphics#format` pass (`SvgGraphics.java:466-475`), and any other
 *   formatted body is regex-scaled;
 * - the shadow filter's blur/offset scale with it (`SvgGraphics.java:1081,
 *   1084`);
 * - the root writes `format(maxX)` for `width`/`height` (`:800-813`), hence
 *   `scaledCanvas` and `canvas * factor`.
 *
 * A margin-baked producer at factor 1 with a formatted body is left as
 * handed over: nothing multiplies, so nothing is re-rounded.
 */
export function exportTo(fragment: RenderFragment, body: string): RenderFragment {
  const { dim, canvas } = exportExtents(fragment);
  const factor = resolveScaleFactor(fragment.scaleSpec, dim.width, dim.height, fragment.dpi);
  const margin = fragment.exportMargin;
  if (margin === undefined && factor === 1 && fragment.numbersDeferred !== true) return { ...fragment, body };
  return {
    ...fragment,
    body:
      margin === undefined ? scaleBodyText(fragment, body, factor) : scaleMarginedBody(fragment, body, margin, factor),
    ...(fragment.extraDefs === undefined ? {} : { extraDefs: scaleShadowFilterDefs(fragment.extraDefs, factor) }),
    // isw-T2c-scale: root `width`/`height` attributes are `format(maxX)`.
    scaledCanvas: true,
    width: canvas.width * factor,
    height: canvas.height * factor,
  };
}

/**
 * The `TextBlockExporter#exportTo` tail for a `TitledDiagram` fragment:
 *
 * - no chrome (`bodyWrapped` unset): the engine already exported its text
 *   block through klimt (margin translate, `calculateFinalDimension`,
 *   scale), so only the single content `<g>` is added;
 * - chrome composed (`annotations/chrome.ts#applyChrome` wrapped the body):
 *   the engine handed chrome its RAW text block, as upstream's
 *   `DiagramChromeFactory.create` receives it, and the margin comes after
 *   (`TextBlockExporter.java:173`, `:198-202`): {@link exportTo}'s
 *   `exportMargin` arm. The margin is the producer's
 *   `Builder#calculateMargin` result (`:510-516`: style `Margin`, else
 *   `getDefaultMargins()` -- `same(10)` for mindmap, `TitledDiagram.java:
 *   274-277`; `same(5)` for salt, `PSystemSalt.java:238-240`), carried as
 *   `RenderFragment.exportMargin`. Scale resolves against the un-bumped
 *   post-margin, post-chrome dimension (jar-verified against zebuzi: the
 *   title's extra width changes `ScaleWidthAndHeight`'s `Math.min`, 1.682
 *   versus the golden's 1.495), and the canvas multiplies the SEPARATE
 *   `+1`-bumped truncation (1.492 versus 1.495 when conflated).
 */
export function finalizeTitledDiagramFragment(fragment: RenderFragment): RenderFragment {
  if (fragment.bodyWrapped !== true) return { ...fragment, body: group(fragment.body) };
  if (fragment.exportMargin === undefined) {
    throw new Error('finalizeTitledDiagramFragment: chromed fragment without exportMargin');
  }
  return exportTo(fragment, fragment.body);
}
