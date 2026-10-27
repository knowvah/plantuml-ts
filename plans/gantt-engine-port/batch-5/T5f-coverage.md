# T5f — chain coverage to 90/90/90 (tests only)

Agent: `typescript-pro` (sonnet), worktree `gep-T5f` (branch `gep/T5f`, off
the batch-5 chain merge `b6e2f5b55`). Commit:
`test(gantt): raise batch-5 coverage to the 90/90/90 bar (T5f)`.
Read [../task-contract.md](../task-contract.md) ("Coverage 90/90/90 on what
you add"). Journal row 54.

## Goal
Measured per file at the chain merge (`--coverage.include` on the gantt
tree): every metric ≥ 90 on these files, by adding tests only.

| File | below 90 |
|---|---|
| `src/diagrams/gantt/GanttArrow.ts` | functions 83.3 |
| `src/diagrams/gantt/GanttDiagram.ts` | branches 87.5 |
| `src/diagrams/gantt/GanttDiagramConfig.ts` | lines 89.6, functions 89.2, statements 89.3 |
| `src/diagrams/gantt/GanttDiagramMainBlock.ts` | branches 88.5 |
| `src/diagrams/gantt/GanttLayout.ts` | branches 83.3 |
| `src/diagrams/gantt/gantt-skin-param.ts` | lines 83.3, branches 83.3, functions 77.8, statements 80.6 |
| `src/diagrams/gantt/core/TaskImpl.ts` | branches 86.0 |
| `src/diagrams/gantt/draw/header/TimeHeader.ts` | branches 88.9 |
| `src/diagrams/gantt/draw/header/TimeHeaderMonthly.ts` | branches 83.3 |
| `src/diagrams/gantt/draw/header/TimeHeaderQuarterly.ts` | branches 81.3 |
| `src/diagrams/gantt/draw/header/TimeHeaderVariant.ts` | branches 83.3 |
| `src/diagrams/gantt/draw/header/TimeHeaderYearly.ts` | branches 87.5 |

## Write-set
`tests/unit/gantt/**` only (existing test files and helpers may be extended).
No file under `src/` changes. A branch you cannot reach from a test without
changing `src/` (e.g. a guard for a state the Java also never reaches): do
not change `src/`; list it in the hand-back with the Java `file:line` and why
it is unreachable.

## Acceptance
- Every expected value cites the Java `file:line` (or a jar oracle); assert
  specific values, never truthiness; no test asserts the port's own output
  back to itself without a Java trace.
- The table re-measured: each listed file ≥ 90 on all four metrics, or the
  residual branch is listed as unreachable with its reason.
- `npm run typecheck`, eslint and prettier clean on the touched test files;
  commit through the pre-commit hook.

Observability: N/A. Rollback: Reversible.
