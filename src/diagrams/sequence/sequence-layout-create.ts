/**
 * A `create` message: the message that took a pending `CREATE` life event
 * (`MessageEvent.create`, `AbstractMessage#isCreate`). In teoz it changes
 * three things about its `CommunicationTile`, and one about the participant:
 *
 *   - the arrow ends at the created head's near EDGE, not its centre --
 *     `getPoint2` is `posB` (or `posD` when reversed), `CommunicationTile
 *     .java:418-426`;
 *   - the tile is at least as tall as that head, `getPreferredHeight:395-402`;
 *   - the head is drawn by the tile, top-aligned at the tile's top and against
 *     the arrow's end, BEFORE the arrow (`drawU:347-371`);
 *   - the participant's lifeline begins at the tile's top --
 *     `goCreate(y)` in `onGaugeResolved:186-190` puts `y -> TRUE` into
 *     `LivingSpace.aliveChanges`, and `drawLineAndLiveboxes` (`LivingSpace
 *     .java:150-167`) draws the line only from that `aliveSince`; its head in
 *     the top row is skipped (`drawHeadOrTail:194-196`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/CommunicationTile.java
 */

import type { MessageEvent, MessageGeo, ParticipantGeo } from './ast.js';

/** The part of a message's resolved endpoints a create rewrites. */
interface CreateEndpoints {
  readonly toX: number;
  readonly arrowDirection: 'left' | 'right' | 'self';
}
import { headSlackOf } from './sequence-layout-participants.js';

/** `getPoint2` for a create (`:418-426`): `posB` left-to-right, `posD` when
 *  the arrow runs right-to-left. */
export function createEndpointX(toGeo: ParticipantGeo, direction: 'left' | 'right'): number {
  return direction === 'left' ? toGeo.x + toGeo.width : toGeo.x;
}

/** `Math.max(arrow height, livingSpace2.getHeadPreferredDimension().getHeight())`
 *  (`:395-402`). A head's preferred height is its painted box plus the
 *  kind's own slack (`sequence-layout-participants.ts#headSlackOf`). */
export function createTileHeight(arrowTileHeight: number, toGeo: ParticipantGeo): number {
  return Math.max(arrowTileHeight, toGeo.height + headSlackOf(toGeo.type));
}

/**
 * The head the tile draws: `drawHead(ug, ..., TOP, LEFT)` at the arrow's end
 * left-to-right, `drawHead(..., TOP, RIGHT)` -- shifted left by its own width
 * -- right-to-left (`:351-353`, `:363-366`). `toX` is the arrow's end after
 * the live-box offsets, which is where upstream's `ug` stands. `y` is the
 * tile top; only `x` moves the runs, because the renderer re-derives the
 * label's `y` from the block top it is handed.
 */
export function createdHeadOf(toGeo: ParticipantGeo, toX: number, direction: 'left' | 'right'): ParticipantGeo {
  const x = direction === 'left' ? toX - toGeo.width : toX;
  const dx = x - toGeo.x;
  if (dx === 0) return toGeo;
  return {
    ...toGeo,
    x,
    centerX: toGeo.centerX + dx,
    labelRuns: toGeo.labelRuns.map((r) => ({ ...r, x: r.x + dx })),
  };
}

/** A create message ends at the created head's edge (`getPoint2`,
 *  `CommunicationTile.java:418-426`); see `sequence-layout-create.ts`. */
export function withCreateEnd<E extends CreateEndpoints>(event: MessageEvent, endpoints: E, toGeo: ParticipantGeo): E {
  if (event.create !== true || endpoints.arrowDirection === 'self') return endpoints;
  return { ...endpoints, toX: createEndpointX(toGeo, endpoints.arrowDirection) };
}

/** Attaches the created head to the message, records the create on the
 *  participant (`goCreate(y)` keeps the FIRST, `aliveChanges` being sorted),
 *  and returns the tile's height. */
export function markCreated(
  messageGeo: MessageGeo,
  toGeo: ParticipantGeo,
  tileTop: number,
  arrowTileHeight: number,
): number {
  const direction = messageGeo.arrowDirection === 'left' ? 'left' : 'right';
  messageGeo.createdHead = { participant: createdHeadOf(toGeo, messageGeo.toX, direction), y: tileTop };
  if (toGeo.createY === undefined || tileTop < toGeo.createY) toGeo.createY = tileTop;
  return createTileHeight(arrowTileHeight, toGeo);
}
