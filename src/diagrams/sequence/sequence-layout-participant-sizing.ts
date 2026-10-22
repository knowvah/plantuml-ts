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

import type { Participant, ParticipantBadge, ParticipantType } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { measureParticipantSymbol } from './renderer-participant-symbol.js';
import { participantStyle, type SequencePaint } from './sequence-skin-param.js';
import { participantStereotype } from './sequence-participant-paints.js';
import { Url } from '../../core/url/Url.js';

/**
 * `ComponentRoseDatabase`'s constructor passes
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(0, 3, 0, 3)` as its padding
 * (`ComponentRoseDatabase.java:62-63`) — 3px right and left, 0 top and bottom
 * — and `AbstractTextualComponent#getTextWidth` adds exactly
 * `padding.getLeft() + padding.getRight()` to the raw text block
 * (`AbstractTextualComponent.java:106-108`). `getTextHeight` adds
 * `padding.getTop() + padding.getBottom()`, which is 0 here (`:110-114`).
 *
 * This is NOT the style's `Padding`: `ComponentRoseParticipant` alone reads
 * that (`Rose.java:134`); the glyph components pass their own constant, which
 * no skinparam feeds.
 */
export const DB_TEXT_PADDING_X = 3;

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
  paint: SequencePaint,
  theme: Theme,
  measurer: StringMeasurer,
): number | undefined {
  switch (type) {
    case 'actor':
    case 'database':
    case 'boundary':
    case 'control':
    case 'entity':
      return Math.max(measureParticipantSymbol(type, paint, theme, measurer).width, blockWidth + DB_TEXT_PADDING_X * 2);
    case 'queue':
      return measureParticipantSymbol('queue', paint, theme, measurer).width + blockWidth;
    default:
      return undefined;
  }
}

/** The matching `getPreferredHeight`. Every kind above adds the glyph's own
 *  height to `getTextHeight()`, which is the text block plus a vertical
 *  padding of 0 for the four stacked kinds
 *  (`ComponentRoseDatabase.java:62-63,:96-99`) and the queue margin's own
 *  5 + 5 for `queue` (`USymbolQueue.java:131`). The paint's stroke and shadow
 *  reach only the actor glyph's own dimension (`ActorStickMan.java:116-122`). */
