/**
 * `SpriteRegistry` — the per-diagram sprite map and its lookup seams, split
 * out of `sprite-commands.ts` (which owns the sprite-DEFINITION grammar)
 * purely to keep that file under this repo's 500-line module cap; the same
 * split precedent as `openiconic-glyphs-data.ts` and
 * `element-grammar-nosymbol.ts`. `sprite-commands.ts` re-exports every symbol
 * below, so no importer moved.
 *
 * Mirrors `SkinParam.sprites` (java :790-807: `Map<String, Sprite>` +
 * `addSprite`/`getSprite`, the latter falling back to
 * `SpriteImage.fromInternal`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:790-807
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/WithSprite.java (registry contract)
 */

import type { SpriteDimsLookup } from './creole-atoms.js';
import type { InternalSpriteStore } from './internal-sprite-store.js';
import type { InternalEmojiStore } from './internal-emoji-store.js';
import type { Sprite } from './klimt/sprite/Sprite.js';
import type { SpriteMonochrome } from './klimt/sprite/SpriteMonochrome.js';
import { isSpriteSvg, type SpriteSvg } from './klimt/sprite/SpriteSvg.js';
import { SpriteColor4096 } from './klimt/sprite/SpriteColor4096.js';

export interface SpriteRegistry {
  readonly byName: Map<string, Sprite>;
  /**
   * Names of a sprite block encountered but NOT registered. cdd-T26
   * residual round: a `sprite $name [WxH/color] { ... }` block now DOES
   * register (`SpriteColorBuilder4096`/`SpriteColor4096`,
   * `sprite-commands.ts#buildAndRegister`) — the only remaining producer
   * of this shelf is `registerSvg`'s own failure path (an SVG sprite with
   * neither a `viewBox` nor `width`/`height` to derive pixel dimensions
   * from). Field name kept (not renamed) to avoid rippling every existing
   * consumer for a shelf whose OWN entries are already self-describing
   * via {@link surfaceSpriteWarnings}'s message text, not this field's name.
   */
  readonly skippedColorSprites: string[];
  /**
   * One ready-to-surface message per name a LATER `sprite $name` definition
   * silently overwrote (si11b ADR-7) -- the namespace is flat and global per
   * diagram (`addSprite` is `byName.set`, last-write-wins, upstream
   * `SkinParam.sprites` behavior, kept unchanged). Each message names BOTH
   * the discarded and the winning definition, since "which one won" is the
   * only actionable part of an otherwise-silent collision. Collected here
   * unconditionally; surfaced only if a consumer opts into
   * `RenderOptions.onWarning` via `surfaceSpriteWarnings`, below.
   */
  readonly collisions: string[];
  /** One message per `sprite $N jar:<path>` whose bundle path resolved
   *  through neither {@link internal} nor a caller-supplied store — upstream
   *  fails the command outright (`CommandSpriteFile.java:111`,
   *  `CommandExecutionResult.error("No such internal sprite: ")`); this port
   *  consumes the line and reports, the same shelf `skippedColorSprites`
   *  already uses. Surfaced by {@link surfaceSpriteWarnings}. */
  readonly unresolved: string[];
  /** `SpriteImage.fromInternal`'s jar-resident `/sprites/**` bundle
   *  (`internal-sprite-store.ts`), consulted by {@link getSprite} only after
   *  {@link byName} misses. `undefined` on the default browser path — no
   *  vendored byte is loaded unless a host wires `RenderOptions.assetStore`. */
  readonly internal?: InternalSpriteStore | undefined;
  /** Twemoji artwork store (`internal-emoji-store.ts`). Carried HERE, beside
   *  the sprite store, purely because this registry is the one object that
   *  already reaches BOTH the sizer (via `spriteDimsLookupFor`) and the
   *  renderer — emoji and sprites stay separate concepts (different keys, no
   *  shared probe), they just share a ride. */
  readonly emoji?: InternalEmojiStore | undefined;
}

export function createSpriteRegistry(internal?: InternalSpriteStore, emoji?: InternalEmojiStore): SpriteRegistry {
  return { byName: new Map(), skippedColorSprites: [], collisions: [], unresolved: [], internal, emoji };
}

/** `sprite $name`'s kind + pixel size -- the only identifying data an
 *  `addSprite` call site carries (no source file/line reaches this layer),
 *  so it is what a collision message uses to distinguish the two origins. */
function describeSprite(sprite: Sprite): string {
  return `${isSpriteSvg(sprite) ? 'SVG' : 'encoded'} ${sprite.width}x${sprite.height}`;
}

/** @see WithSprite.java#addSprite / SkinParam.java:791-793 */
export function addSprite(registry: SpriteRegistry, name: string, sprite: Sprite): void {
  const existing = registry.byName.get(name);
  if (existing !== undefined) {
    registry.collisions.push(
      `sprite $${name} redefined: ${describeSprite(existing)} replaced by ` +
        `${describeSprite(sprite)} (last definition wins)`,
    );
  }
  registry.byName.set(name, sprite);
}

/**
 * The render pipeline's ONLY channel for `SpriteRegistry.collisions` (si11b
 * ADR-7): `renderSync()`/`render()` call this once per parsed AST, right
 * after `plugin.parse()`, so a consumer's `RenderOptions.onWarning` learns
 * about an otherwise-silent sprite-name overwrite. `ast` is `unknown` --
 * every diagram plugin's own AST type is erased by the dispatch registry --
 * but each one optionally carries its own `sprites?: SpriteRegistry`
 * (`createSpriteRegistry()`), so a structural check is the right tool here,
 * not a validation boundary: this is the pipeline's own trusted output, not
 * data crossing into the process (`~/.claude/rules/security.md`).
 *
 * A no-op when `onWarning` is omitted -- the eager (no-callback) path is
 * therefore unaffected bit-for-bit, and no Node global or `console.*` is
 * ever touched (the callback is the ONLY channel, per ADR-7). Reusable
 * later for `skippedColorSprites` and ADR-5(a)'s macro-miss reporting,
 * neither of which has a surfacing channel today.
 */
