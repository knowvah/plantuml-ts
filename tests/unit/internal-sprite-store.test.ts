/**
 * F4-a — `SpriteImage.fromInternal` port: the jar-internal `/sprites/**`
 * bundle reached through ADR-2's synchronous `RenderOptions.assetStore`.
 *
 * @see src/core/internal-sprite-store.ts
 */

import { deflateSync } from 'node:zlib';
import { describe, it, expect } from 'vitest';

import type { AssetStore, AssetPayload } from '../../src/core/asset-store.js';
import {
  INTERNAL_SPRITE_ASSET_PREFIX,
  internalSpriteAssetKey,
  internalSpriteStoreFrom,
  matchJarSpriteLine,
  readPng,
} from '../../src/core/internal-sprite-store.js';
import { ARCHIMATE_SPRITE_NAMES } from '../../src/core/klimt/sprite/archimate-sprite-names.js';
import { buildSpriteAssetsStore } from '../helpers/sprite-assets-store.js';
import { isSpriteSvg } from '../../src/core/klimt/sprite/SpriteSvg.js';
import { SpriteImage } from '../../src/core/klimt/sprite/SpriteImage.js';
import { crc32, encodePng } from '../../src/core/klimt/sprite/png-encoder.js';

const encoder = new TextEncoder();

/** The archimate canvas every vendored SVG declares — `19.995mm x 19.928mm`
 *  with a matching viewBox, so `UImageSvg#getData`'s viewBox branch wins and
 *  the `mm` units never need interpreting. */
const ARCHIMATE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="19.995mm" height="19.928mm" ' +
  'viewBox="0 0 19.995 19.928"><path d="M 2,2 L 18,2 L 18,18 L 2,18 Z"/></svg>';

/** A real 1x1 RGBA PNG (one opaque black pixel). */
const PNG_1X1 = encodePng(new Uint8Array([0, 0, 0, 255]), 1, 1);

function storeOf(entries: Readonly<Record<string, AssetPayload>>): AssetStore {
  return {
    get: (key) => entries[key],
    has: (key) => key in entries,
  };
}

function svgStore(path: string, svg = ARCHIMATE_SVG): AssetStore {
  return storeOf({
    [internalSpriteAssetKey(path)]: { bytes: encoder.encode(svg), mimeType: 'image/svg+xml' },
  });
}

describe('internalSpriteAssetKey', () => {
  it('prefixes and lowercases the bundle path', () => {
    expect(internalSpriteAssetKey('Archimate/Interface.SVG')).toBe('sprite:archimate/interface.svg');
  });

  it('uses the documented prefix', () => {
    expect(INTERNAL_SPRITE_ASSET_PREFIX).toBe('sprite:');
    expect(internalSpriteAssetKey('archimate/interface.svg')).toBe(
      INTERNAL_SPRITE_ASSET_PREFIX + 'archimate/interface.svg',
    );
  });
});

