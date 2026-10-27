# T4e — `TaskDraw` and `TaskDrawSeparator` (T4a's remaining files)

Agent: `typescript-pro` (sonnet), worktree `gep-T4a` (branch `gep/T4a`; it
already holds T4a's 8 files at `73a14548d` and the mission branch merged in,
which brings `src/core/real/` from T4d). Commit:
`feat(gantt): port TaskDraw and TaskDrawSeparator (T4e)`.
Read [../task-contract.md](../task-contract.md), decisions D1, D4, D12, and
[../batch-4/T4a-task-model.md](../batch-4/T4a-task-model.md) (this finishes it).

## Port (whole files, upstream names)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDraw.java` (82) → `src/diagrams/gantt/draw/TaskDraw.ts`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawSeparator.java` (236) → `src/diagrams/gantt/draw/TaskDrawSeparator.ts`

## Write-set
The two files above; `tests/unit/gantt/draw/TaskDraw.test.ts` (may be folded
into the separator test if `TaskDraw` is an interface only — say so),
`tests/unit/gantt/draw/TaskDrawSeparator.test.ts`; `docs/catalog.md`.

## Read-set
The two Java files; for each type they import, its ported TS file
(`docs/catalog.md` → path; `Real` is `src/core/real/Real.ts`). Draw-test
helper: `tests/helpers/recording-ugraphic.ts` (T3c used it). Style helper:
`tests/unit/gantt/helpers/gantt-style.ts`. Do not read the rest of the
gantt package; read no file under `src/diagrams/sequence/`.

## Acceptance
- Given each ported file, every public member exists with the same name and
  behaviour; expected values cite `file:line`.
- Given a `TaskDrawSeparator` drawn through the recording UGraphic, the
  recorded shapes/text and their coordinates equal those traced from
  `TaskDrawSeparator.java` (`drawU`, `getTitle`, `getHeightTask`, `getY`).
- `npm run typecheck`, eslint, prettier (explicit list) clean; coverage
  ≥ 90/90/90 on the two files.

Observability: N/A. Rollback: Reversible.
