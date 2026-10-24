/**
 * Sequence diagram message-drawing path.
 *
 * Split out of `renderer.ts` (T1, sequence-command-coverage) to make
 * headroom under the 500-line cap for exo-arrow rendering and decorated
 * arrow heads. Pure move.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { drawCreatedHead } from './renderer-participant-shapes.js';
import type { MessageGeo } from './ast.js';
import type { PageTheme } from './renderer-ug.js';
import { TRANSPARENT_SVG } from './text-block-geo.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import { drawFlatMessageArrow } from './renderer-arrowhead.js';
import { messagePaintOf } from './sequence-arrow-paint.js';
import { drawSelfMessageLeft, drawSelfMessageRight } from './renderer-message-self.js';
import { drawRun, type RunAmbient } from './renderer-text.js';

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * What a label run falls back to where creole set nothing: the arrow style's
 * font layout measured the block at (`AbstractTextualComponent.java:80`), its
 * size; `paint` carries the style's own lengths. Each run is then ONE `UText` through `DriverTextSvg`
 * reading one `FontConfiguration` (`:104-160,177-180`), via {@link drawRun}.
 * `""mono""` sets its own family; `<size:N>`/`<sup>` its own size.
 */
function labelAmbientOf(msg: MessageGeo): RunAmbient {
  const font = messagePaintOf(msg).font;
  return { fontFamily: font.family, fontSize: font.size, color: font.color ?? TRANSPARENT_SVG };
}

/** The message's label. Upstream draws it last, after the arrow
 *  (`ComponentRoseArrow.java:179`, `ComponentRoseSelfArrow.java:88`).
 *
 *  The autonumber leads, which is `createMessageNumber` merging `tb1` LEFT of
 *  `tb2` (`Display.java:703-712`) read left to right.
 *
 *  `getTextBlock()` is `padder.apply(super.getTextBlock())`
 *  (`AbstractComponentRoseArrow.java:72-75`), so the padder's rectangle
 *  precedes the runs it wraps (`Padder.java:119-135`). */
export function drawMessageLabel(ug: UGraphic, msg: MessageGeo): void {
  drawLabelPadder(ug, msg);
  drawLabelRuns(ug, msg);
}

/**
 * `Padder#drawU`'s one `URectangle`, drawn before the label it wraps:
 *
 * ```java
 * ug = ug.apply(margin.getTranslate());                                       // :120
 * ug2 = ug.apply(borderColor == null ? HColors.none() : borderColor);         // :122-125
 * ug2 = ug2.apply(backgroundColor == null ? HColors.none().bg() : backgroundColor.bg()); // :127-130
 * final URectangle rect = URectangle.build(padding.apply(originalDim)).rounded(roundCorner); // :133
 * ug2.draw(rect);                                                             // :134
 * orig.drawU(ug.apply(padding.getTranslate()));                               // :135
 * ```
 * (`Padder.java`, the anonymous `TextBlock#drawU` of `apply`; the box is
 * layout's resolved `labelPadder`, so `margin.getTranslate()` is the one
 * translate to its top-left.) `rounded(roundCorner)` reaches the SVG as `rx =
 * ry = roundCorner / 2`, written when positive (`SvgGraphics.java:582-584`).
 * The stroke is the graphic's default `UStroke.simple()` (thickness 1); the
 * border colour and the background are the geo's paints, `PAINT_NONE` when
 * unset.
 */
export function drawLabelPadder(ug: UGraphic, msg: MessageGeo): void {
  const box = msg.labelPadder;
  if (box === undefined) return;
  ug.apply(new UTranslate(box.x, box.y))
    .apply(new Fore(box.stroke))
    .apply(new Back(box.fill))
    .draw(URectangle.build(box.width, box.height).rounded(box.roundCorner));
}

function drawLabelRuns(ug: UGraphic, msg: MessageGeo): void {
  const runs = msg.labelNumber === undefined ? msg.labelLines : [msg.labelNumber, ...msg.labelLines];
  const ambient = labelAmbientOf(msg);
  for (const run of runs) drawRun(ug, run, ambient);
}

