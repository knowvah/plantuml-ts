import { describe, it, expect } from 'vitest';
import { combineAssetStores } from '../../src/core/asset-store.js';
import type { AssetPayload, AssetStore } from '../../src/core/asset-store.js';

// ---------------------------------------------------------------------------
// ADR-2 (plans/s1l-tail-fix/decisions.md): the sync-fillable asset store
// seam F4-a (sprites) and F4-b (Twemoji artwork) both consume via
// options.assetStore. Nothing in src/ consumes it yet — this suite exercises
// the type/sync contract combineAssetStores promises those two tasks.
// ---------------------------------------------------------------------------

function payload(text: string, mimeType = 'image/svg+xml'): AssetPayload {
  return { bytes: new TextEncoder().encode(text), mimeType };
}

function stubStore(entries: Readonly<Record<string, AssetPayload>>): AssetStore {
  return {
    get: (key: string): AssetPayload | undefined => entries[key],
    has: (key: string): boolean => key in entries,
  };
}

describe('combineAssetStores', () => {
  it('resolves a key present in a single store', () => {
    const store = combineAssetStores(stubStore({ 'sprite/foo': payload('<svg/>') }));
    const result = store.get('sprite/foo');
    expect(result?.mimeType).toBe('image/svg+xml');
    expect(new TextDecoder().decode(result?.bytes)).toBe('<svg/>');
    expect(store.has('sprite/foo')).toBe(true);
  });

  it('is first-match-wins across multiple stores', () => {
    const first = stubStore({ shared: payload('first', 'image/svg+xml') });
    const second = stubStore({ shared: payload('second', 'image/png') });
    const store = combineAssetStores(first, second);
    expect(store.get('shared')?.mimeType).toBe('image/svg+xml');
    expect(new TextDecoder().decode(store.get('shared')?.bytes)).toBe('first');
  });

  it('falls through to a later store when an earlier one misses', () => {
    const first = stubStore({});
    const second = stubStore({ 'emoji/1f600': payload('grin', 'image/png') });
    const store = combineAssetStores(first, second);
    expect(store.get('emoji/1f600')?.mimeType).toBe('image/png');
    expect(store.has('emoji/1f600')).toBe(true);
  });

  it('returns undefined — never throws — on a key no store has', () => {
    const store = combineAssetStores(stubStore({ known: payload('x') }));
    expect(store.get('unknown')).toBeUndefined();
    expect(store.has('unknown')).toBe(false);
  });

  it('handles zero stores as an always-miss store', () => {
    const store = combineAssetStores();
    expect(store.get('anything')).toBeUndefined();
    expect(store.has('anything')).toBe(false);
  });

  it('is binary-safe: bytes round-trip for a non-UTF8-representable payload', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]); // PNG-ish magic + raw bytes
    const store = combineAssetStores(stubStore({ 'icon.png': { bytes, mimeType: 'image/png' } }));
    const result = store.get('icon.png');
    expect(result?.mimeType).toBe('image/png');
    expect(Array.from(result?.bytes ?? [])).toEqual([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
  });
});
