# T3 — Per-resource routing inside the transitive walk

## Context

See [ADR-2](../decisions.md#adr-2) and [batch-3/overview.md](overview.md#the-shape-of-the-change).

SI8's `stdlibContentFor(registry, stdlibPath)` resolves a stdlib target by
materialising every `BundleData` in the alias chain and asking `stdlibStore` for
one file. For a remote bundle that is exactly wrong: it would mean fetching
6,849 resources to serve one.

## Task

In `src/core/include-resolver.ts`:

1. Rework `stdlibContentFor` so, after `bundlesFor` has walked the alias chain
   to the bundle that actually holds the file, it asks the registry for **that
   one resource** via `resolveResource(bundleName, fileKey)`.
2. Derive `fileKey` the same way `StdlibStore#resolvePumlResource` does —
   lowercase, strip every `.puml`, split on the FIRST `/`, the remainder is the
   key. **Do not reimplement that transform loosely**: `<awslib14/Storage/SimpleStorageService>`
   must produce key `storage/simplestorageservice`, and the multi-slash
   remainder is preserved verbatim. Reuse or extract from `StdlibStore.ts`
   rather than writing a second copy — two answers to that question is how the
   port drifts from the jar.
3. Keep the alias chain working: `bundlesFor` already walks it via `resolve()`,
   which ADR-2 keeps returning correct `name`/`aliasOf` for remote bundles.
4. Fetched text must re-enter the walk exactly as SI8's T3 arranged — a tupadr3
   icon `!include <tupadr3/common>`, and that must resolve.

Do **not** make the walk concurrent in this task. That is T4, deliberately
separate.

## Write-set — write NOTHING outside these

- `src/core/include-resolver.ts` (modify)
- `tests/unit/stdlib-remote-prefetch.test.ts` (create)

## Read-set

- `src/core/include-resolver.ts` — `stdlibContentFor`, `bundlesFor`,
  `prefetchInner`'s stdlib branch and its three-channel comment,
  `PrefetchWalk`. **Line numbers drift — follow the code.**
- `src/core/tim/StdlibStore.ts` — `resolvePumlResource`'s
  lowercase/strip/split/alias pipeline, mirroring `Stdlib.java:98-114`. This is
  the key transform that must not be duplicated loosely.
- `src/core/tim/StdlibRegistry.ts` — T2's `resolveResource`
- `tests/unit/stdlib-registry-prefetch.test.ts` — SI8's existing walk tests;
  they are the post-SI8 contract this task must not move
- [`../decisions.md#adr-2`](../decisions.md#adr-2)

## Architecture decisions (locked)

- [ADR-2](../decisions.md#adr-2) — resolve one resource; alias logic stays in
  `StdlibStore#resolveBundle`
- [ADR-6](../decisions.md#adr-6) — per-resource granularity is the point; do not
  add a "fetch the whole bundle if it's small" heuristic

## Interface contract

None produced. `prefetchIncludes`' signature is unchanged; only the registry
channel's implementation moves.

## Acceptance criteria

1. Given a remote registry and a source naming `<tupadr3/font-awesome-5/ban>`,
   when prefetched, then **exactly one** resource is fetched — assert the
   fetcher's call count and the requested key, not just that it rendered.
2. Given fetched text containing `!include <tupadr3/common>`, when prefetched,
   then that nested target is ALSO resolved and stored (SI8 ADR-4's transitive
   walk still applies to remote content).
3. Given no registry, or an EAGER registry, when prefetched, then behavior is
   identical to post-SI8 — assert against the existing
   `stdlib-registry-prefetch.test.ts` expectations, which must all still pass.
4. Given a key absent from the manifest, then the failure names the bundle and
   the key, and **no network request is made** for it.
5. Given `<awslib14/Storage/SimpleStorageService>`, then the derived key is
   `storage/simplestorageservice` — the multi-slash remainder preserved, case
   folded — matching `StdlibStore`'s existing semantics.
6. Given a bundle that includes itself, then `CircularIncludeError` still fires.

## Quality bar

All four gates exit 0. 389 goldens byte-identical; ratchet's 54 zero-diff;
size-deltas 320/351 widened 0.

Criterion 3 is the regression guard for every existing consumer of the async
API — assert it explicitly rather than assuming a changed internal is inert.

## Observability

The three failure modes must stay distinguishable through this layer: not
registered / not in bundle (`StdlibNotBundledError`), chunk failed
(`StdlibChunkLoadError`), resource fetch failed (`StdlibResourceFetchError`).
T7 owns the wording; T3 owns not destroying the distinction as errors pass
through the walk into `render()`'s `errorSvg`.

No metrics, traces or dashboards — browser library, no runtime.

## Rollback

**Reversible** — revert the commit. No generated state, no migration.

## Boundaries

**Always:** keep the exact-key and `getPumlResource` channels winning ahead of
the registry, in that order — SI8 established it and a store's own copy must
keep beating a remote one.

**Never:** duplicate `Stdlib.java`'s key transform; reuse it. Never import a
Node built-in into `src/`. Never make `renderSync` async.

## Method rules

1. **Trace dependency cascades TWO levels.** `stdlibContentFor` ← `prefetchInner`
   ← `prefetchIncludes` ← `render`/`renderAll`/`prepareIncludeStore`. SI8's T1
   was incomplete because the second consumer of the store was not traced.
2. **Verify the "nested include still resolves" claim against a REAL bundle
   file**, not against the design — `assets/stdlib/tupadr3/` is right there and
   its icons really do include `<tupadr3/common>`.

## Commit

One commit: `feat(T3): fetch individual stdlib resources during prefetch`
