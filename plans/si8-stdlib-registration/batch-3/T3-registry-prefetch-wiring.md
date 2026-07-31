# T3 — Wire the registry into the transitive prefetch walk

## Context

See [ADR-4](../decisions.md#adr-4). T1 made the prefetch walk consult a store's
`getPumlResource`; T2 built a lazy `StdlibRegistry`. This task connects them, and
adds the piece T1 deliberately left out: **resolved bundle text re-enters the
walk.**

That is not a nicety. `assets/stdlib/c4/C4_Context.puml` contains
`!include <C4/C4>` — stdlib bundle files include each other, using the same
`<bundle/thing>` form. A registry that resolves one level and stops produces a
diagram missing everything the nested include defined.

## Task

1. Accept a registry on `RenderOptions` (naming is yours; `stdlibRegistry` is
   the obvious choice) and thread it into `prefetchIncludes`.
2. In the stdlib branch of `prefetchInner`, when neither the exact key nor
   `getPumlResource` resolves and a registry is present, `await` the registry,
   fold the resolved `BundleData` into the store so the sync interpreter can
   read it back, **and recurse into the resolved text** so its own includes are
   prefetched.
3. Preserve the cycle guard across bundle-resolved content — a bundle that
   includes itself must raise `CircularIncludeError`, not hang.

Fold the bundle into the store in a way the synchronous `IncludeExecutor` will
actually find. Its `load()` tries `store.get(what)` first and consults
`getPumlResource` on the miss; either channel is acceptable, but pick one
deliberately and say which in the journal — a bundle folded in so that neither
channel sees it is the silent-failure shape this mission exists to remove.

## Write-set — write NOTHING outside these

- `src/core/include-resolver.ts` (modify)
- `src/index.ts` (modify — `RenderOptions` + threading only)
- `tests/unit/stdlib-registry-prefetch.test.ts` (create)

Do **not** add the public export of `stdlibRegistry` here — T4 owns the export
surface and the error rewrite. Threading an option through is not the same as
publishing the API.

## Read-set

- `src/core/include-resolver.ts` — `prefetchInner` :258 (post-T1),
  `prefetchIncludes` :~295, `BackedIncludeStore` :~318, and the module header's
  over-fetch divergence note :22-33. **Line numbers drift — follow the code.**
- `src/core/tim/StdlibRegistry.ts` — T2's output; see
  [T2's interface contract](../batch-2/T2-stdlib-registry.md#interface-contract-consumed-by-t3)
- `src/core/tim/IncludeExecutor.ts` — `load()` :155-170, the sync read-back path
- `src/index.ts:334-360` — `render` / `renderAll`
- `assets/stdlib/c4/C4_Context.puml` (first lines) — a real nested stdlib include

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4) — extend this pass; a sibling pass is
  **rejected** (it would duplicate the walk, the cycle guard and the over-fetch
  policy)
- [ADR-2](../decisions.md#adr-2) — per-bundle granularity only
- [ADR-5](../decisions.md#adr-5) — the sync warm-up and error rewrite are
  **T4's**, not this task's

## Interface contract

Consumes T2's `StdlibRegistry`. Produces no new type for a downstream task; T4
consumes the option name chosen here, so record it in the journal.

## Acceptance criteria

1. Given a registry with a bundle whose content contains
   `!include <Other/Thing>`, when `render()` runs, then the nested include is
   **also** resolved and its content appears in the output.
2. Given a bundle that includes itself (directly or transitively), when
   `render()` runs, then `CircularIncludeError` results — no hang.
3. Given no registry supplied, when `render()` runs, then behavior is identical
   to post-T1, including the `StdlibNotBundledError` path.
4. Given a registry that does not carry the requested bundle, when `render()`
   runs, then the failure is the not-registered path — not a chunk-load error.
5. Given a registered bundle used twice in one source, when `render()` runs,
   then the registry thunk is invoked once (T2's memoization survives wiring).

## Quality bar

All four gates exit 0. 389 goldens byte-identical; 54 ratchet fixtures
zero-diff; size-deltas 320/351, widened 0.

Criterion 3 is the regression guard for every existing consumer — assert it
explicitly rather than assuming an added optional parameter is inert.

## Observability

The failure modes this task introduces must stay **distinguishable**: bundle
not registered, chunk failed to load, and circular include are three different
consumer actions. Do not collapse them into one error. T4 owns the message
wording; T3 owns not destroying the distinction.

No metrics, traces or dashboards — browser library, no runtime.

## Rollback

**Reversible** — revert the commit. No generated state, no migration. The added
`RenderOptions` field is optional, so reverting cannot break a caller that never
set it.

## Boundaries

**Never:** import a Node built-in into `src/`. Never make `renderSync` async —
if the design seems to require it, that is [ADR-5](../decisions.md#adr-5)'s
warm-up, and it is T4's. Never build per-resource loading (ADR-2).

## Method rules

1. **Trace dependency cascades TWO levels.** `prefetchIncludes` → `render` /
   `renderAll` → every consumer of the async API. An added option is only inert
   if you have checked.
2. **Verify any "the nested include will just resolve" claim against a REAL
   bundle file**, not against the design. `assets/stdlib/c4/` is right there.

## Commit

One commit: `feat(T3): resolve stdlib bundles lazily during prefetch`
