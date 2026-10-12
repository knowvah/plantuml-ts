# T-exit: close

Agent: orchestrator.

## Task
1. Run the four gates on the branch tip. Write `measurements/final-*`.
2. Run `render-all --tree all` into `measurements/final.json`, surveys of every engine into
   `final-eng/`, and the census. Diff them against b0 for all engines.
3. Ledger: every row's `final` is set. Every active `oracle/accepted-divergences.json`
   entry touching a ledger row is one of:
   - a D11 class
   - cdd7 D8 (gubeca, jixibu)
   - D11.1 (nugecu)

   No ELK entry may remain.
4. `planning/next-missions.md`: a `class-divergence-drive-8` section at the top with:
   - counts before → after
   - fixed rows with their commits
   - what stays open: salt ×3, plus anything ledgered by T3b
   - follow-ons with mechanisms
   - flags: the D12 eligibility rule, `RenderOptions.elk`, and D13's adapter
5. Memory: write `cdd8-status.md` plus its MEMORY.md line (branch, merge sha, counts,
   flags). Update any memory that says ELK is unsupported.
6. Merge into main with a merge commit (never squash). **Do not push** (stop 9).
7. Delete `.plan-mission-progress.md` if it is still present.

## Acceptance
- Given the final survey, then the class bucket reads **720/3/0**, unknown CLASS-routed
  reads **282/3**, ratchet pins rose by the number of fixed rows, and there are 0
  conformant losses in any engine against b0.
- Given the four gates, then all pass and collected = on-disk.
- Given main, then it holds the merge commit, and `git status` is clean apart from
  untracked scratch.

**Observability:** N/A. **Rollback:** Reversible (revert the merge commit).
