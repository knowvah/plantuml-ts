# T-exit

Agent: orchestrator.

1. Four gates on the branch tip → `measurements/final-*`; collected = on-disk. If the code
   HEAD is unchanged since the last close, `measurements/final/README.md` points at that
   close's gates and chain instead (sep precedent, journal it).
2. Surveys of every engine → `measurements/final-eng/` (or the pointer above); diff verdicts
   and `dotEqual` against `b0-eng/` AND the previous close.
3. Ledger: every row has a `final`; no acceptance was signed (stop 9).
4. `planning/next-missions.md`: a `wbs-engine-port` DONE section at the top (counts before →
   after, pins, fixed rows with commits, anything open with mechanism and owner); mark the
   sep section's follow-on 6 (wbs half) done; update `planning/mission-index.md` D3.
5. Memory: `wep-status.md` + its MEMORY.md line (branch, merge sha, counts, flags).
6. Merge into local main with a merge commit (never squash, never rebase: the journal cites
   per-task commits). **Do not push**; tell the maintainer to push main (GitHub is rebase-only
   and cannot merge a branch with internal merge commits).
7. Append the README summary (tasks vs planned, decisions flagged, gates, follow-ons).

## Acceptance
- Given the final survey, then wbs reads 204/204 (D10), every byte-identical row is pinned,
  bozido's wbs slot is measured, and no engine lost a conformant row against b0.
- Given local main, then it holds the merge commit and `git status` is clean apart from scratch.

**Observability:** N/A. **Rollback:** Reversible (revert the merge commit).
