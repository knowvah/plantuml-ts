# T0a — branch, b0 baseline, ledger, classify tool

Agent: orchestrator (main checkout, no worktree).

## Context
Planning measured main `d4e29cc8c` (`measurements/plan-{probe,survey,
classify}.json`): 0 conformant, Σ 60988 over 311, 75 rows ≤ 100. Those are
planning-time numbers; the mission's reference is `b0`, measured on the branch
after the brief is committed. The planning classifier (`tools/classify-scratch.
mts`) is uncommitted scratch; D7 wants it reproducible at every close.

## Task
1. `git checkout -b feat/activity-divergence-drive main`; commit the brief
   (`docs(add1): mission brief`).
2. `scripts/activity-probe-classify.ts` (NEW — `activity-probe.ts` is at 474
   lines): port `tools/classify-scratch.mts` to the repo's tool conventions
   (`activity-probe.ts`'s doc comment, `import.meta.url` CLI guard, same seams:
   `renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`
   + `compareSvg(..., 'deterministic')` + `weightedScore`). Output per row:
   `{ slug, ws, n, families: {path: count}, nonPos, shifts: {x[], y[]} }` and
   a summary (`nonPos === 0` count, uniform-shift count, family histogram by
   fixtures affected). Flags: `--json <out>`, `--slugs a,b`. Unit test in
   `tests/unit/scripts/activity-probe-classify.test.ts` on two inline SVG
   pairs (one pure shift, one with a childCount diff). `npm run catalog`.
3. `b0`: `npx tsx scripts/activity-probe.ts --json measurements/b0.json`;
   `npx tsx scripts/activity-probe-classify.ts --json measurements/b0-classify
   .json`; `npm run svg:survey -- activity --out measurements/b0-survey.json`;
   every other engine into `measurements/b0-eng/parity-<e>.json` (the full
   `npm run svg:survey` writes `parity-<type>.json` per type; copy them).
4. `fixtures.md`: correct any row whose `ws (plan)` differs at b0 (add a
   `ws (b0)` column); add rows that are ≤ 100 at b0 and missing; journal row 1
   with the counts.
5. `measurements/mkwt.sh T0b` for T0b's worktree (the script is committed in
   step 1).

## Write-set
`plans/activity-divergence-drive/{fixtures.md,decision-journal.md,
measurements/*}`, `scripts/activity-probe-classify.ts`,
`tests/unit/scripts/activity-probe-classify.test.ts`, `docs/catalog.md`.

## Read-set
`scripts/activity-probe.ts:1-60` (conventions), `tools/classify-scratch.mts`,
`tests/unit/scripts/activity-probe.test.ts` (test shape), `decisions.md#D7`.

## Acceptance
- Given main `d4e29cc8c`, when b0 runs, then survey 0/4/369, probe Σ 60988
  and classify's family histogram equal `plan-classify.json`'s on all 311.
- Given the ledger, when counted, then rows = fixtures with ws ≤ 100 at b0,
  each with its family set and shift pair.
- Given `mkwt.sh T0b`, when run, then a worktree with linked `node_modules`,
  `oracle/dist` and the `test-results` children exists.
- Given `npm test`, then collected = on-disk and the new unit test passes.

Observability: the b0 files ARE the SLI baseline. Rollback: Reversible.
