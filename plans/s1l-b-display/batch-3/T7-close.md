# T7 — Final re-measure + accounting close

## Context
All fixes are in. Re-baseline the backlog to the final state, record the honest
conformant %, and update the ledger + mission-index so every non-conformant
description fixture remains a named entry.

## Task
1. `npx tsx scripts/measure-description-size-deltas.ts` → record conformant %
   and confirm exit 0.
2. Regenerate `oracle/goldens/description/size-backlog.json` (refresh `_doc`
   with the new count / % / S1L-b summary; delete newly-conformant entries).
3. Update `plans/s1l-leaf-sizing/ledger.md` — move the flipped fixtures out of
   the display-expansion / min-width families; note any residual (fariba) with
   its cause.
4. Update `planning/mission-index.md` — S1L-b row: new conformant %, flip to
   `done` if every miss is named (or `wip` naming the residual).

## Read-set
- `scripts/measure-description-size-deltas.ts`
- `plans/s1l-leaf-sizing/ledger.md` (family table format)
- `planning/mission-index.md` (S1L-b row + the S1L close note)

## Write-set
- `oracle/goldens/description/size-backlog.json`
- `plans/s1l-leaf-sizing/ledger.md`
- `planning/mission-index.md`

## Acceptance criteria
- Given the full gate (`measure` exit 0; `dot-sync-report component usecase`
  262/262+90/90; `npm test`; `npm run typecheck`; `npm run lint`;
  `npm run build`), then all pass.
- Given the ledger, then the S1L-b flips are reflected and every remaining
  backlog entry maps to a named family/sub-mission.
- Given `planning/mission-index.md`, then the S1L-b row shows the new conformant
  % and correct status.

## Commit
`docs(s1l): close S1L-b (display expansion) accounting (T7)`.
