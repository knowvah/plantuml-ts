# Batch 2 close — re-pin, ratchet, after-B2 column

**Agent:** debugger · **Depends on:** T5, T6, T7

## Context

B2 is render-only (D2): no DOT node/cluster geometry should move except the
named A5 M5 direction flip and A2a M4's dashed-carry, both measured in T6.
This close re-pins once (D11) against batch 1's `b1.json` and fills the
`after batch 2` column of `fixtures.md`.

## Steps

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build` — all green.
2. `npm run svg:survey class`; `npx jiti scripts/svg-conformance-census.ts
   class`; record both.
3. `npx tsx tools/render-all.mts measurements/b2.json`.
4. `npx tsx tools/pin-diff.mts measurements/b1.json measurements/b2.json`.
   Journal one decision-journal row per riser, `dotEqual` flip, or
   conformant→non-conformant transition, each with its mechanism (stop 5 if
   any is unexplained). Expected movers toward conformant: T6's 7 direction
   fixtures, `canuti`, `camuna`, `cenubi`, `fitini`, `guxode`, `nixema`,
   `gikipi`, `gixesa`. No other slug should move — anything else is a
   regression, not a bonus.
5. `npx jiti scripts/dot-sync-report.ts class` — must still read 710/711.
6. Pin every fixture that is survey-conformant AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
   `in.svg` verbatim; verify with `cmp`).
7. `npm run svg:survey class`; commit the re-surveyed
   `tests/oracle/svg-conformance/parity-class.json`.
8. `npm run parity:dashboard`; commit `docs/parity-report.md`.
9. `fixtures.md`: fill the `after batch 2` column for
   every row whose `buckets` column contains `B2` with that fixture's
   survey verdict at this close.
10. Tick batch 2's `[ ]` to `[x]` in `README.md`'s batches table.
11. JSON-reporter collected test count == on-disk test file count (stop 7).
12. Commit.

## Write-set

`tests/oracle/svg-conformance/parity-class.json`, `oracle/goldens/svg-class/
ratchet.json`, `oracle/goldens/svg-class/<slug>/golden.svg` (new pins only),
`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b2.json`, `plans/class-divergence-drive/fixtures.md`,
`plans/class-divergence-drive/decision-journal.md`,
`plans/class-divergence-drive/README.md` (tick only),
`.agent-notes/cdd-close-b2.md`.

## Acceptance criteria

- Given `pin-diff.mts b1.json b2.json`, then every transition has a
  journaled mechanism and none is unexplained
- Given the four gates, then all exit 0
- Given `dot-sync-report.ts class`, then the fraction is still 710/711
- Given `fixtures.md`, then every `B2`-bucket row has a filled `after batch 2`
  cell
- Given the JSON-reporter run, then collected count equals on-disk count

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the close commit; a newly-added golden directory is
removed with it (no orphaned pin left in `ratchet.json`).

## Quality bar

Same four gates, plus the survey/census/pin-diff/dashboard sequence
completing without a `timeout` verdict (stop 7) and without an unexplained
mover (stop 5).

## Boundaries

Always: treat any pin-diff transition without a stated mechanism as
unresolved — halt, don't adopt it. Ask first: nothing beyond the README
stop conditions — this is an accounting close. Never: rebuild the DOT
cache or repoint the oracle symlink (D12); pin a fixture that is
survey-conformant but census non-0-diff, or vice versa (D3).

## Commit

`chore(cdd-b2): close batch 2 — B2 link render-only`

Body: counts before/after (survey, census, ratchet pin count, DOT
fraction); names the fixtures pinned this batch.
