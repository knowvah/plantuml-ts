# T3 — Re-baseline + accounting close

## Context
T2 unified the lexers; the sizer now strips what the renderer strips. Re-baseline
the shrink-only ratchet and record the new conformant %.

## Task
1. `npx tsx scripts/measure-description-size-deltas.ts` → record conformant %,
   confirm exit 0 (zero widened).
2. Update `oracle/goldens/description/size-backlog.json`: delete newly-conformant
   entries (delta ≤0.01); shrink improved pins to their new deltas (lurupu-11,
   gafico-37, nujito-06, and any other movers the T1 spike / this run identify);
   re-pin any that shifted; refresh `_doc` (new count / % / this mission's note).
3. Update `plans/s1l-leaf-sizing/ledger.md`: update the S1L-b-unicode T3 lurupu
   section + the display-expansion row to reflect the unification landing; note
   the residuals that REMAIN (gafico/nujito node c `<code>`; per-atom font-size
   width, ADR-2). Retire the "sizer↔renderer creole visible-text unification"
   follow-on line (now done).
4. Update `planning/mission-index.md`: record the conformant-% delta and mark
   the creole-lexer-unification follow-on done; keep S1L-b's residual routing
   accurate.

## Read-set
- `scripts/measure-description-size-deltas.ts`.
- `plans/s1l-leaf-sizing/ledger.md` (S1L-b-unicode T1/T2/T3 sections + the
  display-expansion family row).
- `planning/mission-index.md` (S1L-b row + the S1L close note).
- T1's `scripts/measure-creole-lexer-delta.ts` output (which fixtures moved).

## Write-set
- `oracle/goldens/description/size-backlog.json`
- `plans/s1l-leaf-sizing/ledger.md`
- `planning/mission-index.md`

## Architecture (locked)
Docs + pins only. Do NOT change source in this task. Pins shrink-only (never
widen a pin to mask a regression — a widened fixture is a STOP, not a re-pin).

## Observability
N/A.

## Rollback
Reversible — revert the commit (docs + pins only).

## Quality bar
Full gate: `measure` exit 0; `dot-sync-report component usecase` 262/262 + 90/90;
`npm test`; `npm run typecheck`; `npm run lint`; `npm run build` — all pass.

## Acceptance criteria (Given/When/Then)
- Given the T2 tree, when `measure` runs, then exit 0 (zero widened) and the new
  conformant % is recorded in `_doc` + ledger + mission-index.
- Given every improved fixture, then its backlog pin is shrunk to its new delta
  or deleted (if ≤0.01), and no pin is widened.
- Given the ledger + mission-index, then the creole-lexer-unification follow-on
  is retired and the remaining residuals (node c `<code>`, per-atom font-size)
  are each named.

## Commit
`docs(creole-lexer-unification): re-baseline backlog + close accounting (T3)`
