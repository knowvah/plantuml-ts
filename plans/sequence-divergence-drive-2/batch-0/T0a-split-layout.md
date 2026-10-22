# T0a — split `layout.ts` (pure move)

Agent: `refactoring-specialist`, worktree `sdd2-T0a`. Commit:
`refactor(sequence): move document width out of layout.ts`.
Read [../task-contract.md](../task-contract.md) first.

## Task
`src/diagrams/sequence/layout.ts` is 547 lines; the hook blocks edits over
500. Move the document-width computation — `RIGHT_MARGIN`,
`computeTotalWidth` (`:366`) and its helpers `noteContentRight`,
`refContentRight`, `dividerContentRight`, `messageGeosOf`,
`exoContentRight` (`:401-475`) — into a new
`sequence-layout-width.ts`. It mirrors upstream's `PlayingSpace` width
(`teoz/PlayingSpace.java:75-104`); say so in its head comment with the
`@see`. `layout.ts` imports what it uses. Batches 3 and 5 edit the width
module, so keep every width term there.

**Pure move:** no logic, constant or order change; comments move with
their code. If a helper is shared with code staying behind, it stays
behind and the new module imports it.

## Write-set
`src/diagrams/sequence/layout.ts`, new
`src/diagrams/sequence/sequence-layout-width.ts`. No test edits.

## Read-set
`layout.ts` (whole); `docs/catalog.md` sequence section.

## Acceptance
- Given the split, then both files are ≤ 500 lines and `npm run typecheck`
  passes.
- Given `npx tsx $T/svg-hashes.mts <wt>/h.json $M/b0-hashes.json`, then 0
  rows differ on both paths.
- Given `tests/unit/sequence/**`, then all pass unedited.
