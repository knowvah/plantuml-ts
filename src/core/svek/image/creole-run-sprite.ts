/**
 * creole-run-sprite — the drawable image of a creole `<$sprite>` atom for the
 * `creole-text-lines.ts` seam (unwind2-S11).
 *
 * Upstream a `<$name>` in a text block becomes an `AtomSprite` built by
 * `StripeSimple#addSprite` (`StripeSimple.java:229`, `skinParam.getSprite
 * (src)`) at `CommandCreoleSprite`'s scale (`CommandCreoleSprite.java:82`,
 * `Parser.getScale(...) * fc.getSize2D() / 13.0`); `AtomSprite#drawU`
 * draws `sprite.asTextBlock(color, ..., scale, ...)`, which for a
 * monochrome sprite tints `forcedColor ?? fontColor` over the drawing
 * context's back (`SpriteMonochrome.java:215-217`). The seam had no image
 * for this atom: it sized it ({@link measureInlineAtom}) and drew nothing.
 *
 * The seam knows neither the back nor (for a default-coloured run) the
 * font colour the caller draws with, so a monochrome sprite carries its
 * {@link SpriteTint} with `color` = the atom's OWN `forcedColor` only;
 * the draw site completes it ({@link creoleRunImageHref}). An SVG sprite
 * (a vector `UGraphic` drawing, not a raster) gets no image here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomSprite.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteMonochrome.java:211-225
 */
import type { InlineAtomToken } from '../../creole-atoms.js';
import { measureInlineAtom, spriteAtomScale } from '../../creole-atoms-measure.js';
import type { Paint } from '../../paint.js';
import {
  getSpriteColor4096,
  getSpriteMonochrome,
  spriteDimsLookupFor,
  type SpriteRegistry,
} from '../../sprite-registry.js';
import { spriteColor4096ToPngDataUri, spriteMonochromeAsLike } from '../../klimt/sprite/sprite-raster.js';
import { spriteTintHref, type SpriteTint } from '../../klimt/sprite/sprite-tint.js';

/** A sprite atom's image: the no-back rendition `href`, its box, and (for a
 *  monochrome sprite) the deferred tint. `top` is filled by the line
 *  layout, as for a `<latex>` image. */
export interface CreoleRunSpriteImage {
  readonly href: string;
  readonly width: number;
  readonly height: number;
  /** The emitted PNG's pixel box, `Math.round` of the scaled one
   *  (`SpriteMonochrome#toUImage(...).scale(scale)`); `SvgGraphics` writes
   *  the raster's own width/height on the `<image>`. */
  readonly rasterWidth: number;
  readonly rasterHeight: number;
  readonly tint?: SpriteTint;
}

/** The image `AtomSprite#drawU` paints for `atom`, or `undefined` when the
 *  name resolves to no raster sprite (upstream `getSprite` null draws
 *  nothing; an SVG sprite is not a raster). */
export function creoleRunSpriteImage(
  atom: Extract<InlineAtomToken, { kind: 'sprite' }>,
  registry: SpriteRegistry,
  fontSize: number,
): CreoleRunSpriteImage | undefined {
  const dims = measureInlineAtom(atom, spriteDimsLookupFor(registry), fontSize);
  const scale = spriteAtomScale(atom, fontSize);
  const box = {
    width: dims.width,
    height: dims.height,
    rasterWidth: Math.round(dims.width),
    rasterHeight: Math.round(dims.height),
  };
  const mono = getSpriteMonochrome(registry, atom.name);
  if (mono !== undefined) {
    const tint: SpriteTint = { sprite: spriteMonochromeAsLike(mono), color: atom.forcedColor, scale };
    return { href: spriteTintHref(tint, undefined), ...box, tint };
  }
  const color = getSpriteColor4096(registry, atom.name);
  if (color === undefined) return undefined;
  return { href: spriteColor4096ToPngDataUri(color, scale).dataUri, ...box };
}

/** The href a draw site emits for a run image: a monochrome sprite tinted
 *  `forcedColor ?? fontColor` over `back` (`SpriteMonochrome.java:216-217`);
 *  any other image keeps its bytes. */
export function creoleRunImageHref(
  img: { readonly href: string; readonly tint?: SpriteTint },
  fontColor: string | undefined,
  back: Paint | undefined,
): string {
  if (img.tint === undefined) return img.href;
  return spriteTintHref({ ...img.tint, color: img.tint.color ?? fontColor }, back);
}
