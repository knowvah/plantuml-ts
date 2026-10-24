/**
 * A grouping frame's type tab -- background pass (the plain outline) and
 * foreground pass (the clipped-corner tab + its text), drawn through the
 * page's `UGraphic` (sdd3 T8e). Both halves draw the SAME full-area
 * `URectangle`; that duplication is not a bug here, it is
 * `AbstractComponent#drawU`'s per-component two-half dispatch
 * (`drawBackgroundInternalU` vs `drawInternalU`, never both in one call) --
 * see this component's own two methods below.
 *
 * Each `draw<X>` takes the graphic at the PAGE origin and translates to the
 * frame's top-left itself, as the tile does (`GroupingTile#drawU`); every
 * shape is then drawn in the component's local frame, on the instance its
 * last `apply` produced (`symbolContext.applyStroke(ug).apply(fore)`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractComponent.java:137-149
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseGroupingHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseReference.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:100-127
 */

import type { FrameGeo, TextRun } from './ast.js';
import type { Paint } from '../../core/paint.js';
import { PAINT_NONE } from '../../core/svg.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UPath } from '../../core/klimt/shape/UPath.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import { drawRun, type RunAmbient } from './renderer-text.js';
import { primitiveKind } from './sequence-label-primitives.js';
import { frameShadowDelta } from './sequence-shadow.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { CORNER_SIZE } from './frame-style.js';
import { TRANSPARENT_SVG } from './text-block-geo.js';
import { strokeOf } from './renderer-line-component.js';

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

/** `SvgGraphics#fixColor` (`SvgGraphics.java:539-541`): a transparent fill or
 *  stroke is written `none`. */
export function svgFixColor(p: Paint): Paint {
  return p === TRANSPARENT_SVG ? PAINT_NONE : p;
}

/** `symbolContext.getForeColor()` as a frame applies it. */
function foreOf(paint: SequencePaint): Fore {
  return new Fore(svgFixColor(paint.stroke));
}

/** `Fashion#apply` (`klimt/Fashion.java:76-92`): fore, back `.bg()`, stroke --
 *  `symbolContextCorner.apply(ug)`, `symbolContextBody.apply(ug)`. */
function fashion(ug: UGraphic, paint: SequencePaint): UGraphic {
  return ug
    .apply(foreOf(paint))
    .apply(new Back(svgFixColor(paint.fill)))
    .apply(strokeOf(paint));
}

/** `Fashion#applyStroke(ug).apply(getForeColor())`
 *  (`ComponentRoseGroupingHeader.java:128,144`): the outline's stroke, then
 *  its colour, and NO back colour. */
function outline(ug: UGraphic, paint: SequencePaint): UGraphic {
  return ug.apply(strokeOf(paint)).apply(foreOf(paint));
}

/** The graphic at the frame's top-left: the tile's own translate
 *  (`GroupingTile#drawU`, `ReferenceTile#drawU`). A `ref`'s `dx(xMargin)`
 *  (`ComponentRoseReference.java:96,122`) is already in `frame.x`. */
function atFrame(ug: UGraphic, frame: FrameGeo): UGraphic {
  return ug.apply(new UTranslate(frame.x, frame.y));
}

/**
 * `ComponentRoseGroupingHeader#getCorner` (`:161-186`) -- the type tab's
 * clipped top-right corner, as a `UPath` at the component's origin.
 *
 * Exported for direct coverage of both branches against the literal
 * upstream shape. The radius is the BODY style's `RoundCorner` for both
 * components (`ComponentRoseGroupingHeader.java:79`, `ComponentRoseReference
 * .java:74`). `UPath#closePath` records nothing, so `d` stays unclosed.
 */
