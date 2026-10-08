/**
 * class-namespace-title-image -- a cluster title's image run and the draw
 * context it needs (unwind2-S11), split out of `class-namespace-title-
 * runs.ts` to keep that file under the repo's 500-line cap.
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { Paint } from '../../core/paint.js';
import { image } from '../../core/svg.js';
import { spriteHrefOver, type SpriteTint } from '../../core/klimt/sprite/sprite-tint.js';

/** What `class-namespace-title-runs.ts#renderNamespaceTitleRuns` draws with: the measurer and the
 *  `Back` the cluster applied before its title (`USymbolFolder.java:224,
 *  228-229`'s `symbolContext.apply(ug)`), a sprite's tint start. */
export interface TitleRunsDraw {
  readonly measurer: StringMeasurer;
  readonly back?: Paint | undefined;
}

/** unwind2-S11: an image run as `Sea` places it -- bottom on the line's
 *  bottom, as the jar draws `P <$foo>` (`AtomSprite` altitude 0, the line
 *  `fontSize` tall), at the raster's rounded box (`SvgGraphics` writes the
 *  PNG's own size; `renderer-classifier-rows.ts`'s identical row draw),
 *  tinted over the cluster's back (`SpriteMonochrome.java:216`). */
export function titleImage(
  run: { readonly href: string; readonly width: number; readonly height: number; readonly tint?: SpriteTint },
  x: number,
  bottom: number,
  back: Paint | undefined,
): string {
  return image(x, bottom - run.height, Math.round(run.width), Math.round(run.height), spriteHrefOver(run, back));
}
