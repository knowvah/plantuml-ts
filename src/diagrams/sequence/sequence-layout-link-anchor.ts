/**
 * Layout of the `{a1} <-> {a2} : label` duration links.
 *
 * `LinkAnchor#drawAnchor` runs after every tile has been placed and reads
 * exactly two things off each anchored tile: its contact line (`gauge min +
 * getContactPointRelative`) and its `getMiddleX`. The first is T2a's
 * {@link MessageTileGauge#contactY}; the second is the tile's own
 * `(getMinX + getMaxX) / 2`, rebuilt here per tile kind because the port keeps
 * no tile objects.
 *
 * The result rides `SequenceGeometry.linkAnchors` (declared in `geo.ts`; was module
 * augmentation, so the geometry modules stay untouched) and is drawn by
 * `renderer-link-anchor.ts`.
 *
 * @see ~/git/plantuml/.../sequencediagram/LinkAnchor.java:82-123
 * @see ~/git/plantuml/.../sequencediagram/teoz/PlayingSpace.java:129-152
 */

import type { LinkAnchorGeo } from './geo.js';
import type { LinkAnchor, MessageEvent, MessageExoEvent, SequenceDiagramAST, SequenceEvent, TextRun } from './ast.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import { labelFont, messagePaint } from './sequence-arrow-paint.js';
import { ARROW_DELTA_X } from './sequence-arrowhead.js';
import {
  sequenceAtomContext,
  sequenceCreoleRuns,
  sequenceLabelBlockWidth,
  sequenceLabelLineWidth,
} from './sequence-creole.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { messageExtent } from './sequence-note-anchor.js';
import { LEFT_MARGIN } from './sequence-layout-participants.js';
import { ARROW_PADDING_X } from './sequence-layout-shared.js';
import { messageStyle, paintOf } from './sequence-skin-param.js';
import { displayLines, messageLabelWidth, numberTextOf, TRANSPARENT_SVG } from './text-block-geo.js';
import { messageTileGauge } from './sequence-y-gauge.js';

/** `snake.addPoint(x, ymin + 2)` / `(x, ymax - 2)` (`LinkAnchor.java:114-115`). */
const ANCHOR_END_INSET = 2;
/** `x = max(pt1.x, pt2.x) + 4` (`Snake.java:244-247`, the horizontal-alignment
 *  branch a CENTER label with a straight worm falls through to). */
const LABEL_GAP_X = 4;

type AnchoredTile = MessageEvent | MessageExoEvent;

/** `PlayingSpace#getFromAnchor` (`:146-152`) over `AbstractTile#matchAnchor`
 *  (`:68-74`): the FIRST tile whose message carries that anchor, in the
 *  document order `GroupingTile.fillPositionelTiles` flattens to -- a group's
 *  branches are walked in place, which is where this port nests them. */
