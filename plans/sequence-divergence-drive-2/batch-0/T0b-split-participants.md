# T0b — split `sequence-layout-participants.ts` (pure move)

Agent: `refactoring-specialist`, worktree `sdd2-T0b`. Commit:
`refactor(sequence): move participant spacing constraints to own module`.
Read [../task-contract.md](../task-contract.md) first.

## Task
`src/diagrams/sequence/sequence-layout-participants.ts` is 510 lines. Move
the spacing-constraint scan — `SpanConstraint` (`:106`), `MessageLevels`,
`ScanContext`, `liveDelta`, `scanMessageLabels`, `scanFrame`,
`refConstraint` (`:106-239`) and whatever only they use — into a new
`sequence-layout-participant-constraints.ts`. It mirrors upstream's
`addConstraints` passes (`teoz/CommunicationTile.java:404-427`,
`CommunicationTileSelf.java:166-184`); cite them in its head comment.
Export what the original module needs; re-export public symbols
(`MessageLevels`) from the original so callers do not change. Batch 3
adds the self-message constraint here.

**Pure move:** no logic, constant or order change.

## Write-set
`sequence-layout-participants.ts`, new
`sequence-layout-participant-constraints.ts` (both under
`src/diagrams/sequence/`). No test edits.

## Read-set
`sequence-layout-participants.ts` (whole).

## Acceptance
- Given the split, then both files are ≤ 500 lines and typecheck passes.
- Given `svg-hashes.mts` vs `$M/b0-hashes.json`, then 0 rows differ.
- Given `tests/unit/sequence/**`, then all pass unedited.
