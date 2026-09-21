# Batch 9 close — B9 dispatch, hide, chrome

**Agent:** debugger · **Depends on:** T31, T32, T33, T34

## Task

1. Four gates: `npm test` (full suite — T32/T34's mainframe fix touch
   shared seams), `npm run typecheck`, `npm run lint`, `npm run build`.
2. `npm run svg:survey class`.
3. `npx jiti scripts/svg-conformance-census.ts class`.
4. `npx tsx tools/render-all.mts measurements/b9.json`.
5. `npx tsx tools/pin-diff.mts measurements/b8.json measurements/b9.json`
   (or the latest closed batch's file if batch 8 has not closed — name
   which).
6. Journal one row per riser / `dotEqual` flip / conformant-loss in
   `decision-journal.md`, each with its mechanism (stop 5 if none found).
   Pay special attention to non-class engines: T32's dispatcher fix and
   T34's `chrome.ts`/mainframe fix are shared-seam changes — confirm
   every OTHER diagram type's survey/DOT-parity counts are unmoved, or
   journal the mover with its mechanism (stop 4).
7. Pin every fixture that is survey-conformant AND census 0-diff into
   `oracle/goldens/svg-class/ratchet.json` + `<slug>/golden.svg` (copy
   `in.svg` verbatim, verify with `cmp`).
8. Commit the re-surveyed `tests/oracle/svg-conformance/parity-class.json`.
9. `npm run parity:dashboard`.
10. Fill the `after batch 9` column in `fixtures.md` for every B9-tagged row:
    the 3 full E5 fixtures (`cicovi-23-zipe215`, `senece-96-fomu913`,
    `verufu-58-jile750`) plus its 11 partial fixtures, the 4 ORA5a
    fixtures (`bidusa-22-jutu505`, `cuzoga-39-tufu259`,
    `jevuvi-65-dipo437`, `ruliki-78-biji661`), `sadamo-18-siva346`
    (ORA5b), `luzive-62-zote562` (ORA5c), `zirori-93-jefo337` (STY6),
    `bufogi-69-naba929`, `gevuci-69-fafe469`, `jakaja-15-faze022`,
    `jinoba-14-firi471`, `laluve-92-raxu863`, `cukaze-78-zija070`
    (E14/n-ary diamond), `bijevi-38-duza931` (ENT5 — E5 partial).
11. Tick the batch-9 row in `README.md`'s batches table.
12. Confirm the JSON-reporter collected test count equals the on-disk
    test-file count (stop 7) before committing.
13. Commit `chore(cdd-b9): close batch 9 — <counts>` with the
    before/after survey counts (conformant / structural-match /
    diverged) in the body, and note any non-class-engine mover.

## Read-set

`README.md` (exit bar, stop conditions), `decisions.md` D3, D11, D12,
`fixtures.md` (B9 rows), `tools/README.md` (tool invocations).

## Write-set

`measurements/b9.json`, `decision-journal.md`, `oracle/goldens/svg-class/
ratchet.json` + new `<slug>/golden.svg` files, `tests/oracle/
svg-conformance/parity-class.json`, `fixtures.md` (`after batch 9` column
only), `README.md` (batch-9 `Done` checkbox only), `docs/parity-report
.md` (if `parity:dashboard` regenerates it).

## Acceptance criteria

- Given the four gates, then all pass with JSON-reporter count = on-disk
  count, run against the FULL suite (not a class-only filter)
- Given `pin-diff.mts` against the prior close, then every rise/flip/loss
  has a journal row with a mechanism, or the close halts (stop 5)
- Given every non-class diagram type's DOT-parity/survey counts, then
  they are unmoved, or each mover is journaled with a mechanism (stop 4)
- Given the ratchet, then it contains no fixture that is not BOTH
  survey-conformant and census 0-diff
- Given `fixtures.md`, then every B9 row has its `after batch 9` column filled
- Given `README.md`, then the batch-9 row is ticked `[x]`

## Observability

N/A — no new observable operations; this is a measurement/pin task.

## Rollback

Reversible — revert the close commit; the ratchet and pins are committed
with the code, so reverting restores the prior pin state exactly.

## Quality bar

Same four gates as every task, plus the five close-specific commands
above all exiting 0 before the commit.

## Boundaries

Always: pin only survey-conformant AND census-0-diff fixtures (D3);
check non-class engines' counts explicitly (T32/T34 touched shared
files). Ask first: any stop condition in `README.md`. Never: rebuild the
oracle cache (D12); adopt an unjournaled riser (D11, stop 5); edit
`oracle/pin.json` or `oracle/dist/plantuml-oracle.jar`.

## Commit

`chore(cdd-b9): close batch 9 — <conformant>/<structural-match>/<diverged>`

Body: before/after survey counts, ratchet additions count, any
journaled residuals (especially T34's `cukaze` instrument result and
any non-class-engine mover from the shared `dispatcher.ts`/`chrome.ts`
changes) with their mechanism one-liners.
