# Batch 4 close — B4 clusters

**Agent:** debugger · **Depends on:** T11, T12, T13, T14

## Task

1. Four gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run
   build`.
2. `npm run svg:survey class`.
3. `npx jiti scripts/svg-conformance-census.ts class`.
4. `npx tsx tools/render-all.mts measurements/b4.json`.
5. `npx tsx tools/pin-diff.mts measurements/b3.json measurements/b4.json`
   (or `measurements/base.json` if batch 3 has not closed — name which).
6. Journal one row per riser / `dotEqual` flip / conformant-loss in
   `decision-journal.md`, each with its mechanism (stop 5 if none found for
   a given transition — halt, do not adopt an unexplained rise).
7. Pin every fixture that is survey-conformant AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
   `in.svg` verbatim, verify with `cmp`).
8. Commit the re-surveyed `tests/oracle/svg-conformance/parity-class.json`.
9. `npm run parity:dashboard`.
10. Fill the `after batch 4` column in `fixtures.md` for: `bajotu-30-soku184`,
    `baneru-00-kuro607` (B3, not this batch — skip), `bejusa-95-gafo325`,
    `cocube-46-tusu692`, `dativu-93-pona469`, `dopuzi-50-muxo994`,
    `garumi-63-vuze973`, `mujopi-30-zadi566`, `pisobo-93-sipa138`,
    `runane-30-vena766`, `tibatu-28-jiro743`, `vusute-48-xono099`,
    `xitobu-41-lame230`, and every other B4-tagged row in `fixtures.md`.
11. Tick the batch-4 row in `README.md`'s batches table.
12. Confirm the JSON-reporter collected test count equals the on-disk
    test-file count (stop 7) before committing.
13. Commit `chore(cdd-b4): close batch 4 — <counts>` with the before/after
    survey counts (conformant / structural-match / diverged) in the body.

## Read-set

`README.md` (exit bar, stop conditions), `decisions.md` D3, D11, D12,
`fixtures.md` (B4 rows), `tools/README.md` (tool invocations).

## Write-set

`measurements/b4.json`, `decision-journal.md`, `oracle/goldens/svg-class/
ratchet.json` + new `<slug>/golden.svg` files,
`tests/oracle/svg-conformance/parity-class.json`, `fixtures.md` (`after batch 4`
column only), `README.md` (batch-4 `Done` checkbox only),
`docs/parity-report.md` (if `parity:dashboard` regenerates it).

## Acceptance criteria

- Given the four gates, then all pass with JSON-reporter count = on-disk
  count
- Given `pin-diff.mts` against the prior close, then every rise/flip/loss
  has a journal row with a mechanism, or the close halts (stop 5)
- Given the ratchet, then it contains no fixture that is not BOTH
  survey-conformant and census 0-diff
- Given `fixtures.md`, then every B4 row has its `after batch 4` column filled
- Given `README.md`, then the batch-4 row is ticked `[x]`

## Observability

N/A — no new observable operations; this is a measurement/pin task.

## Rollback

Reversible — revert the close commit; the ratchet and pins are committed
with the code, so reverting restores the prior pin state exactly.

## Quality bar

Same four gates as every task, plus the five close-specific commands above
all exiting 0 before the commit.

## Boundaries

Always: pin only survey-conformant AND census-0-diff fixtures (D3). Ask
first: any stop condition in `README.md`. Never: rebuild the oracle cache
(D12); adopt an unjournaled riser (D11, stop 5); edit `oracle/pin.json` or
`oracle/dist/plantuml-oracle.jar`.

## Commit

`chore(cdd-b4): close batch 4 — <conformant>/<structural-match>/<diverged>`

Body: before/after survey counts, ratchet additions count, any journaled
residuals from T13/T14 with their mechanism one-liners.
