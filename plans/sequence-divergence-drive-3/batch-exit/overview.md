# Exit — final measurement, ledger, PR prep

Agent: orchestrator. Runs after the batch 8 close. Commit:
`chore(sdd3-exit): d9 exit bar — <pins> pinned, sum <score>`, then
`docs(sdd3): close out`.

## Steps
1. **Final measurement** at load < 8: gates (`final`), classify, sequence
   survey (wall-clock vs b0), all-engine chain into `$M/final-eng/` diffed
   against **b0** (not just b8): 0 conformant losses (D9).
2. **Final pin round**: every zero-diff row pinned; re-pin baselines (diff
   the JSON; risers journaled); regenerate the diff census.
3. **D9 check**: 1143 pins, or every non-zero row in `fixtures.md` has a
   named mechanism and an owner (`open -> <next mission>: <reason>`).
4. **Dashboards**: `npm run parity:dashboard`, `npm run catalog`.
5. **Docs**: `DIVERGENCES.md` — the LaTeX entry notes `array` sizing (D6);
   README/docs-site carry the ImageProvider usage written in T6e.
6. **Filing**: `planning/next-missions.md` — mark the "Open -> sdd3" families
   done with their batch, list anything still open grouped by mechanism.
7. **Memory**: write `sdd3-status` (outcome, merge state, follow-ons);
   `.agent-notes/sdd3-execution.md` observations.
8. **README**: final status block (counts before → after, per batch).
9. **PR prep**: PR body in the scratchpad (summary table, the public API
   additions from D3/D4 under "API changes (additive)", test plan; one line
   per batch, matching the squashed commits). Then run the
   [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final all-engine diff vs b0, then 0 conformant losses.
- Given the golden ratchet, then every zero-diff row is pinned.
- Given `fixtures.md`, then every open row has a mechanism and an owner.
- Given the PR body, then it has one line per batch and lists the API
  additions.

Observability: N/A. Rollback: Reversible.
