# T3 — `graphAttrLines` emits splines (DOT emitter side)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`. T1 and T2 have landed.

This is the DOT-parity side. Still **inert** — nothing sets `linetype` yet,
and the harness cannot see splines until T7.

## Task
`src/core/svek-dot-emit.ts:66-77`'s `graphAttrLines` currently pushes
`nodesep`/`ranksep` (behind `omitSepAttrs`), then `remincross=true;`,
`searchsize=500;`, then `rankdir=LR;`. Insert the splines line **between
`searchsize=500;` and the `rankdir` check** — upstream's exact slot
(`DotStringFactory.java:154` → `:161-169` → `:171`).

Join T1's pairs into **ONE line**: `splines=ortho;forcelabels=true;` —
matching upstream's two `append`s before a single `println`, and matching
every cached jar DOT byte-for-byte.

**Emit unconditionally**, outside the `omitSepAttrs` guard, same as T2 ([D2]).

## Write-set
- `src/core/svek-dot-emit.ts`
- `tests/unit/core/svek-dot-emit.test.ts`

**Not** `graph-layout-build.ts` (T2's, now frozen). **Not**
`tests/oracle/svek-dot.ts` (T7).

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — D2, D4
- `src/core/svek-dot-emit.ts:66-77` — `graphAttrLines`
- `src/core/dot-splines.ts` — T1's helper
- `oracle/goldens/state/pavuzo-79-zodu430/svek-1.dot` — the byte target
- `~/git/plantuml/.../svek/DotStringFactory.java:150-175` — the emission order

## Architecture decisions
[D2] one shared helper, one line, outside the sep guard · [D4] polyline gets
no forcelabels.

## Interface contracts
Consumes T1's `dotSplinesAttrs`. Produces none.

## Acceptance criteria
- Given `linetype: 'ortho'`, when emitted, then the DOT contains the single
  line `splines=ortho;forcelabels=true;` — one line, not two.
- Given `linetype: 'polyline'`, then `splines=polyline;` and NO
  `forcelabels` anywhere ([D4]).
- Given the emitted output, then the splines line sits **after**
  `searchsize=500;` and **before** any `rankdir=` line.
- Given `omitSepAttrs: true`, then splines is still emitted.
- Given the full suite, then **NO fixture moves** — still inert.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One call site.

## Quality bar
All four gates green, `Test Files` == **685**.

## Commit
`feat(lor-T3): emit splines/forcelabels from the svek DOT emitter`
