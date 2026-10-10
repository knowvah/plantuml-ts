/**
 * The swimlane titles' compression shapes -- split out of `shapes-of.ts`
 * (its 500-line hook) by isw-T2b-ca when the title became the drawn
 * creole block (wrapped by `skinparam swimlaneWrapTitleWidth`).
 *
 * `Swimlanes#drawTitles` draws ONE `CenteredText` per lane
 * (`Swimlanes.java:369-375`), only when the band exists
 * (`:275`'s `size() > 1` guard -- `renderSwimlaneTitles`'s own
 * `geo.swimlaneBand === undefined` early return mirrors this). A
 * `CenteredText` is a bare `UShape` (`ftile/CenteredText.java:26`), not a
 * `UText` -- `SlotFinder#draw`'s dispatch chain (`SlotFinder.java:78-100`)
 * has no branch for it, so on the ON_X pass (the raw block drawn straight
 * into a fresh `SlotFinder`, `CompressionXorYBuilder.java:60-63`) it never
 * occupies. But the ON_Y builder wraps the ON_X builder
 * (`ActivityDiagram3.java:209-210`), so ON_Y's `SlotFinder` sees the raw
 * block drawn through `UGraphicCompressOnXorY.create(ON_X, ySlotFinder,
 * xAffine)` instead -- and that wrapper's OWN `CenteredText` branch
 * (`UGraphicCompressOnXorY.java:100-112`) does not forward the
 * `CenteredText` shape at all: it calls `text.drawU(...)` on the WRAPPED
 * title `TextBlock`, which emits a genuine `UText` per atom straight into
 * `getUg()` -- here, `ySlotFinder` -- so the title occupies on Y like a
 * `'text'` kind (`TextLimitFinder`'s `y - h + 1.5` shift, `collectSlots`
 * applies it, not this adapter).
 *
 * The box is the drawn block's text extent (`ifLabelShape`'s envelope
 * convention, `shapes-of.ts`): `LimitFinder#drawText`'s `[baseline - h +
 * 1.5, baseline + 1.5]` per `UText` (`LimitFinder.java:216-224`), read off
 * `getTitle(swimlane)` (`swimlane-title.ts`) drawn at the band origin, so a
 * wrapped title occupies every one of its lines. Position mirrors
 * `activity-renderer-swimlanes.ts#renderSwimlaneTitles`: `x = contentX +
 * (contentWidth - titleWidth) / 2`.
 */

import type { SwimlaneBandGeo, SwimlaneGeo } from '../../activity-geometry.types.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressShape } from './shapes-of.js';
import { measurerAdapterOf } from '../../tiles/gtile-action.js';
import { klimtStringBounder } from '../../activity-creole-sheet.js';
import { TextBlockUtils } from '../../../../core/klimt/shape/TextBlockUtils.js';
import { TEXT_LIMIT_SHIFT } from './slot-finder.js';
import { swimlaneTitleBlock } from '../swimlane-title.js';

export function titleShapes(
  swimlanes: readonly SwimlaneGeo[],
  band: SwimlaneBandGeo | undefined,
  bounder: StringBounder,
  theme: Theme,
): CompressShape[] {
  if (band === undefined) return [];
  const shapes: CompressShape[] = [];
  for (const lane of swimlanes) {
    const contentX = lane.contentX ?? lane.x;
    const contentWidth = lane.contentWidth ?? lane.width;
    const titleWidth = lane.titleWidth ?? 0;
    const titleX = contentX + (contentWidth - titleWidth) / 2;
    const { tb, fc } = swimlaneTitleBlock(lane.display ?? lane.name, theme, lane.actualWidth ?? lane.width);
    const sheetBounder = klimtStringBounder(measurerAdapterOf(bounder), { family: fc.family, size: fc.size });
    const mm = TextBlockUtils.getMinMax(tb, sheetBounder, false);
    shapes.push({
      kind: 'centeredText',
      x: titleX + mm.getMinX(),
      y: band.y + mm.getMaxY() - TEXT_LIMIT_SHIFT,
      width: mm.getMaxX() - mm.getMinX(),
      height: mm.getMaxY() - mm.getMinY(),
    });
  }
  return shapes;
}
