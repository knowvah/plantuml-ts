/**
 * Sequence diagram message-drawing path.
 *
 * Split out of `renderer.ts` (T1, sequence-command-coverage) to make
 * headroom under the 500-line cap for exo-arrow rendering and decorated
 * arrow heads. Pure move — see `renderer.ts`'s own header for the shared
 * scaling rationale this module inherits (`ScaledTheme.scaleK`).
 */

import { rect } from '../../core/svg.js';
import { renderCreatedHead } from './renderer-participant-shapes.js';
import type { MessageGeo, TextRun } from './ast.js';
import type { ScaledTheme } from './scale-geo.js';
import { primitiveFields, sequenceText, weightOf } from './sequence-text.js';
import { drawnLeftX, drawnWidth } from './run-draw-metrics.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { TRANSPARENT_SVG } from './text-block-geo.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import { renderFlatMessageArrow } from './renderer-arrowhead.js';
import { messagePaintOf } from './sequence-arrow-paint.js';
import { renderSelfMessageLeft, renderSelfMessageRight } from './renderer-message-self.js';

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * ONE label run as its `<text>`.
 *
 * C3: every style below is the RUN's own when creole set it and the message's
 * ambient one when it did not, which is exactly `DriverTextSvg#draw` reading
 * one `FontConfiguration` per `UText` (`:104-160,177-180`). A markup-free
 * label carries a family and a size equal to the ambient pair and none of the
 * flags, so it emits byte-identically to the pre-C3 single run.
 *
 * `url` wraps rather than decorates -- `SvgGraphics#openLink`/`closeLink`
 * (`:1105-1150`) -- and `sequence-text.ts` owns that wrap, so there is no
 * second `<a>` emitter here. No measurer is touched: `textWidth` and
 * `fontSize` were resolved in layout and scaled with the geometry (D5).
 */
function messageLabelRun(run: TextRun, font: FontConfiguration, k: number): string {
  return sequenceText({
    leftX: drawnLeftX(run),
    baselineY: run.y,
    text: run.text,
    width: drawnWidth(run),
    // `""mono""` sets its own family; `<size:N>`/`<sup>` its own size. The
    // fallbacks are the arrow style's font layout measured the block at
    // (`AbstractTextualComponent.java:80`), its size scaled at emission like
    // every other length (`SvgGraphics.java:466-468`); `paint` is unscaled.
    fontFamily: run.fontFamily ?? font.family,
    fontSize: run.fontSize ?? font.size * k,
    fill: run.color ?? font.color ?? TRANSPARENT_SVG,
    // The numeric CSS weight (`sequence-text.ts#runFontWeight`).
    ...weightOf(run),
    ...(run.italic === true ? { fontStyle: 'italic' as const } : {}),
    ...(run.decoration !== undefined ? { textDecoration: run.decoration } : {}),
    ...primitiveFields(run),
  });
}

/** The message's label. Upstream draws it last, after the arrow
 *  (`ComponentRoseArrow.java:175`, `ComponentRoseSelfArrow.java:88`).
 *
 *  The autonumber leads, which is `createMessageNumber` merging `tb1` LEFT of
 *  `tb2` (`Display.java:703-712`) read left to right. */
function renderMessageLabel(msg: MessageGeo, theme: ScaledTheme): string {
  return renderLabelPadder(msg, theme) + renderLabelRuns(msg, theme);
}

/** `Padder#drawU`'s one `URectangle`, drawn before the label it wraps
 *  (`Padder.java:128-131`); `rounded(roundCorner)` reaches the SVG as
 *  `rx = ry = roundCorner / 2`, written when positive (`SvgGraphics.java:
 *  582-584`). Stroke is the default `UStroke` (thickness 1), none when the
 *  border colour is unset. */
function renderLabelPadder(msg: MessageGeo, theme: ScaledTheme): string {
  const box = msg.labelPadder;
  if (box === undefined) return '';
  const r = (box.roundCorner / 2) * theme.scaleK;
  return rect(box.x, box.y, box.width, box.height, {
    fill: box.fill,
    stroke: box.stroke,
    strokeWidth: theme.scaleK,
    ...(r > 0 ? { rx: r, ry: r } : {}),
  });
}

function renderLabelRuns(msg: MessageGeo, theme: ScaledTheme): string {
  const runs = msg.labelNumber === undefined ? msg.labelLines : [msg.labelNumber, ...msg.labelLines];
  const font = messagePaintOf(msg).font;
  return runs.map((run) => messageLabelRun(run, font, theme.scaleK)).join('');
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
export function renderMessage(msg: MessageGeo, theme: ScaledTheme): string {
  // A part-anchored message returns from `drawU` before drawing anything
  // (`CommunicationTile.java:328-331`); its tile kept its height in layout.
  if (msg.partAnchored === true) return '';
  // A create message draws the created head FIRST, then the arrow
  // (`CommunicationTile#drawU:351-371`) -- and draws it even when the arrow
  // is hidden, since only the arrow component checks `isHidden()`.
  const head = msg.createdHead === undefined ? '' : renderCreatedHead(msg.createdHead, theme);
  return renderMulticast(msg, theme) + head + renderMessageArrowAndLabel(msg, theme);
}

/**
 * `drawMulticast` (`CommunicationTile.java:373-390`) runs FIRST in `drawU`
 * (`:338`): each extra target gets the message's own configuration (reversed
 * when `x2 < x1`, `getComponentMulticast:169-177`) and no label
 * (`Display.NULL`), over the span between the two lifelines. A hidden arrow
 * draws nothing (`ComponentRoseArrow.java:85-87`).
 */
function renderMulticast(msg: MessageGeo, theme: ScaledTheme): string {
  if (msg.multicast === undefined || msg.arrow.hidden === true) return '';
  return msg.multicast.map((target) => renderFlatMessageArrow({ ...msg, ...target }, msg.arrow, theme)).join('');
}

/** `isReverseDefine()` picks the side (`ComponentRoseSelfArrow.java:83-86`). */
function renderSelfMessage(msg: MessageGeo, configuration: ArrowConfiguration, theme: ScaledTheme): string {
  return configuration.reverseDefine === true
    ? renderSelfMessageLeft(msg, configuration, theme)
    : renderSelfMessageRight(msg, configuration, theme);
}

function renderMessageArrowAndLabel(msg: MessageGeo, theme: ScaledTheme): string {
  const configuration = msg.arrow;
  // `-[hidden]->` draws NOTHING: `ComponentRoseArrow#drawInternalU:85-87` and
  // `ComponentRoseSelfArrow#drawInternalU:71-73` both return on
  // `isHidden()` before the line, both arrowheads and the label. The message
  // still occupies its full height -- neither `getPreferredHeight` nor
  // `getPreferredWidth` is guarded (`ComponentRoseArrow.java:342-349`) -- so
  // this suppression belongs here and never in layout.
  if (configuration.hidden === true) return '';
  const arrow =
    msg.arrowDirection === 'self'
      ? renderSelfMessage(msg, configuration, theme)
      : renderFlatMessageArrow(msg, configuration, theme);
  return arrow + renderMessageLabel(msg, theme);
}
