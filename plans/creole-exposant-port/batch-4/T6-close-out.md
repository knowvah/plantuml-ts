# T6 — Close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
Read `README.md`, `decisions.md`, `decision-journal.md` (every task's rows,
ratchets, manifest moves), the SI29 close-out precedent
(`plans/state-declared-size-fix/findings/CLOSE-OUT.md`, and its
`planning/mission-index.md` row SI29 — mirror the columns).

## Task
1. Run the harness and `harness-diff.py` against T0's pinned baseline
   (T0's report has the sha256): report went-exact rows, 0 appeared/grew, the
   summary line vs 272/2654/2555/62/37/0/43; `render-manifest --diff` vs T0's
   manifest: every moved fixture in `expected-moves.txt` (list any not).
2. Append "Close-out (2026-08-XX)" to `README.md`: juvagu rows before/after,
   authored fixtures' results, ratchet entries removed, parity counts
   (state/class/description/object; svg goldens), coverage, `npm test`
   wall-clock vs 54.8 s, flags, follow-ups (sequence/activity/WBS creole;
   `TileText`; anything a task deferred).
3. `planning/mission-index.md`: SI30 row after SI29; `planning/next-missions.md`
   §4: replace the `creole-exposant-port` bullet with DONE + pointer.
4. Tick every batch in `README.md`.
Read-only git only; no commits.

## Write-set
As in the batch overview.

## Acceptance
- Given the final tree, then `harness-diff.py` vs T0's baseline prints only went-exact rows and 0 appeared/grew; the summary is reported.
- Given register files, then SI30 is recorded with per-task commit ids from `git log`.

## Observability / Rollback
N/A — docs and register rows. Reversible.

## Report (≤500 tokens)
Rows exact/remaining; ratchets removed; any collateral move; anything the
orchestrator must fix.
