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
import { SpriteImage } from './klimt/sprite/SpriteImage.js';
import type { ArgbImage } from './klimt/sprite/sprite-raster.js';
import { ByteBitInputStream } from './code/deflate/ByteBitInputStream.js';
import { Decompressor } from './code/deflate/Decompressor.js';

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

// ---------------------------------------------------------------------------
// `SImageIO.read(is)` (SpriteImage.java:113-115): PNG bytes -> `getRGB` ints
// ---------------------------------------------------------------------------

/** PNG signature, ISO/IEC 15948 §5.2. */
const PNG_SIGNATURE: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** Chunk length + type + CRC around each chunk's data (§5.3). */
const CHUNK_OVERHEAD = 12;
const CHUNK_HEADER = 8;
/** `IHDR` colour types the decoder reads (§11.2.2): indexed and 8-bit RGBA. */
const COLOR_TYPE_INDEXED = 3;
const COLOR_TYPE_RGBA = 6;
const RGBA_CHANNELS = 4;
const BITS_PER_BYTE = 8;
/** zlib `CM = 8` (deflate) and `FDICT` (RFC 1950 §2.2). */
const ZLIB_METHOD_DEFLATE = 8;
const ZLIB_FDICT = 0x20;
const ZLIB_HEADER = 2;
const OPAQUE_ALPHA = 0xff;

function uint32At(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! * 16777216 + bytes[offset + 1]! * 65536 + bytes[offset + 2]! * 256 + bytes[offset + 3]!;
}

interface PngHeader {
  readonly width: number;
  readonly height: number;
  readonly bitDepth: number;
  readonly colorType: number;
  readonly interlace: number;
}

interface PngChunks {
  readonly header: PngHeader;
  readonly palette: Uint8Array | undefined;
  readonly transparency: Uint8Array | undefined;
  readonly data: Uint8Array;
}

/** The chunks the decoder reads; every other ancillary chunk (`gAMA`,
 *  `pHYs`, `tEXt`, `tIME` in the vendored bundle) is skipped — Java's
 *  `PNGImageReader` applies no gamma to `getRGB` either. */
function readChunks(bytes: Uint8Array): PngChunks {
  if (bytes.length < CHUNK_HEADER || PNG_SIGNATURE.some((b, i) => bytes[i] !== b)) throw new Error('not a PNG');
  const named = new Map<string, Uint8Array>();
  const data: Uint8Array[] = [];
  for (let offset = CHUNK_HEADER; offset + CHUNK_OVERHEAD <= bytes.length;) {
    const length = uint32At(bytes, offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + CHUNK_HEADER));
    const body = bytes.subarray(offset + CHUNK_HEADER, offset + CHUNK_HEADER + length);
    if (body.length !== length) break;
    if (type === 'IDAT') data.push(body);
    else if (!named.has(type)) named.set(type, body);
    offset += CHUNK_OVERHEAD + length;
  }
  const ihdr = named.get('IHDR');
  if (ihdr === undefined || ihdr.length < 13 || data.length === 0) throw new Error('PNG without IHDR or IDAT');
  const header = {
    width: uint32At(ihdr, 0),
    height: uint32At(ihdr, 4),
    bitDepth: ihdr[8]!,
    colorType: ihdr[9]!,
    interlace: ihdr[12]!,
  };
  return { header, palette: named.get('PLTE'), transparency: named.get('tRNS'), data: concat(data) };
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Bits per pixel of a supported header, or a throw for the rest: the
 *  vendored bundle is 1-bit indexed (`assignment.png`,
 *  `association-unidirect.png`) and 8-bit RGBA (the other 21). Greyscale is
 *  not decoded: `getRGB` of Java's grey `ColorModel` is a colour-space
 *  conversion, not the stored value. */
function bitsPerPixel(header: PngHeader): number {
  if (header.width === 0 || header.height === 0) throw new Error('empty PNG');
  if (header.interlace !== 0) throw new Error('interlaced PNG');
  if (header.colorType === COLOR_TYPE_RGBA && header.bitDepth === BITS_PER_BYTE) return RGBA_CHANNELS * BITS_PER_BYTE;
  if (header.colorType === COLOR_TYPE_INDEXED && header.bitDepth <= BITS_PER_BYTE) return header.bitDepth;
  throw new Error(`unsupported PNG colour type ${header.colorType}/${header.bitDepth}`);
}

