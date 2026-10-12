# T-exit

Agent: orchestrator.

1. Four gates on the branch tip → `measurements/final-*`; collected = on-disk.
2. Surveys of every engine → `measurements/final-eng/`; diff verdicts and `dotEqual` against b0.
3. Ledger: every row has a `final`; no acceptance was signed (stop 9).
4. `planning/next-missions.md`: a `salt-engine-port` section at the top (counts before →
   after, fixed rows with commits, anything open with mechanism and owner) and mark the
   "salt-engine-port — proposed" section done.
5. Memory: `sep-status.md` + its MEMORY.md line (branch, merge sha, counts, flags).
6. Merge into main with a merge commit (never squash). **Do not push.**
7. Append the README summary (tasks vs planned, decisions flagged, gates, follow-ons).

## Acceptance
- Given the final survey, then salt reads 51/51 (D8), the 3 seed rows are conformant and
  pinned, and no engine lost a conformant row against b0.
- Given main, then it holds the merge commit and `git status` is clean apart from scratch.

**Observability:** N/A. **Rollback:** Reversible (revert the merge commit).
