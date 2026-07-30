/**
 * render-atoms.ts — SI5b+E2r T7: builds the `AtomImageResolver` factory
 * that turns creole `<img>`/`<$sprite>` atoms (T6, `core/creole-atoms.ts`)
 * into actual SVG `<image>` geometry at render time, reconciling seams
 * (a)/(b) flagged in the batch-2 decision-journal row:
 *
 * - `img` atoms: never need a sprite registry at all. Dims come straight
 *   off `measureInlineAtom` (T6) — the SAME numbers `leaf-sizing.ts`
 *   already used to size the label during layout (D9) — and `href` is the
 *   atom's own `dataUri`, passed through VERBATIM (D7 — licensing).
 * - `sprite` atoms: resolved against the per-diagram `SpriteRegistry` (T4,
 *   `core/sprite-commands.ts`) via `getSpriteMonochrome` (seam (b)
 *   bridge). An unresolved name returns `undefined` — matches
 *   `StripeSimple.addSprite` (upstream java :228-236): the atom
 *   contributes NOTHING, not a blank image. A resolved sprite is tinted +
 *   rasterized to a PNG data URI via T5's `spriteToPngDataUri`, through
 *   the seam (a) adapter (`spriteMonochromeAsLike`) that bridges T4's
 *   concrete `SpriteMonochrome` to T5's `SpriteLike` (see
 *   `sprite-raster.ts`'s file-header note — the one-line adapter that file
 *   anticipated once T4 landed).
 *
 * Width/height are ALWAYS taken from `measureInlineAtom`, never from
 * `spriteToPngDataUri`'s own returned `width`/`height` (the two are
 * numerically identical by construction — both derive from the same
 * `sprite.width`/`height` and `atom.scale` — see that function's own doc
 * comment): this guarantees the drawn `<image>` box is pixel-identical to
 * the box D9's measurement pass already reserved for it during layout
 * (this task's own "drawing and measuring agree" charter).
 *
 * `fontColor` for the sprite tint gradient's dark end is `AtomSprite`'s
 * upstream `fontConfiguration.getColor()` (java
 * `legacy/StripeSimple.java#addSprite`) — approximated here as the CURRENT
 * textblock's own resolved font color (`fontTitle`/`fontBody`/
 * `fontStereo` — see `EntityImageDescription.ts`'s
 * `atomImageResolverFor(font)` call sites, one per textblock, each with
 * its own font). `atom.forcedColor` overrides it, matching upstream's
 * `forcedColor == null ? fontColor : forcedColor`. `backColor` is left
 * unset (defaults to white, `sprite-raster.ts`'s own default) — upstream's
 * `backColor` comes from the active `UGraphic`'s current `Back` paint
 * (`ug.getParam().getBackcolor()`), which this port's `TextBlock` seam
 * does not thread through; documented simplification, not a geometry bug
 * (T7's jar-verification scope pins RELATIONS, not tint bytes — see the
 * mission brief).
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { AtomImageResolver, InlineAtomToken, SpriteDimsLookup } from '../../core/creole-atoms.js';
import {
  measureInlineAtom,
  spriteScale,
} from '../../core/creole-atoms-measure.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { getSpriteMonochrome, getSpriteSvg, spriteDimsLookupFor } from '../../core/sprite-commands.js';
import { toBase64 } from '../../core/klimt/sprite/png-encoder.js';
import { spriteToPngDataUri, spriteMonochromeAsLike } from '../../core/klimt/sprite/sprite-raster.js';

type ResolvedAtomImage =
  | { readonly kind: 'image'; readonly href: string; readonly width: number; readonly height: number }
  | undefined;

function resolveImgAtom(atom: Extract<InlineAtomToken, { kind: 'img' }>): ResolvedAtomImage {
  const dims = measureInlineAtom(atom);
  return { kind: 'image', href: atom.dataUri, width: dims.width, height: dims.height };
}

function resolveSpriteAtom(
  atom: Extract<InlineAtomToken, { kind: 'sprite' }>,
  registry: SpriteRegistry,
  spriteDims: SpriteDimsLookup,
  font: FontConfiguration,
): ResolvedAtomImage {
  // An SVG sprite is re-emitted verbatim as an `image/svg+xml` data URI --
  // there is no grey grid to tint, so `forcedColor`/font colour do not apply
  // (upstream's SpriteSvg likewise ignores both in `asTextBlock`). Dims come
  // from the SAME measureInlineAtom the sizer used (S1L-f part 2b).
  const svgSprite = getSpriteSvg(registry, atom.name);
  if (svgSprite !== undefined) {
    const dims = measureInlineAtom(atom, spriteDims, font.size);
    const href = `data:image/svg+xml;base64,${toBase64(new TextEncoder().encode(svgSprite.svg))}`;
    return { kind: 'image', href, width: dims.width, height: dims.height };
  }
  const sprite = getSpriteMonochrome(registry, atom.name);
  if (sprite === undefined) return undefined; // unknown name -- StripeSimple.addSprite: skip.
  // `font.size` is threaded so the sprite picks up `CommandCreoleSprite`'s
  // `fc.getSize2D() / 13.0` factor -- the SAME call the sizer makes, so drawn
  // and measured sprite geometry cannot drift (S1L-f).
  const dims = measureInlineAtom(atom, spriteDims, font.size);
  const png = spriteToPngDataUri(
    spriteMonochromeAsLike(sprite),
    font.color ?? undefined,
    atom.forcedColor,
    spriteScale(atom.scale, font.size),
  );
  return { kind: 'image', href: png.dataUri, width: dims.width, height: dims.height };
}

/**
 * Builds the `(font) => AtomImageResolver` factory `EntityImageDescription
 * .ts`'s `atomImageResolverFor` param expects (one call per textblock, so
 * each resolver closes over that textblock's own font/color). `registry`
 * is the diagram's `ast.sprites` (`undefined` for a diagram with no
 * `sprite` definitions at all — `<$name>` atoms then always resolve to
 * `undefined`/skip, matching upstream's `skinParam.getSprite(name)`
 * returning null when nothing is registered; `<img>` atoms are unaffected
 * either way).
 */
export function makeAtomImageResolverFor(
  registry: SpriteRegistry | undefined,
): (font: FontConfiguration) => AtomImageResolver {
  const spriteDims = registry !== undefined ? spriteDimsLookupFor(registry) : undefined;
  return (font: FontConfiguration): AtomImageResolver => {
    return (atom: InlineAtomToken): ResolvedAtomImage => {
      if (atom.kind === 'img') return resolveImgAtom(atom);
      // G2 N41: OpenIconic glyphs have zero description/usecase corpus
      // reach (class-only per the G2 N40 survey) -- undefined here matches
      // an unresolved sprite name's own "contributes nothing" rule rather
      // than guessing an unverified description-side render path.
      if (atom.kind === 'openiconic') return undefined;
      if (registry === undefined || spriteDims === undefined) return undefined;
      return resolveSpriteAtom(atom, registry, spriteDims, font);
    };
  };
}
