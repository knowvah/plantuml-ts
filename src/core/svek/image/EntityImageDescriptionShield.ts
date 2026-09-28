/**
 * EntityImageDescriptionShield — the three pure geometry/narrowing helpers
 * `EntityImageDescription` delegates to (`computeShieldMargins`,
 * `hideTextOffsets`, `requireGroups`).
 *
 * Moved VERBATIM out of `EntityImageDescriptionDelegates.ts` (cdd5-T4d,
 * mechanical only -- not an upstream divergence) to keep that file under
 * this project's 500-line complexity-hook ceiling once it gained
 * `AtomText#drawU`'s tab tokenizer and the `{{ }}` draw arm; same
 * "500-line splits" precedent as `EntityImageDescriptionLinkScan.ts`.
 * Re-exported from `EntityImageDescriptionDelegates.ts` unchanged.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageDescription.java
 */
import type { UGraphic } from '../../klimt/UGraphic.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import type { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { UGraphicWithGroups } from '../DecorateEntityImage.js';
import { Margins } from './EntityImageDescriptionSupport.js';

/** Upstream: the dimension math inside `getShield` (after the four
 *  early-return guards). */
export function computeShieldMargins(
  stereo: TextBlock,
  desc: TextBlock,
  asSmall: TextBlock,
  stringBounder: StringBounder,
): Margins {
  const dimStereo = stereo.calculateDimension(stringBounder);
  const dimDesc = desc.calculateDimension(stringBounder);
  const dimSmall = asSmall.calculateDimension(stringBounder);
  const x = Math.max(dimStereo.getWidth(), dimDesc.getWidth());
  const dimSmallWidth = dimSmall.getWidth();
  let suppX = x - dimSmallWidth;
  if (suppX < 1) suppX = 1;
  const y = Math.max(1, dimDesc.getHeight(), dimStereo.getHeight());
  return new Margins(suppX / 2, suppX / 2, y, y);
}

/** Shared `posx1`/`posx2` (+ the three dimensions they derive from) —
 *  upstream duplicates this exact computation once in `drawU`'s
 *  `hideText` block and once in `getOverscanX`; both still read
 *  upstream's own `(dimSmall.getWidth() - dimX.getWidth()) / 2` formula
 *  unchanged. */
export function hideTextOffsets(
  asSmall: TextBlock,
  desc: TextBlock,
  stereo: TextBlock,
  stringBounder: StringBounder,
): { posx1: number; posx2: number; dimSmall: XDimension2D; dimDesc: XDimension2D; dimStereo: XDimension2D } {
  const dimSmall = asSmall.calculateDimension(stringBounder);
  const dimDesc = desc.calculateDimension(stringBounder);
  const dimStereo = stereo.calculateDimension(stringBounder);
  const dimSmallWidth = dimSmall.getWidth();
  const posx1 = (dimSmallWidth - dimDesc.getWidth()) / 2;
  const posx2 = (dimSmallWidth - dimStereo.getWidth()) / 2;
  return { posx1, posx2, dimSmall, dimDesc, dimStereo };
}

/** Narrows `ug` to `UGraphicWithGroups` — duplicated locally per
 *  `DecorateEntityImage.ts`'s/`Cluster.ts`'s own one-local-helper-
 *  per-call-site convention (that module's own `requireGroups` is not
 *  exported). */
export function requireGroups(ug: UGraphic): UGraphicWithGroups {
  const candidate = ug as Partial<UGraphicWithGroups>;
  if (typeof candidate.startGroup !== 'function' || typeof candidate.closeGroup !== 'function') {
    throw new Error('EntityImageDescription: ug does not support startGroup/closeGroup (see UGraphicSvg)');
  }
  return ug as UGraphicWithGroups;
}