export function frameHeaderCorner(
  size: { readonly width: number; readonly height: number },
  cornerSize: number,
  roundCorner: number,
): UPath {
  const { width, height } = size;
  const polygon = UPath.none();
  if (roundCorner === 0) {
    polygon.moveTo(0, 0);
    polygon.lineTo(width, 0);
    polygon.lineTo(width, height - cornerSize);
    polygon.lineTo(width - cornerSize, height);
    polygon.lineTo(0, height);
    polygon.lineTo(0, 0);
    return polygon;
  }
  const half = roundCorner / 2;
  polygon.moveTo(half, 0);
  polygon.lineTo(width, 0);
  polygon.lineTo(width, height - cornerSize);
  polygon.lineTo(width - cornerSize, height);
  polygon.lineTo(0, height);
  polygon.lineTo(0, half);
  polygon.arcTo(half, half, 0, 0, 1, half, 0);
  return polygon;
}

/**
 * `ComponentRoseGroupingHeader#drawBackgroundInternalU` (`:126-133`) -- the
 * background pass, reached only via `Context2D#isBackground()`
 * (`AbstractComponent.java:144-145`):
 *
 * ```java
 * ug = symbolContext.applyStroke(ug).apply(symbolContext.getForeColor());
 * final URectangle rect = URectangle.build(w, h).rounded(roundCorner);
 * rect.setDeltaShadow(symbolContext.getDeltaShadow());
 * ug.apply(background.bg()).draw(rect);
 * ```
 * Under teoz `background` is always `HColors.transparent()` (`:80`), so this
 * is `fill="none"` with an outline stroked by `style`'s symbol context
 * (`:81,128`), rounded by `style`'s `RoundCorner` (`:79,130`) and shadowed by
 * its `Shadowing` (`:131`). Only this background rect carries the shadow --
 * `drawInternalU`'s second rect (`:144-147`) sets none, and neither does the
 * corner `UPath` (`:142`). Jar-verified:
 * `tests/fixtures/unwind2-S9/style-groupheader.svg` draws no filter at all.
 *
 * A `ref` frame draws NOTHING here. Upstream builds it as a `ReferenceTile`
 * (`TileBuilder.java:174-176`), not a `GroupingTile`, and its component
 * `ComponentRoseReference` declares only `drawInternalU`
 * (`ComponentRoseReference.java:83`), so `AbstractComponent#drawU:143-147`
 * dispatches the EMPTY inherited `drawBackgroundInternalU` (`:139-140`).
 */
export function drawGroupingHeaderBackground(ug: UGraphic, frame: FrameGeo): void {
  if (frame.frameType === 'ref') return;
  const { paint } = framePaintsOf(frame);
  const rect = URectangle.build(frame.width, frame.height).rounded(paint.roundCorner);
  rect.setDeltaShadow(frameShadowDelta(frame));
  outline(atFrame(ug, frame), paint).apply(new Back(PAINT_NONE)).draw(rect);
}

/**
 * The corner-tab `UPath`, drawn with `styleHeader`'s symbol context --
 * fill, line colour and stroke (`symbolContextCorner.apply(ug)`,
 * `ComponentRoseGroupingHeader.java:82,142`; `symbolContextHeader.apply(ug)`,
 * `ComponentRoseReference.java:72,121`) -- and shaped by the BODY style's
 * `RoundCorner`.
 */
function drawHeaderCorner(ug: UGraphic, frame: FrameGeo): void {
  const { paint, headerPaint } = framePaintsOf(frame);
  const corner = frameHeaderCorner({ width: frame.tabWidth, height: frame.tabHeight }, CORNER_SIZE, paint.roundCorner);
  fashion(atFrame(ug, frame), headerPaint).draw(corner);
}

/**
 * A block's runs as `DriverTextSvg#draw` emits them: each at its own colour,
 * and a run whose colour is transparent not drawn at all
 * (`DriverTextSvg.java:93-94`). The creole seam stamps a run's resolved fill
 * only when its font colour is not transparent
 * (`sequence-label-primitives.ts:157`), so an absent colour IS transparent --
 * falling back to the header font's would paint the comment's `[` and `]`
 * (the `group` style's font) in the title's (`groupHeader`'s) colour.
 * Jar-verified: `group { FontColor transparent }` draws neither the
 * conditions' brackets nor (`groupHeader { FontColor transparent }`) the tab
 * title. `font` (the block font) colours only a non-text primitive.
 *
 * The rule is about TEXT: `DriverTextSvg` is the only driver that skips a
 * transparent colour. An image or shape primitive (a `<$sprite>` atom) never
 * carries a run colour and is drawn by its own driver, so it is always kept.
 */
