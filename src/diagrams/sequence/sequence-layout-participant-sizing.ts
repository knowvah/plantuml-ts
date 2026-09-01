/**
 * sequence-layout-participant-sizing.ts — one function per participant family's
 * own `getPreferredWidth` / `getPreferredHeight`, split out of
 * `sequence-layout-participants.ts` when the citations pushed that file past
 * the repo's 500-line cap (the same reason `renderer-participant-shapes.ts`
 * split off `renderer.ts`).
 *
 * This is the SIZING half of the seam `renderer-participant-symbol.ts` draws
 * through. The two must move together: shipping one without the other leaves
 * the glyph and the column disagreeing, which is the recurring defect
 * `planning/sizer-renderer-parity.md` exists to name.
 *
 * `collections` is deliberately absent — it is not a glyph-sized kind at all,
 * but the plain participant rule plus `getDeltaCollection()`, applied by the
 * caller (`ComponentRoseParticipant.java:114-124`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/Rose.java#createComponentParticipant
 */

import type { ParticipantBadge, ParticipantType } from './ast.js';
import type { Theme } from '../../core/theme.js';
import { measureParticipantSymbol } from './renderer-participant-symbol.js';

/**
 * `ComponentRoseDatabase`'s constructor passes
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(0, 3, 0, 3)` as its padding
 * (`ComponentRoseDatabase.java:62-63`) — 3px right and left, 0 top and bottom
 * — and `AbstractTextualComponent#getTextWidth` adds exactly
 * `padding.getLeft() + padding.getRight()` to the raw text block
 * (`AbstractTextualComponent.java:106-108`). `getTextHeight` adds
 * `padding.getTop() + padding.getBottom()`, which is 0 here (`:110-114`).
 *
 * This is NOT `theme.sequence.participantPadding`: that knob is this port's
 * own plain-participant-box padding, and upstream's database component has a
 * padding of its own that no skinparam feeds.
 */
const DB_TEXT_PADDING_X = 3;

/**
 * Each glyph-bearing kind's own `getPreferredWidth`, or `undefined` when the
 * kind is sized by the plain participant rule.
 *
 * Read one class at a time (D3, T5): they do NOT all share
 * `ComponentRoseDatabase`'s rule.
 *
 * - `actor`, `database`, `boundary`, `control`, `entity` —
 *   `max(stickman.getWidth(), getTextWidth())`, and each of the four passes
 *   the same `topRightBottomLeft(0, 3, 0, 3)` padding to
 *   `AbstractTextualComponent`, so `getTextWidth` is the text block plus 6
 *   (`ComponentRoseDatabase.java:62-63,:102-105` and the identical bodies in
 *   `ComponentRoseActor`, `ComponentRoseBoundary`, `ComponentRoseControl` and
 *   `ComponentRoseEntity` — read, not assumed: `ComponentRoseActor.java:73-84`
 *   is the same pair of methods, differing only in where its `stickman` came
 *   from). `actor` is the one kind whose glyph dimension is theme-dependent,
 *   through `skinparam actorStyle`.
 * - `queue` — `ComponentRoseQueue#getPreferredWidth:71-74` returns the GLYPH's
 *   own width, and that glyph is `USymbols.QUEUE.asSmall(empty(0,0),
 *   getTextBlock(), empty(0,0), …)` (`:63-64`), i.e.
 *   `USymbolQueue#getMargin()` = `Margin(5,15,5,5)` around the RAW text block.
 *   So it is `+20`, not `max(…)`, and it takes NO 3+3 padding —
 *   `SheetBlock1`'s `marginX1`/`marginX2` reach `getStartingX`/`getEndingX`
 *   only, never `calculateDimension` (`SheetBlock1.java:196-199, :225-229`).
 * - `collections` — not here: it is the plain participant rule plus
 *   `getDeltaCollection()`, applied by the caller.
 */
export function symbolPreferredWidth(
  type: ParticipantType,
  blockWidth: number,
  theme: Theme,
): number | undefined {
  switch (type) {
    case 'actor':
    case 'database':
    case 'boundary':
    case 'control':
    case 'entity':
      return Math.max(
        measureParticipantSymbol(type, theme).width,
        blockWidth + DB_TEXT_PADDING_X * 2,
      );
    case 'queue':
      return measureParticipantSymbol('queue', theme).width + blockWidth;
    default:
      return undefined;
  }
}

