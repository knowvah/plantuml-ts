# Batch 5 close — B3 link layout features

**Agent:** debugger · **Depends on:** T15, T16, T17

## Task

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build`.
2. `npm run svg:survey class`.
3. `npx jiti scripts/svg-conformance-census.ts class`.
4. `npx tsx tools/render-all.mts measurements/b5.json`.
5. `npx tsx tools/pin-diff.mts measurements/b4.json measurements/b5.json`.
6. Journal one row per riser / `dotEqual` flip / conformant-loss in
   `decision-journal.md`, each with its mechanism (stop 5 if none found —
   halt, do not adopt an unexplained rise). Pay particular attention to
   T15's DOT-parity gate (must stay 710/711 or the exact new count is
   named) and T17's step-1 blast-radius fixtures.
7. Pin every fixture that is survey-conformant AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
   `in.svg` verbatim, verify with `cmp`).
8. Commit the re-surveyed `tests/oracle/svg-conformance/parity-class.json`.
9. `npm run parity:dashboard`.
10. Fill the `after batch 5` column in `fixtures.md` for every B3-tagged row,
    including `baneru-00-kuro607`, `camuna-58-veca254`, `nafiki-56-jixu680`,
    `lazeju-60-boki114`, `mefike-75-vova900`, `xifuza-00-paze682`,
    `pijiju-95-xexi872`, `jakapi-64-tine258`, `mugobo-34-fede498`,
    `nenexe-35-zere033`, and the remaining LNK1/LNK7/LNK8/LNK10-tagged rows.
11. Tick the batch-5 row in `README.md`'s batches table.
12. Confirm the JSON-reporter collected test count equals the on-disk
    test-file count (stop 7) before committing.
13. Commit `chore(cdd-b5): close batch 5 — <counts>` with the before/after
    survey counts (conformant / structural-match / diverged) in the body.

## Read-set

`README.md` (exit bar, stop conditions), `decisions.md` D3, D6, D11, D12,
`fixtures.md` (B3 rows), `tools/README.md` (tool invocations).

## Write-set

`measurements/b5.json`, `decision-journal.md`, `oracle/goldens/svg-class/
ratchet.json` + new `<slug>/golden.svg` files,
`tests/oracle/svg-conformance/parity-class.json`, `fixtures.md` (`after batch 5`
column only), `README.md` (batch-5 `Done` checkbox only),
`docs/parity-report.md` (if `parity:dashboard` regenerates it).

## Acceptance criteria

- Given the four gates, then all pass with JSON-reporter count = on-disk
  count
- Given `pin-diff.mts` against `measurements/b4.json`, then every
  rise/flip/loss has a journal row with a mechanism, or the close halts
  (stop 5)
- Given `tests/oracle/class-dot-parity.test.ts`, then it is re-confirmed at
  710/711 or the new count is named and journaled (D6 flagged this batch as
  DOT-node-size-moving)
- Given the ratchet, then it contains no fixture that is not BOTH
  survey-conformant and census 0-diff
- Given `fixtures.md`, then every B3 row has its `after batch 5` column filled
- Given `README.md`, then the batch-5 row is ticked `[x]`

## Observability

N/A — no new observable operations; this is a measurement/pin task.

## Rollback

Reversible — revert the close commit; the ratchet and pins are committed
with the code, so reverting restores the prior pin state exactly.

## Quality bar

Same four gates as every task, plus the five close-specific commands above
all exiting 0 before the commit.

## Boundaries

Always: pin only survey-conformant AND census-0-diff fixtures (D3); confirm
the DOT-parity gate explicitly given T15's node-size changes. Ask first:
any stop condition in `README.md`. Never: rebuild the oracle cache (D12);
adopt an unjournaled riser (D11, stop 5); edit `oracle/pin.json` or
`oracle/dist/plantuml-oracle.jar`.

## Commit

`chore(cdd-b5): close batch 5 — <conformant>/<structural-match>/<diverged>`

Body: before/after survey counts, ratchet additions count, the DOT-parity
gate's final count, any journaled residuals from T16 with their mechanism
one-liners.
