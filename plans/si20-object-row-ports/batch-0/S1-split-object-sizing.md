# S1 — relocate the object geo builders out of `class-object-map-sizing.ts`

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. This task creates
headroom, nothing else. `hooks/check-complexity.py` runs as a `PostToolUse`
hook and **blocks the write** at 500 lines; `class-object-map-sizing.ts` is
at **490** and T1 must add a publish to it.

**This is a pure relocation.** No logic change, no signature change, no
reordering of statements, no "while I'm here" cleanup. CLAUDE.md forbids
refactoring while porting — moves are allowed, redesigns are not.

Another agent (T0) is working in this same worktree concurrently on the
decision journal. Your write-sets do not overlap.

## Task

Move the object-specific geometry builders into a new
`src/diagrams/class/class-object-sizing.ts`, leaving the map/json and shared
helpers behind. The file's own header comment says it is "SHARED by
object/map/json" — that shared part stays.

Candidate group to move (verify before moving; the line numbers drift):

- `buildEnhancedObjectGeo` (~:368)
- `buildFieldBasedObjectGeo` (~:399)
- `measureObjectClassifier` (~:448, exported — its one caller is
  `class-layout-helpers.ts:371`)

`measureObjectFields`, `computeObjectTitle` and `formatObjectMemberText` are
judgment calls: move them if they are used **only** by the relocated
builders, keep them if map/json also consume them. Check the callers; do not
guess. `formatObjectMemberText` is exported, so check outside this file too.

The repo has precedent in both directions — `class-object-map-header.ts` was
already split out of this same file, and `class-port-rows.ts` out of
`class-dot-graph.ts`. Match whichever is closer.

## Write-set

- `src/diagrams/class/class-object-map-sizing.ts`
- `src/diagrams/class/class-object-sizing.ts` (new)
- `src/diagrams/class/class-layout-helpers.ts` — **import line only**
- any other file whose *import* must be repointed (imports only; if a file
  needs a logic change, STOP and report)

## Read-set

- `src/diagrams/class/class-object-map-sizing.ts` — the whole file.
- `src/diagrams/class/class-object-map-header.ts` — the prior split out of
  this same file; match its header-comment style and export shape.
- `src/diagrams/class/class-layout-helpers.ts:371` — the one caller of
  `measureObjectClassifier`.

## Architecture decisions in force

[ADR-7](../decisions.md#adr-7--split-only-what-must-grow-along-seams-that-already-exist).

## Interface contract

None new. Every symbol keeps its **exact** current name, signature and
export status. A caller that compiles today must compile unchanged apart
from the module specifier it imports from.

## Acceptance criteria

- Given the move, when all four gates run, then all four are green.
- Given the move, when every DOT gate and every census is run, then **every
  count is byte-identical** to before — a pure relocation cannot move a
  number. Any movement means the seam is wrong: **STOP and report.**
- Given the result, then `class-object-map-sizing.ts` is **under 500 lines**
  and so is the new file.
- Given `git diff`, then no moved function's body differs by even one
  character from its original (verify deliberately, e.g. by diffing the
  extracted text against the deleted text).

## Measurement obligation

This touches object sizing, so run at minimum:

```sh
npx tsx scripts/dot-sync-report.ts object     # 77/80, 1 portOk (rozuxo)
npx tsx scripts/dot-sync-report.ts class      # 710/711, portOk 0
npx tsx scripts/svg-conformance-census.ts object   # 35/80
```

Read a census from its `DeterministicMeasurer` section, **never** with
`tail` — the second `jarMeasurer` block reports `0 diffs: 0` by design.

Report every number, including the ones that did not move.

## Observability requirements

N/A — no new observable operations.

## Rollback

**Reversible.** A single relocation commit, revertible on its own — which is
why it is separate from the behavioral work rather than bundled with it.

## Quality bar

Four gates, run yourself, **never piped** (a pipe reports the pipe's exit
code and masks vitest failures): `npm test`, `npm run typecheck`,
`npm run lint`, `npm run build`.

## Boundaries

- **Always:** keep it a pure move; verify counts are unchanged.
- **Ask first (STOP and report):** any file outside the write-set; any change
  that is not a relocation or an import repoint.
- **Never:** rename a symbol, change a signature, "improve" a moved function,
  or run any state-mutating git command — T0 is working in this same
  worktree and the orchestrator commits.

## Commit format

```
refactor(S1): relocate object geo builders to class-object-sizing
```
