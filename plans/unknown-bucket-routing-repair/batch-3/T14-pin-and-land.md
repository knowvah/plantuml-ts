# T14 — pin, move, regenerate (orchestrator)

## Steps (sequential; journal wall-clock and every count)
1. `npx jiti scripts/pin-corpus-tree.ts unknown --tree
   test-results/dot-cache-unknown-2026-09-20 --ledger
   tests/oracle/svg-conformance/unknown-ledger --dry` → `unpinned: 0`, zero
   `fix-candidate`. Paste the tally.
2. Same without `--dry`. Then `git diff --numstat oracle/goldens/
   svg-conformance/` → exactly ONE deletion per file (the `$comment`); any
   other deletion is stop 6.
3. Re-derive the counts from the files (`node -e` over both JSONs: agree /
   misroute / jar-error / total / censused; total / jarErrors / erroring /
   rendering / gaps / non-activity defects) and write them into
   `routing-conformance.test.ts` and `refusal-coverage.test.ts` with a
   derivation comment in each file's own style, including how many
   `[FIXED]` retirements batch 2 produced. The non-activity defect list must
   still be exactly nuvoja (D7).
4. Add `{ type: 'unknown', slug: <localeCompare-first slug> }` to
   `oracle-freshness.test.ts` `SENTINELS` with a comment.
5. `mv test-results/dot-cache-unknown-2026-09-20 test-results/dot-cache/
   unknown` (leave the three JSON measurement files behind: move them to the
   scratchpad first).
6. `npx vitest run` the three gate files → green.
7. Alone on the box: `npx jiti scripts/dot-sync-report.ts --json
   tests/oracle/svg-conformance/dot-parity.json`; `npm run svg:survey`
   (zero `timeout` rows, else stop 7 after one c=2 re-run); `npm run
   parity:dashboard`. Read the `unknown` row; every `n/a` carries a reason.
8. Four gates. ONE commit: `test(ubrr-T14): pin and land the unknown oracle
   tree` — body: counts before/after, fixed vs pinned per cohort, `[FIXED]`
   retirements, survey verdicts for `unknown`.

## Acceptance criteria
1. Given the moved tree, when both gates run, then green, with the derived
   counts asserted and commented.
2. Given the two baselines, when diffed against the batch base, then every
   pre-existing row is byte-identical.
3. Given `docs/parity-report.md`, when the drift test runs, then it passes
   and the `unknown` row shows numeric oracle/survey/routing/refusal cells.

## Observability
N/A — the two gates and the drift test are the instrument; report wall-clock of
`npm test` against the planning baseline (stop 9 line: 2×).

## Rollback
Reversible: revert the commit; the renders are in git history from then on.
