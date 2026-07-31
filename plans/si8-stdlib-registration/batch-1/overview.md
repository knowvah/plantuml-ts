# Batch 1 — Prefetch consults the stdlib seam

One task. It is a standalone bug fix, shippable on its own, and it lands ahead
of the registry work because every later task exercises the async path it
repairs.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `prefetchInner` consults `getPumlResource` before throwing | typescript-pro | `src/core/include-resolver.ts`, `tests/unit/stdlib-resolution.test.ts` | — | [x] |

## Batch exit criteria

- All quality gates green
- `render()` + `withStdlib` resolves a stdlib include instead of returning an
  error card
- `renderSync` output for the same input is **byte-identical to before**
- The 54-fixture svg-description ratchet still passes

## Why this is first and separate

It is a user-facing defect that exists today, independent of lazy loading. It
also removes a trap for every later task: T3 wires a registry into the same
walk, and debugging that on top of a broken stdlib branch would conflate two
mechanisms.

## The shape of the bug

`prefetchInner` asks `store.has(url)` — exact key. `withStdlib` returns
`{ get: base.get, has: base.has, getPumlResource: stdlib.getPumlResource }`, so
`has('<bootstrap/bootstrap>')` is false no matter what the stdlib store can
resolve. The `getPumlResource` seam, which exists precisely for this form, is
never consulted.

`renderSync` is unaffected because it never prefetches — which is also why ten
`withStdlib` call sites and a full test suite never caught it.
