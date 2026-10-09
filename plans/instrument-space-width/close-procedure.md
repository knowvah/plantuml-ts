# Batch close (every batch except final)

Agent: orchestrator. `N` = batch label, `prev` = previous close (`b0` for
batch 0's T0c merge check, `b1` for batch 2). `$M` =
`plans/instrument-space-width/measurements/`.

0. **Clean checkout gate (stops 15, 16).** `git status --porcelain` and
   `git stash list` empty; the task worktree has `.husky/_`;
   `npx prettier --check .` passes on the task branch.
1. **Merge** each task branch `--no-ff`. `docs/catalog.md` conflicts:
   `npm run catalog`. Remove the worktree and branch.
2. **Gates** (README) at `--maxWorkers=4`; collected = on-disk (stop 7).
3. **All engines**, no agents running: `$M/survey-all.sh $M/bN-eng`;
   `python3 $M/engdiff.py $M/<prev>-eng $M/bN-eng`. Every mover journaled with
   its mechanism; a conformant loss not in `owed.json` = stop 5.
4. **Sequence:** `seq-scores.mts` → `$M/bN-seq.json`; list rises (outside owed =
   stop 5) and falls; regenerate the census.
5. **Elements:** `elements.mts` → `$M/bN-elements.json`; `elements-diff.py`
   against prev: any AWAY outside owed = stop 5.
6. **Production manifest:** `$M/production-manifest.mts --diff $M/b0-prod.json`
   → 0 changes (stop 6).
7. **Re-pin** only fallen rows (copy the baseline first; diff after — any row
   that ROSE is reverted). Rows cleared from `owed.json` are re-pinned at their
   measured value and removed from it; zero-diff rows are promoted with the
   engine's pin tool (`plans/*/tools/pin-goldens.mts`) and the routing/refusal
   count assertions updated with a derivation comment.
8. **Ledger:** `fixtures.md` bN column; `owed.json` count journaled (stop 13:
   3 fix batches without halving).
9. **Dashboard + catalog:** `npm run -s parity:dashboard`; `npm run catalog`.
10. **Commit** `chore(isw-bN): close batch N — <summary>`; journal row; tick.
