# Standard batch close (batches 0–3)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T`/`$M` as in README.

## Steps
1. **Merge.** Commit any pending `plans/` edit first (`merge-one.sh` refuses
   a dirty tree; never chain `git branch -D` on the same line). Then `bash
   $M/merge-one.sh <Tn> "<subject>" <task test paths>`: `--no-ff` merge,
   typecheck, the four family ratchets + the structural gate, the task's
   tests. Resolve a `docs/catalog.md` conflict with `npm run catalog`. Before
   removing worktrees: `ps -Ao pid,command | grep worktrees/ddc-` and kill
   leftovers.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 10). A
   "Test timed out" with no diff is load: `uptime`, rerun at `--maxWorkers=4`.
   `cmp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts` (stop 6; a diff
   confined to `RenderFragment` / `AssembledSvg` is quoted in the journal
   instead of halting).
3. **All engines (D6).** `bash $M/chain.sh bN-eng`; `node $T/verdict-diff.mjs
   $M/<prev>-eng $M/bN-eng`. Only json/yaml/hcl/files may gain; a conformant
   loss elsewhere is stop 4; a mover elsewhere is a journal row with its
   mechanism.
4. **Family measurement.** The chain writes `$M/bN-eng/parity-{json,yaml,hcl,files}.json`;
   list verdict counts, `errored`, firstDiff families (`jq -r
   '.fixtures[].firstDiff' | sed -E 's/\[[0-9]+\]//g' | sort | uniq -c`).
   Run the structural gate (`npx vitest run tests/oracle/svg-conformance/json-family-structural.test.ts`)
   and list every corpus/authored row that is clean but not in the manifest.
   Re-pin, only when every changed row moved toward the jar:
   `tests/oracle/svg-conformance/parity-{json,yaml,hcl,files}.json`; goldens
   (`npx jiti $M/pin-json-family.mts <type> <slug>... --write`,
   `npx jiti $M/pin-files.mts <slug>... --write`, then
   `repin-files-routing.mts --write`); the manifest `clean` list (append
   only; never a ceiling — stop 9); `oracle/goldens/svg-files/authored-baseline.json`.
   Diff every baseline JSON before and after: a pin that ROSE is an adopted
   regression.
5. **Ledger.** `fixtures.md`: counts row for `bN`; family table rows closed
   with the commit and the Java quote.
6. **Dashboard.** `npm run parity:dashboard` after any `parity-*.json`
   re-pin; `npm run catalog` if exports changed.
7. **Brief.** Tick the batch in `README.md` and its `overview.md`.
8. **Commit.** Full gates again if anything under `oracle/` or `tests/`
   changed in steps 4–6, then `chore(ddc-bN): close batch N — <summary>`
   with explicit paths (never `git add plans/` while a chain writes
   `bN-eng/`). Body: what merged, gate counts, movers, pins.

## Write-set
`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `tests/oracle/svg-conformance/parity-{json,yaml,hcl,files}.json`,
`oracle/goldens/svg-{json,yaml,hcl,files}/**` (goldens, `ratchet.json`,
`authored-baseline.json`), `oracle/goldens/json-family-structural.json`
(append to `clean` only), the routing/refusal pins, `docs/parity-report.md`,
`docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every change has a journal row with a
  mechanism and no other engine lost a conformant row.
- Given every other engine's golden ratchet, then it is green with no pin edited.

Observability: N/A (measurement task). Rollback: Reversible.
