# T2 — Registry of dynamic-`import()` thunks

## Context

See [ADR-3](../decisions.md#adr-3). SI5b shipped `stdlibStore(...bundles)` —
eager, and built today only by `scripts/stdlib-assets-store.ts`, which imports
`node:fs`. A browser consumer needs to declare which packages back
`<bundle/thing>` and have each bundle load on first use.

This task builds the module **in isolation**. Nothing imports it yet; T3 wires
it in. Keeping integration out means its tests exercise the real caching and
error behavior rather than a render pipeline.

## Task

Create `src/core/tim/StdlibRegistry.ts`:

- `stdlibRegistry(entries)` — takes a map of bundle name → thunk returning a
  `Promise` of the bundle's module.
- `StdlibRegistry#resolve(bundle)` — returns the `BundleData` or `undefined`.
  Memoize the **promise**, not just the result, so concurrent resolves of the
  same bundle share one load.
- `StdlibChunkLoadError` — thrown when a thunk rejects, naming the bundle and
  preserving the underlying `cause`.

Accept both module shapes a generated package can produce: a named export
matching the bundle (`{ bootstrap }`, which is what
`packages/stdlib/generated/bootstrap.js` emits) and a `default` export. Reading
one generated file before designing the unwrap is worth the minute.

Bundle-name matching is **case-insensitive**, matching `stdlibStore`'s existing
`byName.set(bundle.name.toLowerCase(), …)`.

## Write-set — write NOTHING outside these

- `src/core/tim/StdlibRegistry.ts` (create)
- `tests/unit/stdlib-registry.test.ts` (create)

**Never colocate a test under `src/`** — `vitest.config.ts`'s `include` is
`['tests/**/*.test.ts']`, so a test under `src/` never runs. This bit an earlier
mission and three files had to be relocated.

Do NOT export from `src/index.ts` in this task — T4 owns the public surface.

## Read-set

- `src/core/tim/StdlibStore.ts` — `BundleData`, `stdlibStore`, `withStdlib`,
  and `resolveBundle`'s alias/cycle handling (the registry must not duplicate
  alias resolution; `stdlibStore` already owns it)
- `packages/stdlib/generated/bootstrap.js` (first ~5 lines) and
  `packages/stdlib/package.json` `exports` — the real module shape and subpath
- `src/core/tim/IncludeStore.ts` — `IncludeStore`, for the type T3 will bridge to

## Architecture decisions (locked)

- [ADR-3](../decisions.md#adr-3) — explicit thunk map. A computed specifier
  `` import(`…/${name}`) `` is **rejected**: bundlers cannot analyse it, so
  code-splitting silently stops working, which is the whole feature.
- [ADR-2](../decisions.md#adr-2) — granularity is **per-bundle**. Do not build
  per-resource loading; it is a separate tracked mission.

## Interface contract (consumed by T3)

```ts
export interface StdlibRegistry {
  /** Resolved BundleData, or undefined when `bundle` is not registered. */
  resolve(bundle: string): Promise<BundleData | undefined>;
}

export function stdlibRegistry(
  entries: Readonly<Record<string, () => Promise<unknown>>>,
): StdlibRegistry;

export class StdlibChunkLoadError extends Error {
  readonly bundle: string;
  readonly cause: unknown;
}
```

`resolve` returns `undefined` for "not registered" and **throws** for "registered
but failed to load". T3 depends on that distinction: one is a caller
configuration error, the other is a runtime/bundler failure, and ADR-5 requires
them to stay distinguishable.

## Acceptance criteria

1. Given a registered thunk, when `resolve('bootstrap')` is called twice, then
   the thunk is invoked exactly once and both calls return the same
   `BundleData`.
2. Given two concurrent `resolve()` calls for the same unloaded bundle, when
   both are awaited, then the thunk is invoked exactly once.
3. Given a name with no entry, when `resolve()` is called, then it returns
   `undefined` — it does not throw.
4. Given a thunk that rejects, when `resolve()` is called, then it throws
   `StdlibChunkLoadError` naming the bundle and preserving `cause`.
5. Given a module exporting the bundle as a named export, and another exporting
   it as `default`, then both resolve to the `BundleData`.
6. Given `resolve('BOOTSTRAP')` against an entry registered as `bootstrap`, then
   it resolves (case-insensitive, matching `stdlibStore`).

## Quality bar

All four gates exit 0. 389 goldens byte-identical; ratchet's 54 pass;
size-deltas 320/351 widened 0 (this task should not move any of them — it is a
new, unreferenced module).

Tests assert specific values and call counts, never truthiness.

## Observability

The error surface **is** this task's observability deliverable
([ADR-5](../decisions.md#adr-5) context): `StdlibChunkLoadError` must name the
bundle and preserve `cause`, because a chunk-load failure is a
bundler/CDN problem the consumer fixes differently from a missing registration.
Do not collapse the two into one error.

No metrics, traces or dashboards — browser library, no runtime.

## Rollback

**Reversible** — revert the commit. The module is unreferenced until T3.

## Boundaries

**Never:** import a Node built-in, touch `process.env`, or use `require()` —
this file ships to browsers. Never modify `stdlibStore` / `withStdlib` /
`BundleData`; the registry is additive (ADR-3). Never export from
`src/index.ts` here.

## Method rules

1. **Trace dependency cascades TWO levels** before choosing the module-unwrap
   shape — check what `scripts/build-stdlib-packages/` actually emits, not what
   a package's `exports` map implies.
2. **Verify any "it will just work" claim against the CURRENT generated
   output.** Read a real generated file.

## Commit

One commit: `feat(T2): add the lazy stdlib bundle registry`
