# T5 — capture five families, re-pin, sentinels (orchestrator)

## Why orchestrator-only
Memory [[new-corpus-tree-trips-two-gates]]: a new `dot-cache/<type>/`
tree turns `routing-conformance.test.ts` and `refusal-coverage.test.ts`
RED on contact, and the re-pin must precede the capture commit. Only the
orchestrator holds that ordering.

## Steps
1. `for t in board chart chronology files packet; do npx jiti
   scripts/capture-oracle-cache.ts $t; done` — save each stdout JSON to
   the journal. Expected 4/29/1/1/6 = 41 entries.
2. Inspect: every captured dir has exactly `{in.puml,in.svg,.done}`;
   `grep -l "data-diagram-type" test-results/dot-cache/{board,...}/*/in.svg
   | wc -l`; note any jar error pages (needle per
   `refusal-coverage.test.ts` `isJarErrorPage`).
3. Re-pin routing and refusal the way the two gates' own headers say
   (each has a re-pin procedure; read them). Then
   `git diff oracle/goldens/svg-conformance/*.json` and CONFIRM: only
   ADDED rows for the 41 slugs; zero existing rows changed. An existing
   `agree`/`ok` flipping is stop 6.
4. Add one sentinel per new type to `oracle-freshness.test.ts`
   `SENTINELS` (line 96-113); run that file alone and check the collected
   count is non-zero.
5. Run the four gates. Commit ONE commit:
   `test(pdr-T5): capture oracle caches for board, chart, chronology,
   files and packet` — body lists counts and any jar-error slugs.

## Acceptance criteria
1. Given the 41 manifest fixtures, when captured, then every captured dir
   is exactly `{in.puml,in.svg,.done}` and the counts per type are in the
   journal.
2. Given the new trees, when re-pinned before the commit, then both gates
   are green on the commit and the baseline diff is additive-only.
3. Given one sentinel per new type, when `oracle-freshness.test.ts` runs,
   then it passes and its collected-file count is 1.

## Observability
N/A.

## Rollback
Reversible: delete the five directories and revert the two baselines and
the sentinel edit.

## Stop conditions that apply here
4 (jar misbehaves beyond the two findings), 6 (re-pin would flip an
existing row).
