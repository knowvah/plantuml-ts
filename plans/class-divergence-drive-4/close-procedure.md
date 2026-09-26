# Standard batch close

Every batch's close task runs these steps. `N` = batch number, `prev` = the
previous close's measurement (`b0.json` for batch 1). Agent: orchestrator.
`$T` = `plans/class-divergence-drive/tools/`, `$M` =
`plans/class-divergence-drive-4/measurements/`.

## Steps

1. **Residual round (D1).** On the merged tree, `npx jiti $T/render-diff.mts
   <batch's fixtures>`. For each residual whose mechanism is stated in
   `diagnosis/`, fix it (one commit, gates, tests; D4 write-set rules).
   A residual with no stated mechanism: `final` = `open -> <owner>`.
2. Four gates: `npm test` (full suite, never a filter), `npm run typecheck`,
   `npm run lint`, `npm run build`. If the 1-min load average is above ~20,
   re-run a red `npm test` before believing it.
3. JSON-reporter collected test-file count = `find tests -name '*.test.ts' | wc -l`
   (stop 7).
4. `npm run svg:survey -- class --out tests/oracle/svg-conformance/parity-class.json`
   (never the positional form — it writes `parity.json`). Save the prior
   file first to diff `dotEqual`.
5. `npx jiti scripts/svg-conformance-census.ts class --json tests/oracle/svg-conformance/census-class.json`
   (without `--json` nothing is written).
6. `npx jiti $T/render-all.mts $M/bN.json`; confirm its verdict counts equal
   the survey's.
7. `npx jiti $T/pin-diff.mts $M/<prev>.json $M/bN.json`, plus a `dotEqual`
   diff of old vs new `parity-class.json`.
8. Journal one row per riser / `dotEqual` flip / conformant loss with its
   mechanism, classified by mechanism (structural fall + numeric rise =
   reveal). No mechanism → stop 4/5.
9. If the batch touched `src/`: survey EVERY other engine
   (`npm run svg:survey -- <e> --out /tmp/cdd4-bN-eng/parity-<e>.json`)
   and diff verdicts + `dotEqual` against the T0 baseline
   (`$M/b0-eng/`), subtracting movers already journaled at earlier
   closes. Never compare to the committed engine pins (stale, D7).
   >20 new non-class movers → stop 9 (waived for T6 and T7b per D3/D4; every mover still needs a mechanism).
10. Pin every survey-conformant AND census-0-diff class fixture not yet in
    the ratchet: `npx jiti $T/pin-goldens.mts cdd4-bN close-bN <slug...>`
    (cmp-verified goldens, ratchet appended unsorted, routing/refusal twin
    rows cloned). Then bump the hard-coded counts in
    `tests/oracle/svg-conformance/{refusal-coverage,routing-conformance}.test.ts`
    by the pin count, with a derivation comment beside each, and run the
    ratchet + routing + refusal tests.
11. `npm run parity:dashboard`; `npm run catalog` if exports changed.
12. Fill `fixtures.md` `mechanism` + `final` for every row the batch
    settles; tick the batch in `README.md` and its `overview.md`.
13. Full `npm test` again (pins changed), then commit
    `chore(cdd4-bN): close batch N — <c>/<s>/<d>`; body: counts before →
    after, pins, each riser's one-line mechanism, non-class movers.

## Write-set

`$M/bN.json`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `oracle/goldens/svg-class/` (ratchet + goldens),
`oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
`tests/oracle/svg-conformance/{parity-class,census-class}.json`, the two
gate tests' counts, `docs/parity-report.md`, `docs/catalog.md`, plus the
residual round's fix files (D4).

## Acceptance criteria

- Given the gates, when run on the full suite, then all pass and collected = on-disk
- Given pin-diff vs `prev`, then every rise/flip/loss has a journal row with a mechanism
- Given the ratchet, then it holds no fixture that is not survey-conformant AND census 0-diff
- Given `fixtures.md`, then every row the batch settles has a non-empty `final`

## Observability · Rollback

N/A — measurement and pin task. Reversible (revert the close commit).
