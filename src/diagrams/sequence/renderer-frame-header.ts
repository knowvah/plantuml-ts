/**
 * A grouping frame's type tab -- background pass (the plain outline) and
 * foreground pass (the clipped-corner tab + its text). Both halves draw the
 * SAME full-area `URectangle`; that duplication is not a bug here, it is
 * `AbstractComponent#drawU`'s per-component two-half dispatch
 * (`drawBackgroundInternalU` vs `drawInternalU`, never both in one call) --
 * see this component's own two methods below.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractComponent.java:137-149
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseGroupingHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:100-127
 */

import type { FrameGeo, TextRun } from './ast.js';
import type { ScaledTheme } from './scale-geo.js';
import type { Paint } from '../../core/paint.js';
import { rect, path } from '../../core/svg-shapes.js';
import { fmt } from '../../core/svg-format.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import { sequenceText } from './sequence-text.js';
import { drawnLeftX, drawnWidth } from './run-draw-metrics.js';
import { moveTo, lineTo, arcTo } from '../../core/svg-path-builder.js';
import { frameShadowDelta, sequenceShadowFilter } from './sequence-shadow.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { CORNER_SIZE } from './frame-style.js';
import { TRANSPARENT_SVG } from './text-block-geo.js';

/** A frame's two paints, as layout resolved them (sdd1 D1): the body
 *  `style` and the `styleHeader` (`sequence-layout-frame.ts`,
 *  `ref-body-geo.ts#referencePaints`). */
export interface FramePaintPair {
  readonly paint: SequencePaint;
  readonly headerPaint: SequencePaint;
}

/** The paints every frame geo carries: layout resolves them (D1). */
export function framePaintsOf(frame: FrameGeo): FramePaintPair {
  const { paint, headerPaint } = frame;
  if (paint === undefined || headerPaint === undefined)
    throw new Error(`frame "${frame.frameType}" geo has no paint: layout resolves it (sdd1 D1)`);
  return { paint, headerPaint };
}

/** `HColor#toSvg` of a fully transparent colour (`HColor.java:76`). */

/** `SvgGraphics#fixColor` (`SvgGraphics.java:539-541`): a transparent fill or
 *  stroke is written `none`. */
export function svgFixColor(p: Paint): Paint {
  return p === TRANSPARENT_SVG ? 'none' : p;
}

/** `Fashion#applyStroke` with its fore colour (`klimt/Fashion.java:67-88`):
 *  colour, thickness and dashes, the lengths scaled at emission
 *  (`SvgGraphics.java:555-561`). */
export function strokeOf(paint: SequencePaint, k: number) {
  const dash = paint.dash;
  return {
    stroke: svgFixColor(paint.stroke),
    strokeWidth: paint.thickness * k,
    ...(dash === undefined ? {} : { strokeDasharray: dash.map((d) => fmt(d * k)).join(',') }),
  };
}

/** `URectangle.rounded(roundCorner)`, emitted `rx = ry = roundCorner / 2`
 *  (`DriverRectangleSvg.java:78`). */
function roundedOf(roundCorner: number, k: number): { readonly rx: number; readonly ry: number } {
  const r = (roundCorner / 2) * k;
  return { rx: r, ry: r };
}

/**
 * `ComponentRoseGroupingHeader#getCorner` (`:161-186`) -- the type tab's
 * clipped top-right corner, as a `<path>` `d` string. `origin` is the
 * frame's own drawn top-left (`frame.x`/`frame.y`); upstream draws this in
 * the component's LOCAL coordinate system and this port bakes the offset
 * into the `d` string directly, matching the jar's own absolute-coordinate
 * `d` output (no `transform`).
 *
 * Exported for direct coverage of both branches against the literal
 * upstream shape. The radius is the BODY style's `RoundCorner` for both
 * components (`ComponentRoseGroupingHeader.java:79`, `ComponentRoseReference
 * .java:74`).
 */
