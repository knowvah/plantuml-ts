/**
 * A teoz tile's vertical extent: `sequencediagram/teoz/YGauge.java`, resolved
 * to numbers.
 *
 * Upstream builds every tile's gauge out of `Real`s at construction time
 * (`TileBuilder.buildSeveral:64-76` chains each tile on the previous one's
 * gauge) and lets `RealLine` solve them before anything is drawn. Every
 * constraint the four factories below register is a lower bound (`addAtLeast`,
 * `ensureBiggerThan`) and the solver settles each value at the smallest one
 * that satisfies them, so each gauge resolves to a closed form -- with ONE
 * retroactive term: a `&` member's `contact.ensureBiggerThan(origin +
 * contactRelative)` (`:131`) raises the contact line it SHARES with the tiles
 * before it, moving their `min` down too. This port lays geometry out in a
 * single forward pass, so the head of a parallel group is handed the contact
 * offsets of the members that will raise it (`createWithContact`'s
 * `raisedBy`), which is what the solved `Real` would hold.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/YGauge.java
 */

import type { AbstractMessageEvent } from './ast-message.js';

export interface YGauge {
  /** The tile's top (`getMin`); every tile draws itself translated by it. */
  readonly min: number;
  /** The chain link the next tile starts from (`getMax`). */
  readonly max: number;
  /** Absolute y of the contact (arrow) line shared by a `&` group
   *  (`YGauge.java:44-46`); `undefined` for a tile that has none. */
  readonly contact: number | undefined;
  /** The parallel group's chaining origin (`:47-51`), the max of the gauge
   *  before the group head; `undefined` with {@link contact}. */
  readonly origin: number | undefined;
}

/** What a tile hands its gauge factory: `getContactPointRelative()` and
 *  `getPreferredHeight()` (`CommunicationTile.java:97-117`, `NoteTile.java:92-97`). */
export interface TileMetrics {
  readonly contactRelative: number;
  readonly height: number;
}

/** `YGauge.create` (`:69-74`): a tile with no contact line, `height` below `min`. */
export function createGauge(min: number, height: number): YGauge {
  if (height < 0) throw new RangeError(`YGauge.create: negative height ${height}`);
  return { min, max: min + height, contact: undefined, origin: undefined };
}

/**
 * `YGauge.createWithContact` (`:103-116`): `origin = currentY.max`,
 * `contact = origin.addAtLeast(contactRelative)`, `min = contact -
 * contactRelative`, `max = contact.addAtLeast(height - contactRelative)`.
 *
 * `raisedBy` is the contact offset of every `&` member that will share this
 * line; each one's `contact.ensureBiggerThan(origin.addFixed(cr))`
 * (`createParallel:131`) leaves the solved line at the largest `origin + cr`.
 */
export function createWithContact(currentY: YGauge, tile: TileMetrics, raisedBy: readonly number[] = []): YGauge {
  if (tile.height < 0 || tile.contactRelative < 0)
    throw new RangeError(`YGauge.createWithContact: negative extent ${tile.contactRelative}/${tile.height}`);
  const origin = currentY.max;
  const contact = Math.max(origin + tile.contactRelative, ...raisedBy.map((cr) => origin + cr));
  return {
    min: contact - tile.contactRelative,
    max: contact + (tile.height - tile.contactRelative),
    contact,
    origin,
  };
}

/**
 * `YGauge.createParallel` (`:124-145`): a `&` tile aligns its own contact
 * point on the line `currentY` carries and its max dominates the previous
 * one's, so the next sequential tile chains below the whole group. With no
 * line to share, it falls back to top alignment: `create(currentY.getMin(),
 * height)` (`:127-129`).
 */
export function createParallel(currentY: YGauge, tile: TileMetrics): YGauge {
  const { contact, origin } = currentY;
  if (contact === undefined || origin === undefined) return createGauge(currentY.min, tile.height);
  // `contact.ensureBiggerThan(origin.addFixed(contactRelative))` (`:131`) was
  // already applied by the group head (`createWithContact`'s `raisedBy`).
  if (contact < origin + tile.contactRelative)
    throw new Error('YGauge.createParallel: the group head was not raised for this member');
  return {
    min: contact - tile.contactRelative,
    max: Math.max(contact + (tile.height - tile.contactRelative), currentY.max),
    contact,
    origin,
  };
}

/** `YGauge.createPropagating` (`:151-157`): a tile with no contact of its own
 *  (a `LifeEventTile`, an `HSpaceTile`) chains below `currentY` and passes its
 *  contact line and origin on, so a later `&` member still finds them. */
export function createPropagating(currentY: YGauge, height: number): YGauge {
  if (height < 0) throw new RangeError(`YGauge.createPropagating: negative height ${height}`);
  return { min: currentY.max, max: currentY.max + height, contact: currentY.contact, origin: currentY.origin };
}

/**
 * The gauge of a note-on-message wrapper: `new YGauge(inner.getMin(),
 * inner.getMin().addAtLeast(getPreferredHeight()), inner.getContact(),
 * inner.getOrigin())` (`CommunicationTileNoteRight.java:96-98`, `...NoteLeft
 * .java:89-91`, `...SelfNoteRight.java:86-88`, `...SelfNoteLeft.java:86-88`).
 * Same top as the tile it wraps -- the note never moves the arrow -- and the
 * contact line passes through for a following `&` member.
 */
export function wrapGauge(inner: YGauge, preferredHeight: number): YGauge {
  return { min: inner.min, max: inner.min + preferredHeight, contact: inner.contact, origin: inner.origin };
}

/** Upstream: a tile's gauge — teoz/YGauge.java; contact = getContactPointRelative. */
export interface MessageTileGauge {
  readonly top: number; // tile top (YGauge min)
  readonly height: number; // tile height
  readonly contactY: number; // absolute y of the arrow line
}
// `contactY` is `getMin() + getContactPointRelative()`, what `LinkAnchor`
// reads (`teoz/LinkAnchor.java:90-91`): the arrow line, except a self
// message's, whose contact point is the middle of its loop
// (`ComponentRoseSelfArrow.java:309-313`).

/** The {@link MessageTileGauge} of a message tile built on `gauge` from
 *  `metrics`. */
export function messageTileGaugeOf(gauge: YGauge, metrics: TileMetrics): MessageTileGauge {
  return { top: gauge.min, height: metrics.height, contactY: gauge.min + metrics.contactRelative };
}

/** Where the layout publishes every message's and exo message's tile gauge,
 *  keyed by the AST event (`EventProcessingContext.messageTileGauges`). */
export interface MessageTileGaugeSource {
  readonly messageTileGauges?: ReadonlyMap<AbstractMessageEvent, MessageTileGauge>;
}

/** The {@link MessageTileGauge} of `event` (a `MessageEvent` or a
 *  `MessageExoEvent`), or `undefined` when it laid out no tile. */
export function messageTileGauge(
  source: MessageTileGaugeSource,
  event: AbstractMessageEvent,
): MessageTileGauge | undefined {
  return source.messageTileGauges?.get(event);
}
