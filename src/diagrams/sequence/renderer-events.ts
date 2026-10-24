/**
 * The event walk of a sequence page, drawn through the page's `UGraphic`:
 * a pure-move split of `renderer.ts` (500-line cap; sdd3 T8e) holding every
 * tile kind that is not a lifeline, a participant head or a link anchor --
 * messages, notes, frames, `else` rules, dividers, `newpage` rules, `delay`
 * text, destroy crosses.
 *
 * `PlayingSpace#drawBackground`/`#drawForeground` share one `drawUInternal`
 * (`PlayingSpace.java:109-117`); it walks the SAME tile list in both, only the
 * `UGraphicInterceptorTile#isBackground` flag differs ({@link drawEventPass}).
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { FontStyle, type FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { DelayGeo, ElseGeo, EventGeo, FrameGeo, NewpageGeo } from './ast.js';
import type { TextRun } from './text-block-geo.js';
import type { PageTheme } from './renderer-ug.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { drawMessage } from './renderer-message.js';
import { drawDestroyCrosses } from './renderer-livebox.js';
import { strokeOf } from './renderer-line-component.js';
import { drawDivider } from './renderer-divider.js';
import { drawFrameBlotter } from './renderer-frame-blotter.js';
import {
  drawGroupingHeaderBackground,
  drawGroupingHeaderForeground,
  drawnRuns,
  framePaintsOf,
  svgFixColor,
} from './renderer-frame-header.js';
import { drawNote, drawNoteBackground } from './renderer-note.js';
import { drawCreoleRuns } from './sequence-text.js';
import { NEWPAGE_MARGIN_Y } from './newpage-style.js';

/** A component text block's runs, at the font layout built them with: one
 *  `UText` per creole atom, each run's own style beating the block's
 *  (`DriverTextSvg#draw` reads one `FontConfiguration` per `UText`,
 *  `:104-160,177-180`). */
function drawStyledRuns(ug: UGraphic, runs: readonly TextRun[], font: FontConfiguration, theme: PageTheme): void {
  drawCreoleRuns(ug, drawnRuns(runs, font), theme, font.size, font.styles.has(FontStyle.BOLD));
}

/**
 * A `ref over` frame's body: one `UText` per creole atom, placed in layout
 * (`sequence-layout-ref.ts#bodyRuns`) at the body style's font and alignment
 * -- `ComponentRoseReference#drawInternalU` draws the header at `(15, 2)` and
 * the body block below it (`:126-137`).
 *
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
function drawRefBody(ug: UGraphic, frame: FrameGeo, theme: PageTheme): void {
  if (frame.refBody.length === 0) return;
  drawStyledRuns(ug, frame.refBody, framePaintsOf(frame).paint.font, theme);
}

/**
 * `GroupingTile#drawU`'s foreground half (`:267`): `comp.drawU(...)`,
 * dispatched with `isBackground()` false, reaches `drawInternalU` --
 * `drawGroupingHeaderForeground` (T4) -- then a `ref`'s body. The child
 * tiles (`:280-281`), each `else` among them, are the events that follow
 * the frame in the stream ({@link drawElse}).
 */
function drawFrame(ug: UGraphic, frame: FrameGeo, theme: PageTheme): void {
  drawGroupingHeaderForeground(ug, frame);
  drawRefBody(ug, frame, theme);
}

/**
 * `GroupingTile#drawU`'s background half (`:269-270, :308-347`): the
 * `Blotter` bands (`drawFrameBlotter`), THEN `drawBackgroundInternalU` --
 * the plain outline (`drawGroupingHeaderBackground`), upstream's own order.
 * A `ref` is a `ReferenceTile`, which draws nothing in this pass
 * (`ComponentRoseReference` declares only `drawInternalU`, `:83`).
 */