export function frameHeaderCornerPath(
  origin: { readonly x: number; readonly y: number },
  size: { readonly width: number; readonly height: number },
  cornerSize: number,
  roundCorner: number,
): string {
  const { x, y } = origin;
  const { width: w, height: h } = size;
  if (roundCorner === 0) {
    return [
      moveTo(x, y),
      lineTo(x + w, y),
      lineTo(x + w, y + h - cornerSize),
      lineTo(x + w - cornerSize, y + h),
      lineTo(x, y + h),
      lineTo(x, y),
    ].join(' ');
  }
  const half = roundCorner / 2;
  return [
    moveTo(x + half, y),
    lineTo(x + w, y),
    lineTo(x + w, y + h - cornerSize),
    lineTo(x + w - cornerSize, y + h),
    lineTo(x, y + h),
    lineTo(x, y + half),
    arcTo(x + half, y, half, 0, 1),
  ].join(' ');
}

/**
 * `ComponentRoseGroupingHeader#drawBackgroundInternalU` (`:126-133`) -- the
 * background pass, reached only via `Context2D#isBackground()`
 * (`AbstractComponent.java:144-145`). Under teoz `background` is always
 * `HColors.transparent()` (`:80`), so this is `fill="none"` with an outline
 * stroked by `style`'s symbol context (`:81,128`), rounded by `style`'s
 * `RoundCorner` (`:79,130`) and shadowed by its `Shadowing` (`:131`). Only
 * this background rect carries the shadow -- `drawInternalU`'s second rect
 * (`:144-147`) sets none, and neither does the corner `UPath` (`:142`).
 * Jar-verified: `tests/fixtures/unwind2-S9/style-groupheader.svg` draws no
 * filter at all.
 *
 * A `ref` frame draws NOTHING here. Upstream builds it as a `ReferenceTile`
 * (`TileBuilder.java:174-176`), not a `GroupingTile`, and its component
 * `ComponentRoseReference` declares only `drawInternalU`
 * (`ComponentRoseReference.java:83`), so `AbstractComponent#drawU:143-147`
 * dispatches the EMPTY inherited `drawBackgroundInternalU` (`:139-140`).
 */
export function renderGroupingHeaderBackground(frame: FrameGeo, theme: ScaledTheme): string {
  if (frame.frameType === 'ref') return '';
  const k = theme.scaleK;
  const { paint } = framePaintsOf(frame);
  return rect(frame.x, frame.y, frame.width, frame.height, {
    fill: 'none',
    ...strokeOf(paint, k),
    ...roundedOf(paint.roundCorner, k),
    ...sequenceShadowFilter(frameShadowDelta(frame)),
  });
}

/**
 * The corner-tab `<path>`, drawn with `styleHeader`'s symbol context --
 * fill, line colour and stroke (`symbolContextCorner.apply(ug)`,
 * `ComponentRoseGroupingHeader.java:82,142`; `symbolContextHeader.apply(ug)`,
 * `ComponentRoseReference.java:72,121`) -- and shaped by the BODY style's
 * `RoundCorner`. A `ref` draws its corner at `dx(xMargin)` (`:122`), which
 * `frame.x` already carries.
 */
function renderHeaderCorner(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const { paint, headerPaint } = framePaintsOf(frame);
  const cornerD = frameHeaderCornerPath(
    { x: frame.x, y: frame.y },
    { width: frame.tabWidth, height: frame.tabHeight },
    CORNER_SIZE * k,
    paint.roundCorner * k,
  );
  return path(cornerD, { fill: svgFixColor(headerPaint.fill), ...strokeOf(headerPaint, k) });
}

/**
 * A block's runs as `DriverTextSvg#draw` emits them: each at its own colour,
 * else the block font's, and a run whose colour is transparent not drawn at
 * all (`DriverTextSvg.java:93-94`; the bridge reads a transparent font colour
 * as `null`, `FontConfigurationBridge.ts`). Jar-verified: `group { FontColor
 * transparent }` draws neither the tab title nor the conditions.
 */
export function drawnRuns(runs: readonly TextRun[], font: FontConfiguration): TextRun[] {
  const out: TextRun[] = [];
  for (const run of runs) {
    const color = run.color ?? font.color;
    if (color !== null) out.push({ ...run, color });
  }
  return out;
}

