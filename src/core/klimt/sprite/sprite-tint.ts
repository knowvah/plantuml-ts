/**
 * sprite-tint.ts — a monochrome sprite's tint, deferred until the back
 * colour it is drawn over is known (unwind2-S7).
 *
 * Upstream tints at DRAW time, from the drawing context:
 *
 * ```java
 * public void drawU(UGraphic ug) {
 *     final UImage image = toUImage(ug.getColorMapper(), ug.getParam().getBackcolor(),
 *             forcedColor == null ? fontColor : forcedColor);
 * ```
 * (`SpriteMonochrome.java:215-217`). The `backColor` argument of
 * `asTextBlock` (`:211-212`) is never read: the gradient's start is whatever
 * `Back` the element applied before drawing its text -- the note fill
 * (`EntityImageNote.java:283`), the class or header fill
 * (`EntityImageClass.java:213,222`), the participant box
 * (`ComponentRoseParticipant.java:96-97`).
 *
 * This port resolves creole atoms at layout time, so a resolved sprite atom
 * keeps its {@link SpriteTint} and the draw site re-rasterises it over its
 * own back colour through {@link spriteHrefOver}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteMonochrome.java:180-188,215-217
 */
import type { Paint } from '../../paint.js';
import { parseSimpleColor } from '../color/HColorSet.js';
import { spriteToPngDataUri, type SpriteLike } from './sprite-raster.js';

/** What `asTextBlock` captures: the sprite, `forcedColor ?? fontColor`
 *  (`undefined` = `toUImage`'s black default, `:184-185`) and the scale. */
export interface SpriteTint {
  readonly sprite: SpriteLike;
  readonly color: string | undefined;
  readonly scale: number;
}

/**
 * The gradient start `toUImage` uses for a drawing context's back paint:
 *
 * - a gradient contributes its FIRST colour -- `HColorGradient`'s
 *   constructor unwraps a gradient `color1arg` to its own `color1`
 *   (`HColorGradient.java:50-51`, reached through `HColors.gradient`,
 *   `SpriteMonochrome.java:188`); jar-verified `class A #red-green`;
 * - no back, or a transparent one (`HColorSimple#isTransparent`, alpha 0,
 *   `HColorSimple.java:132-134`; `'none'`/`transparent` here), is white
 *   (`SpriteMonochrome.java:181-182`) -- returned as `undefined`, the
 *   rasteriser's own white default.
 *
 * Only RGB reaches the gradient (`HColorGradient.java:73-86`), so a
 * translucent back keeps its colour.
 */
export function spriteBackColor(back: Paint | undefined): string | undefined {
  if (back === undefined) return undefined;
  const solid = typeof back === 'string' ? back : back.color1;
  const parsed = parseSimpleColor(solid);
  if (parsed === undefined || parsed.a === 0) return undefined;
  return solid;
}

/** `toUImage(backcolor, color)` + `image.scale(scale)` as a PNG data URI. */
export function spriteTintHref(tint: SpriteTint, back: Paint | undefined): string {
  return spriteToPngDataUri(tint.sprite, tint.color, spriteBackColor(back), tint.scale).dataUri;
}

/** A resolved image atom's href drawn over `back`: a monochrome sprite
 *  re-tints ({@link spriteTintHref}); any other image keeps its bytes. */
export function spriteHrefOver(
  atom: { readonly href: string; readonly tint?: SpriteTint },
  back: Paint | undefined,
): string {
  return atom.tint === undefined ? atom.href : spriteTintHref(atom.tint, back);
}