/**
 * One message: its arrow, then its label. The arrow's heads are inline
 * polygons/strokes, never an SVG `<marker>` reference -- `assembleDocument
 * Shell` injects no marker defs, and the jar's own sequence corpus contains
 * none either.
 *
 * The configuration is read straight off the geometry: the parser builds the
 * whole `ArrowConfiguration` (D1), so there is no style-to-shape adapter and
 * no decoration overlay left at render time. `msg.exoType`, when set, marks
 * geometry an exo message produced -- a distinct drawing path
 * (`MessageExoArrow`), not this one.
 *
 * `msg.url`/`msg.stereotype` are carried onto the geometry (`sequence-
 * layout-message.ts`) but deliberately NOT drawn here -- verified against
 * the oracle jar, not inferred from `CommandArrow.java`/`MessageArrow.java`
 * alone. Both `MessageArrow`/`MessageSelfArrow` (the classic
 * `sequencediagram/graphic/` engine `startUrl`/`endUrl` lives in) are DEAD
 * CODE in the shipped jar: `SequenceDiagram.java` imports only
 * `teoz.SequenceDiagramFileMakerTeoz`, and no `new MessageSelfArrow(`/`new
 * MessageArrow(` call exists anywhere in the source tree. `teoz/
 * CommunicationTile.java` -- the component that actually draws messages --
 * never reads `AbstractMessage#getUrl()`. Confirmed on the golden SVGs:
 * `Alice -> Bob [[http://www.yahoo.com{...}]] : hello` (`fajixi-56-dete708`)
 * and the self-message `A -> A [[link{link with tooltip}]]: here is a OK
 * example` (`sefako-72-jono850`) both render their label as plain
 * `fill="#000"` text with NO `<a>` anywhere near the arrow -- an `<a>` wrap
 * here would be fabricated output the jar never produces (D4's PARALLEL/
 * ANCHOR treatment: parse-only, no divergence to document, because that is
 * exactly what upstream does).
 *
 * `<<stereotype>>` is, per the Java, ONLY a style-signature lookup key
 * (`AbstractMessage.java:60-65,74-77`, `getStyleSignature().
 * withTOBECHANGED(stereotype)`) -- confirmed on `terapo-81-puzi168`
 * (`<style>.a { Linecolor red }` + `alice -> bob <<a>> : red`): the golden
 * arrow LINE turns `stroke:#F00`, but the label text stays plain
 * `fill="#000"` with no guillemet run drawn anywhere. It reaches the line
 * through the merged arrow style (`sequence-arrow-paint.ts#messagePaint`,
 * sdd1 T2c), never as text.
 */
export function drawMessage(ug: UGraphic, msg: MessageGeo, theme: PageTheme): void {
  // A part-anchored message returns from `drawU` before drawing anything
  // (`CommunicationTile.java:328-331`); its tile kept its height in layout.
  if (msg.partAnchored === true) return;
  drawMulticast(ug, msg, theme);
  // A create message draws the created head FIRST, then the arrow
  // (`CommunicationTile#drawU:351-371`) -- and draws it even when the arrow
  // is hidden, since only the arrow component checks `isHidden()`.
  if (msg.createdHead !== undefined) drawCreatedHead(ug, msg.createdHead, theme);
  drawMessageArrowAndLabel(ug, msg, theme);
}

/**
 * `drawMulticast` (`CommunicationTile.java:373-390`) runs FIRST in `drawU`
 * (`:338`): each extra target gets the message's own configuration (reversed
 * when `x2 < x1`, `getComponentMulticast:169-177`) and no label
 * (`Display.NULL`), over the span between the two lifelines. A hidden arrow
 * draws nothing (`ComponentRoseArrow.java:85-87`).
 *
 * ```java
 * final UGraphic ug2 = ug.apply(UTranslate.dx(Math.min(x1, x2))).apply(UTranslate.dy(dy)); // :386
 * comp.drawU(ug2, area, (Context2D) ug2);                                                   // :388
 * ```
 * Each target's tile translates are the extra target's `x`/`y` here.
 */
export function drawMulticast(ug: UGraphic, msg: MessageGeo, theme: PageTheme): void {
  if (msg.multicast === undefined || msg.arrow.hidden === true) return;
  for (const target of msg.multicast) drawFlatMessageArrow(ug, { ...msg, ...target }, msg.arrow, theme);
}

/** `isReverseDefine()` picks the side (`ComponentRoseSelfArrow.java:83-86`). */
function drawSelfMessage(ug: UGraphic, msg: MessageGeo, configuration: ArrowConfiguration, theme: PageTheme): void {
  if (configuration.reverseDefine === true) drawSelfMessageLeft(ug, msg, configuration, theme);
  else drawSelfMessageRight(ug, msg, configuration, theme);
}

function drawMessageArrowAndLabel(ug: UGraphic, msg: MessageGeo, theme: PageTheme): void {
  const configuration = msg.arrow;
  // `-[hidden]->` draws NOTHING: `ComponentRoseArrow#drawInternalU:85-87` and
  // `ComponentRoseSelfArrow#drawInternalU:71-73` both return on
  // `isHidden()` before the line, both arrowheads and the label. The message
  // still occupies its full height -- neither `getPreferredHeight` nor
  // `getPreferredWidth` is guarded (`ComponentRoseArrow.java:342-349`) -- so
  // this suppression belongs here and never in layout.
  if (configuration.hidden === true) return;
  if (msg.arrowDirection === 'self') drawSelfMessage(ug, msg, configuration, theme);
  else drawFlatMessageArrow(ug, msg, configuration, theme);
  drawMessageLabel(ug, msg);
}
