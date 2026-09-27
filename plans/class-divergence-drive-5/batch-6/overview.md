# Batch 6: exit and close-out

Sequential, orchestrator. Runs after batch 5's close. If batch 5 is empty, after
the last scheduled batch.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T-exit | final measurement; evaluate D6 clause by clause | orchestrator | `measurements/final.json`, README Status table, journal | last close | [ ] |
| T-close-out | ledger finals, records, memory, merge | orchestrator | see below | T-exit | [ ] |

## T-exit
1. On the merged tree, run the full close-procedure steps 2–9, measuring every
   engine against `b0-8beta1` for non-class and `b1` for CLASS. Write
   `measurements/final.json`.
2. Add a `## Status` table to `README.md` with one row per D6 clause:
   `| clause | result | met |`. A clause not met is stated plainly, with its rows.
3. Journal the result.
   **Acceptance:** each D6 clause has a measured result; every non-conformant CLASS
   row has a `final`.

## T-close-out
1. `fixtures.md`: no empty `final`.
2. `planning/next-missions.md`: replace the `class-divergence-drive-4` follow-on for
   the oracle re-pin with a `class-divergence-drive-5 — DONE` section at the top.
   It holds:
   - counts before → after (class bucket, unknown CLASS);
   - ratchet size;
   - the `open -> cdd6` families, with row counts;
   - the D2 non-class re-pin movers per engine (from `b0-8beta1/NONCLASS.md`);
   - the D7 accept-candidates and flagged acceptances;
   - flags for review.
3. `DIVERGENCES.md`: add an entry only for a deliberate divergence introduced this
   mission (expected: none).
4. `docs/parity-report.md` (`npm run parity:dashboard`); `npm run catalog` if exports
   changed.
5. Memory: write `class-divergence-drive-5-status.md` plus its MEMORY.md line, and
   mark `class-divergence-drive-4-status` as superseded for its re-pin follow-on.
6. `.agent-notes/cdd5-*.md`: one observation per novel finding (re-pin effects,
   census dispatch).
7. Four gates. Commit `chore(cdd5-close): record final measurement`. Then
   `git checkout main && git merge --no-ff feat/class-divergence-drive-5`, with a
   merge body carrying the counts. **Do not push.**
   **Acceptance:** main builds green after the merge; next-missions names every
   open family.

Observability: N/A. Rollback: Reversible (revert the merge commit).