/** zlib stream (RFC 1950) -> inflated bytes, through the deflate port. */
function inflateZlib(stream: Uint8Array): Uint8Array {
  const cmf = stream[0] ?? 0;
  const flg = stream[1] ?? 0;
  if ((cmf & 0x0f) !== ZLIB_METHOD_DEFLATE || (flg & ZLIB_FDICT) !== 0) throw new Error('unsupported zlib header');
  const padded = new Uint8Array(stream.length - ZLIB_HEADER + 256);
  padded.set(stream.subarray(ZLIB_HEADER));
  return Decompressor.decompress(new ByteBitInputStream(padded));
}

/** The Paeth predictor (§9.4). */
function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function predictor(type: number, a: number, b: number, c: number): number {
  switch (type) {
    case 0:
      return 0;
    case 1:
      return a;
    case 2:
      return b;
    case 3:
      return Math.floor((a + b) / 2);
    case 4:
      return paeth(a, b, c);
    default:
      throw new Error(`unknown PNG filter ${type}`);
  }
}

/** Reverses the per-scanline filters (§9.2) in place; returns the rows. */
function unfilter(raw: Uint8Array, header: PngHeader, bpp: number): Uint8Array[] {
  const stride = Math.ceil((header.width * bpp) / BITS_PER_BYTE);
  if (raw.length < header.height * (stride + 1)) throw new Error('short PNG data');
  const left = Math.max(1, bpp / BITS_PER_BYTE);
  const rows: Uint8Array[] = [];
  let previous: Uint8Array = new Uint8Array(stride);
  for (let y = 0; y < header.height; y++) {
    const start = y * (stride + 1);
    const type = raw[start]!;
    const row = raw.subarray(start + 1, start + 1 + stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= left ? row[i - left]! : 0;
      const c = i >= left ? previous[i - left]! : 0;
      row[i] = (row[i]! + predictor(type, a, previous[i]!, c)) & OPAQUE_ALPHA;
    }
    rows.push(row);
    previous = row;
  }
  return rows;
}

/** `IndexColorModel#getRGB`: `PLTE` rgb, `tRNS` alpha (opaque past its end). */
function indexedArgb(chunks: PngChunks, index: number): number {
  const palette = chunks.palette;
  if (palette === undefined || (index + 1) * 3 > palette.length) throw new Error('PNG palette index out of range');
  const alpha = chunks.transparency?.[index] ?? OPAQUE_ALPHA;
  return (alpha << 24) | (palette[index * 3]! << 16) | (palette[index * 3 + 1]! << 8) | palette[index * 3 + 2]!;
}

/** One pixel of an unfiltered row as `getRGB` answers it. */
function pixelArgb(chunks: PngChunks, row: Uint8Array, x: number): number {
  const { bitDepth, colorType } = chunks.header;
  if (colorType === COLOR_TYPE_RGBA) {
    const o = x * RGBA_CHANNELS;
    return (row[o + 3]! << 24) | (row[o]! << 16) | (row[o + 1]! << 8) | row[o + 2]!;
  }
  const bit = x * bitDepth;
  const shift = BITS_PER_BYTE - bitDepth - (bit % BITS_PER_BYTE);
  return indexedArgb(chunks, (row[Math.floor(bit / BITS_PER_BYTE)]! >> shift) & ((1 << bitDepth) - 1));
}

/**
 * `SImageIO.read(is)` reduced to what `SpriteImage` reads off the result:
 * pixel size and `getRGB(x, y)` (non-premultiplied ARGB `int`s). Covers the
 * vendored bundle's two encodings (see {@link bitsPerPixel}); `undefined` for
 * anything else or anything malformed — `fromInternal` logs and returns
 * `null` on any `Throwable` (java:118-121).
 */
export function readPng(bytes: Uint8Array): ArgbImage | undefined {
  try {
    const chunks = readChunks(bytes);
    const { width, height } = chunks.header;
    const rows = unfilter(inflateZlib(chunks.data), chunks.header, bitsPerPixel(chunks.header));
    const argb = new Int32Array(width * height);
    rows.forEach((row, y) => {
      for (let x = 0; x < width; x++) argb[y * width + x] = pixelArgb(chunks, row, x);
    });
    return { width, height, argb };
  } catch {
    return undefined;
  }
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
  const image = readPng(payload.bytes);
  return image === undefined ? undefined : new SpriteImage(image);
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
