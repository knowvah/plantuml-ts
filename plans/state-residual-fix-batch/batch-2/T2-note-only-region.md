# T2 — G17: note-only region uses the jar's SvekResult margin

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. A faithful TypeScript port of PlantUML; the
Java at `~/git/plantuml` is the **canonical spec** — read the method body, not
a summary of it. Tests are vitest, colocated under `tests/unit/state/`.

SI29 diagnosed this to a `file:line` and proved the arithmetic; it left the
fix unapplied under its own diagnosis-only scope. You apply it.

## Task
In `regionInkGeometry` (`src/diagrams/state/state-composite-concurrent.ts`,
around lines 114-143), the return is currently:

```ts
return {
  width: Math.max(ink.width, p.result.width),
  height: Math.max(ink.height, p.result.height),
  dx: ink.dx,
  dy: ink.dy,
};
```

When the region has no materialized states, `ink` is `{width:0, height:0}` and
this unconditionally returns `p.result.width/height` — dot-engine's own graph
canvas, measured at exactly **+12 px on both axes** over the note's declared
box (three independent confirmations in the record). The jar never uses a raw
canvas here: a note-only `CONCURRENT_STATE` sub-group gets its own real
`SvekResult`, whose `calculateDimension()` is the tight content bbox **+15 on
both axes**.

Change the degenerate branch only: when there are no materialized states, size
the region from `p.result.nodes`' own raw declared boxes plus one new named
constant, value **15**, carrying `SvekResult.java:135` in its comment. Leave
the non-degenerate path byte-identical.

**Per D3: the number 3 must not appear in source.** 15−12=3 is why the
arithmetic closes; 15 is the ported constant. A `+3` would close every row
today and be wrong the instant dot-engine's default graph margin moved.

## Write-set
- `src/diagrams/state/state-composite-concurrent.ts` — `regionInkGeometry`'s
  degenerate branch and the new constant ONLY. Do not touch
  `buildConcurrentBranchAcc` (~:228-248) — that is T2's, in the next batch.
- The module's unit test.

## Read-set
- `plans/state-declared-size-fix/findings/G17-note-only-region.md` — the whole
  record, especially `causalChain` (the per-scope arithmetic you must
  reproduce) and `proposedWriteSet`
- `decisions.md#d3` and `decisions.md#d4`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:126-136`
  — `calculateDimension`, the `.delta(15, 15)` you are porting. **Read this
  method body before writing the constant.**
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GroupMakerState.java:110-129`
  — `getImage`'s `containsSomeConcurrentStates()==false` branch, which is what
  gives a note-only region a real `SvekResult` rather than the
  `countChildren()==0` leaf short-circuit at :113-115
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:133-141`
  — `calculateDimensionSlow`, confirming every region is summed the same way
- `src/core/svek/SvekResult.ts:57-63` — this port's EXISTING `INK_DELTA=15`
  for the non-degenerate case. Reuse it if it is exported and the citation
  fits; a second constant with the same value and provenance is duplication.

## Architecture decisions (locked)
D3 (jar's formula, not a retuned margin), D4 (this file's other edit is T2's,
next batch). Treat both as settled — conflict means stop and journal, per
stop 8.

## Acceptance
- Given `joleju-94-maru748`, when
  `npx jiti scripts/measure-composite-declared-size.ts joleju-94-maru748`
  runs, then all six target rows are exact: scope9 width+height, scope11
  width+height, scope12 width (each −3.000 → 0) and scope12 height
  (−9.000 → 0).
- Given a concurrent region that DOES have materialized states, when
  `regionInkGeometry` runs, then its returned width/height/dx/dy are
  byte-identical to before this change (assert it in a unit test).
- Given the new constant, then its value is 15, its comment carries
  `SvekResult.java:135`, and `grep -n '\b3\b'` over the diff shows no bare 3
  introduced as a margin.
- Given the full harness, when `harness-diff.py` runs, then
  `0 rows appeared or grew`.
- Given `render-manifest`, then any moved fixture is appended to
  `expected-moves.txt` under a `# Batch 2` heading with a one-line jar-side
  account.

## Interface contracts
None consumed downstream — `regionInkGeometry` is module-local. Its return
shape `{width, height, dx, dy}` is unchanged.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one commit, one function, no data or schema.

## Quality bar
All four gates green (`npm test` with coverage >= 90/90/90, `npm run
typecheck`, `npm run lint`, `npm run build`) before you finish. Write the
regression test FIRST (TDD) — it should fail against the current code for the
stated reason, then pass.

## Boundaries
- **Always:** cite `file:line` for the constant; keep the non-degenerate path
  byte-identical.
- **Ask first:** nothing — this task is fully specified.
- **Never:** touch `buildConcurrentBranchAcc`; introduce a bare `+3`; run git.

## Report (<=500 tokens)
The six rows before/after; the constant and its citation; the non-degenerate
invariance evidence; any fixture that moved in the manifest, with its account.
