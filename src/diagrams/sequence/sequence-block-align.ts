/**
 * A sequence component's text BLOCK at its style's font and alignment (sdd1
 * T3a; sdd2 T6b: through core creole). The block is `create0`'s
 * (`sequence-creole-sheet.ts`): its stripes stack by their own heights and
 * each is shifted inside the block by `SheetBlock1#initMap`'s
 * `(maxWidth - width) / coef` -- coef 2 for CENTER, 1 for RIGHT, 0 (no
 * shift) for LEFT (`klimt/creole/SheetBlock1.java:155-193`).
 *
 * The frame header, the `else` condition, the `ref` header and body and the
 * delay text all build their block this way: `AbstractTextualComponent`
 * creates it with the style's `FontConfiguration` and `HorizontalAlignment`
 * (`skin/AbstractTextualComponent.java:78-91`), or with an explicit LEFT
 * (`ComponentRoseGroupingHeader.java:90`, `ComponentRoseReference.java:78`).
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import type { TextRun } from './text-block-geo.js';
import { componentLabelBlock, offsetRun, type LabelInk } from './sequence-creole-sheet.js';

/** A block's primitives as placed, and its dimension
 *  (`textBlock.calculateDimension`). */
export interface PlacedBlock {
  readonly runs: readonly TextRun[];
  readonly width: number;
  readonly height: number;
}

/** Where a block goes: its left edge and the top of its first line. */
export interface BlockOrigin {
  readonly leftX: number;
  readonly top: number;
}

/** What a block is built and drawn with besides its lines and font: the
 *  sprites, the component's ink and its padding sides as `create0`'s margins
 *  (`AbstractTextualComponent.java:91`). */
export interface BlockContext {
  readonly measurer: StringMeasurer;
  readonly sprites?: SpriteRegistry | undefined;
  readonly ink?: LabelInk | undefined;
  readonly marginX1?: number;
  readonly marginX2?: number;
}

/**
 * `lines` as one block at `font`, its top-left at `origin` -- an empty
 * display is a `TextBlockEmpty` (`AbstractTextualComponent.java:86-87`).
 */
export function alignedBlockRuns(
  lines: readonly string[],
  font: FontConfiguration,
  origin: BlockOrigin,
  align: HorizontalAlignment | undefined,
  context: BlockContext,
): PlacedBlock {
  const { measurer, ...rest } = context;
  const block = componentLabelBlock(lines, font, { align, ...rest }, measurer);
  const runs = block.primitives.map((run) => offsetRun(run, origin.leftX, origin.top));
  return { runs, width: block.width, height: block.height };
}
