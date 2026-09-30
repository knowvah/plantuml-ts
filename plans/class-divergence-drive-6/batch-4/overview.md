# Batch 4: exit and close-out

Sequential, orchestrator, after batch 3's close.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T-exit | final measurement; D10 clause by clause | orchestrator | `measurements/final*`, README Status, journal | b3 close | [x] |
| T-close-out | ledger finals, records, memory, merge | orchestrator | see below | T-exit | [ ] |

## T-exit
1. On the final tree, run close-procedure steps 3–9; CLASS against `b0.json`,
   every other engine against `b0-eng/`. Write `measurements/final.json` and
   `measurements/final-eng/`.
2. Add a `## Status` table to `README.md`: `| clause | result | met |`, one row per
   D10 clause; a clause not met is stated plainly with its rows.
3. Journal it. **Acceptance:** every D10 clause has a measured result; every row
   in `fixtures.md` has a `final`.

## T-close-out
1. `fixtures.md`: no empty `final` (`fixed (<commit>)`, `open -> cdd7`,
   `accept-candidate`, `open -> dot-engine TRACKER <n>`).
2. `planning/next-missions.md`: a `class-divergence-drive-6 — DONE` section at the
   top (counts before → after, ratchet, `open -> cdd7` families with rows, non-class
   movers per engine, accept-candidates, flags); strike the cdd5 bullets it resolved.
3. `DIVERGENCES.md`: an entry only for a deliberate divergence introduced here
   (expected: none; D8's Smetana numeric residue is already covered by the ruling).
4. `npm run parity:dashboard`; `npm run catalog` if exports changed.
5. Memory: `class-divergence-drive-6-status.md` + MEMORY.md line; mark
   `class-divergence-drive-5-status` superseded for what cdd6 closed.
6. `.agent-notes/cdd6-*.md`: one observation per novel finding.
7. Four gates. Commit `chore(cdd6-close): record final measurement`, then
   `git checkout main && git merge --no-ff feat/class-divergence-drive-6` with a merge
   body carrying the counts (use `git merge -F <file>`; `-F -` is not supported).
   **Do not push.** **Acceptance:** main's tree equals the branch tip and builds
   green; next-missions names every open family.

Observability: N/A. Rollback: Reversible (revert the merge commit).
