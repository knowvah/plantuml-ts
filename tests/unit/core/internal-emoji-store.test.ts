/**
 * `internalEmojiStoreFrom` — the Twemoji-artwork half of `<:name:>` emoji
 * rendering, memoized per store instance (hits AND misses).
 *
 * @see src/core/internal-emoji-store.ts
 */

import { describe, it, expect } from 'vitest';

import type { AssetStore, AssetPayload } from '../../../src/core/asset-store.js';
import {
  INTERNAL_EMOJI_ASSET_PREFIX,
  internalEmojiAssetKey,
  internalEmojiStoreFrom,
} from '../../../src/core/internal-emoji-store.js';

const encoder = new TextEncoder();
const ROCKET_SVG = '<path d="M0,0 L1,1"/>';

function storeOf(entries: Readonly<Record<string, AssetPayload>>): AssetStore {
  return {
    get: (key) => entries[key],
    has: (key) => key in entries,
  };
}

function countingStore(inner: AssetStore): { store: AssetStore; getCalls: () => number } {
  let calls = 0;
  return {
    store: {
      get: (key) => {
        calls += 1;
        return inner.get(key);
      },
      has: (key) => inner.has(key),
    },
    getCalls: () => calls,
  };
}

describe('internalEmojiAssetKey', () => {
  it('prefixes and lowercases the codepoint', () => {
    expect(internalEmojiAssetKey('1F680')).toBe('emoji:1f680.svg');
  });

  it('uses the documented prefix', () => {
    expect(INTERNAL_EMOJI_ASSET_PREFIX).toBe('emoji:');
  });
});

describe('internalEmojiStoreFrom', () => {
  it('a hit decodes and returns the artwork bytes as text', () => {
    const store = internalEmojiStoreFrom(
      storeOf({ [internalEmojiAssetKey('1f680')]: { bytes: encoder.encode(ROCKET_SVG), mimeType: 'image/svg+xml' } }),
    );
    expect(store.get('1f680')).toBe(ROCKET_SVG);
  });

  it('a miss returns undefined rather than throwing', () => {
    const store = internalEmojiStoreFrom(storeOf({}));
    expect(store.get('1f680')).toBeUndefined();
  });

  it('normalizes the codepoint case before lookup', () => {
    const store = internalEmojiStoreFrom(
      storeOf({ [internalEmojiAssetKey('1f680')]: { bytes: encoder.encode(ROCKET_SVG), mimeType: 'image/svg+xml' } }),
    );
    expect(store.get('1F680')).toBe(ROCKET_SVG);
  });

  it('caches a hit: the underlying store is consulted once for repeated lookups', () => {
    const inner = storeOf({
      [internalEmojiAssetKey('1f680')]: { bytes: encoder.encode(ROCKET_SVG), mimeType: 'image/svg+xml' },
    });
    const { store: counting, getCalls } = countingStore(inner);
    const store = internalEmojiStoreFrom(counting);

    expect(store.get('1f680')).toBe(ROCKET_SVG);
    expect(store.get('1f680')).toBe(ROCKET_SVG);
    // A differently-cased request for the SAME codepoint hits the same
    // normalized cache key, so it must not re-consult the underlying store.
    expect(store.get('1F680')).toBe(ROCKET_SVG);
    expect(getCalls()).toBe(1);
  });

  it('caches a miss too: the underlying store is consulted once for repeated misses', () => {
    const { store: counting, getCalls } = countingStore(storeOf({}));
    const store = internalEmojiStoreFrom(counting);

    expect(store.get('1f680')).toBeUndefined();
    expect(store.get('1f680')).toBeUndefined();
    expect(getCalls()).toBe(1);
  });
});
