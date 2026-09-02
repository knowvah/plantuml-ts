/**
 * MESSAGE geometry — an arrow, its label runs, and the activation bars a
 * message opens and closes.
 *
 * One of the four per-renderer geometry modules `geo.ts` was split into
 * (D8); this one pairs with `renderer-message.ts`. {@link ActivationGeo} lives
 * here rather than with the annotations because a bar is opened and closed by
 * a message's own `++`/`--` suffix, and because `renderer-lifeline.ts` reads it
 * beside {@link MessageGeo}.
 *
 * Re-exported by `geo.ts`, which is re-exported by `ast.ts`.
 */

import type { ArrowConfiguration } from './sequence-arrowhead.js';
import type { MessageExoType } from './ast.js';
import type { TextRun } from './text-block-geo.js';

export interface MessageGeo {
  kind: 'message';
  fromX: number;
  toX: number;
  y: number;
  label: string;
  /** The message's `ArrowConfiguration`, carried through from
   *  {@link AbstractMessageEvent.arrow} unchanged — it is drawing vocabulary,
   *  not geometry, so `scaleSequenceGeometry` passes it through untouched. */
  arrow: ArrowConfiguration;
  sequenceNumber?: number;
  /** `AutoNumber#getNextMessageNumber`'s formatted text
   *  (`DottedNumber#format`), when the source's `autonumber` carries a dotted
   *  start or a quoted `FORMAT`; the renderer prefers this over the bare
   *  `sequenceNumber` when present. */
  sequenceLabel?: string;
  /**
   * The label as PLACED text: one entry per source line, each with its own
   * `x`/`y`. Positioned in layout rather than at render time for the same
   * reason `FrameGeo.refBody` is -- the jar emits a computed `x` and no
   * `text-anchor`, and computing one needs the measurer. Empty when the
   * message has no label: `AbstractTextualComponent` maps an empty display to
   * a `TextBlockEmpty`, which draws nothing
   * (`AbstractTextualComponent.java:84-85`).
   */
  labelLines: readonly TextRun[];
  /** The autonumber, when present -- its OWN `<text>` beside the label lines,
   *  vertically centred against them, with no `": "` joining the two
   *  (`Display.java:703-712`). */
  labelNumber?: TextRun;
  arrowDirection: 'right' | 'left' | 'self';
  /** {@link AbstractMessageEvent.url}, carried to the renderer. */
  url?: string;
  /** {@link AbstractMessageEvent.stereotype}, carried to the renderer. */
  stereotype?: string;
  /** {@link AbstractMessageEvent.lifeColor}, carried to the renderer. */
  lifeColor?: string;
  /** Exo geometry only: `MessageExoArrow` anchors one end at the border this
   *  type names (`isLeftBorder`/`isRightBorder`), which the renderer cannot
   *  re-derive from `fromX`/`toX`. */
  exoType?: MessageExoType;
  /** {@link MessageExoEvent.shortArrow}, likewise exo-only. */
  shortArrow?: boolean;
  /**
   * SELF messages only: the x the RETURNING (lower) horizontal segment
   * starts at, where {@link fromX} is the OUTGOING (upper) one's.
   *
   * The two differ. `ComponentRoseSelfArrow#drawRightSide` opens with
   * ```java
   * double x1 = area.getDeltaX1() < 0 ? area.getDeltaX1() : 0;
   * double x2 = area.getDeltaX1() > 0 ? -area.getDeltaX1() : 1;
   * ```
   * (`:92-93`) — so even with no live participant at all the returning
   * segment starts ONE pixel right of the outgoing one, and when the message
   * opens or closes an activation the two split by a whole
   * `LIVE_DELTA_SIZE`. Jar-verified on `jobadi-87-jegi648`
   * (`34.469`/`35.469`, the bare +1) and `gesiba-07-rise357`
   * (`60.044`/`66.044`, a `B -> B ++` straddling its own new bar).
   *
   * Absent on every non-self message.
   */
  selfReturnX?: number;
}

export interface ActivationGeo {
  kind: 'activation';
  participantId: string;
  lifelineX: number;
  y: number;
  height: number;
  /**
   * How deeply this bar is nested, 1-based — upstream's `Step#getIndent`,
   * the value `LiveBoxes#drawBoxes` loops `for (int i = 1; i <= max; i++)`
   * over (`:342-346`). A COUNT, not a length: it is what the renderer
   * multiplies the half-width by, so it must not be scaled.
   *
   * `drawOneLevel` offsets each level by
   * `(levelToDraw - 1) * drawer.getWidth() / 2` (`:365-368`) — derived from
   * the box's own width, which is why the renderer computes it from
   * `ACTIVATION_HALF_WIDTH` rather than from a separate 5.
   */
  level: number;
  color?: string;
}
