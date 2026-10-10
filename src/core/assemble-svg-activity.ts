/**
 * Activity's per-diagram body finalization — split out of `assemble-svg.ts`
 * (T2d-a pass 2, 500-line hook) to make room for the DOCGRAD gradient
 * background branch. A pure move for the pre-existing pieces (doc comments
 * included); only {@link activityBackgroundRect} and
 * {@link spliceIntoActivityContentGroup} are new. Re-exported from
 * `assemble-svg.ts` so the dispatch table there is unchanged.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java
 */
import type { RenderFragment } from './dispatcher.js';
import { attrs, group, rect } from './svg.js';
import { paintToSvg } from './paint.js';
import { resolveColorToSvgHex } from './klimt/color/HColorSet.js';
import { CONTENT_G_OPEN_RE } from './klimt/document-shell.js';
import { formatScaledFragmentBody } from './TextBlockExporter.js';
import { resolveScaleFactor } from './scale-command.js';
import { mapOutsideInlineDefs } from './svg-defs.js';
import { DEFAULT_SVG_DECIMALS, formatDecimal } from './svg-format.js';

/** The default (unset) diagram background -- `theme.ts`'s own
 *  `colors.background: '#FFFFFF'`. Declared separately from the sibling
 *  constants in `assemble-svg.ts` for the same reason they are declared
 *  separately from each other: a per-engine correction to one must not
 *  silently move the rest. */
const ACTIVITY_DEFAULT_BACKGROUND = '#FFFFFF';

/**
 * The three resolved backgrounds for which the jar paints NO content-level
 * rect -- `SvgGraphics`'s constructor, `klimt/drawing/svg/SvgGraphics.java:
 * 186-192`, verbatim:
 *
 *   if (color.equals("#00000000") == false && color.equals("#000000") == false
 *           && color.equals("#FFFFFF") == false)
 *       this.paintBackcolor(color);
 *
 * Only reached for a PLAIN colour -- {@link activityBackgroundRect} checks
 * {@link RenderFragment.backgroundGradient} first and takes the
 * unconditional gradient branch before this set is ever consulted, matching
 * `SvgGraphics.java:174-192`'s own `if (backcolor instanceof HColorGradient)
 * ... else if (backcolor == null) ... else { ... white/black/transparent
 * check ... }` three-way split (the white/black/transparent check applies
 * ONLY to the final `else`, never to the gradient branch).
 *
 * `ActivityDiagram3 extends TitledDiagram` and declares no `backcolor`/
 * exporter member of its own, so activity inherits this shared
 * `TextBlockExporter#createUGraphicSVG` path unchanged -- there is no
 * activity-specific background mechanism. This set holds ONLY resolved
 * hex, because {@link finalizeActivityFragment} canonicalizes before
 * testing (activity's theme reaches here holding raw spellings -- `grey`,
 * `transparent`, lowercase `#f1f1f1`).
 */
const ACTIVITY_UNPAINTED_BACKGROUNDS: ReadonlySet<string> = new Set([
  ACTIVITY_DEFAULT_BACKGROUND,
  '#000000',
  '#00000000',
]);

/** The whole-canvas rect `SvgGraphics#paintBackcolor` appends to the root
 *  `<g>` (`:207-212`), resized to the final `maxX`/`maxY` (`:819-822`) --
 *  hence `fragment.width`/`height`, post-chrome. Jar-verified byte-for-byte
 *  against `activity/poraji-17-goke817` and `activity/labala-74-juki864`,
 *  whose goldens open their content `<g>` with exactly
 *  `<rect x="0" y="0" width="…" height="…" fill="…" style="stroke:none;"/>`. */
function maybeActivityBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? ACTIVITY_DEFAULT_BACKGROUND;
  if (ACTIVITY_UNPAINTED_BACKGROUNDS.has(background)) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background,
    stroke: 'none',
    strokeWidth: 1,
  });
}

/**
 * T2d-a pass 2 (row DOCGRAD): the gradient half of the background rect --
 * `SvgGraphics.java:174-183`'s `if (backcolor instanceof HColorGradient)`
 * branch, which ALWAYS mints the gradient (`createSvgGradient`) and ALWAYS
 * paints the rect (`paintBackcolor("url(#" + id + ")")`), with no
 * white/black/transparent check at all -- unlike the plain-colour branch
 * {@link maybeActivityBackgroundRect} guards. `paintToSvg` (`paint.ts`)
 * mirrors `createSvgGradient`'s own vector table and dedup-by-content id
 * scheme; its `def` string is a bare `<linearGradient id="g...">...
 * </linearGradient>` that `svg-defs.ts#collectDocumentDefs` (called later,
 * from `document-shell.ts#assembleDocumentShell`) lifts out of the body
 * into the document's shared `<defs>` -- so it only needs to be ANYWHERE
 * in the returned body, not placed at any particular offset.
 */
function activityBackgroundRect(fragment: RenderFragment): string {
  if (fragment.backgroundGradient === undefined) return maybeActivityBackgroundRect(fragment);
  const { fill, def } = paintToSvg(fragment.backgroundGradient);
  return (
    (def ?? '') +
    rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
      fill,
      stroke: 'none',
      strokeWidth: 1,
    })
  );
}

