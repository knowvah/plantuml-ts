# Batch 3: exit and close-out

Sequential, orchestrator, after batch 2's close.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T-exit | final measurement; D10 clause by clause | orchestrator | `measurements/final*`, README Status, journal | b2 close | [ ] |
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
1. `fixtures.md`: no empty `final` (`fixed (<commit>)`, `accepted (D8)`,
   `open -> cdd8`, `open -> salt-engine-port`, `open -> dot-engine TRACKER <n>`).
2. `planning/next-missions.md`: a `class-divergence-drive-7 — DONE` section at the
   top (counts before → after, ratchet, `open -> cdd8` rows with mechanisms and
   commits, non-class movers per engine, flags); strike the cdd6 "Open -> cdd7"
   and "Accept-candidates" lists it resolved; keep the `salt-engine-port` stub.
3. `DIVERGENCES.md`: an entry only for a deliberate divergence introduced here
   (expected: none beyond T0a's eight-id note).
4. `npm run parity:dashboard`; `npm run catalog` if exports changed.
5. Memory: `class-divergence-drive-7-status.md` + MEMORY.md line; mark
   `class-divergence-drive-6-status` superseded for what cdd7 closed.
6. `.agent-notes/cdd7-*.md`: one observation per novel finding.
7. Four gates. Commit `chore(cdd7-close): record final measurement`, then
   `git checkout main && git merge --no-ff feat/class-divergence-drive-7` with a merge
   body carrying the counts (use `git merge -F <file>`; `-F -` is not supported).
   **Do not push.** **Acceptance:** main's tree equals the branch tip and builds
   green; next-missions names every open row.

Observability: N/A. Rollback: Reversible (revert the merge commit).
