# T4 — Re-baseline + accounting close

## Context
All fixes/residuals from T1–T3 are in. Re-baseline the backlog and record the
honest conformant %, so every non-conformant description fixture stays a named
entry.

## Task
1. `npx tsx scripts/measure-description-size-deltas.ts` → record conformant %
   and confirm exit 0.
2. Update `oracle/goldens/description/size-backlog.json`: delete newly-conformant
   entries; shrink improved pins; re-pin any documented residual at its true
   delta; refresh the `_doc` (new count / % / S1L-b-unicode summary).
3. Update `plans/s1l-leaf-sizing/ledger.md` — the display-expansion /
   emoji-unicode rows: which of gafico/nujito/lurupu flipped, shrank, or stayed
   a named residual (quoted-title → T2 finding; emoji → T3 finding).
4. Update `planning/mission-index.md` — the S1L-b row: new conformant %, and the
   named residuals; flip to `done` only if every miss is named.

## Read-set
- `scripts/measure-description-size-deltas.ts`.
- `plans/s1l-leaf-sizing/ledger.md` (family table + the S1L-b-display close
  notes this mission extends).
- `planning/mission-index.md` (S1L-b row + the S1L close note).

## Write-set
- `oracle/goldens/description/size-backlog.json`
- `plans/s1l-leaf-sizing/ledger.md`
- `planning/mission-index.md`

## Observability
N/A.

## Rollback
Reversible — revert the commit (docs + pins only).

## Quality bar
Full gate: `measure` exit 0; `dot-sync-report component usecase` 262/262+90/90;
`npm test`; `npm run typecheck`; `npm run lint`; `npm run build` — all pass.

## Acceptance criteria (Given/When/Then)
- Given the T1–T3 tree, when the harness runs, then exit 0 (zero widened) and
  the new conformant % is recorded.
- Given the ledger + mission-index, then every remaining backlog entry maps to a
  named family/sub-mission and the S1L-b row shows the new % + residuals.

## Commit
`docs(s1l): close S1L-b-unicode accounting (T4)`.