/** The matching `getPreferredHeight`. Every kind above adds the glyph's own
 *  height to `getTextHeight()`, which is the text block plus a vertical
 *  padding of 0 for the four stacked kinds
 *  (`ComponentRoseDatabase.java:62-63,:96-99`) and the queue margin's own
 *  5 + 5 for `queue` (`USymbolQueue.java:131`). */
export function symbolPreferredHeight(
  type: ParticipantType,
  blockHeight: number,
  theme: Theme,
): number | undefined {
  switch (type) {
    case 'actor':
    case 'database':
    case 'boundary':
    case 'control':
    case 'entity':
    case 'queue':
      return measureParticipantSymbol(type, theme).height + blockHeight;
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Label placement — shared by the layout that MEASURES the label and the
// renderer that DRAWS it (A3)
// ---------------------------------------------------------------------------
//
// Both halves need the same two answers, and `planning/sizer-renderer-parity
// .md` names disagreement between them as this project's recurring defect
// class. They were the renderer's private helpers until A3 gave layout the job
// of placing the runs; the footer still needs them at render time, because a
// foot block's own top is `lifelineEndY`, which is not known when the head is
// built.

/** `getDeltaCollection()` -- how far the FRONT rectangle of a `collections`
 *  stack is pushed down and in (`ComponentRoseParticipant.java:114-124`). */
const COLLECTIONS_LABEL_DELTA = 4;

/**
 * Where a participant's label block is CENTRED vertically, per the
 * composition its `ComponentRose*` uses.
 *
 * - `queue` puts the text INSIDE the glyph: `ComponentRoseQueue`'s constructor
 *   passes `getTextBlock()` as `USymbols.QUEUE.asSmall`'s label, and
 *   `USymbolQueue#getMargin()` is `Margin(5,15,5,5)`, so the text's vertical
 *   centre is the block's own centre.
 * - `collections` puts it inside the FRONT rectangle, which
 *   `ComponentRoseParticipant#drawInternalU:95` has already pushed down by
 *   `getDeltaCollection() = 4`.
 * - the glyph-above-text kinds (`database`, `boundary`, `control`, `entity`)
 *   put it below the glyph at the head and above it at the tail
 *   (`ComponentRoseDatabase.java:81-87`) -- which is why this is NOT a
 *   uniform translation between the two rows.
 */
export function participantLabelCy(
  kind: ParticipantType,
  height: number,
  blockTopY: number,
  head: boolean,
  theme: Theme & { readonly scaleK?: number },
): number {
  if (kind === 'queue') return blockTopY + height / 2;
  if (kind === 'collections') {
    return blockTopY + COLLECTIONS_LABEL_DELTA + (height - COLLECTIONS_LABEL_DELTA) / 2;
  }
  const labelYOffset = theme.fontSize / 2 + 4 * (theme.scaleK ?? 1);
  return head ? blockTopY + height - labelYOffset : blockTopY + labelYOffset;
}

/**
 * `TextBlockSprited#drawU` -- the badge draws at the block origin and the
 * label block is translated right by `sprite.width + 6.0` (`:70-77`). So the
 * badge sits at the box's left padding and the name block centres in what is
 * left, which is exactly the box layout sized it for.
 *
 * Jar-verified on `birocu-87-xubi808`: box x=172.938 w=177.363 with a 64-wide
 * image gives image x=179.938 (`x + 7`) and a name block centred on 296.62 --
 * `(179.938 + 64 + 6 + (172.938 + 177.363 - 7)) / 2`. The jar's two rows in
 * that box, `«APIGateway»` at 249.938 w=93.363 and `BothZWSP` at 261.969
 * w=69.3, both centre on 296.6195, which is what makes this ONE centre for
 * however many rows the block has.
 */
export function participantBadgeGeo(
  badge: ParticipantBadge | undefined,
  x: number,
  width: number,
  theme: Theme,
): { readonly x: number; readonly nameCx: number } | undefined {
  if (badge === undefined) return undefined;
  const pad = theme.sequence.participantPadding;
  const badgeX = x + pad;
  return { x: badgeX, nameCx: (badgeX + badge.width + BADGE_GAP + (x + width - pad)) / 2 };
}

/** `TextBlockSprited`'s own gap between the sprite and the label block
 *  (`TextBlockSprited.java:70-77`'s `sprite.width + 6.0`). */
const BADGE_GAP = 6;
