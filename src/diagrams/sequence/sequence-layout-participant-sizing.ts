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

import type { ParticipantType } from './ast.js';
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
