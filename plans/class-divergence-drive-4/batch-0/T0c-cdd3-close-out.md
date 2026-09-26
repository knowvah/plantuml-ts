# T0c — cdd3 close-out + merge

Run `plans/class-divergence-drive-3/final/T-close-out.md`. Then merge `feat/class-divergence-drive-3`
into main with a merge commit (per-task ids are cited in its journal).
Pushing follows that close-out's own instruction. If it is silent, do not
push; list it in the handoff.

**Acceptance.** Given main, then `git log --merges -1` is the cdd3 merge and
the four gates are green on main. **Rollback** Reversible (revert -m 1).
