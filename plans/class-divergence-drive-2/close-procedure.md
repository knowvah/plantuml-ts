# Standard batch close

Every batch's close task (T10, T14, T16, T18, and batch 5's) runs these
steps. `N` = batch number, `prev` = the previous close's measurement file
(`b0.json` for batch 1). Agent: orchestrator. Tools resolve from
`plans/class-divergence-drive/tools/` (abbreviated `$T`).

## Steps

1. **Residual round (D4).** On the merged tree, run
   `npx jiti $T/render-diff.mts <batch's fixtures>`. For each residual
   whose mechanism is already stated in `diagnosis/`, fix it (one commit,
   gates, tests). For a residual with no stated mechanism, write its
   `final` as `open -> <owner>` instead of guessing (diagnosis mode).
2. Four gates: `npm test` (full suite, never a filter), `npm run
   typecheck`, `npm run lint`, `npm run build`. If the 1-min load average
   is above ~20, re-run a red `npm test` before believing it.
3. Confirm the JSON-reporter collected test-file count equals the on-disk
   count (stop 7; memory: coverage/.tmp can under-collect and exit 0).
4. `npm run svg:survey -- class --out tests/oracle/svg-conformance/parity-class.json`
   (never the positional form — it writes `parity.json`).
5. `npx jiti scripts/svg-conformance-census.ts class --json tests/oracle/svg-conformance/census-class.json` (without `--json` nothing is written — journal row 23).
6. `npx jiti $T/render-all.mts plans/class-divergence-drive-2/measurements/bN.json`.
7. `npx jiti $T/pin-diff.mts plans/class-divergence-drive-2/measurements/<prev>.json plans/class-divergence-drive-2/measurements/bN.json`
   and the same against the committed `parity-class.json` for `dotEqual`.
8. Journal one row per riser / `dotEqual` flip / conformant loss, each with
   its mechanism; classify by mechanism, never by group token (a riser
   whose STRUCTURAL count fell while numeric rose is a short-circuit
   reveal, not a regression). No mechanism → stop 5.
9. If the batch touched `src/core/`: re-run every other engine's survey the
   batch could reach and diff against its committed pin; journal movers
   (stop 4; >20 non-class movers → stop 13).
10. Pin every survey-conformant AND census-0-diff fixture into
    `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
    `in.svg` verbatim, verify with `cmp`). Re-pin the routing/refusal
    baselines and the gate tests' counts if they moved (prior mission:
    every close extends into these).
11. `npm run parity:dashboard`; `npm run catalog` if any module's public
    API changed (drift-gated).
12. Fill `fixtures.md` `final` for every row this batch settles; tick the
    batch row in `README.md`.
13. Commit `chore(cdd2-bN): close batch N — <conformant>/<structural>/<diverged>`,
    body: before/after counts, ratchet additions, each journaled riser's
    one-line mechanism, any non-class mover.

## Write-set

`measurements/bN.json`, `decision-journal.md`, `fixtures.md` (`final`,
group/task only when re-assigned), `README.md` (Done tick),
`oracle/goldens/svg-class/ratchet.json` + new `<slug>/golden.svg`,
`tests/oracle/svg-conformance/parity-class.json`, `census-class.json`,
routing/refusal baselines + their gate-test counts, `docs/parity-report.md`,
`docs/catalog.md`, plus the residual round's fix files (must be inside the
batch's union write-set, else stop 1).

## Acceptance criteria

- Given the four gates, when run on the full suite, then all pass and the
  collected count equals the on-disk count
- Given `pin-diff`, when compared with the previous close, then every
  rise/flip/loss has a journal row with a mechanism
- Given the ratchet, when inspected, then it holds no fixture that is not
  both survey-conformant and census 0-diff
- Given `fixtures.md`, when the close commits, then every row the batch
  owns has a non-empty `final`

## Observability · Rollback

N/A — measurement and pin task. Reversible: revert the close commit; pins
are committed with the code.

## Boundaries

Always: full suite; pin only D3-qualified fixtures. Ask first: any stop
condition. Never: rebuild the oracle cache or edit `oracle/pin.json` /
`oracle/dist/*` (D5); adopt an unjournaled riser (D4).
