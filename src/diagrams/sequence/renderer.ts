/**
 * Sequence diagram SVG renderer.
 *
 * Pure function: SequenceGeometry + Theme → SVG string.
 * No DOM, no async.
 *
 * T13 (dispatch-by-parse-attempt): `scale ...` is applied at the
 * layout→render boundary, mirroring `json/renderer.ts` — `scale-geo.ts`
 * scales `SequenceGeometry` and `Theme.fontSize` as pure data BEFORE this
 * module ever sees them, and every OTHER local pixel-literal constant this
 * file owns (`ACTIVATION_HALF_WIDTH`, `SELF_LOOP_WIDTH`/`HEIGHT`, and the
 * small inline offsets throughout; a style paint's lengths in
 * `renderer-note.ts`)
 * is scaled at its point of use via the `ScaledTheme.scaleK` this module
 * threads everywhere `theme` already flowed. See `scale-geo.ts`'s header
 * for the full rationale and the jar measurements this replaces (a
 * `<g transform="scale(...)">` wrap around unscaled coordinates, which
 * upstream never emits for a document body — `manageScale`,
 * `SvgGraphics.java:1035-1051`, is for embedded sprites only).
 */

import type { SequenceGeometry, EventGeo, ElseGeo, FrameGeo, NewpageGeo, DelayGeo } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
// No `text` import: D3 -- every `<text>` this file emits goes through
// `sequenceText`, and dropping the direct import is what makes that
// structural rather than a convention.
import { line } from '../../core/svg.js';
import { primitiveFields, sequenceText, weightOf } from './sequence-text.js';
import { drawnLeftX, drawnWidth } from './run-draw-metrics.js';
import type { TextRun } from './text-block-geo.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { fmt } from '../../core/svg-format.js';
import { renderMessage } from './renderer-message.js';
import { renderLinkAnchors } from './renderer-link-anchor.js';
import { renderParticipantBox, renderFooterBox } from './renderer-participant-shapes.js';
import { lifelineOf, renderDestroyCrosses, renderLifelinePass, type LiveboxItem } from './renderer-lifeline.js';
import { renderFrameBlotter } from './renderer-frame-blotter.js';
import {
  drawnRuns,
  framePaintsOf,
  renderGroupingHeaderBackground,
  renderGroupingHeaderForeground,
  strokeOf,
  svgFixColor,
} from './renderer-frame-header.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { renderDivider } from './renderer-divider.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaleSequenceGeometry, scaleSequenceTheme } from './scale-geo.js';
import { paginateSequence } from './sequence-page.js';
import { canvasOf, documentChromeOf, preChromeDims } from './renderer-document.js';
import { sequenceShadowDefs } from './sequence-shadow.js';
import { renderBoxBackground, renderNote, renderNoteBackground } from './renderer-note.js';
import { NEWPAGE_MARGIN_Y } from './newpage-style.js';
import { applyColorMapperToFragment, colorMapperOf } from '../../core/klimt/color/fragment-color-mapper.js';

/**
 * ONE creole run as a `<text>`, at the caller's ambient font wherever creole
 * set none -- `renderRefBody`'s shape (C5), shared by the two sites C6 added
 * rather than copied a third and fourth time. `DriverTextSvg#draw` reads
 * `font-weight`, `font-style`, `fill` and the assembled `text-decoration` off
 * ONE `FontConfiguration` per `UText` (`:104-160,177-180`), and
 * `SvgGraphics#openLink`/`closeLink` (`:1105-1150`) WRAP the drawn shape rather
 * than decorating it -- so the url reaches `sequence-text.ts`, the single `<a>`
 * emitter, and no measurer is acquired here (D1, D5). `boldFallback` is the
 * component STYLE's own weight, which a run that set its own beats -- exactly
 * as `renderElse` resolves the leaf style's. */
