# Standard batch close (batches 0–4)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T`/`$M` as in README.

## Steps
1. **Merge.** Commit any pending `plans/` edit first (`merge-one.sh` refuses a
   dirty tree; never chain `git branch -D` on the same line). Then `bash
   $M/merge-one.sh <Tn> "<subject>" <task test paths>`: `--no-ff` merge,
   typecheck, the json/yaml/hcl golden ratchets, the structural gate, the
   extensions ratchet, the task's tests. Resolve a `docs/catalog.md` conflict
   with `npm run catalog`. Before removing worktrees: `ps -Ao pid,command | grep worktrees/jse-` and kill leftovers.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 12).
   `cmp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt` (stop 6).
3. **All engines.** `bash $M/chain.sh bN-eng`; `node $T/verdict-diff.mjs $M/<prev>-eng $M/bN-eng`.
   Only json/yaml/hcl may move; a conformant loss anywhere is stop 5.
4. **Extended mode (D6).** `npx tsx $T/extended-baseline.mts --check $M/extended-baseline.json`:
   journal every mover with its `FromSkinparamToStyle`/skin line (stop 7 if none).
   Rebaseline (`--write`) only after every mover is journaled.
5. **Family measurement.** Re-survey json/yaml/hcl into
   `tests/oracle/svg-conformance/parity-{json,yaml,hcl}.json`; run the structural
   gate and list every clean-but-unpinned row; append them to
   `oracle/goldens/json-family-structural.json` `clean` (never a ceiling — stop 10);
   pin new byte-conformant rows (`npx jiti $M/pin-json-family.mts <type> <slug>... --write`,
   then `npx jiti $M/repin-family-routing.mts --type <type> --write` and the two
   gates' running-count bumps). Re-pin extension examples whose move is journaled
   (`renderSync(source, { measurer: new DeterministicMeasurer() })`, the ratchet's own call).
   Diff every baseline JSON before and after: a pin that ROSE is an adopted regression.
6. **Ledger.** `fixtures.md`: counts row for `bN`; target-row table updated with the commit and the Java quote.
7. **Dashboard.** `npm run parity:dashboard` after any `parity-*.json` re-pin; `npm run catalog` if exports changed.
8. **Brief.** Tick the batch in `README.md` and its `overview.md`.
9. **Commit.** Full gates again if anything under `oracle/` or `tests/` changed
   in steps 4–7, then `chore(jse-bN): close batch N — <summary>` with explicit
   paths (never `git add plans/` while a chain writes `bN-eng/`).

## Write-set
`$M/bN*`, `$M/bN-eng/`, `$M/extended-baseline.json`, `decision-journal.md`,
`fixtures.md`, `README.md`, `batch-N/overview.md`,
`tests/oracle/svg-conformance/parity-{json,yaml,hcl}.json`,
`oracle/goldens/svg-{json,yaml,hcl}/**`, `oracle/goldens/json-family-structural.json`
(append to `clean` only), `tests/fixtures/extensions/{json,yaml,hcl}-*.svg`,
the routing/refusal pins and the two gates' count assertions,
`docs/parity-report.md`, `docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every change has a journal row with a mechanism and no engine lost a conformant row.
- Given the extended-mode check, then every mover is journaled.

Observability: N/A (measurement task). Rollback: Reversible.
