# Batch 3 — Close  ✅ DONE (2026-07-27)

**Result:** T7 re-measured (236/351 = 67.2% conformant, +5 vs the S1L close),
refreshed the backlog `_doc`, updated `plans/s1l-leaf-sizing/ledger.md` (Result
table + min-width/display-expansion rows + fariba residual) and
`planning/mission-index.md` (S1L close note, S1L-g → done, S1L-b → wip with
residuals named). Full gate green. Commit: T7 = see git log.


Final measurement, backlog re-baseline, and accounting so S1L-b closes under the
"100% minus known divergences" rule.

| Task | Writes |
|------|--------|
| T7 | `size-backlog.json`, `plans/s1l-leaf-sizing/ledger.md`, `planning/mission-index.md` |

**Exit bar:** full gate green (measure exit 0, dot-sync 262/262+90/90, npm test,
typecheck, lint, build); ledger + mission-index reflect the new conformant % and
name any remaining residual (fariba); S1L-b row flipped to `done` (or `wip` with
the residual named).