/**
 * Put `markup` immediately after the already-wrapped body's opening `<g>`.
 * Local copy of `assemble-svg.ts#spliceIntoContentGroup` (same mechanism,
 * same `CONTENT_G_OPEN_RE`, now shared via `document-shell.ts`'s own
 * export) -- kept separate rather than imported back from `assemble-svg.ts`
 * to avoid a module cycle (that file imports {@link finalizeActivityFragment}
 * from this one).
 */
function spliceIntoActivityContentGroup(body: string, markup: string): string {
  if (markup === '') return body;
  const openTag = CONTENT_G_OPEN_RE.exec(body)?.[0];
  if (openTag === undefined) return markup + body;
  return openTag + markup + body.slice(openTag.length);
}

/**
 * add4-T3b (ACT-SCALE): the activity attributes `formatScaledFragmentBody`'s
 * mindmap vocabulary (`TextBlockExporter.ts#SCALABLE_ATTR_RE`) does not
 * name. Every one is a `SvgGraphics#format`-ed length (`SvgGraphics.java:
 * 468-475`): ellipse centres, line endpoints, and the dash pattern
 * (`setStrokeWidth`, `:557-562`). `stroke-width="..."` is NOT listed: the
 * mindmap regex's `\bwidth` alternative already matches it after the `-`
 * (pinned by `assemble-svg-activity-scale.test.ts`), so listing it here
 * would scale it twice.
 */
const ACTIVITY_EXTRA_SCALABLE_ATTR_RE = /(?<![\w-])(cx|cy|x1|y1|x2|y2|stroke-dasharray)="([^"]*)"/g;
const NUMBER_RE = /-?\d+(?:\.\d+)?/g;

function scaleNumbers(value: string, factor: number): string {
  return value.replace(NUMBER_RE, (token) => formatDecimal(Number(token) * factor, DEFAULT_SVG_DECIMALS));
}

/** The whole composed activity body at `factor` -- upstream draws it through
 *  ONE scaled `UGraphic` (`TextBlockExporter.java:165-177`). Inline defs are
 *  stepped over, as `scaleFragmentBody` does (gradient `x1`/`y1` are
 *  objectBoundingBox fractions). Each number is formatted here, once, after
 *  the multiply (`SvgGraphics.java:468-475`) -- the body was drawn deferred
 *  (`RenderFragment.numbersDeferred`), so this runs at factor 1 too. */
function scaleActivityBody(body: string, factor: number): string {
  return mapOutsideInlineDefs(formatScaledFragmentBody(body, factor), (segment) =>
    segment.replace(ACTIVITY_EXTRA_SCALABLE_ATTR_RE, (_m, name: string, value: string) =>
      attrs([[name, scaleNumbers(value, factor)]]).trimStart(),
    ),
  );
}

/**
 * activity's per-diagram finalization. Canonicalizes `fragment.background`
 * itself as well as the body, for json's reason (N4's resolve-before-shell
 * convention): the jar's root `style` carries the value
 * `backcolor.toSvg(colorMapper)` returns (`SvgGraphics.java:805-806`), which
 * is always resolved hex -- `poraji-17-goke817`'s golden writes
 * `background:#808080;` where this port's theme still holds the literal
 * `grey`. A `backgroundGradient` is NOT re-canonicalized here -- `paintToSvg`
 * (inside {@link activityBackgroundRect}) already resolves both of its own
 * stops via the SAME `resolveColorToSvgHex` table.
 *
 * Follows json's/sequence's shape rather than state's for the chrome-present
 * case: `paintBackcolor` runs in `SvgGraphics`'s CONSTRUCTOR, before any
 * diagram or chrome draw, so the rect is the content group's first child
 * whether or not `applyChrome` wrapped the body.
 */
export function finalizeActivityFragment(fragment: RenderFragment): RenderFragment {
  const canonical =
    fragment.background === undefined
      ? fragment
      : { ...fragment, background: resolveColorToSvgHex(fragment.background) };
  const backgroundRect = activityBackgroundRect(canonical);
  const body =
    fragment.bodyWrapped === true
      ? spliceIntoActivityContentGroup(fragment.body, backgroundRect)
      : group(backgroundRect + fragment.body);
  // add4-T3b (ACT-SCALE): `computeScaleFactor` (`TextBlockExporter.java:
  // 204-208`). The activity layer already resolved the spec's strategy
  // against `calculateFinalDimension()` (`layout/document-margin.ts
  // #withActivityScale`) -- the post-chrome, post-margin raw dimension only
  // it can rebuild -- and hands it here as a `simple` spec, so `width`/
  // `height` below are unread for it. The canvas (`maxX`/`maxY`, already
  // the `ensureVisible` integers) and the background rect scale with the
  // body (`SvgGraphics.java:801-822`).
  const factor = resolveScaleFactor(fragment.scaleSpec, fragment.width, fragment.height, fragment.dpi);
  if (factor === 1 && fragment.numbersDeferred !== true) return { ...canonical, body };
  return {
    ...canonical,
    body: scaleActivityBody(body, factor),
    width: fragment.width * factor,
    height: fragment.height * factor,
  };
}
