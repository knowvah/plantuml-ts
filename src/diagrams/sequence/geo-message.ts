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

import type { SequencePaint } from './sequence-skin-param.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import type { MessageExoType } from './ast.js';
import type { TextRun } from './text-block-geo.js';
import type { ParticipantGeo } from './geo-participant.js';

export interface MessageGeo {
  /**
   * The element's resolved style paint (sdd1 D1/D5). Optional until its family
   * migrates. NOT scaled by `scale-geo`: the jar scales at emission
   * (`SvgGraphics#format`), see `scale-geo.ts` header.
   */
  readonly paint?: SequencePaint;
  kind: 'message';
  /** A create message's head (`CommunicationTile#drawU:347-371`): the
   *  participant, at the x the tile draws it, and the block top it is drawn
   *  from -- see `sequence-layout-create.ts`. */
  createdHead?: { participant: ParticipantGeo; y: number };
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
  /**
   * REVERSE self messages (`A <- A`) only: `Area#getLevel`, the live level
   * before the message (`CommunicationTileSelf.java:152`), which
   * `ComponentRoseSelfArrow#drawLeftSide` reads for the saltire's indent
   * (`:218-226`) and which cannot be recovered from the geometry. A count,
   * not a length: never scaled.
   */
  selfLevel?: number;
  /**
   * REVERSE self messages (`A <- A`) only: the tile's `getMinX`,
   * `posC - getCompWidth() - liveDeltaWidthAdjustment`
   * (`CommunicationTileSelf.java:263-270`) -- left of the drawn loop, and
   * what `PlayingSpace` folds into the drawing's min (`PlayingSpace.java
   * :91-94`), so a reverse loop on the first participant shifts the drawing.
   */
  tileMinX?: number;
}

export interface ActivationGeo {
  /**
   * The element's resolved style paint (sdd1 D1/D5). Optional until its family
   * migrates. NOT scaled by `scale-geo`: the jar scales at emission
   * (`SvgGraphics#format`), see `scale-geo.ts` header.
   */
  readonly paint?: SequencePaint;
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
  /**
   * Set only on a bar a delay cut into pieces (`LiveBoxesDrawer#doDrawing`,
   * `teoz/LiveBoxesDrawer.java:105-121`): which ends of THIS piece are closed.
   * `ACTIVATION_BOX_CLOSE_OPEN` is `{ closeUp: true, closeDown: false }`, and
   * so on. Absent is `CLOSE_CLOSE`, the plain rectangle.
   */
  open?: { closeUp: boolean; closeDown: boolean };
}

/**
 * Where one `ComponentRoseDestroy` cross is drawn, and by whom. The two
 * strokes span `2 * crossSize` from the top-left corner (`ComponentRoseDestroy
 * .java:57,63-64`).
 */
export interface DestroyCross {
  x: number;
  y: number;
  /**
   * `tile`: a destroy bound to no message draws its own cross in the
   * foreground pass (`LifeEventTile#drawU`, `teoz/LifeEventTile.java:112-122`).
   * `liveboxes`: one bound to a message is drawn in the lifeline pass from
   * that message's step (`LiveBoxes.java:374-396,398-420`).
   */
  drawnBy: 'tile' | 'liveboxes';
  /**
   * Which `LiveBoxes` pass draws a `liveboxes` cross: 0 is `drawDestroys`,
   * after every bar of its participant (`LiveBoxes.java:387-396`), for a step
   * at indent 0; `L` is `drawOneLevel(L)`, right after the level-`L` bar the
   * step closes (`:409-417`). Always 0 for a `tile` cross. A COUNT: not
   * scaled.
   */
  level: number;
}

/**
 * A `destroy` life event (`LifeEventType.DESTROY`), as laid out: where its
 * participant's lifeline stops, and the crosses upstream draws for it.
 */
export interface DestroyGeo {
  /**
   * `ComponentType.DESTROY`'s merged style from the end-of-parse builder, no
   * stereotype (`LiveBoxesDrawer.java:78-81`, `LifeEventTile.java:107-110`).
   * NOT scaled by `scale-geo`: the jar scales at emission (`SvgGraphics
   * #format`), see `scale-geo.ts` header.
   */
  readonly paint: SequencePaint;
  kind: 'destroy';
  participantId: string;
  /**
   * The tile's gauge min, where `onGaugeResolved` calls `goDestroy(y)`
   * (`LifeEventTile.java:65-72`): the lifeline stops here
   * (`LivingSpace.java:151-165`).
   */
  y: number;
  /** Empty where upstream draws none (`sequence-layout-life-event.ts`). */
  crosses: readonly DestroyCross[];
}
