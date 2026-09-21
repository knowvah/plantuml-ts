# Batch 6 close — gates, re-pin, dashboard

**Agent:** debugger · **Depends on:** T18, T19, T20, T21, T22, T23

## Context

Batch 6 is the first re-pin since batches 4/5 landed (`measurements/
b5.json` is the prior fixed point per `README.md`'s batch table; use
`base.json` if b5 does not yet exist because 4/5 haven't executed).
T18-T23 each touch a disjoint slice of the classifier box/style render
path; this close proves the merged tree as a whole, not just the six
tasks' own named fixtures — every conformant/ratchet-pinned fixture must
be re-verified, since `Paint`-typing and the border/dash/icon-centring
changes touch shared render functions every classifier fixture calls.

## Steps

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build` — all green.
2. `npm run svg:survey class` — record the new conformant/structural-
   match/diverged counts.
3. `npx jiti scripts/svg-conformance-census.ts class`.
4. `npx tsx tools/render-all.mts measurements/b6.json`.
5. `npx tsx tools/pin-diff.mts measurements/b5.json measurements/b6.json`
   (or `base.json` if b5 doesn't exist yet). Journal one row per riser,
   `dotEqual` flip, or conformant-loss with its mechanism — stop 5 if any
   is unexplained. Expect falls at minimum for: `dizuse-83-dabi909`,
   `taceve-49-mezi408`, `capode-04-jeka075`, `dacixi-46-lina038`
   (T18); `remanu-84-sega129`, `picija-82-jebu272`, `tabaxa-70-pomu341`,
   `tagofo-84-nuti362`, `beruje-75-jimu270`, `curupe-50-kibu120`,
   `nesivu-99-cexu403` (T19); `nisune-86-faji869`, `gojatu-01-jibo986`,
   `sosono-24-vuro518`, `pakemi-72-cani346`, `vubofi-17-dedi529`,
   `zubevi-64-fume582` (T20); `bejeli-39-sina124`, `lilura-67-cati343`,
   `tepazu-23-zapo261`, `xidura-26-teki974` (T21); `conija-14-nuta580`,
   `niduni-65-bujo175`, `cacoma-43-poxu615` (T22); `cutasu-32-zete658`,
   `xogixe-78-zuro619` (T23).
6. Pin every fixture that is survey-conformant AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
   `in.svg` verbatim, verify with `cmp`).
7. Commit the re-surveyed `tests/oracle/svg-conformance/parity-
   class.json`.
8. `npm run parity:dashboard` — commit `docs/parity-report.md`.
9. `fixtures.md`: fill the `after B6` column for every T18-T23 fixture
   above, plus any other fixture the re-pin moved.
10. Tick batch 6's `[ ]` to `[x]` in `README.md`'s batches table.
11. JSON-reporter collected test count == on-disk test-file count
    (stop 7).
12. Commit.

## Write-set

`tests/oracle/svg-conformance/parity-class.json`,
`oracle/goldens/svg-class/ratchet.json`,
`oracle/goldens/svg-class/*/golden.svg` (new pins only),
`docs/parity-report.md`, `plans/class-divergence-drive/measurements/
b6.json`, `plans/class-divergence-drive/fixtures.md` (`after B6` column),
`plans/class-divergence-drive/decision-journal.md`,
`plans/class-divergence-drive/README.md` (tick only),
`.agent-notes/cdd-close-b6.md`.

## Acceptance criteria

- Given `pin-diff.mts b5.json b6.json`, then every transition carries a
  journal row naming its mechanism (stop 5 if any is unexplained)
- Given the four gates, then all exit 0
- Given a fixture that is survey-conformant AND census 0-diff, then it
  is pinned into `ratchet.json` with its `golden.svg` verified by `cmp`
- Given the JSON-reporter run, then collected count equals on-disk count
- Given `fixtures.md`, then every T18-T23-named fixture has its `after
  B6` cell filled

## Observability

N/A — no new observable operation.

## Rollback

Reversible for the pin/journal state — revert the close commit. Golden
SVGs added this batch are removed by the same revert (new files, no
prior version to restore).

## Quality bar

Same four gates as every task, plus survey/census/pin-diff/dashboard
must complete without a `timeout` verdict (stop 7) and without an
unexplained mover (stop 5). DOT parity must stay at or above 710/711
(stop 6).

## Boundaries

Always: treat every `pin-diff` transition as requiring a named
mechanism before it is adopted — an unexplained rise is stop 5, not a
number to accept. Ask first: any stop condition in `../README.md`.
Never: pin a fixture that is conformant on only one of survey/census
(D3); rebuild the DOT cache (D12); touch `oracle/pin.json` or the jar
symlink.

## Commit

`chore(cdd-b6): close batch 6 — classifier box & style re-pin`

Body: counts before/after (conformant/structural-match/diverged), new
ratchet pin count, and a one-line pointer to the journal rows for this
batch's transitions.
