# T-exit

Agent: orchestrator.

1. Four gates on the branch tip → `measurements/final/` (typecheck BEFORE any commit); collected =
   on-disk. If src is unchanged since the last close survey, `measurements/final/README.md` points
   at that close's chain (wep precedent, journal it).
2. Surveys of every engine (or the pointer); diff verdicts and `dotEqual` against `b0-eng/` AND the
   previous close.
3. Ledger: every row has a `final`; no acceptance signed (stop 9); retirements journaled.
4. `planning/next-missions.md`: a `utility-factories-port` DONE section at the top (counts before →
   after, pins, fixed rows with commits, anything open with mechanism and owner — incl. the
   out-of-scope list: `listfonts`, `help`, the `@start*` block types, encrypted dedications, key
   tools); `planning/mission-index.md` if a row tracks this work.
5. Memory: `ufp-status.md` + its MEMORY.md line (branch, merge sha, counts, flags).
6. Merge into local main with a merge commit (never squash, never rebase). **Do not push**; tell
   the maintainer to push main.
7. Append the README summary (tasks vs planned, decisions flagged, gates, follow-ons).

## Acceptance
- Given the final survey, then the 17 rows read conformant (D11), every byte-identical row is
  pinned, and no engine lost a conformant row against b0.
- Given local main, then it holds the merge commit and `git status` is clean apart from foreign files.

**Observability:** N/A. **Rollback:** Reversible (revert the merge commit).