export function creoleRunText(run: TextRun, theme: ScaledTheme, fontSize: number, boldFallback = false): string {
  return sequenceText({
    leftX: drawnLeftX(run),
    baselineY: run.y,
    text: run.text,
    width: drawnWidth(run),
    fontFamily: run.fontFamily ?? theme.fontFamily,
    fontSize: run.fontSize ?? fontSize,
    fill: run.color ?? theme.colors.text,
    // The numeric weight, not `'bold'` -- the jar emits the numeric form
    // (`sequence-text.ts#runFontWeight`).
    ...weightOf(run, boldFallback),
    ...(run.italic === true ? { fontStyle: 'italic' as const } : {}),
    ...(run.decoration !== undefined ? { textDecoration: run.decoration } : {}),
    // url, image, shape, back colour, extended-colour lines
    // (`sequence-text.ts#primitiveFields`).
    ...primitiveFields(run),
  });
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** A component text block's runs, at the font layout built them with: one
 *  `<text>` per creole atom, each run's own style beating the block's
 *  (`DriverTextSvg#draw` reads one `FontConfiguration` per `UText`,
 *  `:104-160,177-180`). */
function styledRunsText(runs: readonly TextRun[], font: FontConfiguration, theme: ScaledTheme): string {
  const bold = font.styles.has(FontStyle.BOLD);
  return drawnRuns(runs, font)
    .map((run) => creoleRunText(run, theme, font.size * theme.scaleK, bold))
    .join('');
}

/**
 * A `ref over` frame's body: one `<text>` per creole atom, placed in layout
 * (`sequence-layout-ref.ts#bodyRuns`) at the body style's font and alignment
 * -- `ComponentRoseReference#drawInternalU` draws the header at `(15, 2)` and
 * the body block below it (`:126-137`).
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
function renderRefBody(frame: FrameGeo, theme: ScaledTheme): string {
  if (frame.refBody.length === 0) return '';
  return styledRunsText(frame.refBody, framePaintsOf(frame).paint.font, theme);
}

/**
 * `GroupingTile#drawU`'s foreground half (`:267`): `comp.drawU(...)`,
 * dispatched with `isBackground()` false, reaches `drawInternalU` --
 * `renderGroupingHeaderForeground` (T4) -- then a `ref`'s body. The child
 * tiles (`:280-281`), each `else` among them, are the events that follow
 * the frame in the stream ({@link renderElse}).
 */
function renderFrame(frame: FrameGeo, theme: ScaledTheme): string {
  return renderGroupingHeaderForeground(frame, theme) + renderRefBody(frame, theme);
}

/**
 * `GroupingTile#drawU`'s background half (`:269-270, :308-347`): the
 * `Blotter` bands (`renderFrameBlotter`), THEN `drawBackgroundInternalU` --
 * the plain outline (`renderGroupingHeaderBackground`), upstream's own order.
 * A `ref` is a `ReferenceTile`, which draws nothing in this pass
 * (`ComponentRoseReference` declares only `drawInternalU`, `:83`).
 */
function renderFrameBackground(frame: FrameGeo, theme: ScaledTheme): string {
  if (frame.frameType === 'ref') return '';
  return renderFrameBlotter(frame, theme.scaleK) + renderGroupingHeaderBackground(frame, theme);
}

/** `ArrowConfiguration.stroke(ug, 2, 2, 1)`: the else rule's fixed dash and
 *  thickness (`ComponentRoseGroupingElse.java:106`,
 *  `ArrowConfiguration.java:240-242`). */
const ELSE_RULE_DASH = 2;
const ELSE_RULE_THICKNESS = 1;
/** `ug.apply(UTranslate.dy(1)).draw(ULine.hline(…))`
 *  (`ComponentRoseGroupingElse.java:107`): the rule sits one pixel below the
 *  else tile's top. Jar-verified on a two-`else` `alt`: rules at 131 and 175
 *  for tiles at 130 and 174. */
const ELSE_RULE_DY = 1;

/**
 * The dashed rule + bracketed condition an `else` tile draws, in the
 * foreground pass, at its place among its group's child tiles
 * (`ElseTile#drawU:103-133`): `ComponentRoseGroupingElse#drawInternalU`
 * (`:103-113`) strokes a `ULine.hline` the frame's width, one pixel down, in
 * `groupBorder` (`:70`), under `stroke(2, 2, 1)`; then the text block under
 * `UStroke.simple()`. The paint is the else's OWN leaf style, merged from the
 * builder current at its `else` line (`ElseTile#getComponent:92-101`,
 * `SequenceDiagram.java:431-432`), so a `skinparam`/`<style>` between the
 * opener and the `else` reaches the rule and the condition font. The dash and
 * thickness are fixed whatever the style says.
 */
function renderElse(elseGeo: ElseGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const { paint } = elseGeo;
  const dash = fmt(ELSE_RULE_DASH * k);
  const y = elseGeo.y + ELSE_RULE_DY * k;
  const rule = line(elseGeo.x, y, elseGeo.x + elseGeo.width, y, {
    stroke: svgFixColor(paint.stroke),
    strokeWidth: ELSE_RULE_THICKNESS * k,
    strokeDasharray: `${dash},${dash}`,
  });
  // A5: the runs are empty exactly when the branch carries no condition,
  // which is the case that draws the rule alone. C5: several runs where
  // creole styled the condition, each its own `<text>` (D3).
  return rule + styledRunsText(elseGeo.runs, paint.font, theme);
}

// ---------------------------------------------------------------------------
// Divider helpers
// ---------------------------------------------------------------------------

/**
 * `ComponentRoseDivider#drawSep` (`:91-95`) — the full-width band every
 * divider draws, labelled or not: a 3px `URectangle` at `dy - 1` under
 * `UStroke.simple()`, then TWO `ULine.hline` at `dy - 1` and `dy + 2` at half
 * the style's thickness. `dy` is the component's own vertical midpoint.
 *
 * The band spans the tile's `Area` width, not `getPreferredWidth`
 * (`:67`, `DividerTile.java`'s `Area.create(border2 - border1 - xorigin, …)`),
 * which is `totalWidth` here.
 */
/**
 * The page separator: ONE `ULine.hline(areaWidth)`, and nothing else.
 *
 * `ComponentRoseNewpage#drawInternalU` is three statements -- take the
 * style's stroke and line colour, draw a horizontal line the width of the
 * `Area` (`:59-64`) -- and `NewpageTile#drawU` hands it an `Area` spanning
 * `border1 … border2`, translated by `dy(MARGINY)` inside the tile
 * (`:83-90`). So the line sits 10px below the tile's top, which is what puts
 * it inside BOTH adjacent page bands.
 *
 * It draws nothing in the background pass -- `drawU` returns early on
 * `isBackground` (`NewpageTile.java:79-81`) -- which `renderEvent`'s
 * `isBackground` guard already provides.
 */
function renderNewpage(newpage: NewpageGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const y = newpage.y + NEWPAGE_MARGIN_Y * k;
  return line(newpage.bandX, y, newpage.bandX + newpage.bandWidth, y, strokeOf(newpagePaintOf(newpage), k));
}

/** The paint layout resolved for this separator (D1). */
function newpagePaintOf(newpage: NewpageGeo): SequencePaint {
  if (newpage.paint === undefined) throw new Error('newpage geo has no paint: layout resolves it (sdd1 D1)');
  return newpage.paint;
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

/**
 * `PlayingSpace#drawBackground`/`#drawForeground` share `drawUInternal`
 * (`PlayingSpace.java:109-117`); only the `UGraphicInterceptorTile
 * #isBackground` flag they wrap `ug` in differs (that class suppresses
 * nothing itself, it only carries the flag). `frame` is the one event kind
 * whose component overrides `drawBackgroundInternalU`; every other kind
 * inherits `AbstractComponent`'s empty default (`:139-140`), so messages,
 * notes, activations, dividers and spaces draw nothing here.
 */
function renderEvent(event: EventGeo, theme: ScaledTheme, isBackground: boolean): string {
  if (event.kind === 'frame') {
    return isBackground ? renderFrameBackground(event, theme) : renderFrame(event, theme);
  }
  if (isBackground) return event.kind === 'note' ? renderNoteBackground(event, theme) : '';
  return renderForeground(event, theme);
}

/** The foreground pass for every kind but `frame` (handled above). */
function renderForeground(event: Exclude<EventGeo, FrameGeo>, theme: ScaledTheme): string {
  switch (event.kind) {
    case 'message':
      return renderMessage(event, theme);
    case 'destroy':
      // Only an unbound destroy's own tile draws here (`LifeEventTile
      // #drawU:112-122`); `LiveBoxes` draws the rest in step 2.
      return renderDestroyCrosses(event, 'tile', theme);
    case 'activation':
    // Drawn in the lifeline pass (step 2), not here -- see the comment
    // there and `LivingSpace#drawLineAndLiveboxes`.
    // falls through
    case 'space':
      // Space geos add no visible elements
      return '';
    case 'note':
      return renderNote(event, theme);
    case 'else':
      return renderElse(event, theme);
    case 'divider':
      return renderDivider(event, theme);
    case 'newpage':
      return renderNewpage(event, theme);
    case 'delay':
      return renderDelayText(event, theme);
  }
}

/** `ComponentRoseDelayText#drawInternalU` (`:62-70`): only the text block,
 *  at the delay style's font -- the dotted line is the lifeline's own
 *  `DELAY_LINE` piece. */
function renderDelayText(delay: DelayGeo, theme: ScaledTheme): string {
  if (delay.paint === undefined) throw new Error('delay geo has no paint: layout resolves it (sdd1 D1)');
  return styledRunsText(delay.labelRuns, delay.paint.font, theme);
}

/** One event-walk pass -- see {@link renderEvent}; mirrors the one
 *  `drawUInternal` both drawBackground/drawForeground share. */
function renderEventPass(events: readonly EventGeo[], theme: ScaledTheme, isBackground: boolean): string[] {
  return events.map((event) => renderEvent(event, theme, isBackground));
}

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

function renderPaginated(geo: SequenceGeometry, theme: Theme, measurer: StringMeasurer): RenderFragment {
  // T13: `resolveScaleFactor` needs the UNSCALED document dims -- `geo`
  // itself, before `scaleSequenceGeometry` runs below. cdd-T30: `theme.dpi`
  // -- `skinParam.getDpi()` (`core/TextBlockExporter.java:206`), default 96
  // when `skinparam dpi` was never declared (`Theme.dpi`'s own doc comment).
  const k = resolveScaleFactor(geo.scale, geo.totalWidth, geo.totalHeight, theme.dpi);
  const scaledGeo = scaleSequenceGeometry(geo, k);
  const scaledTheme = scaleSequenceTheme(theme, k, measurer);
  const children: string[] = [];

  // 0. Box backgrounds (lowest z-order — behind lifelines and participants)
  children.push(...scaledGeo.boxes.map((box) => renderBoxBackground(box, scaledTheme)));

  // 1. Background pass -- `playingSpace.drawBackground(ugBody)`
  //    (`PlayingSpaceWithParticipants.java:218`), the FIRST of the five
  //    passes. Walks the SAME `scaledGeo.events` array, in the same order,
  //    as step 5 below -- `PlayingSpace#drawBackground`/`#drawForeground`
  //    both delegate to the identical `drawUInternal` (`PlayingSpace.java:
  //    109-117`), differing only in the `isBackground` flag `renderEvent`
  //    now takes. Everything but a frame's own band+outline is silent here.
  children.push(...renderEventPass(scaledGeo.events, scaledTheme, true));
  //    The link anchors close `drawUInternal` after its tile loop
  //    (`PlayingSpace.java:129-134`), in this pass as in step 5.
  children.push(renderLinkAnchors(scaledGeo.linkAnchors, scaledTheme));

  // 2. Lifelines AND liveboxes -- one pass, per participant.
  //    `PlayingSpaceWithParticipants#drawU:221` calls
  //    `livingSpaces.drawLifeLines(...)` here, and `LivingSpace
  //    #drawLineAndLiveboxes` draws each participant's line followed by that
  //    participant's own activation boxes. Activations are therefore NOT part
  //    of the event pass below, however naturally they read as events.
  children.push(
    renderLifelinePass(
      scaledGeo.participants,
      scaledGeo.events.filter((e): e is LiveboxItem => e.kind === 'activation' || e.kind === 'destroy'),
      (p) => lifelineOf(scaledGeo.lifelineSegments, p),
      scaledTheme,
    ),
  );

  // 3. Participant header boxes
  // A created participant has no head here (`drawHeadOrTail:194-196`); its
  // create message draws it instead.
  for (const p of scaledGeo.participants) {
    if (p.createY === undefined) children.push(renderParticipantBox(p, scaledTheme));
  }

  // 4. Footer boxes, unless suppressed -- BEFORE the foreground tiles.
  //    `PlayingSpaceWithParticipants#drawU:223-227` draws the footbox row
  //    immediately after the heads and only then calls
  //    `playingSpace.drawForeground(ugBody)`, so upstream lets an arrow paint
  //    OVER a footbox. Emitting it last, as this renderer used to, inverts
  //    that z-order as well as shifting every following child index.
  //    `SequenceDiagram#isShowFootbox` (`SequenceDiagram.java:474-486`) is
  //    resolved once at layout, which is also where the space for this row is
  //    (not) reserved -- see `layout.ts#isShowFootbox`.
  if (scaledGeo.showFootbox) {
    for (const p of scaledGeo.participants) {
      children.push(renderFooterBox(p, scaledGeo.footerShapeY, scaledTheme));
    }
  }

  // 5. Foreground tiles -- messages, notes, frames, dividers.
  //    `playingSpace.drawForeground(ugBody)` (`:227`), the LAST of the five
  //    passes. Activations are absent here by design; see step 2.
  children.push(...renderEventPass(scaledGeo.events, scaledTheme, false));
  children.push(renderLinkAnchors(scaledGeo.linkAnchors, scaledTheme));

  const shadowDefs = sequenceShadowDefs(scaledGeo, scaledTheme);
  return {
    // sdd3-T1h: `TitledDiagram#muteColorMapper` (`TitledDiagram.java:292-299`)
    // installs MONOCHROME / MONOCHROME_REVERSE on the exporter for the whole
    // draw pass (`UgDiagram.java:134-135`), so EVERY colour the body draws is
    // mapped (`ColorMapper.java:80-91`) -- applied once to the assembled body,
    // as activity does (`activity/renderer.ts`). No mapper is a no-op.
    body: applyColorMapperToFragment(children.join(''), colorMapperOf(theme)),
    ...canvasOf(geo, k),
    ...preChromeDims(scaledGeo, k),
    ...documentChromeOf(theme),
    // T2's `finalizeSequenceBody` (`core/assemble-svg.ts`) owns the content
    // `<g>` wrap and the background rect, so the body is handed over bare.
    diagramType: DIAGRAM_TYPE_SEQUENCE,
    // unwind2-S9: the frames' shadow filter, when one is drawn.
    ...(shadowDefs === '' ? {} : { extraDefs: shadowDefs }),
  };
}
