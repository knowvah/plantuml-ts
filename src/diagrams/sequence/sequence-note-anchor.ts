/**
 * Which lifeline a note on a message hangs from, and where a `right` note on
 * a `create` or self message starts -- the inputs `TileBuilder.buildOne`
 * (`teoz/TileBuilder.java:102-121`) and the `CommunicationTile*Note*`
 * wrappers give a note that the parser's `[from, to]` pair does not.
 */
import type { MessageEvent, MessageExoEvent, NoteEvent } from './ast.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { messagePaint } from './sequence-arrow-paint.js';
import { messageLabelWidth, numberTextOf } from './text-block-geo.js';
import { ARROW_PADDING_X } from './sequence-layout-shared.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';

/** `ComponentRoseSelfArrow#arrowWidth` (`:59`) plus 5: the floor of
 *  `getPreferredWidth` (`:326-328`), `Math.max(getTextWidth, arrowWidth+5)`. */
export const SELF_ARROW_MIN_WIDTH = 50;

/** What {@link noteAnchor} resolved for one note. */
export interface NoteAnchor {
  /** The lifeline the note is placed against. */
  readonly participant: string | undefined;
  /** See `NoteTileInput.rightX`. */
  readonly rightX?: number;
}

/**
 * `reverse`: `CommunicationTile#isReverse` (`:125-132`), `posC(ls1) >
 * posC(ls2)`. `TileBuilder` evaluates it while the tiles are being built
 * (`:97`), when the participants still sit at their initial left-to-right
 * order, so the participant index decides it. A self message is never
 * reverse there (`:90-93`).
 */
function isReverse(owner: MessageEvent, ctx: EventProcessingContext): boolean {
  if (owner.from === owner.to) return false;
  const from = ctx.participantIndex.get(owner.from);
  const to = ctx.participantIndex.get(owner.to);
  return from !== undefined && to !== undefined && from > to;
}

/** `CommunicationTileSelf#getMaxX` without the live-box term (`:272-277`):
 *  the lifeline's centre plus the loop component's preferred width,
 *  `max(getTextWidth, 50)` -- the text block and both `AbstractComponentRoseArrow`
 *  paddings of 7 (`:66`, `ComponentRoseSelfArrow.java:326-328`). The live-box
 *  term, `posC2 - posC`, is `LiveBoxes#getMaxPosition` (`:367-372`). */
export function selfMaxX(owner: MessageEvent, centerX: number, ctx: EventProcessingContext): number {
  const font = messagePaint(owner.styleBuilder, owner.stereotype, owner.arrow, true).font;
  const text = messageLabelWidth(owner.label, numberTextOf(owner), font, ctx) + 2 * ARROW_PADDING_X;
  return centerX + Math.max(text, SELF_ARROW_MIN_WIDTH);
}

/**
 * The lifeline and start x of `note` on `owner`: `LEFT` is `reverse ? ls2 :
 * ls1`, `RIGHT` is `reverse ? ls1 : ls2` (`TileBuilder.java:108-115`); after
 * an exo arrow the one lifeline (`:128-136`). A `right` note on a `create`
 * message starts at that lifeline's `posD` (`CommunicationTileNoteRight
 * .java:122-124`), on a self message at the loop's `getMaxX`
 * (`CommunicationTileSelfNoteRight.java:108-110`).
 */
export function noteAnchor(
  owner: MessageEvent | MessageExoEvent,
  note: NoteEvent,
  position: 'left' | 'right',
  ctx: EventProcessingContext,
): NoteAnchor {
  if (owner.kind === 'messageExo') return { participant: note.participants[0] };
  const reverse = isReverse(owner, ctx);
  const participant = (position === 'left') === reverse ? owner.to : owner.from;
  const geo = ctx.participantMap.get(participant);
  if (geo === undefined || position === 'left') return { participant };
  if (owner.from === owner.to) return { participant, rightX: selfMaxX(owner, geo.centerX, ctx) };
  if (owner.create === true) return { participant, rightX: geo.x + geo.width };
  return { participant };
}

/**
 * `CommunicationTile#getMinX`/`#getMaxX` (`:445-460`) -- `CommunicationTileSelf`'s
 * (`:263-277`) for a self message -- which the `top`/`bottom` wrappers read:
 * `point1` is `posC(ls1)`, `point2` `posC(ls2)` (`posB`, or `posD` when
 * reverse, of a created head, `:435-442`); the max is the right point or the
 * left one plus the arrow component's `getTextWidth + getArrowDeltaX`
 * (`ComponentRoseArrow.java:347-349`).
 */
export function messageExtent(owner: MessageEvent, ctx: EventProcessingContext): { minX: number; maxX: number } {
  const from = ctx.participantMap.get(owner.from);
  const to = ctx.participantMap.get(owner.to);
  if (from === undefined || to === undefined) return { minX: 0, maxX: 0 };
  if (owner.from === owner.to) return { minX: from.centerX, maxX: selfMaxX(owner, from.centerX, ctx) };
  const reverse = isReverse(owner, ctx);
  const point2 = owner.create === true ? (reverse ? to.x + to.width : to.x) : to.centerX;
  const [left, right] = reverse ? [point2, from.centerX] : [from.centerX, point2];
  const font = messagePaint(owner.styleBuilder, owner.stereotype, owner.arrow, false).font;
  const width = messageLabelWidth(owner.label, numberTextOf(owner), font, ctx) + 2 * ARROW_PADDING_X + ARROW_DELTA_X;
  return { minX: left, maxX: Math.max(right, left + width) };
}
