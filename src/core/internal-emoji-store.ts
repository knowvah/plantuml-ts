/**
 * The Twemoji artwork half of `<:name:>` emoji rendering.
 *
 * Upstream reads `emoji/data/<unicode>.svg` off the classpath
 * (`Emoji.java:167` — `Dummy.class.getResourceAsStream(unicode + ".svg")`)
 * and hands the raw text to `SvgSpriteParserFactory.create(data, null, null)`.
 * A browser-safe port has no classpath, so the bytes arrive through
 * `RenderOptions.assetStore` instead — the same ADR-2 channel the internal
 * sprite bundle uses, under its own `emoji:` namespace so one store can carry
 * both without collision.
 *
 * Deliberately NOT folded into `internal-sprite-store.ts`, even though the
 * two are shaped alike and our `SpriteDimsLookup` could physically carry
 * emoji artwork: upstream keeps `Emoji` and `SpriteImage` separate, they
 * resolve by different keys (unicode codepoint vs bundle path), and only
 * sprites have the `.svg`-then-`.png` probe. Merging them would save a file
 * and lose the distinction this port is supposed to mirror.
 *
 * These assets are bare `<path>`/`<circle>` fragments with NO `<svg>` root —
 * `SvgNanoParser` handles that natively (it ignores `<svg>`/`</svg>` tags
 * outright), which is exactly why upstream can feed them to the same parser
 * family it uses for sprites.
 *
 * The artwork ships as `@knowvah/plantuml-emoji` (CC-BY 4.0), separately from
 * the MIT core — see that package's LICENSES.md.
 */

import type { AssetStore } from './asset-store.js';

/** Namespace prefix for emoji artwork inside a shared `AssetStore`. Matches
 *  `@knowvah/plantuml-emoji`'s `EMOJI_ASSET_PREFIX` — the two must agree or
 *  a consumer's store silently resolves nothing. */
export const INTERNAL_EMOJI_ASSET_PREFIX = 'emoji:';

/**
 * `AssetStore` key for one emoji's artwork.
 *
 * @param unicode hex codepoint from `Emoji.ts`'s registry, e.g. `1f680`
 * @returns e.g. `emoji:1f680.svg`
 */
export function internalEmojiAssetKey(unicode: string): string {
  return `${INTERNAL_EMOJI_ASSET_PREFIX}${unicode.toLowerCase()}.svg`;
}

/** Raw artwork source by codepoint. `undefined` = no artwork available, which
 *  is a legitimate state (no store wired, or a codepoint the bundle lacks) —
 *  callers fall back to the platform-glyph text run. */
export interface InternalEmojiStore {
  get(unicode: string): string | undefined;
}

/** The bare lookup `EntityImageDescriptionParams.emojiArtwork` and
 *  `BoxSizingOpts.emojiArtwork` both take. */
export type EmojiArtworkResolver = (unicode: string) => string | undefined;

/**
 * `InternalEmojiStore` → the resolver the sizer and the renderer take,
 * `undefined` for an absent store so a caller can omit the field entirely.
 *
 * One function rather than the same two-line ternary at each call site,
 * because the SIZER and the RENDERER must derive it IDENTICALLY: a use-case
 * ellipse is fitted by `Footprint` to the points actually drawn, so if one
 * side resolves artwork and the other falls back to the platform glyph, the
 * measured box and the drawn box disagree (`planning/sizer-renderer-parity
 * .md`). That desync is exactly what left `murava-69-tago286` non-conformant
 * while the renderer was already correct.
 */
export function emojiArtworkResolverFor(
  store: InternalEmojiStore | undefined,
): EmojiArtworkResolver | undefined {
  return store === undefined ? undefined : (unicode: string): string | undefined => store.get(unicode);
}

/**
 * Reads emoji artwork out of an `AssetStore`.
 *
 * Memoized per store instance, hits AND misses: a single diagram can measure
 * the same emoji many times (every sizing pass re-runs the draw path for the
 * use-case ellipse fit), and a miss is as worth caching as a hit.
 */
export function internalEmojiStoreFrom(assets: AssetStore): InternalEmojiStore {
  const decoder = new TextDecoder();
  const cache = new Map<string, string | undefined>();
  return {
    get(unicode: string): string | undefined {
      const key = unicode.toLowerCase();
      if (cache.has(key)) return cache.get(key);
      const payload = assets.get(internalEmojiAssetKey(key));
      const svg = payload === undefined ? undefined : decoder.decode(payload.bytes);
      cache.set(key, svg);
      return svg;
    },
  };
}