export function drawnRuns(runs: readonly TextRun[], font: FontConfiguration): TextRun[] {
  const out: TextRun[] = [];
  for (const run of runs) {
    if (run.color !== undefined) out.push(run);
    else if (primitiveKind(run) !== 'text' && font.color !== null) out.push({ ...run, color: font.color });
  }
  return out;
}

/** What a frame's runs fall back to where creole set none: the block font's
 *  family, (scaled) size and weight. The colour is never read --
 *  {@link drawnRuns} stamps every drawn run with its own. */
function frameAmbientOf(font: FontConfiguration): RunAmbient {
  return {
    fontFamily: font.family,
    fontSize: font.size,
    color: font.color ?? TRANSPARENT_SVG,
    bold: font.styles.has(FontStyle.BOLD),
  };
}

/**
 * The tab title, its optional `[comment]` and a `ref`'s keyword -- each run
 * carries the font its block was built at in layout (`sequence-layout-frame
 * .ts#buildTabRuns`, `sequence-layout-ref.ts#headerOf`): `styleHeader`'s for
 * the title, `style`'s `smallFont2` for the comment
 * (`ComponentRoseGroupingHeader.java:84,90`). That is `DriverTextSvg#draw`
 * reading one `FontConfiguration` per `UText` (`:104-160,177-180`), via
 * {@link drawRun}. Drawn under `UStroke.simple()` (`:149`).
 */
function drawHeaderText(ug: UGraphic, frame: FrameGeo): void {
  const font = framePaintsOf(frame).headerPaint.font;
  const ambient = frameAmbientOf(font);
  const simple = ug.apply(UStroke.simple());
  for (const run of drawnRuns(frame.tabRuns, font)) drawRun(simple, run, ambient);
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
function bodyRectOf(frame: FrameGeo, paint: SequencePaint): URectangle {
  const delta = frame.frameType === 'ref' ? frameShadowDelta(frame) : 0;
  const rect = URectangle.build(frame.width - delta, frame.height).rounded(paint.roundCorner);
  rect.setDeltaShadow(delta);
  return rect;
}

/** A grouping frame's body outline: `symbolContext.applyStroke(ug)
 *  .apply(fore)` then `draw(rect)` (`ComponentRoseGroupingHeader.java:144-147`). */
function drawGroupingBodyRect(ug: UGraphic, frame: FrameGeo): void {
  const { paint } = framePaintsOf(frame);
  outline(atFrame(ug, frame), paint).draw(bodyRectOf(frame, paint));
}

/** A `ref`'s body: `symbolContextBody.apply(ug)` then `draw(rect)`
 *  (`ComponentRoseReference.java:93-96`). */
function drawReferenceBodyRect(ug: UGraphic, frame: FrameGeo): void {
  const { paint } = framePaintsOf(frame);
  fashion(atFrame(ug, frame), paint).draw(bodyRectOf(frame, paint));
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
export function drawGroupingHeaderForeground(ug: UGraphic, frame: FrameGeo): void {
  // The page clip took the tab: its `UPath` failed `DriverPathSvg`'s
  // min/max-corner test and its label `UText` failed `DriverTextSvg`'s
  // anchor test, so the body outline is all that is left of the header.
  // See `FrameGeo.headerClipped`.
  const isRef = frame.frameType === 'ref';
  if (frame.headerClipped === true) {
    if (isRef) drawReferenceBodyRect(ug, frame);
    else drawGroupingBodyRect(ug, frame);
    return;
  }
  if (isRef) drawReferenceBodyRect(ug, frame);
  drawHeaderCorner(ug, frame);
  if (!isRef) drawGroupingBodyRect(ug, frame);
  drawHeaderText(ug, frame);
}
