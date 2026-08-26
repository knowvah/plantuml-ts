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
import { text, path } from '../../core/svg.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import {
  renderFlatMessageArrow,
  renderSelfMessageHead,
} from './renderer-arrowhead.js';

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * The self-message loop's own geometry. Upstream's is `arrowWidth = 45` with
 * the vertical stroke at `xRight = 42` (`ComponentRoseSelfArrow.java:59-60`);
 * this port keeps the spike's 40 (Gap SQ-5, out of this task's scope), so the
 * loop is 5 px narrower than the jar's and the head below is placed against
 * THIS loop's returning segment rather than against upstream's `x2`.
 */
const SELF_LOOP_WIDTH = 40;
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
  const y1 = msg.y;
  const loopWidth = SELF_LOOP_WIDTH * k;
  const loopHeight = SELF_LOOP_HEIGHT * k;
  const d =
    `M ${x1} ${y1} ` +
    `H ${x1 + loopWidth} ` +
    `V ${y1 + loopHeight} ` +
    `H ${x1}`;
  const loop = path(d, {
    stroke: theme.colors.arrow,
    strokeWidth: 1 * k,
    ...(configuration.dashed ? { strokeDasharray: scaledDashPattern(k) } : {}),
  });
  return loop + renderSelfMessageHead(msg, configuration, theme, y1 + loopHeight);
}

/** The message's label. Upstream draws it last, after the arrow
 *  (`ComponentRoseArrow.java:175`, `ComponentRoseSelfArrow.java:88`). */
function renderMessageLabel(msg: MessageGeo, theme: ScaledTheme): string {
  const runs = msg.labelNumber === undefined ? msg.labelLines : [msg.labelNumber, ...msg.labelLines];
  return runs
    .map((run) =>
      text(run.x, run.y, run.text, {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
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
 */
export function renderMessage(msg: MessageGeo, theme: ScaledTheme): string {
  const configuration = msg.arrow;
  const arrow =
    msg.arrowDirection === 'self'
      ? renderSelfMessage(msg, configuration, theme)
      : renderFlatMessageArrow(msg, configuration, theme);
  return arrow + renderMessageLabel(msg, theme);
}
