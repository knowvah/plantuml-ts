/**
 * ADR-2's asset store seam (`plans/s1l-tail-fix/decisions.md`) — the
 * synchronous, pre-fillable channel for vendored binary/text asset payloads
 * (the jar-internal `/sprites/**` bundle, F4-a; Twemoji artwork, F4-b).
 *
 * Mirrors the `includeStore` (sync, `src/core/include-resolver.ts`) /
 * `stdlibRegistry` (async, `src/core/tim/StdlibRegistry.ts`) pair already on
 * `RenderOptions`: `renderSync` cannot `await` a dynamic `import()`, and the
 * size-conformance measurement harness
 * (`scripts/measure-description-size-deltas.ts`) renders exclusively through
 * `renderSync` with a pre-built store — a lazy-only asset channel would leave
 * F4-a's and F4-b's own fixtures permanently unmeasurable by the mission's
 * own gate.
 *
 * This module fixes the SHAPE and the sync CONTRACT only. It does not define
 * a key scheme (sprite paths and emoji codepoints look nothing alike — F4-a
 * and F4-b each layer their own convention on top, the same way
 * `StdlibStore.ts#stdlibStore` layers `<bundle/thing>` resolution on top of
 * the generic `IncludeStore` shape) and it carries zero vendored bytes
 * (ADR-9(b) — the default bundle must not grow from this task).
 *
 * @see src/core/tim/StdlibStore.ts — the sync/async pairing precedent this
 *      module mirrors (`withStdlib`'s composition shape -> `combineAssetStores`).
 * @see src/core/include-resolver.ts — the other sync/async pair `RenderOptions`
 *      already documents (`includeStore` / `stdlibRegistry`).
 */

/**
 * One resolved vendored asset (a sprite SVG/PNG, a Twemoji artwork file).
 * Binary-safe: `bytes` covers both text formats (SVG) and binary ones (PNG)
 * without a second payload shape.
 */
export interface AssetPayload {
  readonly bytes: Uint8Array;
  readonly mimeType: string; // e.g. 'image/svg+xml', 'image/png'
}

/**
 * Synchronous asset resolution — the render path calls this without
 * awaiting, exactly like `IncludeStore.get`. A miss returns `undefined`,
 * never throws: the caller degrades to its own existing fallback (a literal
 * `«label»` for an unresolved sprite stereotype, a platform-glyph `UText`
 * for an unresolved emoji).
 *
 * F4-a and F4-b each own their own key scheme; this interface only fixes the
 * shape and the sync contract, not what a key looks like.
 */
export interface AssetStore {
  get(key: string): AssetPayload | undefined;
  has(key: string): boolean;
}

/**
 * Combines any number of {@link AssetStore}s into one, first-match-wins —
 * mirrors `withStdlib`'s composition shape (`StdlibStore.ts`) so a host can
 * layer a sprite store and an emoji store under one `options.assetStore`
 * value.
 */
export function combineAssetStores(...stores: readonly AssetStore[]): AssetStore {
  return {
    get: (key: string): AssetPayload | undefined => {
      for (const store of stores) {
        const payload = store.get(key);
        if (payload !== undefined) return payload;
      }
      return undefined;
    },
    has: (key: string): boolean => stores.some((store) => store.has(key)),
  };
}
