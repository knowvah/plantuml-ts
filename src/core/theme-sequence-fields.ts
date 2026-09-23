/**
 * `Theme.sequence` field shape — split out of theme.ts (cdd-T30) to keep
 * that file under the project's 500-line file-size cap. A pure move: every
 * field below, doc comments included, is unchanged from the pre-split
 * `Theme` interface's own `sequence: { ... }` inline shape. See theme.ts's
 * own doc comment for the full module map.
 */

export interface ThemeSequenceFields {
  /**
   * Padding inside a participant box, on every side.
   *
   * `plantuml.skin:186-190` sets `Padding 7` for
   * `participant,actor,boundary,control,entity,queue,database,collections`,
   * and `ClockwiseTopRightBottomLeft.read` expands a scalar to all four
   * sides. `AbstractTextualComponent#getTextWidth` adds
   * `padding.getLeft() + padding.getRight()` to the raw text block
   * (`:106-108`) and `getTextHeight` adds top + bottom (`:110-114`), and
   * `ComponentRoseParticipant#drawInternalU:100-104` draws a rectangle of
   * exactly those two. So the drawn box is `text + 2 * this` on both axes.
   *
   * There is deliberately NO minimum-width companion to this. Upstream's
   * floor is `Rose#getMinClassWidth` = `style.value(PName.MinimumWidth)`
   * (`Rose.java:275-278`), `MinimumWidth` is declared in no skin file, and
   * `ValueNull#asDouble()` returns 0 (`ValueNull.java:57-59`) — so
   * upstream's floor is zero. See
   * `plans/sequence-coordinate-convergence/findings/participant-width.md`.
   */
  participantPadding: number;
  /**
   * Horizontal gap between adjacent participant boxes.
   *
   * `LivingSpaces#addConstraints:61-71` is the whole rule:
   * `current.getPosA().ensureBiggerThan(previous.getPosE().addFixed(10))`.
   * `posA` is `posB - marginBefore` and `posE` is `posD + marginAfter`
   * (`LivingSpace.java:292-298`), with `posB`/`posD` the box's left and
   * right edges (`:238-248`) and the two margins zero unless an englober
   * or a self-message overflow widened them
   * (`Doll.java:220-221`, `CommunicationTileSelf.java:208-213`). So for
   * ordinary participants the constraint is `nextLeft >= prevRight + 10`:
   * a ten-pixel gap between box EDGES.
   */
  participantGap: number;
  /**
   * INERT since C3 — nothing reads it.
   *
   * It was "the vertical gap between messages", and teoz has no such
   * concept: `YGauge.createWithContact:103-116` sets each tile's `min` to
   * the previous tile's `max`, so tiles are FLUSH and the whole gap between
   * two events is the first one's own `getPreferredHeight`. There is no
   * inter-event spacing constant anywhere in `sequencediagram/teoz/`.
   *
   * Kept as a field, not deleted, because `Theme` is public and
   * `resolveTheme` accepts a partial override of it. A knob documented as
   * doing nothing is better than one that silently does nothing.
   */
  messageSpacing: number;
  /** Width of the activation box drawn on a lifeline */
  activationWidth: number;
  /** INERT — no reader. A note's own box padding is
   *  `ComponentRoseNote:67-70`'s, resolved in `sequence-layout-events.ts`. */
  noteMargin: number;
  /** INERT — no reader. A group's header height is MEASURED from its title
   *  (`ComponentRoseGroupingHeader#getPreferredHeight:120-123`), never a
   *  constant; see `sequence-layout-events.ts#handleFrameEvent`. */
  frameHeaderHeight: number;
  /**
   * INERT since C3 — nothing reads it. The tail below the last tile is
   * `PlayingSpace#getPreferredHeight:154-161`'s `+ 10`
   * (`sequence-layout-shared.ts#PLAYING_SPACE_TAIL_Y`), not a themed 20.
   */
  lifelineExtension: number;
}
