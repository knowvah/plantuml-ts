/**
 * Sequence diagram SVG renderer.
 *
 * Pure function: SequenceGeometry + Theme → SVG fragment.
 * No DOM, no async.
 *
 * The page is DRAWN at scale 1 and the `scale ...` directive is the
 * exporter's single `SvgGraphics#format` pass (`core/TextBlockExporter.ts
 * #exportTo`, `SvgGraphics.java:466-475`), never a multiply in this module:
 * a `<g transform="scale(...)">` wrap around unscaled coordinates is something
 * upstream never emits for a document body (`manageScale`,
 * `SvgGraphics.java:1035-1051`, is for embedded sprites only).
 */

import type { SequenceGeometry } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { isExportScaled } from '../../core/scale-command.js';
import { withDeferredFormat } from '../../core/svg-format.js';
import { drawLinkAnchors } from './renderer-link-anchor.js';
import { drawFooterBox, drawParticipantBox } from './renderer-participant-shapes.js';
import { drawLifelinesOf } from './renderer-lifeline.js';
import { openSequenceGraphic, pageThemeOf } from './renderer-ug.js';
import { drawEventPass } from './renderer-events.js';
import { paginateSequence } from './sequence-page.js';
import {
  documentChromeOf,
  drawnExtentSeed,
  exporterMarginFields,
  exporterPlacement,
  type ExporterPlacement,
} from './renderer-document.js';
import { sequenceShadowDefs } from './sequence-shadow.js';
import { drawBoxBackground } from './renderer-note.js';
import { applyColorMapperToFragment, colorMapperOf } from '../../core/klimt/color/fragment-color-mapper.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** The jar's `data-diagram-type` value for this engine
 *  (`TextBlockExporter.java:293`), which routes `assembleSvg` through
 *  `assembleDocumentShell` instead of the generic `svgRoot`. */
const DIAGRAM_TYPE_SEQUENCE = 'SEQUENCE';

/**
 * Render ONE PAGE of a sequence diagram geometry into an SVG string.
 *
 * `SequenceDiagramFileMakerTeoz#getTextBlock(num, …)` sets the page index on
 * the body and only then draws it (`:127-146`), so the page selection sits
 * exactly here: between layout and render, ahead of the scale multiply,
 * because upstream paginates in layout space and applies `scale` on the way
 * out (`SvgGraphics#format`).
 *
 * `paginateSequence` returns `geo` by reference when the document has no
 * `newpage`, which is every document but 35 of the oracle corpus.
 */
export function renderSequencePage(
  geo: SequenceGeometry,
  theme: Theme,
  pageIndex: number,
  measurer: StringMeasurer,
): RenderFragment {
  return renderPaginated(paginateSequence(geo, pageIndex), theme, measurer);
}

/**
 * Render a sequence diagram geometry into an SVG string — PAGE 1 of it.
 *
 * The jar writes `f.svg`, `f_001.svg`, … for a multi-page document; this
 * port's render entry point returns one string, so it returns the first
 * page and {@link renderSequencePage} reaches the rest. See
 * `plans/sequence-newpage-pagination/decisions.md` D5.
 */
export function renderSequence(geo: SequenceGeometry, theme: Theme, measurer: StringMeasurer): RenderFragment {
  return renderSequencePage(geo, theme, 0, measurer);
}

/** The scale every page is DRAWN at. The export scale is the exporter's
 *  (`core/TextBlockExporter.ts#exportTo`): `computeScaleFactor` reads the
 *  chrome-included dimension (`TextBlockExporter.java:160,165,205-209`), which
 *  does not exist until chrome has composed, so the page is drawn at 1. */
const DRAW_SCALE = 1;

/** What one page's graphic yields: its markup, the font `@import` its
 *  document wrote once into `<defs>` (`SvgGraphics#addRoboto`,
 *  `SvgGraphics.java:195-205`), and its `ensureVisible` fold -- the canvas
 *  (`SvgGraphics.java:129-135`). */
interface DrawnPage {
  readonly children: string;
  readonly fontDefs: string;
  readonly maxX: number;
  readonly maxY: number;
}

/**
 * The page's draw passes, in the jar's order, on ONE graphic: upstream draws
 * the whole page into the exporter's single `UGraphicSvg`
 * (`TextBlockExporter.java:169-177`), so one `openSequenceGraphic` per page
 * and a sequence of `draw...(g.ug, ...)` calls. The graphic is floored at the
 * page's own extent (`TextBlockExporter.java:284`, `option.withMinDim(dim)`)
 * and drawn under the exporter's margin translate
 * (`TextBlockExporter.java:168-176`), so its `maxX`/`maxY` -- `ensureVisible`
 * folded over every primitive, seed included -- is the canvas.
 */
