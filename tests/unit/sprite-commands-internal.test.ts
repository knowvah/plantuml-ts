/**
 * F4-a — `getSprite`'s internal-bundle fallback (`SkinParam.java:801-807`)
 * and `matchSpriteCommand`'s `jar:` definition form
 * (`CommandSpriteFile.java:108-112`).
 *
 * Kept out of `tests/unit/sprite-commands.test.ts` so the two files stay
 * separately ownable while this mission's batch runs in parallel.
 */

import { describe, it, expect } from 'vitest';

import type { AssetStore } from '../../src/core/asset-store.js';
import { internalSpriteAssetKey, internalSpriteStoreFrom } from '../../src/core/internal-sprite-store.js';
import type { InternalSpriteStore } from '../../src/core/internal-sprite-store.js';
import {
  addSprite,
  createSpriteRegistry,
  getSprite,
  matchSpriteCommand,
  surfaceSpriteWarnings,
} from '../../src/core/sprite-commands.js';
import { SpriteSvg, isSpriteSvg } from '../../src/core/klimt/sprite/SpriteSvg.js';

const ARCHIMATE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="19.995mm" height="19.928mm" ' +
  'viewBox="0 0 19.995 19.928"><path d="M 2,2 L 18,2 L 18,18 L 2,18 Z"/></svg>';

function bundleWith(...paths: readonly string[]): InternalSpriteStore {
  const bytes = new TextEncoder().encode(ARCHIMATE_SVG);
  const entries = new Map(paths.map((p) => [internalSpriteAssetKey(p + '.svg'), { bytes, mimeType: 'image/svg+xml' }]));
  const assets: AssetStore = {
    get: (key) => entries.get(key),
    has: (key) => entries.has(key),
  };
  return internalSpriteStoreFrom(assets);
}

describe('getSprite — internal-bundle fallback', () => {
  it('returns undefined with no internal store, exactly as before (default browser path)', () => {
    expect(getSprite(createSpriteRegistry(), 'archimate/interface')).toBeUndefined();
  });

  it('resolves a jar-internal name through a registry-carried store', () => {
    const registry = createSpriteRegistry(bundleWith('archimate/interface'));
    const sprite = getSprite(registry, 'archimate/interface');
    expect(sprite?.width).toBe(20);
    expect(sprite?.height).toBe(20);
  });

  it('resolves through an explicitly passed store when the registry carries none', () => {
    const sprite = getSprite(createSpriteRegistry(), 'archimate/interface', bundleWith('archimate/interface'));
    expect(sprite?.width).toBe(20);
  });

  it('prefers the per-diagram registry over the internal bundle (java:803-805 order)', () => {
    const registry = createSpriteRegistry(bundleWith('archimate/interface'));
    addSprite(registry, 'archimate/interface', SpriteSvg.from('<svg viewBox="0 0 7 9"></svg>')!);
    expect(getSprite(registry, 'archimate/interface')?.width).toBe(7);
  });

  it('still misses on a name absent from both channels', () => {
    expect(getSprite(createSpriteRegistry(bundleWith('archimate/interface')), 'archimate/nope')).toBeUndefined();
  });
});

describe('matchSpriteCommand — the jar: definition form', () => {
  it('registers the resolved sprite under the command NAME, not the bundle path', () => {
    const registry = createSpriteRegistry(bundleWith('archimate/business-function'));
    const result = matchSpriteCommand(['sprite $bFunction jar:archimate/business-function'], 0, registry);
    expect(result).toEqual({ consumed: 1 });
    const sprite = getSprite(registry, 'bFunction');
    expect(sprite?.width).toBe(20);
    expect(isSpriteSvg(sprite) && sprite.svg).toBe(ARCHIMATE_SVG);
  });

  it('consumes the line and records a warning when the bundle path is unknown', () => {
    const registry = createSpriteRegistry(bundleWith('archimate/interface'));
    expect(matchSpriteCommand(['sprite $x jar:archimate/absent'], 0, registry)).toEqual({ consumed: 1 });
    expect(getSprite(registry, 'x')).toBeUndefined();
    expect(registry.unresolved).toEqual(['No such internal sprite: archimate/absent (sprite $x)']);
  });

  it('records the same warning when no internal bundle is wired at all', () => {
    const registry = createSpriteRegistry();
    expect(matchSpriteCommand(['sprite $x jar:archimate/interface'], 0, registry)).toEqual({ consumed: 1 });
    expect(registry.unresolved).toHaveLength(1);
  });

  it('surfaces the unresolved warning through onWarning', () => {
    const registry = createSpriteRegistry();
    matchSpriteCommand(['sprite $x jar:archimate/absent'], 0, registry);
    const seen: string[] = [];
    surfaceSpriteWarnings({ sprites: registry }, (m) => seen.push(m));
    expect(seen).toEqual(['No such internal sprite: archimate/absent (sprite $x)']);
  });

  it('leaves the inline SVG form untouched', () => {
    const registry = createSpriteRegistry(bundleWith('archimate/interface'));
    matchSpriteCommand(['sprite $inline <svg viewBox="0 0 5 6"></svg>'], 0, registry);
    expect(getSprite(registry, 'inline')?.width).toBe(5);
    expect(registry.unresolved).toEqual([]);
  });

  it('does not match a non-jar file path (unportable I/O form)', () => {
    const registry = createSpriteRegistry();
    expect(matchSpriteCommand(['sprite $x /tmp/icon.svg'], 0, registry)).toBeNull();
  });
});
