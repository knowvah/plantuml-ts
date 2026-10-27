# Exit — final measurement, docs, memory, PR prep

Agent: orchestrator. Runs after the batch 8 close. Commits:
`chore(gep-exit): exit bar — gantt <c>/<n> conformant, 0 losses`, then
`docs(gep): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; chain into
   `$M/final-eng/` diffed against **b0**: 0 conformant losses in the 27 other
   engines; gantt counts reported.
2. **D9 exit bar:** gantt `errored` = 0 and no refusal where the jar renders;
   the 10 jar-error rows conformant (error-page rule); every gantt fixture in
   the golden or diff-baseline ratchet; `capture-clock.test.ts` green; every
   diverged corpus row in a family with an owner (`fixtures.md` family table
   complete).
3. **Docs:** rewrite `planning/mission-guide.md` Phase 4d and
   `planning/gantt-deepdive.md` to the real package (`gantt/`, 167 files) and
   point at this brief; `planning/next-missions.md` gets a gep section (DONE
   status, the family table as gantt-divergence-drive work, the D3 fork-seam
   fallback note, SI2 done by `src/core/time`); `planning/mission-index.md`
   SI2 and D4 rows ticked. `DIVERGENCES.md`: expected untouched (no library
   forces a divergence; a needed entry is stop 9).
4. **Dashboards:** `npm run parity:dashboard`, `npm run catalog`.
5. **Memory:** write `gep-status` (outcome, merge state, follow-ons);
   `.agent-notes/gep-execution.md` observations.
6. **README:** final status block (per-batch counts, gantt before → after).
7. **PR prep:** PR body in the scratchpad (summary table one line per batch,
   gantt counts, "Output changes: @startgantt and {{gantt}} now render", test
   plan). Then the [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final diff vs b0, then 0 conformant losses outside gantt.
- Given the D9 checks, then every clause holds or the halt names the clause.

Observability: N/A. Rollback: Reversible.
