# T5 — Close-out

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. Read this brief's `README.md`, `decisions.md`
and `decision-journal.md` (every task's rows, ratchets, manifest moves), plus
the SI30 close-out precedent (`plans/creole-exposant-port/README.md`'s
"Close-out" section and its `planning/mission-index.md` row SI30 — mirror the
columns).

## Task
1. Run the harness and `harness-diff.py` against T0's pinned baseline (T0's
   report has the sha256). Report rows that went exact, `0 appeared/grew`, and
   the summary line vs T0's `273/2660/2563/60/37/0/42`. Run `render-manifest`
   and `manifest-diff.py`: every moved fixture must be on
   `expected-moves.txt`; list any that is not.
2. Append a "Close-out (2026-08-XX)" section to `README.md` covering: each of
   the 14 target rows before/after; which of the five groups closed and which
   did not; whether T4 reverted; `jetuse-93`'s verdict; parity counts
   (state/class/description/object; svg goldens); coverage; `npm test`
   wall-clock against the 58.9 s honest sample; flags; follow-ups.
3. `planning/mission-index.md`: an SI31 row after SI30, mirroring SI30's
   columns, with per-task commit ids read from `git log`.
   `planning/next-missions.md` §4: replace the follow-on-fix-batch bullet with
   DONE + a pointer, and add any mission this run spun out (G20a if reverted;
   the G20b consumption once dot-engine ships `EdgeGeometry.xlabel`).
4. Tick every batch in `README.md`.
5. State plainly in the close-out that this mission changed **emitted SVG**
   (T2 always; T4 possibly) — the one consumer-visible output change. A
   downstream consumer pinning golden SVGs will see diffs.

Read-only git only; no commits.

## Write-set
As in the batch overview.

## Read-set
- This brief's `README.md`, `decisions.md`, `decision-journal.md`
- `plans/creole-exposant-port/README.md` — close-out precedent (SI30)
- `planning/mission-index.md` rows SI29 and SI30 — column shape
- `docs/graphviz-issues/TRACKER.md` line 16 — the G20b dependency this
  mission filed rather than fixed

## Acceptance
- Given the final tree, when `harness-diff.py` runs against T0's baseline,
  then it prints only went-exact rows and `0 rows appeared or grew`, and the
  summary is reported.
- Given the register files, then SI31 is recorded with per-task commit ids
  from `git log`.
- Given the close-out, then every one of the 14 target rows is accounted for —
  exact, or carrying a jar-cited mechanism for the residual.

## Observability
N/A — docs and register rows.

## Rollback
Reversible. Docs only.

## Quality bar
The four gates run by the orchestrator on a docs-only tree.

## Report (<=500 tokens)
Rows exact / remaining; groups closed; whether T4 reverted; any collateral
move; anything the orchestrator must fix.
