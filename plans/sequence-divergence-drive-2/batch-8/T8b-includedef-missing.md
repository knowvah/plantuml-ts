# T8b — a missing `!includedef` is a no-op

Agent: `typescript-pro` (sonnet), worktree `sdd2-T8b`. Commit:
`fix(core): treat a missing includedef definition as empty`.
Read [../task-contract.md](../task-contract.md) first. Core, all engines.

## Mechanism (research D §2, nuvoja)
`tim/TContext.java:687-705` + `BlockUmlBuilder.java:150-156`:
`getDefinition` returns an empty list when the definition is missing, so
`!includedef macro` contributes nothing. The port throws
`IncludeNotFoundError` (`src/core/tim/IncludeExecutor.ts:124-130,184`).
This is a port bug, not a harness gap (sdd1 recorded it as one).

## Targets
nuvoja-46 (would pin).

## Write-set
`src/core/tim/IncludeExecutor.ts`, its tests.

## Read-set
`research/research-d-structure.md` §2; `IncludeExecutor.ts:100-200`;
`TContext.java:680-710`; `BlockUmlBuilder.java:140-160`.

## Acceptance
- Given `!includedef missing`, then preprocessing continues with no lines
  added (test citing `TContext.java:687-705`).
- Given `!include` of a missing file, then behaviour is unchanged (still
  the jar's error — check it).
- Given nuvoja, then zero-diff; every engine's pins unchanged.
