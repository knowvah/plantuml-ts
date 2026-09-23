# Batch 7 close — full re-pin (D5, D9, D11)

**Agent:** debugger · **Depends on:** T24, T25, T26, T27, T28

## Context

Five parallel worktrees land: four class-only (T24/T25/T26/T27) and one
shared-seam task (T28) whose gate already ran the full suite once, but a
merge of all five together can still interact — `bixogo-47-xulu385`/
`roxosu-00-pini153` (T27's renderer + T28's legend-creole routing) and
`manube-50-xora983` (T26's sprite filter + T28's table-cell parsing) are
each split across two tasks by mechanism, not by write-set, and only
become fully conformant once BOTH land. Read `../decision-journal.md`
(T24–T28's rows) and `../README.md` stops 3–5 before starting.

## Steps

1. Merge all five task branches into the batch integration branch; resolve
   only trivial rebase conflicts (none expected — write-sets are disjoint
   except the shared read-only `src/core/klimt/creole/legacy/` imports).
2. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build` — all green.
3. `npm run svg:survey class`.
4. `npx jiti scripts/svg-conformance-census.ts class`.
5. `npx tsx tools/render-all.mts measurements/b7.json`.
6. `npx tsx tools/pin-diff.mts measurements/b6.json measurements/b7.json`
   (or the latest prior close's file if batch 6 has not closed yet — name
   which base was used in the journal).
7. Re-measure `bixogo-47-xulu385`, `roxosu-00-pini153`, `manube-50-xora983`
   specifically: confirm each is now conformant with BOTH mechanisms
   landed; journal which task supplied the last-mile fix.
8. For every OTHER riser, `dotEqual true→false` flip, or conformant-loss:
   a journal row naming the mechanism (must be one of T24–T28's, or a new
   one — if new, stop 3, halt).
9. Pin every fixture that is survey-`conformant` AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` (append `{slug, addedAt:
   "2026-09-2X", source: "cdd-b7"}`) plus its golden dir — copy the cached
   `in.svg` verbatim, verify with `cmp`.
10. `npx jiti scripts/dot-sync-report.ts class` — must stay ≥ 710/711
    (stop 6); commit the re-survey's `tests/oracle/svg-conformance/
    parity-class.json`.
11. `npm run parity:dashboard`; commit `docs/parity-report.md`.
12. `fixtures.md`: add (if absent) and fill the `after batch 7` column for
    every batch-7 slug named across T24–T28's task files, plus any T28
    mechanism-column correction already made.
13. Tick batch 7 in `../README.md`'s batches table.
14. JSON-reporter collected count == on-disk test file count (stop 7).
15. Commit.

## Write-set

`tests/oracle/svg-conformance/parity-class.json`, `oracle/goldens/
svg-class/ratchet.json`, `oracle/goldens/svg-class/<newly-pinned slugs>/`,
`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b7.json`, `plans/class-divergence-drive/fixtures.md` (`after batch 7` column),
`plans/class-divergence-drive/decision-journal.md`, `plans/
class-divergence-drive/README.md` (tick only), `.agent-notes/
cdd-close-b7.md`.

## Acceptance criteria

- Given `pin-diff.mts`, then every mover has a journal row naming its
  mechanism (T24–T28), and no mover is unexplained
- Given `bixogo-47-xulu385`/`roxosu-00-pini153`/`manube-50-xora983`, then
  each is confirmed conformant with both contributing tasks' fixes present
- Given the DOT-sync report, then the fraction is ≥ 710/711
- Given the ratchet re-pin, then `git diff oracle/goldens/svg-class/
  ratchet.json` shows only additions, each newly added slug's golden dir
  verified byte-identical with `cmp`
- Given the four gates and JSON-reporter check, then all pass

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the merge commit; ratchet/pin changes are committed
alongside the code.

## Quality bar

Same four gates plus the survey/census/pin-diff/dot-sync/dashboard
sequence above, zero unexplained movers (stop 5), zero DOT regression
(stop 6), zero `timeout` verdicts (stop 7).

## Boundaries

Always: re-verify the two cross-task fixtures explicitly before pinning
them. Ask first: accepting a `structural-match`-only fixture into the
ratchet (D3). Never: rebuild the DOT cache or repoint the oracle jar
symlink (D12); accept a `dotEqual true→false` flip without a journaled
mechanism (stop 4).

## Commit

`chore(cdd-b7): close batch 7 — re-pin after text & creole fixes`

Body: before/after survey and DOT-sync counts; ratchet pin count delta;
which task supplied the last-mile fix for bixogo/roxosu/manube; count of
journaled risers with a one-line mechanism list.