describe('internalSpriteStoreFrom', () => {
  it('resolves an extension-less name through the .svg probe (fromInternal step 1)', () => {
    const sprite = internalSpriteStoreFrom(svgStore('archimate/interface.svg')).get('archimate/interface');
    expect(sprite).toBeDefined();
    // viewBox "0 0 19.995 19.928" -> Math.ceil each -> 20 x 20 (UImageSvg.java:118-143).
    expect(sprite!.width).toBe(20);
    expect(sprite!.height).toBe(20);
    expect(isSpriteSvg(sprite)).toBe(true);
  });

  it('carries the verbatim SVG source through to the sprite', () => {
    const sprite = internalSpriteStoreFrom(svgStore('archimate/interface.svg')).get('archimate/interface');
    expect(isSpriteSvg(sprite) && sprite.svg).toBe(ARCHIMATE_SVG);
  });

  it('measures the drawn-ink box, not just the declared canvas', () => {
    const sprite = internalSpriteStoreFrom(svgStore('archimate/interface.svg')).get('archimate/interface');
    expect(isSpriteSvg(sprite) && sprite.inkWidth).toBe(16);
    expect(isSpriteSvg(sprite) && sprite.inkX).toBe(2);
  });

  it('matches names case-insensitively, as the key scheme is lowercase', () => {
    const sprite = internalSpriteStoreFrom(svgStore('archimate/interface.svg')).get('Archimate/Interface');
    expect(sprite?.width).toBe(20);
  });

  it('returns undefined for a name absent from the bundle', () => {
    expect(internalSpriteStoreFrom(svgStore('archimate/interface.svg')).get('archimate/nope')).toBeUndefined();
  });

  it('returns undefined when the name already carries an extension (java:103-104)', () => {
    const store = internalSpriteStoreFrom(svgStore('archimate/interface.svg'));
    expect(store.get('archimate/interface.svg')).toBeUndefined();
    expect(store.get('archimate/interface.png')).toBeUndefined();
  });

  it('returns undefined for an SVG payload with neither viewBox nor width/height', () => {
    const store = internalSpriteStoreFrom(svgStore('archimate/broken.svg', '<svg><path d="M0,0"/></svg>'));
    expect(store.get('archimate/broken')).toBeUndefined();
  });

  it('memoizes: a second lookup returns the identical instance', () => {
    const store = internalSpriteStoreFrom(svgStore('archimate/interface.svg'));
    expect(store.get('archimate/interface')).toBe(store.get('archimate/interface'));
  });

  it('memoizes misses too — the asset store is consulted once per name', () => {
    let gets = 0;
    const inner = svgStore('archimate/interface.svg');
    const counting: AssetStore = {
      get: (key) => {
        gets += 1;
        return inner.get(key);
      },
      has: (key) => inner.has(key),
    };
    const store = internalSpriteStoreFrom(counting);
    store.get('archimate/absent');
    store.get('archimate/absent');
    expect(gets).toBe(2); // one .svg probe + one .png probe, for the FIRST call only
  });

  it('falls back to the .png probe when no .svg exists (fromInternal step 2)', () => {
    const store = internalSpriteStoreFrom(
      storeOf({
        [internalSpriteAssetKey('archimate/access.png')]: { bytes: PNG_1X1, mimeType: 'image/png' },
      }),
    );
    const sprite = store.get('archimate/access');
    // `new SpriteImage(SImageIO.read(is))` (java:113-115): UImage#getWidth() = 1 - 1.
    expect(sprite).toBeInstanceOf(SpriteImage);
    expect([sprite?.width, sprite?.height]).toEqual([0, 0]);
  });

  it('prefers the .svg over the .png when both exist (java:107-113 probe order)', () => {
    const store = internalSpriteStoreFrom(
      storeOf({
        [internalSpriteAssetKey('archimate/junction.svg')]: {
          bytes: encoder.encode(ARCHIMATE_SVG),
          mimeType: 'image/svg+xml',
        },
        [internalSpriteAssetKey('archimate/junction.png')]: { bytes: PNG_1X1, mimeType: 'image/png' },
      }),
    );
    expect(store.get('archimate/junction')?.width).toBe(20);
  });

  it('returns undefined for a PNG payload too short to hold an IHDR', () => {
    const store = internalSpriteStoreFrom(
      storeOf({
        [internalSpriteAssetKey('archimate/bad.png')]: {
          bytes: new Uint8Array([1, 2, 3]),
          mimeType: 'image/png',
        },
      }),
    );
    expect(store.get('archimate/bad')).toBeUndefined();
  });

  it('returns undefined for a long payload with the wrong PNG signature', () => {
    const notPng = new Uint8Array(PNG_1X1);
    notPng[1] = 0x00;
    const store = internalSpriteStoreFrom(
      storeOf({
        [internalSpriteAssetKey('archimate/bad.png')]: { bytes: notPng, mimeType: 'image/png' },
      }),
    );
    expect(store.get('archimate/bad')).toBeUndefined();
  });

  it('returns undefined for a PNG declaring a zero dimension', () => {
    const zeroWide = new Uint8Array(PNG_1X1);
    zeroWide[19] = 0; // IHDR width -> 0
    const store = internalSpriteStoreFrom(
      storeOf({
        [internalSpriteAssetKey('archimate/bad.png')]: { bytes: zeroWide, mimeType: 'image/png' },
      }),
    );
    expect(store.get('archimate/bad')).toBeUndefined();
  });
});

