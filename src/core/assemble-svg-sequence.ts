/**
 * assemble-svg-sequence.ts -- sequence's per-diagram body finalization,
 * dispatched from `assemble-svg.ts#finalizeShellFragment`. Moved out of that
 * file unchanged (500-line hook cap, sdd2-T7f); see its header for why the
 * finalize work lives in core at all (decisions.md D1/D2).
 */
import type { RenderFragment } from './dispatcher.js';
import { group, rect } from './svg.js';
import { spliceIntoContentGroup } from './assemble-svg-splice.js';
import { paintToSvg } from './paint.js';
import { documentMarginOf } from './document-margin.js';
import { exportTo } from './TextBlockExporter.js';

/** The default (unset) diagram background -- jar's own `TextBlockExporter
 *  .Builder` field initializer, `HColors.WHITE.withDark(HColors.BLACK)`
 *  (`core/TextBlockExporter.java:413`), which reaches `SvgGraphics` as
 *  `#FFFFFF` and so takes the no-rect branch of
 *  {@link SEQUENCE_UNPAINTED_BACKGROUNDS}. Same value as state's and json's
 *  sibling constants above, declared separately so a per-engine correction
 *  to one cannot silently move the other four. */
const SEQUENCE_DEFAULT_BACKGROUND = '#FFFFFF';

/**
 * Every resolved background for which the jar draws NO content-level rect.
 * `SvgGraphics`'s constructor guards its `paintBackcolor(color)` call with
 * `color.equals("#00000000") == false && color.equals("#000000") == false
 * && color.equals("#FFFFFF") == false` (`klimt/drawing/svg/SvgGraphics.java:
 * 189-191`) -- note BLACK is excluded alongside white and transparent, which
 * neither `assemble-svg.ts#maybeStateBackgroundRect` nor `assemble-svg.ts#isSolidNonDefault`
 * models. Jar-verified across the whole cached sequence corpus: of the 19
 * goldens whose root style carries a non-`#FFFFFF` `background:`, the 18
 * non-black ones all open their content `<g>` with the rect, and the single
 * black one (`sequence/zuravu-52-mike252`, `background:#000000;`) does not.
 * `transparent`/`none` are this port's un-resolved spellings of jar's
 * `#00000000` -- the same pair `document-shell.ts#assembleDocumentShell`'s
 * own `isSolid` test already accepts.
 */
const SEQUENCE_UNPAINTED_BACKGROUNDS: ReadonlySet<string> = new Set([
  SEQUENCE_DEFAULT_BACKGROUND,
  '#000000',
  '#00000000',
  'transparent',
  'none',
]);

/**
 * The whole-canvas rect `SvgGraphics#paintBackcolor` appends to the root
 * `<g>` (`:207-212`), later resized to the FINAL `maxX`/`maxY` (`:817-819`)
 * -- hence `fragment.width`/`height`, post-chrome, truncated the way
 * `assembleDocumentShell` truncates the root's own `width`/`height` (every
 * one of the 17 painted goldens carries integral dims, so the two agree).
 */
function maybeSequenceBackgroundRect(fragment: RenderFragment): string {
  const background = fragment.background ?? SEQUENCE_DEFAULT_BACKGROUND;
  if (SEQUENCE_UNPAINTED_BACKGROUNDS.has(background)) return '';
  return rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), {
    fill: background,
    stroke: 'none',
    strokeWidth: 1,
  });
}

/**
 * `SvgGraphics.java:174-183`'s `HColorGradient` branch: `createSvgGradient`
 * then `paintBackcolor("url(#" + id + ")")`, unconditionally -- the
 * white/black/transparent guard of {@link maybeSequenceBackgroundRect} is the
 * plain-colour `else` only. The def rides in the body ahead of every other
 * draw; `svg-defs.ts#collectDocumentDefs` lifts it, in body order, so the
 * seeded counter gives it index 0 as the constructor does (`:393`).
 */
function sequenceBackgroundRect(fragment: RenderFragment): string {
  if (fragment.backgroundGradient === undefined) return maybeSequenceBackgroundRect(fragment);
  const { fill, def } = paintToSvg(fragment.backgroundGradient);
  return (
    (def ?? '') +
    rect(0, 0, Math.trunc(fragment.width), Math.trunc(fragment.height), { fill, stroke: 'none', strokeWidth: 1 })
  );
}

/** `UStroke.simple()` (`klimt/UStroke.java:75-77`, thickness 1.0), the stroke `maybeDrawBorder`
 *  falls back to when `LineParam.diagramBorder` has no thickness
 *  (`core/TextBlockExporter.java:221-223`). */
const SEQUENCE_DIAGRAM_BORDER_THICKNESS = 1;

/** `DriverRectangleSvg.java:78`: `svgRectangle(..., rx / 2, ry / 2, ...)`. */
const SVG_ROUND_CORNER_DIVISOR = 2;

