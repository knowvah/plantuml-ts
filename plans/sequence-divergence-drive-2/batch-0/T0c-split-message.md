# T0c — split `sequence-layout-message.ts` (pure move)

Agent: `refactoring-specialist`, worktree `sdd2-T0c`. Commit:
`refactor(sequence): move self-message layout to its own module`.
Read [../task-contract.md](../task-contract.md) first.

## Task
`src/diagrams/sequence/sequence-layout-message.ts` is 495 lines and Batch 2
grows it. Upstream separates the normal and self message tiles
(`teoz/CommunicationTile.java` vs `teoz/CommunicationTileSelf.java`).
Mirror that: move the self-message code paths — `liveOffsetSelf`
(`:407`), the self branch constants (`SELF_ARROW_ONLY_HEIGHT` `:132` if only
self uses it), the self branch of `labelLeftOf`/`buildMessageGeo` if it can
be extracted as a whole function without changing behaviour, and the
`isReverseDefine` NOT-ported comment block (`:396-405`) — into a new
`sequence-layout-message-self.ts`. If extracting a branch would require
restructuring logic, leave it and journal it in the hand-back: a pure move
beats a complete one.

**Pure move:** no logic, constant or order change.

## Write-set
`sequence-layout-message.ts`, new `sequence-layout-message-self.ts` (under
`src/diagrams/sequence/`). No test edits.

## Read-set
`sequence-layout-message.ts` (whole).

## Acceptance
- Given the split, then both files are ≤ 500 lines, the original ≤ 440
  (headroom for Batch 2), and typecheck passes.
- Given `svg-hashes.mts` vs `$M/b0-hashes.json`, then 0 rows differ.
- Given `tests/unit/sequence/**`, then all pass unedited.
