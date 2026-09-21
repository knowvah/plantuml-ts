# Batch 1 close — full re-pin (D7, D11)

**Agent:** debugger · **Depends on:** T1, T2, T3, T4

## Context

D7/D2: this batch moves `creationIndex` (the rank source for draw order
AND the uid exact/fallback gate) and DOT edge emission order — the highest
blast-radius batch in the mission. Every one of the 412 baseline-
conformant fixtures and all 314 ratchet pins must be re-verified, not just
the ~60 named SB1–SB5/SB8 slugs. Read the whole
[`../decision-journal.md`](../decision-journal.md) (T1–T4's rows) and
[`../README.md`](../README.md) stops 4–8 before starting.

## Steps

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build` — all green.
2. `npm run svg:survey class`.
3. `npx jiti scripts/svg-conformance-census.ts class`.
4. `npx tsx tools/render-all.mts measurements/b1.json`.
5. `npx tsx tools/pin-diff.mts measurements/b0.json measurements/b1.json`.
6. For every riser, `dotEqual true→false` flip, or conformant-loss in
   step 5's output: a journal row naming the mechanism (must be one of
   T1–T4's, or a new one — if new, stop 3, halt). Zero unexplained rows —
   an empty diff here (only the ~60 SB1–SB5/SB8 slugs plus any documented
   SB2/SB3 overlap moved, all improving) is the expected, not the required,
   outcome; if anything ELSE moved, stop 5.
7. Pin every fixture that is survey-`conformant` AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` (append `{slug, addedAt:
   "2026-09-2X", source: "cdd-b1"}`) plus its golden dir under
   `oracle/goldens/svg-class/<slug>/` — copy the cached `in.svg` verbatim
   (`cp test-results/dot-cache/class/<slug>/in.svg
   oracle/goldens/svg-class/<slug>/in.svg`), verify with `cmp` (byte-
   identical, not just diff-empty).
8. `npx jiti scripts/dot-sync-report.ts class` — must stay ≥ 710/711 (stop
   6); commit the re-survey's `tests/oracle/svg-conformance/
   parity-class.json`.
9. `npm run parity:dashboard`; commit `docs/parity-report.md`.
10. `fixtures.md`: fill the `after batch 1` column for every one of the ~60
    SB1–SB5/SB8 slugs plus the 8 SB6/count-divergence slugs if any moved
    as a side effect (should not have — SB6 is a different mechanism,
    B9/newpage/hide, untouched by this batch).
11. Tick batch 1 in `../README.md`'s batches table.
12. JSON-reporter collected count == on-disk test file count (stop 7).
13. Commit.

## Write-set

`tests/oracle/svg-conformance/parity-class.json`, `oracle/goldens/
svg-class/ratchet.json`, `oracle/goldens/svg-class/<newly-pinned slugs>/`,
`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b1.json`, `plans/class-divergence-drive/fixtures.md` (`after batch 1` column
only), `plans/class-divergence-drive/decision-journal.md`,
`plans/class-divergence-drive/README.md` (tick only), `.agent-notes/
cdd-close-b1.md`.

## Acceptance criteria

- Given `pin-diff.mts b0.json b1.json`, then every mover has a journal row
  naming its mechanism (T1/T2/T3/T4), and no mover is unexplained
- Given the DOT-sync report, then the fraction is ≥ 710/711
- Given the ratchet re-pin, then `git diff oracle/goldens/svg-class/
  ratchet.json` shows only additions (no existing pin's `addedAt`/`source`
  changed) and every newly added slug's golden dir `in.svg` is byte-
  identical to its cached `in.svg` (verified with `cmp`)
- Given `fixtures.md`, then the `after batch 1` column is filled for every
  batch-1 slug
- Given the four gates and JSON-reporter check, then all pass

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the merge commit; ratchet/pin changes are committed
alongside the code per this mission's policy (`README.md` branch/merge
note), so a single revert undoes both.

## Quality bar

Same four gates plus the survey/census/pin-diff/dot-sync/dashboard
sequence above, zero unexplained movers (stop 5), zero DOT regression
(stop 6), zero `timeout` verdicts (stop 7).

## Boundaries

Always: treat any mover outside T1–T4's named slugs as a stop-5/stop-3
event requiring a journal row or a halt, never a silent accept. Ask
first: accepting a `structural-match`-only fixture into the ratchet (D3 —
pin only survey-conformant AND census-0-diff, never one alone). Never:
rebuild the DOT cache or repoint the oracle jar symlink (D12); accept a
`dotEqual true→false` flip without a journaled mechanism (stop 4).

## Commit

`chore(cdd-b1): close batch 1 — re-pin after ordering/uid fixes`

Body: before/after survey and DOT-sync counts; ratchet pin count delta;
count of journaled risers with a one-line mechanism list.
