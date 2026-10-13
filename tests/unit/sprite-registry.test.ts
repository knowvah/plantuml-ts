/**
 * Kind-specific registry lookups: `getSpriteMonochrome` hands the grey-grid
 * tint path only a real `SpriteMonochrome` (tinting anything else as a grey
 * grid threw `sprite.getGray is not a function`, ufp journal), and
 * `getSpriteImage` returns the internal store's PNG entries — `SpriteImage`s
 * (`internal-sprite-store.ts#probe`, SpriteImage.java:113-115).
 */
import { describe, expect, it } from 'vitest';
import { createSpriteRegistry, getSpriteImage, getSpriteMonochrome } from '../../src/core/sprite-registry.js';
import type { InternalSpriteStore } from '../../src/core/internal-sprite-store.js';
import { SpriteImage } from '../../src/core/klimt/sprite/SpriteImage.js';
import { SpriteMonochrome } from '../../src/core/klimt/sprite/SpriteMonochrome.js';

const PNG_SPRITE = new SpriteImage({ width: 16, height: 16, argb: new Int32Array(256) });
const internal: InternalSpriteStore = { get: (name) => (name === 'archimate/access' ? PNG_SPRITE : undefined) };

describe('getSpriteMonochrome', () => {
  it('declines an internal PNG sprite (pixels, no grey grid to tint)', () => {
    expect(getSpriteMonochrome(createSpriteRegistry(internal), 'archimate/access')).toBeUndefined();
  });

  it('returns a registered SpriteMonochrome', () => {
    const sprite = new SpriteMonochrome(2, 2, 16);
    const registry = createSpriteRegistry();
    registry.byName.set('foo', sprite);
    expect(getSpriteMonochrome(registry, 'foo')).toBe(sprite);
  });
});

describe('getSpriteImage', () => {
  it('returns the internal store PNG sprite after the registry misses (SkinParam.java:801-807)', () => {
    expect(getSpriteImage(createSpriteRegistry(internal), 'archimate/access')).toBe(PNG_SPRITE);
  });

  it('declines another sprite kind and an unknown name', () => {
    const registry = createSpriteRegistry(internal);
    registry.byName.set('foo', new SpriteMonochrome(2, 2, 16));
    expect(getSpriteImage(registry, 'foo')).toBeUndefined();
    expect(getSpriteImage(registry, 'archimate/nope')).toBeUndefined();
  });
});
