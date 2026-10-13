/**
 * `getSpriteMonochrome` hands the grey-grid tint path only a real
 * `SpriteMonochrome`: the internal store's PNG entries are dims-only
 * (`internal-sprite-store.ts#probe` -> `pngDimensions`), and tinting one as a
 * grey grid threw `sprite.getGray is not a function` (ufp journal).
 */
import { describe, expect, it } from 'vitest';
import { createSpriteRegistry, getSpriteMonochrome } from '../../src/core/sprite-registry.js';
import type { InternalSpriteStore } from '../../src/core/internal-sprite-store.js';
import { SpriteMonochrome } from '../../src/core/klimt/sprite/SpriteMonochrome.js';

describe('getSpriteMonochrome', () => {
  it('declines a dims-only internal PNG sprite (no grey grid to tint)', () => {
    const internal: InternalSpriteStore = { get: () => ({ width: 16, height: 16 }) };
    expect(getSpriteMonochrome(createSpriteRegistry(internal), 'archimate/access')).toBeUndefined();
  });

  it('returns a registered SpriteMonochrome', () => {
    const sprite = new SpriteMonochrome(2, 2, 16);
    const registry = createSpriteRegistry();
    registry.byName.set('foo', sprite);
    expect(getSpriteMonochrome(registry, 'foo')).toBe(sprite);
  });
});