export function surfaceSpriteWarnings(ast: unknown, onWarning: ((message: string) => void) | undefined): void {
  if (onWarning === undefined) return;
  if (typeof ast !== 'object' || ast === null || !('sprites' in ast)) return;
  const sprites = (ast as { sprites?: SpriteRegistry }).sprites;
  // Wrapped in a lambda, not passed directly: `Array#forEach`'s callback
  // signature is `(value, index, array)`, and passing `onWarning` itself
  // would leak those extra positional args into every consumer's callback.
  sprites?.collisions.forEach((message) => onWarning(message));
  sprites?.unresolved.forEach((message) => onWarning(message));
}

/**
 * `SkinParam#getSprite` (java:801-807) in full: the per-diagram registry
 * first, then `SpriteImage.fromInternal`'s jar-resident `/sprites/**` bundle
 * (F4-a). The internal store is taken from `internalStore` when a caller has
 * one in hand, else from the registry it was built with — both channels are
 * optional, so a host that wires neither gets today's behaviour bit for bit
 * (an unresolved name, and the caller's own `«label»` fallback).
 */
export function getSprite(
  registry: SpriteRegistry,
  name: string,
  internalStore?: InternalSpriteStore,
): Sprite | undefined {
  return registry.byName.get(name) ?? (internalStore ?? registry.internal)?.get(name);
}

// ---------------------------------------------------------------------------
// T7 seam (b) reconciliation (SI5b+E2r batch-2 decision-journal row):
// bridges this registry's `getSprite(name)` to T6's `SpriteDimsLookup.get`
// (creole-atoms.ts) for measurement, and exposes the concrete
// `SpriteMonochrome` (not just the narrow `Sprite` {width,height} surface)
// for T7's render-time tint/PNG pipeline (render-atoms.ts).
// ---------------------------------------------------------------------------

/** Bridges `getSprite` to T6's `SpriteDimsLookup` interface (D9 measurement
 *  seam, `creole-atoms.ts#measureLineWithAtoms`/`measureInlineAtom`) -- the
 *  `SpriteDimsLookup.get(name)` -> `SpriteRegistry.getSprite(name)` name-
 *  bridge the batch-2 journal flagged for this task. `svg` (T10): carries
 *  the verbatim source through too, so the SIZER can decompose real
 *  geometry instead of approximating from ink numbers alone (`leaf-sizing.ts
 *  #sizingAtomImageResolverFor`). */
export function spriteDimsLookupFor(registry: SpriteRegistry): SpriteDimsLookup {
  return {
    get(name: string) {
      const sprite = getSprite(registry, name);
      if (sprite === undefined) return undefined;
      if (isSpriteSvg(sprite))
        return {
          width: sprite.width,
          height: sprite.height,
          inkX: sprite.inkX,
          inkY: sprite.inkY,
          svg: sprite.svg,
          inkWidth: sprite.inkWidth,
          inkHeight: sprite.inkHeight,
        };
      return { width: sprite.width, height: sprite.height };
    },
  };
}

/** Render-time seam (T7): resolves a sprite by name as the concrete
 *  `SpriteMonochrome` every `sprite ... { }`/`sprite ... DATA` definition
 *  this registry stores actually is (`buildAndRegister`, above, only ever
 *  constructs one via `SpriteGrayLevel#buildSprite`/`buildSpriteZ`) -- the
 *  plain `Sprite` interface (`{width,height}`) is too narrow for T7's
 *  tint/PNG pipeline (`sprite-raster.ts#spriteToPngDataUri`), which needs
 *  `grayLevel`/`getGray` too (seam (a), that file's `spriteMonochromeAsLike`
 *  adapter). */
export function getSpriteMonochrome(registry: SpriteRegistry, name: string): SpriteMonochrome | undefined {
  const sprite = getSprite(registry, name);
  // An SVG or 4096-colour sprite has no grey grid — the monochrome/PNG
  // tint path must skip it rather than cast blindly (S1L-f part 2b; the
  // colour exclusion is cdd-T26 residual round's own addition, once
  // `SpriteColor4096` became a real registrable `Sprite` kind).
  if (isSpriteSvg(sprite) || isSpriteColor4096(sprite)) return undefined;
  return sprite as SpriteMonochrome | undefined;
}

/** cdd-T26 residual round: the `getSpriteMonochrome`/`getSpriteSvg`
 *  sibling for a `/color` (4096-colour) sprite — `SpriteColor4096` is a
 *  real class (not a duck-typed `.kind` tag like `SpriteSvg`), so
 *  `instanceof` is the natural, exact type guard. */
export function isSpriteColor4096(sprite: Sprite | undefined): sprite is SpriteColor4096 {
  return sprite instanceof SpriteColor4096;
}

/** The `/color`-sprite registry entry for `name`, or `undefined` when the
 *  name is unknown or is a monochrome/SVG sprite instead. */
export function getSpriteColor4096(registry: SpriteRegistry, name: string): SpriteColor4096 | undefined {
  const sprite = getSprite(registry, name);
  return isSpriteColor4096(sprite) ? sprite : undefined;
}

/** The SVG-backed registry entry for `name`, or `undefined` when the name is
 *  unknown or is an encoded (monochrome) sprite instead. */
export function getSpriteSvg(registry: SpriteRegistry, name: string): SpriteSvg | undefined {
  const sprite = getSprite(registry, name);
  return isSpriteSvg(sprite) ? sprite : undefined;
}
