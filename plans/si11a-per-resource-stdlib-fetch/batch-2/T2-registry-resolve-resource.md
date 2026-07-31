# T2 — The registry gains `resolveResource`

## Context

See [ADR-2](../decisions.md#adr-2). T1 built a `RemoteBundle` that can fetch one
resource. This task makes the registry able to hold one, without breaking the
contract SI8 published.

The tension ADR-2 resolves: `resolve(bundle): Promise<BundleData | undefined>`
cannot be honored remotely, because producing a `BundleData` means having
fetched all 6,849 files — the exact thing being removed.

## Task

In `src/core/tim/StdlibRegistry.ts`:

1. Teach `harvest` to recognise a `StdlibRemoteManifest`-shaped or
   `RemoteBundle`-shaped export alongside `BundleData`, keying it by `name`
   lowercased exactly as today.
2. Add `resolveResource(bundle, key): Promise<string | undefined>` to the
   `StdlibRegistry` interface:
   - remote bundle → delegate to `RemoteBundle#fetch(key)`
   - **eager `BundleData` → read `files[key]`**, so a caller has ONE code path
     regardless of how the bundle is registered. This is the point: T3 must not
     branch on remote-vs-eager.
3. `resolve(bundle)` keeps its exact signature. For a remote bundle it returns
   `asBundleData()` — correct `name`/`aliasOf`, empty `files`.

Do not duplicate alias resolution. `resolve()` returning correct `name`/`aliasOf`
is precisely what lets SI8's `bundlesFor` and `StdlibStore#resolveBundle` handle
alias chains unchanged, cycle guard included.

## Write-set — write NOTHING outside these

- `src/core/tim/StdlibRegistry.ts` (modify)
- `tests/unit/stdlib-registry.test.ts` (modify — extend T2-of-SI8's file)

Do NOT export from `src/index.ts` — T7 owns the public surface.

## Read-set

- `src/core/tim/StdlibRegistry.ts` — `harvest` and its doc comment explaining
  why keying is by the `name` FIELD, not the export identifier; `resolve`'s
  promise memoization
- `src/core/tim/StdlibRemote.ts` — T1's output; see
  [T1's interface contract](../batch-1/T1-stdlib-remote.md#interface-contract-consumed-by-t2-t3)
- `src/core/include-resolver.ts` — `bundlesFor` / `stdlibContentFor`, the alias
  walk that must keep working untouched
- `plans/si8-stdlib-registration/decision-journal.md` — the T2 rows recording
  why `harvest` keys by `name` and how alias chains resolve one link at a time

## Architecture decisions (locked)

- [ADR-2](../decisions.md#adr-2) — `resolve()` unchanged; add `resolveResource`
- [ADR-1](../decisions.md#adr-1) — registration stays an explicit thunk map

## Interface contract (consumed by T3)

```ts
export interface StdlibRegistry {
  resolve(bundle: string): Promise<BundleData | undefined>;          // unchanged
  resolveResource(bundle: string, key: string): Promise<string | undefined>;
}
```

`resolveResource` returns `undefined` for "not registered, or not in this
bundle" and **throws** for "registered but the chunk or the resource failed to
load" (`StdlibChunkLoadError` / `StdlibResourceFetchError`).

## Acceptance criteria

1. Given a registered REMOTE module, when `resolveResource(bundle, key)`, then
   it returns the fetched content.
2. Given a registered EAGER `BundleData`, when `resolveResource(bundle, key)`,
   then it returns `files[key]` — so the caller needs no remote-vs-eager branch.
3. Given a remote bundle, when `resolve(bundle)`, then it returns a `BundleData`
   with the correct `name`/`aliasOf` and empty `files`, and an alias chain
   through it resolves via the EXISTING `bundlesFor` with no change to that
   function.
4. Given a thunk that rejects, then `StdlibChunkLoadError` still fires and is
   distinguishable from `StdlibResourceFetchError`.
5. Given every existing test in `tests/unit/stdlib-registry.test.ts`, then all
   still pass unmodified — the eager path is untouched.

## Quality bar

All four gates exit 0. 389 goldens byte-identical; ratchet's 54 zero-diff;
size-deltas 320/351 widened 0.

Criterion 5 is the regression guard: SI8's registry tests are the pinned
contract, and this task extends that file rather than replacing its assertions.

## Observability

The error taxonomy must stay three-way distinguishable, and this task owns
keeping it so: bundle not registered (`undefined`), chunk failed
(`StdlibChunkLoadError`), resource failed (`StdlibResourceFetchError`). Each has
a different consumer action. Do not collapse them.

No metrics, traces or dashboards — browser library, no runtime.

## Rollback

**Reversible** — revert the commit. Additive method on an interface whose
existing members do not change.

## Boundaries

**Never:** change `resolve()`'s signature, `BundleData`, or duplicate alias
resolution into this module (`StdlibStore#resolveBundle` owns it, cycle guard
included). Never import a Node built-in into `src/`.

## Method rules

1. **Trace dependency cascades TWO levels.** `StdlibRegistry` is consumed by
   `include-resolver.ts#bundlesFor` and `#stdlibContentFor`, which are consumed
   by `prefetchInner` → `render`/`renderAll`. An added interface member is only
   inert if you have checked every implementer.
2. **Verify the "alias chains still work" claim against the CURRENT
   `bundlesFor`**, by test, not by reading.

## Commit

One commit: `feat(T2): resolve individual stdlib resources through the registry`
