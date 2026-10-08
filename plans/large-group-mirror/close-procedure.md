# Batch close (batches 0, 1)

Agent: orchestrator. `N` = batch label, `prev` = the previous close (`b0` for
batch 1). `$M` = `plans/large-group-mirror/measurements/`.

0. **Clean checkout gate (stop 15).** `git status --porcelain` empty and
   `git stash list` empty before every merge.
1. **Merge** each task branch `--no-ff`. Resolve a `docs/catalog.md` conflict by
   `npm run catalog`. Remove the worktree and branch.
2. **Four gates** (README); collected = on-disk (stop 7).
3. **All engines.** `$M/survey-all.sh $M/bN-eng`; `python3 $M/engdiff.py
   $M/<prev>-eng $M/bN-eng`. Journal every mover with its mechanism; any
   conformant loss without one = stop 4; > 40 movers in one engine = stop 13.
4. **Sequence.** Score every row (`measurements/seq-scores.mts`); list rises (each needs a
   mechanism or it is stop 5) and falls; regenerate the census; diff its
   missing/extra-element buckets against the previous census.
5. **D5 element check** for every engine the batch touched: per-tag counts
   ours vs jar, before vs after; any move away from the jar = a fix task.
6. **Re-pin** only fallen rows (copy the baseline first; diff the JSON after —
   any row that ROSE is reverted or journaled).
7. **Ledger.** Fill the `bN` column in `fixtures.md`; tick the batch in README.
8. **Dashboard + catalog.** `npm run -s parity:dashboard`; `npm run catalog`.
9. **Commit** `chore(lgm-bN): close batch N — <summary>`; journal row.
