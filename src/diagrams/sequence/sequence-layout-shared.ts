/**
 * Small shared leaf utilities for sequence diagram layout.
 * No dependencies on sibling layout modules — keeps the module graph a DAG.
 */

import type { FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';

/** Derive the font spec used for sequence-diagram text measurement.
 *
 *  This is the AMBIENT size (`root { FontSize 14 }`, `plantuml.skin:14`),
 *  which is what a participant head uses. A message label does NOT (it is
 *  measured in the arrow style's font, `sequence-arrow-paint.ts#messagePaint`),
 *  nor does a note (`sequence-layout-note.ts#notePaint`), nor a `ref` body
 *  (`ref-body-geo.ts#referencePaints`) — declared style buckets that each
 *  carry their own size. */
export function fontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: theme.fontSize };
}

/**
 * `CommunicationTile.LIVE_DELTA_SIZE` — half an activation bar's width, and
 * the step by which a live participant pushes the things anchored on its
 * lifeline sideways.
 *
 * It is read by every tile that has to dodge a bar: `CommunicationTile`
 * moves a message's two endpoints by it (`:333-350`),
 * `CommunicationExoTile` its one endpoint (`:122-129`), `NoteTile` its box
 * (`:153`), and `CommunicationTileSelf` its loop (`:133-135`). Shared here
 * for the same reason upstream keeps one `public static final`: those four
 * must agree.
 *
 * `renderer-lifeline.ts` deliberately does NOT use it for the bars'
 * own per-level indent -- `LiveBoxes#drawOneLevel` derives that from the
 * box's own `getWidth() / 2` (`:365-368`), and the two coincide at 5 only
 * because the box is 10 wide.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationTile.java:172
 */
export const LIVE_DELTA_SIZE = 5;

/** The arrow component's horizontal text padding, both sides:
 *  `topRightBottomLeft(1, 7, 1, 7)` (`skin/rose/AbstractComponentRoseArrow
 *  .java:62`), read back by `getTextWidth` (`skin/AbstractTextualComponent
 *  .java:106-108`).
 *
 *  Lives here because both the exo path and the participant-row constraint
 *  solve need the SAME number: `ComponentRoseArrow#getPreferredWidth:347-349`
 *  is one formula, and a message asks the diagram for that width whether its
 *  far end is a border or another lifeline. */
export const ARROW_PADDING_X = 7;

/**
 * The playing space's TOP border — where the participant head row starts, and
 * the y half of `sequence-layout-participants.ts`'s `LEFT_MARGIN`.
 *
 * The same two fives: `TextBlockExporter:173` translates the whole diagram by
 * `(margin.left, margin.top)`, which for a Teoz sequence is
 * `ClockwiseTopRightBottomLeft.same(5)`
 * (`SequenceDiagram#getDefaultMargins:624-628`), and inside that
 * `SequenceDiagramFileMakerTeoz#getTextBlock`'s `drawU` applies its own
 * `new UTranslate(5, 5)` (`:132`). `jobadi-87-jegi648`'s head rect is at
 * `y="10"` in the jar; it was at `y="0"` here until C3.
 *
 * It cannot land alone. It moves ONLY the head row, while every other term in
 * `findings/vertical-terms.md` §4 moves everything under it, so applied by
 * itself it lowers the diff count and RAISES total distance by 35 145 (§3).
 *
 * Lives here rather than beside `LEFT_MARGIN` because that file is already
 * over the 500-line cap; both the participant column and `layout.ts` read it.
 */
export const TOP_MARGIN = 10;

/**
 * `PlayingSpace.startingY` (`teoz/PlayingSpace.java:55`) — the headroom
 * between the bottom of the head row and the first tile's top, seeded into
 * the gauge chain at `:89`
 * (`YGauge.create(tileArguments.getYOrigin().addFixed(startingY), 0)`).
 *
 * This port applied `messageSpacing` (20) here. There is no such term in
 * `teoz/`: tiles chain flush (`YGauge.createWithContact:103-116`), and the
 * only headroom is this 8.
 */
export const PLAYING_SPACE_STARTING_Y = 8;

/**
 * The tail `PlayingSpace#getPreferredHeight:154-161` adds below the last
 * tile: `Math.max(inkHeight, finalY) + 10`. The foot row (or the document's
 * bottom margin, when `hide footbox`) begins there.
 *
 * Replaces `theme.sequence.lifelineExtension` (20), which had no upstream
 * counterpart. The `inkHeight` half of that `max` is not modelled — this
 * port has no draw-interception pass — so a tile that paints below its own
 * gauge max is still under-reserved.
 */
export const PLAYING_SPACE_TAIL_Y = 10;

/**
 * The document's bottom margin: `margin.bottom` (5) plus the text block's own
 * inner inset (5), the exact mirror of {@link TOP_MARGIN}.
 * `TextBlockExporter:199-203` grows the image by `margin.top + margin.bottom`
 * and `SequenceDiagramFileMakerTeoz#getTextBlock:157` returns `body + 10`.
 *
 * This port used an uncited 5.
 */
export const BOTTOM_MARGIN = 10;
