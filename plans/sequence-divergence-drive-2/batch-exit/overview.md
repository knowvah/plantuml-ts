# Exit — final measurement, ledger, PR prep

Agent: orchestrator. Runs after the batch 8 close. Commit:
`chore(sdd2-exit): d9 exit bar — <pins> pinned, sum <score>`, then
`docs(sdd2): close out`.

## Steps
1. **Final measurement** at load < 8: gates (`final`), classify, sequence
   survey (wall-clock vs b0), all-engine chain into `$M/final-eng/` diffed
   against b0 (not just b8): 0 conformant losses (D9).
2. **Final pin round**: every zero-diff row pinned; re-pin baselines (diff
   the JSON; risers journaled).
3. **D9 check**: pins ≥ 560, or every non-zero row in `fixtures.md` has a
   named mechanism and an owner (`open -> <next drive>: <reason>`). Error
   rows: 0, or each errors in the jar too (conformant).
4. **Dashboards**: `npm run parity:dashboard`, `npm run catalog`.
5. **Filing**: `planning/next-missions.md` — the open families, grouped by
   mechanism with row counts; verified dot-engine findings (if any) in
   `docs/graphviz-issues/`.
6. **Memory**: update `sdd1-status` → write `sdd2-status` (outcome, merge
   state, follow-ons); `.agent-notes/sdd2-execution.md` observations.
7. **README**: final status block (counts before → after).
8. **PR prep**: PR body in the scratchpad (summary table, breaking changes —
   none expected, test plan; one line per batch, matching the squashed
   commits). Then run the [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final all-engine diff vs b0, then 0 conformant losses.
- Given the golden ratchet, then every zero-diff row is pinned.
- Given `fixtures.md`, then every open row has a mechanism and owner.
- Given the PR body, then it has one line per batch.

Observability: N/A. Rollback: Reversible.
