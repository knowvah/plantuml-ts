/**
 * F4-a — `SpriteImage.fromInternal` port: the jar-internal `/sprites/**`
 * bundle reached through ADR-2's synchronous `RenderOptions.assetStore`.
 *
 * @see src/core/internal-sprite-store.ts
 */

import { describe, it, expect } from 'vitest';

import type { AssetStore, AssetPayload } from '../../src/core/asset-store.js';
import {
  INTERNAL_SPRITE_ASSET_PREFIX,
  internalSpriteAssetKey,
  internalSpriteStoreFrom,
  matchJarSpriteLine,
} from '../../src/core/internal-sprite-store.js';
import { isSpriteSvg } from '../../src/core/klimt/sprite/SpriteSvg.js';

const encoder = new TextEncoder();

/** The archimate canvas every vendored SVG declares — `19.995mm x 19.928mm`
 *  with a matching viewBox, so `UImageSvg#getData`'s viewBox branch wins and
 *  the `mm` units never need interpreting. */
const ARCHIMATE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="19.995mm" height="19.928mm" ' +
  'viewBox="0 0 19.995 19.928"><path d="M 2,2 L 18,2 L 18,18 L 2,18 Z"/></svg>';

const PNG_1X1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0,
]);

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
    expect(sprite).toEqual({ width: 1, height: 1 });
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
