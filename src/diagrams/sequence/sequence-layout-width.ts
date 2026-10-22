/**
 * Sequence diagram document width (the right edge of the drawing space).
 *
 * Mirrors the width half of upstream `PlayingSpace`: its constructor maxes
 * every tile's `getMaxX` (plus each living space's `getPosD`/`getPosC2`) to
 * place the right border.
 *
 * @see teoz/PlayingSpace.java:75-104
 */

import type { EventGeo, MessageGeo, ParticipantGeo } from './ast.js';
import { REF_X_MARGIN } from './ref-body-geo.js';
import { fontSpecOf } from './sequence-layout-shared.js';
import { DIVIDER_WIDTH_ALLOWANCE } from './divider-style.js';
import { delayContentRight } from './sequence-delay.js';
import { exoRightExtent } from './sequence-layout-exo.js';
import { sequenceAtomContext, sequenceLabelLineWidth } from './sequence-creole.js';
import type { MessageLabelEnv } from './text-block-geo.js';

/**
 * The gap kept between the rightmost content and the document edge. Upstream
 * keeps it outside the drawing space -- `getBorder2()` is the content edge
 * and the image margin lies beyond it -- so an exo arrow anchored on the
 * border stops here, not at `totalWidth`.
 *
 * 10, and symmetric with `LEFT_MARGIN` because both halves are:
 * `TextBlockExporter:201-202` grows the image by `margin.left + margin.right`
 * = 5 + 5, and `SequenceDiagramFileMakerTeoz#getTextBlock`'s
 * `calculateDimension` returns `body + 10` (`:157`) for its own inner 5 each
 * side. So the image is the content span plus 20, 10 on each side.
 */
export const RIGHT_MARGIN = 10;

/** Total diagram width: the rightmost participant edge, expanded if any
 *  message label, centred at midX, overflows it (midX + labelWidth/2). */
export function computeTotalWidth(
  participantGeos: ParticipantGeo[],
  eventGeos: EventGeo[],
  env: MessageLabelEnv,
): number {
  const { theme, measurer } = env;
  const fontSpec = fontSpecOf(theme);
  const atoms = sequenceAtomContext(env.sprites, theme.colors.text);
  // Safe: participantGeos is non-empty (guarded by the early return above)
  const lastParticipant = participantGeos[participantGeos.length - 1]!;
  let totalWidth = Math.max(
    lastParticipant.x + lastParticipant.width + RIGHT_MARGIN,
    exoContentRight(eventGeos) + RIGHT_MARGIN,
  );

  for (const geo of eventGeos) {
    if (geo.kind !== 'message') continue;
    const labelText = geo.sequenceNumber !== undefined ? `${geo.sequenceNumber}: ${geo.label}` : geo.label;
    const labelWidth = sequenceLabelLineWidth(labelText, fontSpec, measurer, atoms);
    const midX = geo.arrowDirection === 'self' ? geo.fromX + 20 : (geo.fromX + geo.toX) / 2;
    const labelRightEdge = midX + labelWidth / 2 + RIGHT_MARGIN;
    if (labelRightEdge > totalWidth) {
      totalWidth = labelRightEdge;
    }
  }

  return Math.max(
    totalWidth,
    dividerContentRight(eventGeos),
    delayContentRight(eventGeos, RIGHT_MARGIN),
    refContentRight(eventGeos) + RIGHT_MARGIN,
    noteContentRight(eventGeos) + RIGHT_MARGIN,
  );
}

/** The rightmost `NoteTile#getMaxX` (`teoz/NoteTile.java:288-296`), which
 *  `PlayingSpace` maxes with every other tile's to place the right border
 *  (`teoz/PlayingSpace.java:75-96`). A note reaching past the last participant
 *  widens the document. */
function noteContentRight(eventGeos: readonly EventGeo[]): number {
  let right = Number.NEGATIVE_INFINITY;
  for (const e of eventGeos) if (e.kind === 'note') right = Math.max(right, e.maxX);
  return right;
}

/** The rightmost `ReferenceTile#getMaxX` -- `last`, the component area's
 *  right edge, `xMargin` beyond the drawn box (`teoz/ReferenceTile.java
 *  :173-180`). A `ref` wider than its participants widens the document
 *  (`tests/fixtures/unwind2-S9b/r-single.svg`). */
function refContentRight(eventGeos: readonly EventGeo[]): number {
  let right = Number.NEGATIVE_INFINITY;
  for (const e of eventGeos) {
    if (e.kind === 'frame' && e.frameType === 'ref') right = Math.max(right, e.x + e.width + REF_X_MARGIN);
  }
  return right;
}

/**
 * How far right a divider forces the drawing space.
 *
 * `DividerTile#getMaxX` is `xorigin.addFixed(dim.getWidth())` where `dim` is
 * the component's `getPreferredDimension`, i.e.
 * `ComponentRoseDivider#getPreferredWidth = getTextWidth + 30` (`:131-133`) --
 * so a divider whose label is wider than the participant row widens the whole
 * diagram, exactly as an exo message does above. `PlayingSpace` maxes every
 * tile's `getMaxX` to place the right border
 * (`teoz/PlayingSpace.java:75-96`).
 *
 * `geo.textWidth` IS `getTextWidth`, resolved in layout from the divider's
 * OWN font (`separator { FontSize 13, FontStyle bold }`) -- re-measuring it
 * here with the diagram font would reintroduce the sizer/renderer split this
 * feature was built to avoid. `0` when there is no divider, which never
 * lowers the max.
 */
function dividerContentRight(eventGeos: EventGeo[]): number {
  let right = 0;
  for (const geo of eventGeos) {
    if (geo.kind !== 'divider') continue;
    const extent = geo.textWidth + DIVIDER_WIDTH_ALLOWANCE + RIGHT_MARGIN;
    if (extent > right) right = extent;
  }
  return right;
}

/** The message geos, in one place, for the exo passes below. */
export function messageGeosOf(eventGeos: EventGeo[]): MessageGeo[] {
  return eventGeos.filter((g): g is MessageGeo => g.kind === 'message');
}

/**
 * How far right an exo message forces the drawing space. `PlayingSpace` maxes
 * every tile's `getMaxX` to place the right border
 * (`teoz/PlayingSpace.java:75-96`), and a right-border exo's is
 * `posC + preferredWidth` -- so a document holding one is wider than the same
 * document without it. `0` when there is none, which never lowers the max.
 */
function exoContentRight(eventGeos: EventGeo[]): number {
  let right = 0;
  for (const geo of messageGeosOf(eventGeos)) {
    const extent = exoRightExtent(geo);
    if (extent !== undefined && extent > right) right = extent;
  }
  return right;
}