function tileFromAnchor(events: readonly SequenceEvent[], anchor: string): AnchoredTile | undefined {
  for (const e of events) {
    if ((e.kind === 'message' || e.kind === 'messageExo') && e.anchor === anchor) return e;
    if (e.kind !== 'frame') continue;
    for (const branch of e.branches) {
      const found = tileFromAnchor(branch, anchor);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** `ComponentRoseArrow#getPreferredWidth` (`:347-349`) for an exo tile
 *  (`CommunicationExoTile.java:166-170`). */
function exoPreferredWidth(event: MessageExoEvent, ctx: EventProcessingContext): number {
  const font = messagePaint(event.styleBuilder, event.stereotype, event.arrow, false).font;
  return messageLabelWidth(event.label, numberTextOf(event), font, ctx) + 2 * ARROW_PADDING_X + ARROW_DELTA_X;
}

/**
 * `CommunicationExoTile#getMiddleX` (`:242-253`): a non-short left-border
 * message spans `border1 … border1 + preferredWidth`; every other is the
 * common `(getMinX + getMaxX) / 2` over `getPoint1`/`getPoint2` (`:206-218`).
 */
function exoMiddleX(event: MessageExoEvent, ctx: EventProcessingContext): number | undefined {
  const posC = ctx.participantMap.get(event.participant)?.centerX;
  if (posC === undefined) return undefined;
  const width = exoPreferredWidth(event, ctx);
  const leftBorder = event.exoType === 'FROM_LEFT' || event.exoType === 'TO_LEFT';
  // `getPoint1Value` answers `tileArguments.getBorder1()` (`:220-225`); the
  // port's border 1 is `LEFT_MARGIN` (`sequence-layout-exo.ts`'s `BORDER1`).
  if (leftBorder && event.shortArrow !== true) return LEFT_MARGIN + width / 2;
  const point1 = leftBorder ? posC - width : posC;
  const point2 = leftBorder ? posC : point1 + width;
  return (point1 + point2) / 2;
}

/** `Tile#getMiddleX` (`CommonTile.java:62-66`) of the tile `event` built. */
function tileMiddleX(event: AnchoredTile, ctx: EventProcessingContext): number | undefined {
  if (event.kind === 'messageExo') return exoMiddleX(event, ctx);
  const { minX, maxX } = messageExtent(event, ctx);
  return ctx.participantMap.has(event.from) && ctx.participantMap.has(event.to) ? (minX + maxX) / 2 : undefined;
}

/**
 * `Display.getWithNewlines(pragma, message).create(fc, CENTER, skinParam)`
 * placed by `Snake#getTextBlockPosition` (`Snake.java:244-247`): the block's
 * top is the worm's vertical middle less half the block height, its left edge
 * `x + 4`, and each line is centred in the block's width
 * (`TextBlockSimple#drawU`).
 */
function labelRunsOf(
  message: string | undefined,
  at: { readonly x: number; readonly yMiddle: number },
  font: FontConfiguration,
  ctx: EventProcessingContext,
): readonly TextRun[] {
  const lines = message === undefined || message === '' ? [] : displayLines(message);
  if (lines.length === 0) return [];
  const spec = atomFontSpec(font);
  const atoms = sequenceAtomContext(ctx.sprites, font.color ?? TRANSPARENT_SVG);
  const lineHeight = ctx.measurer.measure('M', spec).height;
  const ascent = lineHeight - ctx.measurer.getDescent(spec, 'M');
  const blockWidth = sequenceLabelBlockWidth(lines, spec, ctx.measurer, atoms);
  const top = at.yMiddle - (lines.length * lineHeight) / 2;
  return lines.flatMap((line, i) => {
    const lineWidth = sequenceLabelLineWidth(line, spec, ctx.measurer, atoms);
    const leftX = at.x + LABEL_GAP_X + (blockWidth - lineWidth) / 2;
    return sequenceCreoleRuns(line, font, { leftX, baselineY: top + ascent + i * lineHeight }, ctx.measurer, atoms);
  });
}

/** One link between two resolved tiles: `LinkAnchor#drawAnchor` (`:82-123`). */
function linkGeo(link: LinkAnchor, tiles: readonly [AnchoredTile, AnchoredTile], ctx: EventProcessingContext) {
  const [g1, g2] = tiles.map((t) => messageTileGauge(ctx, t));
  const [x1, x2] = tiles.map((t) => tileMiddleX(t, ctx));
  if (g1 === undefined || g2 === undefined || x1 === undefined || x2 === undefined) return undefined;
  const x = (x1 + x2) / 2;
  const yMin = Math.min(g1.contactY, g2.contactY);
  const yMax = Math.max(g1.contactY, g2.contactY);
  // The worm's style is `activityArrow()` (`Snake.java:136-137`), its colour
  // the sequence arrow's `LineColor` (`LinkAnchor.java:100-101`).
  const stroke = StyleSignatureBasic.of('root', 'element', 'activityDiagram', 'arrow')
    .getMergedStyle(ctx.endStyleBuilder)!
    .getStroke();
  const paint = paintOf(messageStyle(ctx.endStyleBuilder), HColorSet.instance());
  // `FontConfiguration.create(skinParam, style)` of the sequence `arrow`
  // style (`LinkAnchor.java:102-104`), drawn on the document background.
  const font = labelFont(messageStyle(ctx.endStyleBuilder), ctx.endStyleBuilder);
  return {
    x,
    yStart: yMin + ANCHOR_END_INSET,
    yEnd: yMax - ANCHOR_END_INSET,
    stroke: paint.stroke,
    thickness: stroke.getThickness(),
    dash: stroke.getDasharraySvg(),
    labelRuns: labelRunsOf(link.message, { x, yMiddle: (yMin + yMax) / 2 }, font, ctx),
    font,
  } satisfies LinkAnchorGeo;
}

/**
 * Every link whose two anchors both resolve (`PlayingSpace.java:131-134`
 * silently skips the rest), in declaration order.
 */
export function layoutLinkAnchors(ast: SequenceDiagramAST, ctx: EventProcessingContext): readonly LinkAnchorGeo[] {
  const geos: LinkAnchorGeo[] = [];
  for (const link of ast.linkAnchors ?? []) {
    const tile1 = tileFromAnchor(ast.events, link.anchor1);
    const tile2 = tileFromAnchor(ast.events, link.anchor2);
    const geo = tile1 !== undefined && tile2 !== undefined ? linkGeo(link, [tile1, tile2], ctx) : undefined;
    if (geo !== undefined) geos.push(geo);
  }
  return geos;
}
