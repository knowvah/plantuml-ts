# Batch 3 — Per-resource routing into the prefetch walk

One task. It is where the mission's value actually lands: until this, a remote
bundle can fetch a resource but nothing asks it to.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Route `<bundle/thing>` to per-resource resolution inside the walk | typescript-pro | `src/core/include-resolver.ts`, `tests/unit/stdlib-remote-prefetch.test.ts` | T1, T2 | [x] |

**Required a scope escalation.** The `Stdlib.java` key transform was private to
`StdlibStore.ts`, a file in no task's write-set. Resolved by maintainer ruling:
`src/core/tim/stdlib-path.ts` now holds it, with `StdlibStore` and
`include-resolver` as its two callers. Landed as `fix(T3)` before T3 itself.

## Batch exit criteria

- All quality gates green
- `<tupadr3/font-awesome-5/ban>` with a remote registry fetches **that resource
  only** — proven by call count, not by reasoning
- Fetched text re-enters the transitive walk (SI8 ADR-4's mechanism)
- With no registry, or an eager one, behavior is **identical to post-SI8**
- 389 svg goldens byte-identical; 54-fixture ratchet zero-diff

## Why this is its own batch

It depends on both T1 and T2, and T4 rewrites the same file immediately after.
Landing the routing alone — correct but sequential — keeps the concurrency
change in Batch 4 diffable against a working baseline. Debugging a concurrency
bug on top of unproven routing would conflate two mechanisms.

## The shape of the change

SI8's `prefetchInner` stdlib branch already consults three channels in order:
exact key, `getPumlResource`, then the registry via `stdlibContentFor`
(whole-bundle). This task makes the registry channel resolve **one resource**
instead of materialising a whole `BundleData` — which for `tupadr3` is the
difference between 2.9 KB and 18.93 MB.

Because T2 gave `resolveResource` a uniform eager/remote implementation, this
branch does not need to know which kind of bundle it is talking to.