describe('matchJarSpriteLine', () => {
  it('matches the CommandSpriteFile jar: form', () => {
    expect(matchJarSpriteLine('sprite $bFunction jar:archimate/business-function')).toEqual({
      name: 'bFunction',
      path: 'archimate/business-function',
    });
  });

  it('accepts the form without the leading $ and is case-insensitive on the keyword', () => {
    expect(matchJarSpriteLine('SPRITE aComponent JAR:archimate/application-component')).toEqual({
      name: 'aComponent',
      path: 'archimate/application-component',
    });
  });

  it('tolerates trailing whitespace, which the parser trims before dispatch', () => {
    expect(matchJarSpriteLine('sprite $x jar:archimate/node  '.trim())?.path).toBe('archimate/node');
  });

  it('rejects the FILE characters upstream excludes (`<>%g#`)', () => {
    expect(matchJarSpriteLine('sprite $x jar:archi#mate/node')).toBeUndefined();
    expect(matchJarSpriteLine('sprite $x jar:<archimate/node>')).toBeUndefined();
  });

  it('does not match the inline SVG or encoded sprite forms', () => {
    expect(matchJarSpriteLine('sprite $x <svg width="4" height="4"></svg>')).toBeUndefined();
    expect(matchJarSpriteLine('sprite $x [16x16/8z] ABCDEF')).toBeUndefined();
    expect(matchJarSpriteLine('sprite $x {')).toBeUndefined();
  });

  it('does not match a non-jar file path (needs I/O — out of a browser-safe port)', () => {
    expect(matchJarSpriteLine('sprite $x /tmp/icon.svg')).toBeUndefined();
  });

  it('rejects a whitespace-only bundle path — it could never resolve', () => {
    expect(matchJarSpriteLine('sprite $x jar:   ')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// `SImageIO.read(is)` (SpriteImage.java:113-115) -> `PortableImage#getRGB`
// ---------------------------------------------------------------------------

/** Java `int` ARGB. */
function argb(a: number, r: number, g: number, b: number): number {
  return (a << 24) | (r << 16) | (g << 8) | b | 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  const typed = new Uint8Array([...type].map((c) => c.charCodeAt(0)));
  out.set(typed, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(new Uint8Array([...typed, ...data])));
  return out;
}

interface PngSpec {
  readonly width: number;
  readonly height: number;
  readonly bitDepth: number;
  readonly colorType: number;
  readonly interlace?: number;
  /** Filter byte + filtered scanline, per row, already concatenated. */
  readonly scanlines: Uint8Array;
  readonly extra?: readonly Uint8Array[];
  readonly zlib?: Uint8Array;
}

/** A PNG assembled chunk by chunk (ISO/IEC 15948 §5), compressed with node:zlib. */
function pngOf(spec: PngSpec): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, spec.width);
  view.setUint32(4, spec.height);
  ihdr.set([spec.bitDepth, spec.colorType, 0, 0, spec.interlace ?? 0], 8);
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    ...(spec.extra ?? []),
    chunk('IDAT', spec.zlib ?? new Uint8Array(deflateSync(spec.scanlines))),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Encodes `rows` (raw bytes per row) with one filter type per row (§9.2). */
function filtered(rows: readonly number[][], filters: readonly number[], bpp: number): Uint8Array {
  const out: number[] = [];
  rows.forEach((row, y) => {
    const prev = y === 0 ? row.map(() => 0) : rows[y - 1]!;
    const type = filters[y]!;
    out.push(type);
    row.forEach((x, i) => {
      const a = i >= bpp ? row[i - bpp]! : 0;
      const b = prev[i]!;
      const c = i >= bpp ? prev[i - bpp]! : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][type]!;
      out.push((x - predictor) & 0xff);
    });
  });
  return new Uint8Array(out);
}

function vendored(name: string): Uint8Array {
  const payload = buildSpriteAssetsStore().get(internalSpriteAssetKey(`archimate/${name}.png`));
  if (payload === undefined) throw new Error(`no vendored ${name}.png`);
  return payload.bytes;
}

describe('readPng (SImageIO.read stand-in)', () => {
  it('decodes the vendored 8-bit RGBA access.png: 15 opaque black, 241 clear pixels', () => {
    const image = readPng(vendored('access'));
    expect([image?.width, image?.height]).toEqual([16, 16]);
    const values = Array.from(image!.argb);
    expect(values.filter((v) => v === argb(255, 0, 0, 0))).toHaveLength(15);
    expect(values.filter((v) => v === 0)).toHaveLength(241);
  });

  it('decodes the vendored 1-bit palette assignment.png through PLTE + tRNS', () => {
    const image = readPng(vendored('assignment'))!;
    const values = Array.from(image.argb);
    expect(values.filter((v) => v === argb(255, 0, 0, 0))).toHaveLength(56);
    expect(values.filter((v) => v === argb(0, 255, 255, 255))).toHaveLength(200);
    expect(image.argb[1 * 16 + 10]).toBe(argb(255, 0, 0, 0));
    expect(image.argb[0]).toBe(argb(0, 255, 255, 255));
  });

  it('resolves every vendored archimate PNG to a 15x15-measuring SpriteImage', () => {
    const store = internalSpriteStoreFrom(buildSpriteAssetsStore());
    const pngs = ARCHIMATE_SPRITE_NAMES.filter((n) => n.format === 'png');
    expect(pngs).toHaveLength(23);
    for (const { folder, name } of pngs) {
      const sprite = store.get(`${folder}/${name}`);
      expect(sprite, name).toBeInstanceOf(SpriteImage);
      expect([sprite?.width, sprite?.height], name).toEqual([15, 15]);
    }
  });

  it('round-trips the port encoder (RGBA, filter 0)', () => {
    const rgba = new Uint8Array([1, 2, 3, 4, 250, 251, 252, 253, 9, 8, 7, 0, 0, 0, 0, 255, 10, 20, 30, 40, 5, 6, 7, 8]);
    const image = readPng(encodePng(rgba, 3, 2))!;
    expect(Array.from(image.argb)).toEqual([
      argb(4, 1, 2, 3),
      argb(253, 250, 251, 252),
      argb(0, 9, 8, 7),
      argb(255, 0, 0, 0),
      argb(40, 10, 20, 30),
      argb(8, 5, 6, 7),
    ]);
  });

  it('reverses all five scanline filters (sub, up, average, paeth)', () => {
    const rows = [
      [10, 20, 30, 255, 40, 50, 60, 128],
      [200, 100, 50, 25, 1, 2, 3, 4],
      [7, 77, 177, 255, 255, 0, 128, 64],
      [90, 80, 70, 60, 50, 40, 30, 20],
      [11, 22, 33, 44, 55, 66, 77, 88],
    ];
    const bytes = pngOf({
      width: 2,
      height: 5,
      bitDepth: 8,
      colorType: 6,
      scanlines: filtered(rows, [0, 1, 2, 3, 4], 4),
    });
    const image = readPng(bytes)!;
    expect(Array.from(image.argb)).toEqual(
      rows.flatMap((r) => [argb(r[3]!, r[0]!, r[1]!, r[2]!), argb(r[7]!, r[4]!, r[5]!, r[6]!)]),
    );
  });

  it('unpacks 2- and 4-bit palette indices, MSB first; entries past tRNS are opaque', () => {
    const plte = chunk('PLTE', new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 9, 9, 9]));
    const trns = chunk('tRNS', new Uint8Array([0x40]));
    const two = readPng(
      pngOf({
        width: 4,
        height: 1,
        bitDepth: 2,
        colorType: 3,
        scanlines: new Uint8Array([0, 0b00011011]),
        extra: [plte, trns],
      }),
    )!;
    expect(Array.from(two.argb)).toEqual([
      argb(0x40, 255, 0, 0),
      argb(255, 0, 255, 0),
      argb(255, 0, 0, 255),
      argb(255, 9, 9, 9),
    ]);
    const four = readPng(
      pngOf({
        width: 3,
        height: 1,
        bitDepth: 4,
        colorType: 3,
        scanlines: new Uint8Array([0, 0x21, 0x30]),
        extra: [plte],
      }),
    )!;
    expect(Array.from(four.argb)).toEqual([argb(255, 0, 0, 255), argb(255, 0, 255, 0), argb(255, 9, 9, 9)]);
    const eight = readPng(
      pngOf({ width: 1, height: 1, bitDepth: 8, colorType: 3, scanlines: new Uint8Array([0, 2]), extra: [plte] }),
    )!;
    expect(Array.from(eight.argb)).toEqual([argb(255, 0, 0, 255)]);
  });

  it.each([
    [
      'a palette index past PLTE',
      { width: 1, height: 1, bitDepth: 8, colorType: 3, scanlines: new Uint8Array([0, 5]) },
    ],
    [
      'a greyscale image (colour type 0)',
      { width: 1, height: 1, bitDepth: 8, colorType: 0, scanlines: new Uint8Array([0, 5]) },
    ],
    ['a 16-bit RGBA image', { width: 1, height: 1, bitDepth: 16, colorType: 6, scanlines: new Uint8Array(9) }],
    [
      'an Adam7-interlaced image',
      { width: 1, height: 1, bitDepth: 8, colorType: 6, interlace: 1, scanlines: new Uint8Array(5) },
    ],
    ['a short IDAT stream', { width: 2, height: 2, bitDepth: 8, colorType: 6, scanlines: new Uint8Array(5) }],
    [
      'an unknown filter type',
      { width: 1, height: 1, bitDepth: 8, colorType: 6, scanlines: new Uint8Array([5, 0, 0, 0, 0]) },
    ],
    [
      'a preset-dictionary zlib header',
      {
        width: 1,
        height: 1,
        bitDepth: 8,
        colorType: 6,
        scanlines: new Uint8Array(5),
        zlib: new Uint8Array([0x78, 0xbb, 0, 0]),
      },
    ],
    [
      'a non-deflate zlib method',
      {
        width: 1,
        height: 1,
        bitDepth: 8,
        colorType: 6,
        scanlines: new Uint8Array(5),
        zlib: new Uint8Array([0x77, 0x01, 0, 0]),
      },
    ],
    [
      'a corrupt deflate stream',
      {
        width: 1,
        height: 1,
        bitDepth: 8,
        colorType: 6,
        scanlines: new Uint8Array(5),
        zlib: new Uint8Array([0x78, 0x9c, 0xff, 0xff, 0xff]),
      },
    ],
  ] satisfies [string, PngSpec][])('declines %s (fromInternal logs and returns null, java:118-121)', (_label, spec) => {
    expect(readPng(pngOf(spec))).toBeUndefined();
  });

  it('declines a PNG with no IDAT chunk', () => {
    const noData = pngOf({ width: 1, height: 1, bitDepth: 8, colorType: 6, scanlines: new Uint8Array(5) });
    // Drop the IDAT: signature (8) + IHDR (25), then IEND.
    const idatLength = new DataView(noData.buffer).getUint32(33);
    const stripped = new Uint8Array([...noData.subarray(0, 33), ...noData.subarray(33 + 12 + idatLength)]);
    expect(readPng(stripped)).toBeUndefined();
  });

  it('declines a truncated chunk list', () => {
    expect(readPng(vendored('access').subarray(0, 40))).toBeUndefined();
  });
});