export function symbolPreferredHeight(
  type: ParticipantType,
  blockHeight: number,
  paint: SequencePaint,
  theme: Theme,
  measurer: StringMeasurer,
): number | undefined {
  switch (type) {
    case 'actor':
    case 'database':
    case 'boundary':
    case 'control':
    case 'entity':
    case 'queue':
      return measureParticipantSymbol(type, paint, theme, measurer).height + blockHeight;
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
// foot block's own top is `footerShapeY`, which is not known when the head is
// built.

/** `getDeltaCollection()` -- how far the FRONT rectangle of a `collections`
 *  stack is pushed down and in (`ComponentRoseParticipant.java:121-126`). */
const COLLECTIONS_LABEL_DELTA = 4;

/**
 * What {@link participantLabelCy} reads, in the caller's units (layout: k = 1;
 * render: every length already multiplied by `scaleK`, as `SvgGraphics#format`
 * scales at emission, `SvgGraphics.java:468-469`). `Theme` satisfies it.
 */
export interface ParticipantLabelMetrics {
  readonly scaleK?: number;
  /**
   * The label TEXT BLOCK's height: `getTextHeight()` = block + padding 0+0
   * (`AbstractTextualComponent.java:110-114`). A stick-kind block stacks it
   * against the glyph -- below it at the head (`ComponentRoseActor.java:75`),
   * from the block top at the tail (`:78`) -- so its centre follows from this
   * and the box's edge, nothing else. Unread by the other kinds.
   */
  readonly labelBlockHeight?: number;
  /** `ComponentRoseParticipant`'s padding top/bottom (`Rose.java:134`); 0 when absent. */
  readonly padTop?: number;
  readonly padBottom?: number;
}

/** A participant paint's {@link ParticipantLabelMetrics}, scaled by `k`. */
export function participantLabelMetricsOf(
  paint: SequencePaint,
  k = 1,
  labelBlockHeight?: number,
): ParticipantLabelMetrics {
  return {
    ...(labelBlockHeight === undefined ? {} : { labelBlockHeight }),
    scaleK: k,
    padTop: paint.padding.getTop() * k,
    padBottom: paint.padding.getBottom() * k,
  };
}

/**
 * Where a participant's label block is CENTRED vertically, per the
 * composition its `ComponentRose*` uses. `blockTopY`/`height` are the painted
 * box's for `participant` and `collections` (`participantBoxOf`), the block's
 * for the glyph kinds.
 *
 * - `participant` draws the text block at `padding.getTranslate()` inside its
 *   rectangle (`ComponentRoseParticipant.java:118`), so the block spans
 *   `[top + padTop, top + height - padBottom]`.
 * - `collections` does the same inside the FRONT rectangle, which
 *   `ComponentRoseParticipant#drawInternalU:109` has already pushed down
 *   by `getDeltaCollection() = 4`.
 * - `queue` puts the text INSIDE the glyph: `ComponentRoseQueue`'s constructor
 *   passes `getTextBlock()` as `USymbols.QUEUE.asSmall`'s label, and
 *   `USymbolQueue#getMargin()` is `Margin(5,15,5,5)`, so the text's vertical
 *   centre is the block's own centre.
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
  metrics: ParticipantLabelMetrics,
): number {
  if (kind === 'participant') return paddedCentreY(blockTopY, height, metrics);
  if (kind === 'queue') return blockTopY + height / 2;
  if (kind === 'collections') {
    const delta = COLLECTIONS_LABEL_DELTA * (metrics.scaleK ?? 1);
    return paddedCentreY(blockTopY + delta, height - delta, metrics);
  }
  // Stick kinds. Head: the block is drawn at `dimStickman.getHeight()`, so it
  // ends at the component's bottom and spans `[bottom - T, bottom]`; tail: at
  // dy 0, `[top, top + T]` (`ComponentRoseActor.java:75,78`; the same bodies in
  // Boundary `:76,79`, Control `:77,80`, Entity `:77,80`, Database `:82,85`).
  const half = (metrics.labelBlockHeight ?? 0) / 2;
  return head ? blockTopY + height - half : blockTopY + half;
}

/** The centre of `[top + padTop, top + height - padBottom]`. */
function paddedCentreY(top: number, height: number, metrics: ParticipantLabelMetrics): number {
  const padTop = metrics.padTop ?? 0;
  return top + padTop + (height - padTop - (metrics.padBottom ?? 0)) / 2;
}

/**
 * `TextBlockSprited#drawU` -- the badge draws at the block origin and the
 * label block is translated right by `sprite.width + 6.0` (`:70-77`). So the
 * badge sits at the box's left padding and the name block centres in what is
 * left, which is exactly the box layout sized it for. `padding` is the
 * merged style's (`Rose.java:134`), in the caller's units.
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
  padding: Pick<ClockwiseTopRightBottomLeft, 'getLeft' | 'getRight'>,
  k = 1,
): { readonly x: number; readonly nameCx: number } | undefined {
  if (badge === undefined) return undefined;
  const badgeX = x + padding.getLeft() * k;
  return { x: badgeX, nameCx: (badgeX + badge.width + BADGE_GAP + (x + width - padding.getRight() * k)) / 2 };
}

/** `TextBlockSprited`'s own gap between the sprite and the label block
 *  (`TextBlockSprited.java:70-77`'s `sprite.width + 6.0`). */
const BADGE_GAP = 6;

/**
 * `Rose#getMinClassWidth` (`Rose.java:276-278`): `style.value(PName
 * .MinimumWidth).asDouble()` off the participant's merged style
 * (`styles[0]`, `Rose.java:139-151`) -- `skinparam minClassWidth` reaches it
 * as `MinimumWidth` (`SkinParam.java:577-578`, `FromSkinparamToStyle`). An
 * unset value is `ValueNull#asDouble()` = 0 (`ValueNull.java:57-59`), a floor
 * that never binds. `ComponentRoseParticipant#getPureTextWidth` maxes the text
 * block against it (`ComponentRoseParticipant.java:139-142`).
 */
export function participantMinWidth(p: Participant): number {
  const url = p.url === undefined ? undefined : new Url(p.url.url, p.url.tooltip, null);
  const { style } = participantStyle(p.styleBuilder, p.type, participantStereotype(p), url);
  return style.value('MinimumWidth').asDouble();
}
