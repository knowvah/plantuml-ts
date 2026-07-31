# T1 — `prefetchInner` consults the stdlib seam

## Context

See [`../README.md`](../README.md) § "The defect found while planning"
(verified 2026-07-31 — do not re-derive it) and
[ADR-1](../decisions.md#adr-1).

`src/core/include-resolver.ts#prefetchInner` gates a `<bundle/thing>` target on
`store.has(url)` — an exact-key lookup — then throws `StdlibNotBundledError`.
A store built by `withStdlib` resolves that form through `getPumlResource` and
carries no such key, so the async API cannot use stdlib bundles at all.

## Task

In `prefetchInner`'s stdlib branch, accept the target when the store can resolve
it through **either** channel:

- the existing exact-key hit (`store.has(url)`), which must keep winning first —
  a host keying `'<c4/c4.puml>'` directly is a supported pattern
  (`IncludeExecutor#load`'s doc comment), or
- `store.getPumlResource?.(stdlibPath)`, where `stdlibPath` is what
  `stdlibPathOf(url)` already returned.

Throw `StdlibNotBundledError` only when neither resolves. Do not change the
error type, and do not change its message in this task — [ADR-5](../decisions.md#adr-5)
rewrites it once a registry exists, and moving it twice makes the diff harder to
read.

**Do not** make the resolved content re-enter the transitive walk in this task.
Bundle text containing further `!include <…>` is [ADR-4](../decisions.md#adr-4)
and belongs to T3. T1 restores the pre-existing contract; it does not extend it.

## Write-set — write NOTHING outside these

- `src/core/include-resolver.ts` (modify)
- `tests/unit/stdlib-resolution.test.ts` (modify — add the async coverage)

`tests/unit/stdlib-resolution.test.ts` already owns the "`withStdlib()` +
`IncludeExecutor#load` wiring" concern (see its header). The missing async case
belongs there, not in a new file.

## Read-set

- `src/core/include-resolver.ts` — `prefetchInner` :258, the stdlib branch
  inside it, `prefetchIncludes` :~295, `BackedIncludeStore` :~318.
  **Line numbers drift — follow the code.**
- `src/core/tim/IncludeStore.ts` — `IncludeStore#getPumlResource`,
  `stdlibPathOf`, `StdlibNotBundledError`
- `src/core/tim/StdlibStore.ts` — `withStdlib` (~:88), to see why `has` misses
- `src/index.ts:334-347` — `render()` / `renderAll()`, incl. the `try/catch`
  that turns the throw into an error SVG
- `tests/unit/stdlib-resolution.test.ts:124-140` — the existing wiring helper

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — consult `getPumlResource`; exact key still
  wins first
- [ADR-4](../decisions.md#adr-4) — transitivity is **T3's**, not this task's

## Interface contract

None produced. `prefetchIncludes`' signature is unchanged; only its accept/throw
condition moves.

## Acceptance criteria

1. Given `withStdlib(new MapIncludeStore(), stdlibStore(bundle))` and a source
   containing `!include <bundle/thing>`, when `render()` runs, then the returned
   SVG contains the bundle's rendered content — today it returns an error card.
2. Given a `<bundle/thing>` target that neither the exact key nor
   `getPumlResource` resolves, when `render()` runs, then
   `StdlibNotBundledError` still reaches `errorSvg` (the failure is preserved,
   not swallowed).
3. Given `renderSync` with the same store and source, when rendered, then the
   output is byte-identical to before this change.
4. Given a host keying `'<bundle/thing>'` directly in a `MapIncludeStore`, when
   prefetched, then the exact-key hit still wins and `getPumlResource` is not
   required.

## Quality bar

All four gates exit 0. 389 svg-class/object/state goldens byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` at 320/351, widened 0.
The 54-fixture svg-description ratchet passes.

Tests assert specific values, never truthiness — assert on rendered content or
error type, not `toBeTruthy()`.

## Observability

The deliverable is **test coverage of the async path**, which is the real
defect: ten `withStdlib` call sites exist and every one feeds `renderSync`, so
nothing exercised `render()` + stdlib. At least one acceptance test must go
through the public `render()` entry point, not through `prefetchIncludes`
directly — testing the internal function would have passed while the bug shipped.

No metrics, traces or dashboards: this is a browser library with no runtime.

## Rollback

**Reversible** — revert the commit. No generated state, no migration.

## Boundaries

**Always:** keep the exact-key hit winning first.

**Never:** introduce a Node built-in into `src/`. Never make `renderSync` async.
Never change `StdlibNotBundledError`'s message here (that is ADR-5/T4).

## Method rules

1. **Trace dependency cascades TWO levels.** Enumerate `prefetchIncludes`'
   callers (`render`, `renderAll`) and then theirs, before declaring the
   behavior change contained.
2. **Verify any "already fixed / already wired" claim against the CURRENT call
   graph.** This task exists because "stdlib resolution works" was true only for
   `renderSync`.

## Commit

One commit: `fix(T1): resolve stdlib includes through the prefetch seam`
