/**
 * `SpriteImage.fromInternal` (java `klimt/sprite/SpriteImage.java:100-128`) —
 * the jar-internal `/sprites/**` bundle, ported onto ADR-2's synchronous
 * asset channel (`plans/s1l-tail-fix/decisions.md`).
 *
 * Upstream reads `/sprites/<name>.svg`, then `/sprites/<name>.png`, off the
 * classpath: a process-global, immutable resource root. A browser-safe port
 * has no classpath, so the bytes arrive through `RenderOptions.assetStore`
 * (`core/asset-store.ts`, built by F3-seam) — the same sync/pre-fillable
 * shape `includeStore` already establishes, which is what lets the
 * size-conformance harness (`scripts/measure-description-size-deltas.ts`,
 * `renderSync`-only) measure a jar-resident sprite at all. This module adds
 * NO option of its own; it layers a key scheme on top of the existing
 * `AssetStore`, exactly as `StdlibStore.ts` layers `<bundle/thing>`
 * resolution on top of `IncludeStore`.
 *
 * The vendored payload lives in `assets/sprites/**` (byte-verbatim, upstream
 * `de1f986f092`) and is loaded by `scripts/sprite-assets-store.ts`. It is NOT
 * imported from anywhere in `src/` — no sprite byte reaches the default
 * library bundle unless a host explicitly builds a store and passes it
 * (ADR-9(b), stop condition 8).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java:100-128
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:801-807
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSpriteFile.java:68-76,108-112
 */

import type { AssetStore } from './asset-store.js';
import type { Sprite } from './klimt/sprite/Sprite.js';
import { SpriteSvg } from './klimt/sprite/SpriteSvg.js';

/**
 * Namespace prefix for every internal-sprite key inside a shared
 * `AssetStore`. `combineAssetStores` layers a sprite store and F4-b's emoji
 * store under one `options.assetStore` value, so each consumer's keys must
 * be unambiguous on their own.
 */
export const INTERNAL_SPRITE_ASSET_PREFIX = 'sprite:';

/**
 * Key for one vendored file: `sprite:` + its path relative to
 * `assets/sprites/`, WITH its extension, lowercased —
 * `sprite:archimate/interface.svg`.
 *
 * The extension stays in the key deliberately: `fromInternal` probes `.svg`
 * before `.png` and that precedence belongs in the resolver below (where
 * upstream puts it), not in the loader. The store itself is a dumb byte
 * channel. Lowercasing mirrors `Stdlib.java#getPumlResource`'s own
 * case-folding, already reproduced by `derivePumlKey`.
 */
export function internalSpriteAssetKey(bundlePath: string): string {
  return INTERNAL_SPRITE_ASSET_PREFIX + bundlePath.toLowerCase();
}

/**
 * The internal-bundle half of `SkinParam#getSprite`'s two-step lookup:
 * consulted only after the per-diagram `SpriteRegistry` misses.
 *
 * `path` is the extension-less bundle path a diagram writes —
 * `archimate/interface` for `<<$archimate/interface>>`, or the text after
 * `jar:` in a `sprite $NAME jar:...` command.
 */
export interface InternalSpriteStore {
  get(path: string): Sprite | undefined;
}

/** Probe order, `SpriteImage.java:107-113`: SVG wins outright over PNG. */
const PROBE_EXTENSIONS: readonly string[] = ['.svg', '.png'];

/** PNG signature + `IHDR` big-endian width/height, ISO/IEC 15948 §11.2.2 —
 *  the raw-bytes twin of `klimt/sprite/png-ihdr.ts#parsePngIhdrFromDataUri`
 *  (that one decodes a `data:` URI prefix; a vendored asset arrives as bytes
 *  already). Plain arithmetic, not bitwise shifts, for the same
 *  complexity-hook reason that file documents. */
const PNG_SIGNATURE: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function uint32At(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! * 16777216 + bytes[offset + 1]! * 65536 + bytes[offset + 2]! * 256 + bytes[offset + 3]!
  );
}

/** `SImageIO.read(is)` -> `image.getWidth()/getHeight()`, reduced to the
 *  header read those two accessors need. `undefined` when the payload is not
 *  a PNG with a leading IHDR chunk. */
function pngDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  if (bytes.length < 24) return undefined;
  if (PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) return undefined;
  const width = uint32At(bytes, 16);
  const height = uint32At(bytes, 20);
  if (width === 0 || height === 0) return undefined;
  return { width, height };
}

const decoder = new TextDecoder();

/** One probe: bytes -> `Sprite`, or `undefined` when the payload is absent
 *  or undecodable. Upstream logs and returns null on any `Throwable`
 *  (java:118-121); declining rather than failing the whole diagram is also
 *  this port's established rule for an undimensionable SVG
 *  (`sprite-commands.ts#registerSvg`, `SpriteSvg.from`). */
function probe(assets: AssetStore, path: string, extension: string): Sprite | undefined {
  const payload = assets.get(internalSpriteAssetKey(path + extension));
  if (payload === undefined) return undefined;
  if (extension === '.svg') return SpriteSvg.from(decoder.decode(payload.bytes));
  return pngDimensions(payload.bytes);
}

/** True when `path` already carries a sprite extension — `fromInternal`
 *  rejects those outright (java:103-104), because it appends its own. */
function hasSpriteExtension(path: string): boolean {
  return PROBE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

/**
 * Wraps a byte-level {@link AssetStore} as an {@link InternalSpriteStore},
 * reproducing `fromInternal`'s `.svg`-then-`.png` probe order.
 *
 * Memoized per store instance, hits AND misses: `getSprite` runs once per
 * stereotype occurrence per measurement pass, and the size-conformance
 * harness renders every fixture in one process — re-decoding an SVG's ink
 * box (`svgInkBox` walks every `<path d>`) on each of those is pure waste.
 * The vendored bundle is immutable, so caching is observationally
 * transparent.
 */
export function internalSpriteStoreFrom(assets: AssetStore): InternalSpriteStore {
  const cache = new Map<string, Sprite | undefined>();
  return {
    get(path: string): Sprite | undefined {
      const key = path.toLowerCase();
      if (cache.has(key)) return cache.get(key);
      let sprite: Sprite | undefined;
      if (!hasSpriteExtension(key)) {
        for (const extension of PROBE_EXTENSIONS) {
          sprite = probe(assets, key, extension);
          if (sprite !== undefined) break;
        }
      }
      cache.set(key, sprite);
      return sprite;
    },
  };
}

// ---------------------------------------------------------------------------
// `CommandSpriteFile`'s `jar:` grammar (java :68-76 pattern, :108-112 dispatch)
// ---------------------------------------------------------------------------

/**
 * `sprite $NAME jar:<bundlePath>` — the ONLY `CommandSpriteFile` source form
 * a browser-safe port can serve. Its two siblings (`sprite $N <file>` and
 * `sprite $N <archive>~<entry>`) both go through
 * `FileSystem.getInstance().getFile(...)` and are therefore unportable to
 * `src/` (CLAUDE.md: no Node built-ins, no blocking I/O). They are a
 * documented gap, not a silent omission — a non-`jar:` line simply does not
 * match here and falls through to the next command, exactly as it does today.
 *
 * NAME is `\$?([-%pLN_]+)` upstream; `%pLN_` -> `\w` per this port's
 * established idiom (see `sprite-commands.ts`'s file doc for the same
 * translation, made once and cited everywhere). FILE is `([^<>%g#]*)` —
 * `%g` is PlantUML's quote macro, so the excluded set is `<`, `>`, `"`, `#`;
 * required non-empty here because an empty path can never resolve.
 * String-built, never a regex literal carrying `{`/`[`/`]`.
 */
const JAR_SPRITE_RE = new RegExp('^sprite\\s+\\$?([-.\\w]+)\\s+jar:([^<>"#]+)$', 'i');

/** The parsed `sprite $NAME jar:<path>` line, or `undefined` when `trimmed`
 *  is some other (or no) sprite form. Pure — no registry mutation, so the
 *  grammar is testable without one (`~/.claude/rules/testability.md`). */
export function matchJarSpriteLine(trimmed: string): { name: string; path: string } | undefined {
  const match = JAR_SPRITE_RE.exec(trimmed);
  if (match === null) return undefined;
  const path = match[2]!.trim();
  return path === '' ? undefined : { name: match[1]!, path };
}
