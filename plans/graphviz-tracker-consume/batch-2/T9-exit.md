# T9 — exit (orchestrator)

## Steps
1. If the state lane is not merged yet, run close-procedure B.
2. Run close-procedure C: `gates.sh final`, `chain.sh final-eng`, `diff-eng.mjs b0-eng final-eng`. Losses
   must be 0 and every mover needs a mechanism.
3. Census final vs b0 for component, usecase, unknown and state. Every row moving away from the jar needs a
   mechanism (D6). Diff all baseline pin JSONs against b0: zero rises.
4. `bash measurements/rd.sh final` and fill fixtures.md's `after` column.
5. TRACKER.md: every in-scope box is ticked per D2, or carries a dated line with its measured residual and
   mechanism. Each still-open item gets a `planning/next-missions.md` entry with its owner.
6. Write `.agent-notes/gtc-findings.md` (observations template) and add the next-missions section
   "graphviz-tracker-consume (gtc)".
7. README: tick the batches and add a mission summary (tasks, exit bar per clause, ticks, decisions to
   review, follow-ups). Commit `chore(gtc-exit): record final gates and mission summary`.
8. Stop and give the user `git rebase -S 9094705aa` on `fix/graphviz-tracker-consume`. After the user
   confirms, re-run `npm run typecheck`, then push the branch and open a merge-commit PR (no attribution;
   the body summarises the ticks and the exit bar).

## Acceptance
- Given the final gates, then all four pass and collected = on-disk.
- Given b0 vs final, then there are 0 conformant losses in all engines and 0 pin rises.
- Given TRACKER.md, then every in-scope box is ticked per D2, or open with a dated residual, a mechanism
  and a next-missions owner.
- Given the PR, then it is a merge-commit PR whose commits are signed by the user.

**Observability:** final SLIs recorded. **Rollback:** reversible (revert the merge commit).