/**
 * `TextBlockExporter#calculateFinalDimension` (`:198-203`): the chrome-composed
 * block plus the document margin, before `ensureVisible`. Chrome sets it
 * (`document-margin.ts#applyDocumentMargin`); without chrome it is the
 * declared margin-less block plus that margin (`SequenceDiagram.java:629-633`).
 * `renderer.ts` always declares the margin-less block (it draws at scale 1;
 * the factor is the exporter's, `TextBlockExporter.ts#exportTo`), so a
 * sequence fragment without either is a broken invariant.
 */
function sequenceExportedDimension(fragment: RenderFragment): { readonly width: number; readonly height: number } {
  if (fragment.exportedDimension !== undefined) return fragment.exportedDimension;
  const margin = documentMarginOf(fragment);
  if (margin === undefined || fragment.preChromeWidth === undefined || fragment.preChromeHeight === undefined)
    throw new Error('finalizeSequenceFragment: sequence fragment declares neither exportedDimension nor its block');
  return {
    width: fragment.preChromeWidth + margin.left + margin.right,
    height: fragment.preChromeHeight + margin.top + margin.bottom,
  };
}

/**
 * `TextBlockExporter#maybeDrawBorder` (`:214-231`), called right after
 * `createUGraphic` and before the margin translate (`:168-170`):
 * `URectangle.build(dim.w - t, dim.h - t)` at the origin, in
 * `diagramBorderColor`. Drawn after the constructor's background rect and
 * before the diagram, chrome included.
 */
function sequenceBorderRect(fragment: RenderFragment): string {
  if (fragment.diagramBorderColor === undefined) return '';
  const dim = sequenceExportedDimension(fragment);
  const t = fragment.diagramBorderThickness ?? SEQUENCE_DIAGRAM_BORDER_THICKNESS;
  // `URectangle#rounded(c)` (`:227-228`); `DriverRectangleSvg.java:78` halves it
  // on emission, and a zero radius emits no rx/ry.
  const corner = (fragment.diagramBorderRoundCorner ?? 0) / SVG_ROUND_CORNER_DIVISOR;
  return rect(0, 0, dim.width - t, dim.height - t, {
    fill: 'none',
    stroke: fragment.diagramBorderColor,
    strokeWidth: t,
    ...(corner > 0 ? { rx: corner, ry: corner } : {}),
  });
}

/**
 * sequence's per-diagram body finalization. Sequence reaches this module
 * with `bodyWrapped` unset in the common case -- unlike description it has
 * no `CompleteSvg` escape hatch and unlike class no wrap of its own -- so
 * this is the ONE place that guarantees the single content `<g>`
 * `document-shell.ts#withRootGroupAttributes` then upgrades to
 * `ROOT_GROUP_OPEN`.
 *
 * Follows json's shape rather than state's for the chrome-present case:
 * `paintBackcolor` runs in `SvgGraphics`'s CONSTRUCTOR, before any diagram
 * or chrome draw, so the rect is the content group's first child whether or
 * not chrome wrapped the body. State's `bodyWrapped ? '' : ...` carve-out
 * records that state's corpus had no such combination; sequence's has six
 * (`fazaba-22-nusi829`, `ganefo-61-leka777`, `jogeto-89-zaco078`,
 * `solivu-37-vika919`, `taxude-25-lamo370`, `zerovu-57-cumo773` -- all
 * `<g class="header">`/`<g class="title">` behind a 0,0 background rect).
 */
export function finalizeSequenceBody(fragment: RenderFragment): string {
  const documentChrome = sequenceBackgroundRect(fragment) + sequenceBorderRect(fragment);
  return fragment.bodyWrapped === true
    ? spliceIntoContentGroup(fragment.body, documentChrome)
    : group(documentChrome + fragment.body);
}

/**
 * sequence through the one `TextBlockExporter#exportTo` tail
 * (`TextBlockExporter.ts#exportTo`, `core/TextBlockExporter.java:159-177`).
 * The page is drawn at scale 1, numbers deferred when the document is
 * export-scaled, around the margin-less block chrome composed against; so
 * `calculateFinalDimension()` is {@link sequenceExportedDimension} -- chrome
 * plus margin -- and `computeScaleFactor` (`:205-209`) reads THAT, not the
 * body. The background and border rects are spliced first, as `SvgGraphics`'s
 * constructor and `maybeDrawBorder` run before the draw (`:168-176`) and the
 * root resizes the background with `format(maxX)` (`SvgGraphics.java:819-821`),
 * so they scale with the body. The canvas is the unscaled `ensureVisible`
 * integer (`SvgGraphics.java:129-135`) times the factor (`:800-813`).
 */
export function finalizeSequenceFragment(fragment: RenderFragment): RenderFragment {
  const exportedDimension = sequenceExportedDimension(fragment);
  const exported = {
    ...fragment,
    exportedDimension,
    width: Math.trunc(fragment.width),
    height: Math.trunc(fragment.height),
  };
  return exportTo(exported, finalizeSequenceBody(exported));
}
