/**
 * Sequence diagram message-drawing path.
 *
 * Split out of `renderer.ts` (T1, sequence-command-coverage) to make
 * headroom under the 500-line cap for exo-arrow rendering and decorated
 * arrow heads. Pure move — see `renderer.ts`'s own header for the shared
 * scaling rationale this module inherits (`ScaledTheme.scaleK`).
 */

import type { MessageGeo } from './ast.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaledDashPattern } from './scale-geo.js';
import { path } from '../../core/svg.js';
import { sequenceText } from './sequence-text.js';
import { ARROW_FONT_SIZE } from './sequence-layout-shared.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import {
  renderFlatMessageArrow,
  renderSelfMessageHead,
} from './renderer-arrowhead.js';

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * The self-message loop's horizontal reach: where the vertical stroke goes.
 *
 * `xRight = arrowWidth - 3` with `arrowWidth = 45`
 * (`ComponentRoseSelfArrow.java:59-60`), and `drawRightSide:124-126` draws the
 * three strokes as `hline(xRight - x1)`, `vline(arrowHeight)` at `xRight`, and
 * `hline(xRight - x2)` — so the drawn extent is **42**, not `arrowWidth`.
 *
 * Gap SQ-5 recorded this as "40 vs 45". Measured absolutely against the jar in
 * Batch 8 of `plans/sequence-coordinate-convergence`, the gap was 40 vs 42:
 * `jobadi-87-jegi648`'s loop runs `x1="34.469"` to `x2="76.469"`, and 42 puts
 * this port's on it exactly.
 */
const SELF_LOOP_WIDTH = 42;
/**
 * The loop's vertical drop. Upstream's is `getArrowOnlyHeight()` = **13**
 * (`ComponentRoseSelfArrow.java:321-323`), drawn as `vline(arrowHeight)`
 * (`:125`), and `jobadi-87-jegi648`'s golden drops `y1="53"` to `y2="66"`.
 *
 * This port's 20 is therefore 7 too tall, and it is left that way
 * DELIBERATELY: y-coordinate convergence is an explicit non-goal of the
 * mission that measured it (`plans/sequence-coordinate-convergence`), and
 * changing it moves every self message's following event. Cited here so the
 * next mission to touch it does not have to re-derive it.
 */
const SELF_LOOP_HEIGHT = 20;

/**
 * The self branch: three strokes clockwise off the lifeline and back, then
 * the head at the foot. Upstream draws the strokes FIRST and the head after
 * (`ComponentRoseSelfArrow.java:124-126` then `:131-173`) -- the reverse of
 * the flat component's order, and the order `botoku-28-cupe920` shows.
 *
 * Emitted as one `<path>` where upstream emits three `<line>`s; that is the
 * spike's existing shape, left alone here because this task owns the HEADS.
 */
function renderSelfMessage(
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  theme: ScaledTheme,
): string {
  const k = theme.scaleK;
  const x1 = msg.fromX;
  // The RETURNING segment does not start where the outgoing one does:
  // `ComponentRoseSelfArrow#drawRightSide:92-93` splits them by `deltaX1`,
  // and by one pixel even when nothing is live. Resolved in layout, which is
  // where the activation level lives -- see `MessageGeo.selfReturnX`. The
  // fallback covers a hand-authored geometry that predates the field.
  const xBack = msg.selfReturnX ?? x1;
  const y1 = msg.y;
  const loopWidth = SELF_LOOP_WIDTH * k;
  const loopHeight = SELF_LOOP_HEIGHT * k;
  const d =
    `M ${x1} ${y1} ` +
    `H ${x1 + loopWidth} ` +
    `V ${y1 + loopHeight} ` +
    `H ${xBack}`;
  const loop = path(d, {
    stroke: theme.colors.arrow,
    strokeWidth: 1 * k,
    ...(configuration.dashed ? { strokeDasharray: scaledDashPattern(k) } : {}),
  });
  // The head sits at the foot of the RETURNING segment, so it moves with it.
  return loop + renderSelfMessageHead(msg, configuration, theme, y1 + loopHeight);
}

/** The message's label. Upstream draws it last, after the arrow
 *  (`ComponentRoseArrow.java:175`, `ComponentRoseSelfArrow.java:88`). */
function renderMessageLabel(msg: MessageGeo, theme: ScaledTheme): string {
  const runs = msg.labelNumber === undefined ? msg.labelLines : [msg.labelNumber, ...msg.labelLines];
  return runs
    .map((run) =>
      sequenceText({
        leftX: run.x,
        baselineY: run.y,
        text: run.text,
        // Measured in layout at this same font and carried on the run (D1);
        // the renderer has no measurer and must not acquire one.
        width: run.textWidth,
        fontFamily: theme.fontFamily,
        // `arrow { FontSize 13 }` (`plantuml.skin:306-308`), scaled with the
        // rest of the document. Layout measured the block with the same
        // value (`text-block-geo.ts#messageLabelBlock`).
        fontSize: ARROW_FONT_SIZE * theme.scaleK,
        fill: theme.colors.text,
      }),
    )
    .join('');
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
 * `fill="#000"` with no guillemet run drawn anywhere. Wiring the stereotype
 * to the arrow's line style is a real feature (a `<style>`-bucket lookup
 * keyed by stereotype, mirroring the participant-color bucket this engine
 * already has) but touches `sequence-arrowhead.ts`/`renderer-arrowhead.ts`,
 * which are out of this task's write-set this batch (T15). Left parsed and
 * carried on `MessageGeo`, not drawn, matching upstream's own dead-visually
 * behavior until that bucket is ported.
 */
export function renderMessage(msg: MessageGeo, theme: ScaledTheme): string {
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
