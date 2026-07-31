# T1 — `StdlibRemote.ts`: the fetch-backed bundle source

## Context

See [`../README.md`](../README.md) § "The numbers that shaped the design"
(verified 2026-07-31 — do not re-derive) and
[ADR-1](../decisions.md#adr-1) / [ADR-5](../decisions.md#adr-5) /
[ADR-7](../decisions.md#adr-7).

SI8 made a bundle load lazily as one chunk. `tupadr3` is 19.54 MB in one chunk.
This module is the piece that lets a bundle be described by a small manifest and
have its resources fetched individually.

Built **in isolation**: nothing imports it yet (T2 wires it in). Keeping
integration out means its tests exercise the real caching and error behavior
rather than a render pipeline.

## Task

Create `src/core/tim/StdlibRemote.ts`:

- `StdlibRemoteManifest` — the shape in
  [batch-1/overview.md](overview.md#the-manifest-shape-both-tasks-must-agree-on).
  **Exported and documented as hand-constructible** (ADR-7) — a third party
  hosting their own icon set must be able to write one by hand, with no
  generator and no `@plantuml-ts` package involved.
- `remoteStdlib({ manifest, baseUrl, fetcher? })` → a `RemoteBundle`:
  - `name`, `aliasOf` — read straight off the manifest
  - `has(key)` — manifest lookup, no network
  - `fetch(key)` — resolve `baseUrl` + the manifest's relative path, fetch,
    cache. Memoize the **promise**, not the result, so concurrent fetches of one
    key share a single request (mirroring `StdlibRegistry`'s existing pattern).
  - `asBundleData()` — `{ name, aliasOf, files: {} }`, for ADR-2's alias reuse
- `StdlibResourceFetchError` — thrown when the fetcher rejects. Names the
  bundle, the key **and the resolved URL**, and preserves `cause`.

Default the fetcher to `fetchInclude` (`../include-resolver.js`). Do NOT
reimplement fetching — reusing it is what gives CORS/CSP differentiation for
free (ADR-5).

Take care joining `baseUrl` and the relative path: exactly one `/` between them
regardless of whether `baseUrl` has a trailing slash.

## Write-set — write NOTHING outside these

- `src/core/tim/StdlibRemote.ts` (create)
- `tests/unit/stdlib-remote.test.ts` (create)

**Never colocate a test under `src/`** — `vitest.config.ts`'s `include` is
`['tests/**/*.test.ts']`, so a test under `src/` never runs.

Do NOT export from `src/index.ts` in this task — T7 owns the public surface.

## Read-set

- `src/core/tim/StdlibRegistry.ts` — the promise-memoization and
  drop-on-rejection pattern to mirror, and `StdlibChunkLoadError` as the model
  for a typed, actionable error
- `src/core/tim/StdlibStore.ts` — `BundleData`, for `asBundleData()`
- `src/core/include-resolver.ts` — `IncludeFetcher`, `fetchInclude`, and the
  `CspIncludeError` / `CorsIncludeError` this inherits
- [`../decisions.md#adr-5`](../decisions.md#adr-5), [`#adr-7`](../decisions.md#adr-7)

## Architecture decisions (locked)

- [ADR-5](../decisions.md#adr-5) — promise-memoized cache; injectable fetcher
- [ADR-7](../decisions.md#adr-7) — the manifest is PUBLIC and hand-constructible
- [ADR-3](../decisions.md#adr-3) — the manifest carries key→path; do not derive
  a path from a key

## Interface contract (consumed by T2, T3)

```ts
export interface StdlibRemoteManifest {
  readonly name: string;
  readonly aliasOf?: string | undefined;
  readonly files: Readonly<Record<string, string>>;
}

export interface RemoteBundle {
  readonly name: string;
  readonly aliasOf: string | undefined;
  has(key: string): boolean;
  fetch(key: string): Promise<string | undefined>;
  asBundleData(): BundleData;
}

export function remoteStdlib(options: {
  readonly manifest: StdlibRemoteManifest;
  readonly baseUrl: string;
  readonly fetcher?: IncludeFetcher | undefined;
}): RemoteBundle;

export class StdlibResourceFetchError extends Error {
  readonly bundle: string;
  readonly key: string;
  readonly url: string;
}
```

`fetch` returns `undefined` for "not in this bundle" and **throws** for "in the
bundle but could not be fetched". T3 depends on that distinction: one is a
caller/authoring error, the other is a deployment failure.

## Acceptance criteria

1. Given a manifest and a `baseUrl`, when `fetch(key)` is called, then it
   requests `baseUrl` + the manifest's relative path for that key and returns
   the content.
2. Given two concurrent `fetch()` calls for the same key, when both are awaited,
   then the fetcher is invoked exactly once.
3. Given a key absent from the manifest, when `fetch(key)` is called, then it
   returns `undefined` and **the fetcher is never invoked** (ADR-3's offline
   miss detection).
4. Given a fetcher that rejects, when `fetch(key)` is called, then
   `StdlibResourceFetchError` is thrown naming the bundle, the key and the
   resolved URL, with `cause` preserved — and a subsequent call retries rather
   than replaying a cached rejection.
5. Given a manifest written BY HAND (no generator, no `@plantuml-ts` package),
   then it behaves identically to a generated one (ADR-7).
6. Given a `baseUrl` with and without a trailing slash, then the resolved URL is
   the same in both cases.

## Quality bar

All four gates exit 0. 389 svg goldens byte-identical; 54-fixture ratchet
zero-diff; size-deltas 320/351 widened 0 — this task should move none of them,
being a new unreferenced module.

Tests assert specific values and call counts, never truthiness.

## Observability

**The injected fetcher IS the observability seam** and this task establishes it
(ADR-5): a browser library has no metrics pipeline, so a consumer wraps the
fetcher to measure fetch error rate, requests-per-diagram and p95 latency.
Document that in the exported API's doc comment, along with what each error
means and what the consumer does about it.

No metrics, traces or dashboards — there is no service.

## Rollback

**Reversible** — revert the commit. The module is unreferenced until T2.

## Boundaries

**Never:** import a Node built-in, touch `process.env`, or use `require()` —
this file ships to browsers, and the fetch path must use global `fetch` via the
injected `IncludeFetcher`, never `node:http`. Never give `baseUrl` a default
(ADR-4). Never modify `BundleData`.

## Method rules

1. **Trace dependency cascades TWO levels** before settling the error taxonomy —
   T3 routes these errors into the prefetch walk, which routes into
   `render()`'s `errorSvg`.
2. **Verify the "fetchInclude gives me CORS/CSP handling" claim against the
   CURRENT code**, not against its doc comment.

## Commit

One commit: `feat(T1): add the fetch-backed remote stdlib bundle source`
