# T4 — Sync warm-up, public export, error rewrite

## Context

See [ADR-5](../decisions.md#adr-5). T3 made `render()` resolve bundles lazily.
`renderSync` cannot await, and it must stay synchronous — that is public API and
a hard CLAUDE.md constraint. So sync callers need an explicit async warm-up, and
the errors need to stop giving advice that is now wrong.

## Task

### 1. Warm-up
Expose an async function that takes a source (and a registry, plus optionally an
existing store) and returns a ready `IncludeStore` a caller passes straight to
`renderSync`. It resolves the same targets T3's walk would.

This is deliberately not a new mechanism: `render()` already does
prefetch-then-render. The warm-up publishes that first half so a sync caller can
do the same two steps by hand.

### 2. Public export
Export the registry API and the warm-up from `src/index.ts`, alongside the
existing `stdlibStore` / `withStdlib` / `BundleData` re-exports (`src/index.ts:53-54`).
Follow the comment convention already there explaining **why** each symbol is
re-exported for downstream `@plantuml-ts/stdlib*` packages.

### 3. Error rewrite
Rewrite `StdlibNotBundledError`'s message so it:

- names the bundle and the full target,
- states whether a registry was supplied and, if so, that the bundle had no
  entry — rather than telling the caller to pass `options.includeStore`,
- tells a `renderSync` caller to use the warm-up, since that is the actual fix
  for the sync case.

Keep `StdlibChunkLoadError` (T2) distinct: "registered but failed to load" and
"not registered" have different fixes and must not read alike.

## Write-set — write NOTHING outside these

- `src/index.ts` (modify)
- `src/core/tim/IncludeStore.ts` (modify — the error message/shape only)
- `tests/unit/stdlib-registry.test.ts` (modify — extend T2's file)

## Read-set

- `src/index.ts:35-55` — the import + re-export block and its rationale comment;
  `:334-360` — `render` / `renderAll`
- `src/core/tim/IncludeStore.ts` — `StdlibNotBundledError` and its current
  message text
- `src/core/tim/StdlibRegistry.ts` — T2's module
- `src/core/include-resolver.ts` — T3's wiring, and the option name T3 recorded
  in the journal
- `plans/si8-stdlib-registration/decision-journal.md` — T3's recorded option name

## Architecture decisions (locked)

- [ADR-5](../decisions.md#adr-5) — lazy is `render()`-only; sync gets a warm-up
- [ADR-3](../decisions.md#adr-3) — `stdlibStore` / `withStdlib` / `BundleData`
  keep working unchanged; the registry is additive

## Interface contract

Publishes T2's `stdlibRegistry` / `StdlibRegistry` / `StdlibChunkLoadError` and
the new warm-up on the package's public surface. No downstream task consumes it;
T7 documents it.

## Acceptance criteria

1. Given a registry and a source using `!include <bundle/thing>`, when the
   warm-up is awaited and its store passed to `renderSync`, then the diagram
   renders with the bundle's content.
2. Given a source whose bundle is not in the registry, when rendered, then the
   error names the bundle and does **not** advise passing `options.includeStore`.
3. Given a registered bundle whose thunk rejects, when rendered, then the error
   is distinguishable from the not-registered case and preserves `cause`.
4. Given existing callers using `withStdlib(new MapIncludeStore(), stdlibStore(b))`
   with `renderSync`, when rendered, then output is byte-identical to before —
   the ten in-repo call sites are the regression population.
5. Given `src/index.ts`, when the package is built, then the new symbols are
   exported and `npm run build` emits their types.

## Quality bar

All four gates exit 0. 389 goldens byte-identical; 54 ratchet fixtures
zero-diff; size-deltas 320/351, widened 0.

Criterion 4 matters most: `scripts/dot-sync-report.ts`,
`scripts/svg-conformance-census.ts`, `scripts/measure-description-size-deltas.ts`
and `tests/oracle/description-parity.ratchet.test.ts` all build stores the old
way, and all feed measurement gates.

## Observability

**This task is where the mission's observability deliverable lands.** The three
consumer-facing failure modes must each produce an error a consumer can act on
without reading plantuml-ts source:

| failure | consumer action |
|---|---|
| bundle not registered | add a thunk for it |
| chunk failed to load | fix bundler/CDN config — not a plantuml-ts bug |
| sync caller, lazy registry | await the warm-up first |

Put this guidance in the exported API's doc comments; there is no runbook
because there is no service.

## Rollback

**Reversible** — revert the commit. Exports are additive, so reverting cannot
break a caller that predates them.

## Boundaries

**Never:** make `renderSync` async or change its signature — if the design seems
to need it, stop and log it. Never import a Node built-in into `src/`. Never
change `stdlibStore` / `withStdlib` / `BundleData` semantics.

## Method rules

1. **Trace dependency cascades TWO levels** before changing the error message —
   grep for tests asserting on its current text, then check what those tests
   themselves guard.
2. **Verify the "additive exports cannot break anything" claim against the
   CURRENT build**, including the `.d.ts` emit; `npm run build` runs API
   Extractor and has warned about version skew before.

## Commit

One commit: `feat(T4): publish the stdlib registry and sync warm-up`