function drawFrameBackground(ug: UGraphic, frame: FrameGeo): void {
  if (frame.frameType === 'ref') return;
  drawFrameBlotter(ug, frame);
  drawGroupingHeaderBackground(ug, frame);
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
function drawElse(ug: UGraphic, elseGeo: ElseGeo, theme: PageTheme): void {
  const { paint } = elseGeo;
  ug.apply(new UTranslate(elseGeo.x, elseGeo.y))
    .apply(new UStroke(ELSE_RULE_DASH, ELSE_RULE_DASH, ELSE_RULE_THICKNESS))
    .apply(new Fore(svgFixColor(paint.stroke)))
    .apply(UTranslate.dy(ELSE_RULE_DY))
    .draw(ULine.hline(elseGeo.width));
  // A5: the runs are empty exactly when the branch carries no condition,
  // which is the case that draws the rule alone. C5: several runs where
  // creole styled the condition, each its own `UText` (D3).
  drawStyledRuns(ug, elseGeo.runs, paint.font, theme);
}

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
 * `isBackground` (`NewpageTile.java:79-81`) -- which {@link drawEvent}'s
 * `isBackground` guard already provides.
 */
function drawNewpage(ug: UGraphic, newpage: NewpageGeo): void {
  const paint = newpagePaintOf(newpage);
  ug.apply(new UTranslate(newpage.bandX, newpage.y))
    .apply(UTranslate.dy(NEWPAGE_MARGIN_Y))
    .apply(strokeOf(paint))
    .apply(new Fore(svgFixColor(paint.stroke)))
    .draw(ULine.hline(newpage.bandWidth));
}

/** The paint layout resolved for this separator (D1). */
function newpagePaintOf(newpage: NewpageGeo): SequencePaint {
  if (newpage.paint === undefined) throw new Error('newpage geo has no paint: layout resolves it (sdd1 D1)');
  return newpage.paint;
}

/** `ComponentRoseDelayText#drawInternalU` (`:62-70`): only the text block,
 *  at the delay style's font -- the dotted line is the lifeline's own
 *  `DELAY_LINE` piece. */
function drawDelayText(ug: UGraphic, delay: DelayGeo, theme: PageTheme): void {
  if (delay.paint === undefined) throw new Error('delay geo has no paint: layout resolves it (sdd1 D1)');
  drawStyledRuns(ug, delay.labelRuns, delay.paint.font, theme);
}

/**
 * One tile in one pass. `frame` is the one event kind whose component
 * overrides `drawBackgroundInternalU`; every other kind inherits
 * `AbstractComponent`'s empty default (`:139-140`), so messages, notes,
 * activations, dividers and spaces draw nothing in the background pass --
 * but for a `top`/`bottom` note's connector, which `drawLine` draws straight
 * on the `UGraphic` ({@link drawNoteBackground}).
 */
function drawEvent(ug: UGraphic, event: EventGeo, theme: PageTheme, isBackground: boolean): void {
  if (event.kind === 'frame') {
    if (isBackground) drawFrameBackground(ug, event);
    else drawFrame(ug, event, theme);
  } else if (!isBackground) drawForeground(ug, event, theme);
  else if (event.kind === 'note') drawNoteBackground(ug, event);
}

/** The foreground pass for every kind but `frame` (handled above). */
function drawForeground(ug: UGraphic, event: Exclude<EventGeo, FrameGeo>, theme: PageTheme): void {
  switch (event.kind) {
    case 'message':
      return drawMessage(ug, event, theme);
    case 'destroy':
      // Only an unbound destroy's own tile draws here (`LifeEventTile
      // #drawU:112-122`); `LiveBoxes` draws the rest in step 2.
      return drawDestroyCrosses(ug, event, 'tile');
    case 'activation':
    // Drawn in the lifeline pass (step 2), not here -- see the comment
    // there and `LivingSpace#drawLineAndLiveboxes`.
    // falls through
    case 'space':
      // Space geos add no visible elements
      return;
    case 'note':
      return drawNote(ug, event, theme);
    case 'else':
      return drawElse(ug, event, theme);
    case 'divider':
      return drawDivider(ug, event, theme);
    case 'newpage':
      return drawNewpage(ug, event);
    case 'delay':
      return drawDelayText(ug, event, theme);
  }
}

/** One event-walk pass -- see {@link drawEvent}; mirrors the one
 *  `drawUInternal` both drawBackground/drawForeground share. */
export function drawEventPass(
  ug: UGraphic,
  events: readonly EventGeo[],
  theme: PageTheme,
  isBackground: boolean,
): void {
  for (const event of events) drawEvent(ug, event, theme, isBackground);
}