/**
 * The tab title, its optional `[comment]` and a `ref`'s keyword -- each run
 * carries the font its block was built at in layout (`sequence-layout-frame
 * .ts#buildTabRuns`, `sequence-layout-ref.ts#headerOf`): `styleHeader`'s for
 * the title, `style`'s `smallFont2` for the comment
 * (`ComponentRoseGroupingHeader.java:84,90`). That is `DriverTextSvg#draw`
 * reading one `FontConfiguration` per `UText` (`:104-160,177-180`). The
 * fallbacks are the header font's, for a run that set none. Drawn under
 * `UStroke.simple()` (`:149`). `url` WRAPS rather than decorates
 * (`SvgGraphics#openLink`/`closeLink`); `sequence-text.ts` owns that wrap.
 */
function renderHeaderText(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const font = framePaintsOf(frame).headerPaint.font;
  return drawnRuns(frame.tabRuns, font)
    .map((run) =>
      sequenceText({
        leftX: drawnLeftX(run),
        baselineY: run.y,
        text: run.text,
        width: drawnWidth(run),
        fontFamily: run.fontFamily ?? font.family,
        fontSize: run.fontSize ?? font.size * k,
        ...((run.bold ?? font.styles.has(FontStyle.BOLD)) ? { fontWeight: '700' as const } : {}),
        fill: run.color!,
        ...(run.italic === true ? { fontStyle: 'italic' as const } : {}),
        ...(run.decoration !== undefined ? { textDecoration: run.decoration } : {}),
        ...(run.url !== undefined ? { url: run.url } : {}),
        // A `<math>`/`<latex>` run draws its image instead of a `<text>`
        // (`sequence-text.ts#SequenceRunImage`, `AtomMath.java:78-97`).
        ...(run.image !== undefined ? { image: run.image } : {}),
      }),
    )
    .join('');
}

/**
 * The foreground pass's full-area rect, stroked by the BODY style's symbol
 * context. A grouping frame's carries no fill and no shadow
 * (`ComponentRoseGroupingHeader.java:144-147`: stroke and fore colour only,
 * no `setDeltaShadow`). A `ref`'s is the whole symbol context -- fill
 * included -- narrowed by the body style's `getDeltaShadow()` and shadowed by
 * it (`ComponentRoseReference.java:89-96`), the width its
 * `getPreferredWidth` added back (`:155-159`, `ref-body-geo.ts
 * #refComponentWidth`).
 */
function renderBodyRect(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const { paint } = framePaintsOf(frame);
  const isRef = frame.frameType === 'ref';
  const delta = isRef ? frameShadowDelta(frame) : 0;
  return rect(frame.x, frame.y, frame.width - delta * k, frame.height, {
    fill: isRef ? svgFixColor(paint.fill) : 'none',
    ...strokeOf(paint, k),
    ...roundedOf(paint.roundCorner, k),
    ...sequenceShadowFilter(delta),
  });
}

/**
 * `ComponentRoseGroupingHeader#drawInternalU` (`:135-159`) -- the
 * foreground pass, in upstream's exact order: corner path, then the SAME
 * full-area rect the background pass drew (`:144-147`), then the tab text and
 * its optional comment.
 *
 * A `ref` frame is a DIFFERENT component -- `ComponentRoseReference`
 * (`ReferenceTile.java:117-124`) -- whose `drawInternalU` (`:83-136`) emits
 * the body rect FIRST (`:96`) and the corner path SECOND (`:122`), the
 * reverse of this one, and no `[comment]` at all (its display is split into
 * a header at index 0 and body lines from index 1, `:69-78`). Only that
 * ordering differs at this level, so the two share a module rather than
 * duplicating the corner and rect.
 */
export function renderGroupingHeaderForeground(frame: FrameGeo, theme: ScaledTheme): string {
  const cornerEl = renderHeaderCorner(frame, theme);
  const bodyRectEl = renderBodyRect(frame, theme);
  // The page clip took the tab: its `UPath` failed `DriverPathSvg`'s
  // min/max-corner test and its label `UText` failed `DriverTextSvg`'s
  // anchor test, so the body outline is all that is left of the header.
  // See `FrameGeo.headerClipped`.
  if (frame.headerClipped === true) return bodyRectEl;
  const textEl = renderHeaderText(frame, theme);
  if (frame.frameType === 'ref') return bodyRectEl + cornerEl + textEl;
  return cornerEl + bodyRectEl + textEl;
}