function drawPaginated(
  geo: SequenceGeometry,
  theme: Theme,
  measurer: StringMeasurer,
  placement: ExporterPlacement,
): DrawnPage {
  const pageTheme = pageThemeOf(theme, measurer);
  const g = openSequenceGraphic(pageTheme, drawnExtentSeed(placement.extent), placement.translate);
  const { ug } = g;

  // 0. Box backgrounds (lowest z-order — behind lifelines and participants)
  for (const box of geo.boxes) drawBoxBackground(ug, box, pageTheme);

  // 1. Background pass -- `playingSpace.drawBackground(ugBody)`
  //    (`PlayingSpaceWithParticipants.java:218`), the FIRST of the five
  //    passes. Walks the SAME `geo.events` array, in the same order,
  //    as step 5 below -- `PlayingSpace#drawBackground`/`#drawForeground`
  //    both delegate to the identical `drawUInternal` (`PlayingSpace.java:
  //    109-117`), differing only in the `isBackground` flag `drawEvent`
  //    takes. Everything but a frame's own band+outline is silent here.
  drawEventPass(ug, geo.events, pageTheme, true);
  //    The link anchors close `drawUInternal` after its tile loop
  //    (`PlayingSpace.java:129-134`), in this pass as in step 5.
  drawLinkAnchors(ug, geo.linkAnchors, pageTheme);

  // 2. Lifelines AND liveboxes -- one pass, per participant.
  //    `PlayingSpaceWithParticipants#drawU:221` calls
  //    `livingSpaces.drawLifeLines(...)` here, and `LivingSpace
  //    #drawLineAndLiveboxes` draws each participant's line followed by that
  //    participant's own activation boxes. Activations are therefore NOT part
  //    of the event pass below, however naturally they read as events.
  drawLifelinesOf(ug, geo);

  // 3. Participant header boxes
  // A created participant has no head here (`drawHeadOrTail:194-196`); its
  // create message draws it instead.
  for (const p of geo.participants) if (p.createY === undefined) drawParticipantBox(ug, p, pageTheme);

  // 4. Footer boxes, unless suppressed -- BEFORE the foreground tiles.
  //    `PlayingSpaceWithParticipants#drawU:223-227` draws the footbox row
  //    immediately after the heads and only then calls
  //    `playingSpace.drawForeground(ugBody)`, so upstream lets an arrow paint
  //    OVER a footbox. Emitting it last, as this renderer used to, inverts
  //    that z-order as well as shifting every following child index.
  //    `SequenceDiagram#isShowFootbox` (`SequenceDiagram.java:474-486`) is
  //    resolved once at layout, which is also where the space for this row is
  //    (not) reserved -- see `layout.ts#isShowFootbox`.
  if (geo.showFootbox) {
    for (const p of geo.participants) drawFooterBox(ug, p, geo.footerShapeY, pageTheme);
  }

  // 5. Foreground tiles -- messages, notes, frames, dividers.
  //    `playingSpace.drawForeground(ugBody)` (`:227`), the LAST of the five
  //    passes. Activations are absent here by design; see step 2.
  drawEventPass(ug, geo.events, pageTheme, false);
  drawLinkAnchors(ug, geo.linkAnchors, pageTheme);

  // The graphic's defs (a gradient) lead its markup, as the page's def
  // collector (`svg-defs.ts#collectDocumentDefs`) lifts them from the body.
  const { body, extraDefs, fontDefs, maxX, maxY } = g.finish();
  return { children: extraDefs + body, fontDefs, maxX, maxY };
}

function renderPaginated(geo: SequenceGeometry, theme: Theme, measurer: StringMeasurer): RenderFragment {
  // sdd3-T3b: drawn at scale 1; when the document is export-scaled (a `scale`
  // directive or `skinparam dpi` != 96, `scale-command.ts#isExportScaled`) the
  // numbers stay lossless and the exporter's single `SvgGraphics#format` pass
  // rounds them once (`SvgGraphics.java:466-475`; activity precedent,
  // `activity/renderer.ts`).
  const deferred = isExportScaled(geo.scale, theme.dpi);
  const placement = exporterPlacement(geo, theme);
  const { children, fontDefs, maxX, maxY } = withDeferredFormat(deferred, () =>
    drawPaginated(geo, theme, measurer, placement),
  );
  // The page's `<defs>`: the frames' shadow filter, when one is drawn
  // (unwind2-S9), then the font `@import` the document wrote once.
  const pageDefs = sequenceShadowDefs(geo, { ...theme, scaleK: DRAW_SCALE }) + fontDefs;
  return {
    // sdd3-T1h: `TitledDiagram#muteColorMapper` (`TitledDiagram.java:292-299`)
    // installs MONOCHROME / MONOCHROME_REVERSE on the exporter for the whole
    // draw pass (`UgDiagram.java:134-135`), so EVERY colour the body draws is
    // mapped (`ColorMapper.java:80-91`) -- applied once to the assembled body,
    // as activity does (`activity/renderer.ts`). No mapper is a no-op.
    body: applyColorMapperToFragment(children, colorMapperOf(theme)),
    // sdd3-T8g: the canvas is the graphic's own fold, `ensureVisible` over the seed and every drawn primitive
    // (`SvgGraphics.java:129-135,142-143`); it also travels as the fold chrome and the banner shift with the body.
    width: maxX,
    height: maxY,
    drawnMaxX: maxX,
    drawnMaxY: maxY,
    // sdd3-T2d: the style `Margin` (`TextBlockExporter.java:510-516`) the page was drawn under.
    ...exporterMarginFields(placement),
    ...documentChromeOf(theme),
    // sdd3-T3b: the exporter's inputs (`TextBlockExporter.java:205-209`):
    // the `scale` directive and `skinparam dpi`, resolved against the
    // chrome-included dimension by `exportTo`.
    ...(geo.scale === undefined ? {} : { scaleSpec: geo.scale }),
    ...(theme.dpi === undefined ? {} : { dpi: theme.dpi }),
    ...(deferred ? { numbersDeferred: true as const } : {}),
    // sdd3-T2c: `TextBlockExporter.java:307` -- `skinparam lengthAdjust` is the
    // document's `SvgOption`, read by `SvgGraphics.java:155-158,703-705`.
    ...(theme.lengthAdjust !== undefined ? { lengthAdjust: theme.lengthAdjust } : {}),
    // T2's `finalizeSequenceBody` (`core/assemble-svg.ts`) owns the content
    // `<g>` wrap and the background rect, so the body is handed over bare.
    diagramType: DIAGRAM_TYPE_SEQUENCE,
    ...(pageDefs === '' ? {} : { extraDefs: pageDefs }),
  };
}
