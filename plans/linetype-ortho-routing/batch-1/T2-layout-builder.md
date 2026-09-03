# T2 — `applyGraphAttrs` emits splines (layout side)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T1 has landed `dotSplinesAttrs`.

This is the seam that actually changes layout — but it stays **inert** until
Batch 2, because nothing sets `linetype` yet.

## Task
`src/core/graph-layout-build.ts:34-43`'s `applyGraphAttrs` currently sets
`rankdir`, `nodesep`, `ranksep`, `aspect` — and nothing else. Consume
`dotSplinesAttrs(input.linetype)` and `b.setAttr(k, v)` each pair.

**Placement is load-bearing ([D2]).** The splines attrs must be emitted
**unconditionally**, NOT inside any `omitSepAttrs` guard.
`pavuzo-79-zodu430`'s own cached `svek-1.dot` proves it:

```dot
digraph unix {
remincross=true;
searchsize=500;
splines=ortho;forcelabels=true;      <-- present
sh0006 [shape=circle,...];            <-- and NO nodesep/ranksep anywhere
```

Upstream emits splines from `DotStringFactory.java:161-169`, independent of
the sep attrs. Putting it behind `omitSepAttrs` would silently no-op every
composite pass — which is most of the state corpus.

## Write-set
- `src/core/graph-layout-build.ts`
- `tests/unit/core/graph-layout-build.test.ts`

**Not** `svek-dot-emit.ts` (T3). **Not** `dot-splines.ts` (T1's, now frozen).

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D2
- `src/core/graph-layout-build.ts:34-43` — `applyGraphAttrs`
- `src/core/dot-splines.ts` — T1's helper
- `oracle/goldens/state/pavuzo-79-zodu430/svek-1.dot` — the no-sep-attrs proof

## Architecture decisions
[D2] one shared helper; emitted OUTSIDE the `omitSepAttrs` guard.

## Interface contracts
Consumes T1's `dotSplinesAttrs`. Produces none.

## Acceptance criteria
- Given `linetype: 'ortho'`, when the graph is built, then it carries
  `splines=ortho` AND `forcelabels=true`.
- Given `omitSepAttrs: true` AND `linetype: 'ortho'`, then splines is
  **still** emitted — the [D2] regression guard.
- Given no `linetype`, then no `splines` attribute is set at all (not
  `splines=""`, not a default).
- Given the full suite, then **NO fixture moves** — still inert.
- Given `git diff --name-only`, then only the write-set changed.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One call site.

## Quality bar
All four gates green, `Test Files` == **685**.

## Commit
`feat(lor-T2): emit splines/forcelabels from applyGraphAttrs`
