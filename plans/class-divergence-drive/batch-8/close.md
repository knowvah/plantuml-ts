# Batch 8 close — full re-pin (D4, D11)

**Agent:** debugger · **Depends on:** T29, T30

## Context

D4: this batch is a serialization-only change (no layout move for any
already-conformant fixture that does not use `scale`/`skinparam dpi`), but
T30 widens `resolveScaleFactor`, a function five engines share — the
cross-engine gate already ran inside T30 itself; this close re-confirms it
at the merged tip and re-pins class. Read `../decision-journal.md` (T29's
and T30's rows, including T30's list of every non-class mover) and
`../README.md` stops 3–5 before starting.

## Steps

1. Merge T29 then T30 (sequential dependency, not parallel worktrees).
2. Four gates: `npm test` (every engine), `npm run typecheck`, `npm run
   lint`, `npm run build` — all green.
3. `npm run svg:survey class`.
4. `npx jiti scripts/svg-conformance-census.ts class`.
5. `npx tsx tools/render-all.mts measurements/b8.json`.
6. `npx tsx tools/pin-diff.mts measurements/b7.json measurements/b8.json`
   (or the latest prior close's file if batch 7 has not closed yet — name
   which base was used in the journal).
7. For every riser, `dotEqual true→false` flip, or conformant-loss: a
   journal row naming the mechanism (must be one of T29/T30's, or a new
   one — if new, stop 3, halt). Confirm T30's own cross-engine gate result
   still holds at the merged tip (json/yaml/hcl/description/sequence
   suites unmoved or journaled).
8. Pin every fixture that is survey-`conformant` AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` (append `{slug, addedAt:
   "2026-09-2X", source: "cdd-b8"}`) plus its golden dir — copy the cached
   `in.svg` verbatim, verify with `cmp`.
9. `npx jiti scripts/dot-sync-report.ts class` — must stay ≥ 710/711 (stop
   6); commit the re-survey's `tests/oracle/svg-conformance/
   parity-class.json`.
10. `npm run parity:dashboard`; commit `docs/parity-report.md`.
11. `fixtures.md`: add (if absent) and fill the `after batch 8` column for the
    twelve scale/dpi slugs named across T29/T30's task files.
12. Tick batch 8 in `../README.md`'s batches table.
13. JSON-reporter collected count == on-disk test file count (stop 7).
14. Commit.

## Write-set

`tests/oracle/svg-conformance/parity-class.json`, `oracle/goldens/
svg-class/ratchet.json`, `oracle/goldens/svg-class/<newly-pinned slugs>/`,
`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b8.json`, `plans/class-divergence-drive/fixtures.md` (`after batch 8` column),
`plans/class-divergence-drive/decision-journal.md`, `plans/
class-divergence-drive/README.md` (tick only), `.agent-notes/
cdd-close-b8.md`.

## Acceptance criteria

- Given `pin-diff.mts`, then every mover has a journal row naming its
  mechanism (T29/T30), and no mover is unexplained
- Given the cross-engine suites, then each is unmoved or its mover is
  journaled (re-confirms T30's own gate at the merged tip)
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

Always: re-confirm T30's cross-engine gate at the merged tip, not just
trust its own task-local run. Ask first: accepting a
`structural-match`-only fixture into the ratchet (D3). Never: rebuild the
DOT cache or repoint the oracle jar symlink (D12); accept a `dotEqual
true→false` flip without a journaled mechanism (stop 4).

## Commit

`chore(cdd-b8): close batch 8 — re-pin after scale/dpi fixes`

Body: before/after survey and DOT-sync counts; ratchet pin count delta;
confirms cross-engine suites unmoved or journaled; count of journaled
risers with a one-line mechanism list.
