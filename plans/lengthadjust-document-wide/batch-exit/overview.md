# Exit — final measurement, ledger, docs, PR prep

Agent: orchestrator. Runs after the batch 3 close. **DONE 2026-10-24** (step 4 ran before step 1 — journal row 30). Commits:
`chore(lad-exit): d8 exit bar — 64/64 root-exact, 0 losses`, then
`docs(lad): close out`.

## Steps
1. **Final measurement** at load < 8: `gates.sh final`; all-engine chain into
   `$M/final-eng/` diffed against **b0** (not just b2): 0 conformant losses;
   movers only on board/files/packetdiag/chart, each by the route (D2).
2. **Authored baseline**: `build-authored-baseline.mts <sha>` must report 64
   `rootExact`, 51 `textLengthMatch` on `exact` rows, the 13 `baseline` rows
   not worse (Amendment 1); `--write` and diff the JSON.
3. **D8 check**: every golden ratchet and diff-baseline ratchet green with no
   pin edited; the four D2 engines' `parity-*.json` equal `final-eng/`.
4. **Dedupe** the per-task `RootLengthAdjust → LengthAdjust` mappings
   (T2a/T2b/T2c/T2d/T2e wrote local copies): one helper in
   `src/core/klimt/drawing/svg/length-adjust-of.ts` (or beside the enum),
   every site importing it; byte-identical output proven by the authored gate
   and the ratchets; `npm run catalog`.
5. **Dashboards**: `npm run parity:dashboard`, `npm run catalog`.
6. **Docs**: `DIVERGENCES.md` carries T3a's "Extensions" section and no
   other change (an accepted-divergence entry is still stop 13). Add the
   2026-10-23 extension ruling to the project `CLAUDE.md` mirror bullet
   (one sentence pointing at DIVERGENCES.md "Extensions"), and update the
   `always-mirror-the-jar` memory with the carve-out. `planning/next-missions.md`:
   mark the sdd3 "Carried from earlier batches" lengthAdjust item done with
   this mission; list anything still open (the 12 baseline rows' emitter
   gap, with its owner).
7. **Memory**: write `lad-status` (outcome, merge state, follow-ons);
   `.agent-notes/lad-execution.md` observations.
8. **README**: final status block (authored counts before → after, per batch).
9. **PR prep**: PR body in the scratchpad (summary table, one line per batch
   matching the squashed commits, the D2 root change called out under
   "Output changes", test plan). Then run the
   [squash batch](../batch-squash/overview.md).

## Acceptance
- Given the final all-engine diff vs b0, then 0 conformant losses and movers
  only on the four D2 engines.
- Given the authored gate, then 64 `rootExact`, 51 `textLengthMatch`, 13
  `baseline` rows not worse.
- Given T3a's extension ratchet and the T1e fitness test, then both green.
- Given the PR body, then it has one line per batch and names the D2 root
  change.

Observability: N/A. Rollback: Reversible.
