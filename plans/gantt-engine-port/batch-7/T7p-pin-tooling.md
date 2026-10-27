# T7p — gantt pin/re-pin tooling for the turn-on close (orchestrator scripts)

Agent: `typescript-pro` (sonnet), worktree `gep-T7p` (branch `gep/T7p`, off the
mission tip). Runs in parallel with T7c; merged before the b7 close. Commit:
`chore(gep): add the gantt pin and re-pin scripts (T7p)`. Journal row 77.

## What
The batch-7 close ([overview.md](overview.md) "Close (turn-on)") needs the
gantt twins of the wbs port's close tooling, adapted file-for-file:
`plans/wbs-engine-port/measurements/{pin-wbs.mts, repin-wbs-routing.mts,
repin-wbs-baseline.mts, pin-wbs.test.mts, vitest.config.mts}` →
`plans/gantt-engine-port/measurements/{pin-gantt.mts, repin-gantt-routing.mts,
repin-gantt-baseline.mts, pin-gantt.test.mts, vitest.config.mts}`.

## Differences to apply (read the gantt harness first)
- Engine slug `gantt`; goldens dir `oracle/goldens/svg-gantt/` whose manifests
  the gantt ratchets read: `ratchet.json` (`tests/oracle/svg-conformance/gantt.golden.ratchet.test.ts`),
  `diff-baseline.json` + `authored-baseline.json` (`gantt.diff-baseline.ratchet.test.ts`)
  — match their `RatchetFixture`/manifest shapes exactly; a pin dir holds
  `in.puml` + `golden.svg` per slug.
- Every render goes through `tests/oracle/svg-conformance/render-fixture-gantt.ts`
  (`ganttRenderOptions`, the recorded capture clock from `oracle/capture-clock.json`
  keyed `gantt/<slug>` / `fixtures/gantt/<name>`) — never a bare `renderSync`.
- Corpus rows: `test-results/dot-cache/gantt/<slug>/in.puml` + `in.svg` (265);
  authored rows: `tests/fixtures/gantt/<name>.puml` + `.svg` (51).
- Routing/refusal re-pin: whatever `routing-conformance.test.ts` /
  `refusal-coverage.test.ts` / `oracle-freshness.test.ts` read for the gantt
  rows (find the pin files they load; mirror what `repin-wbs-routing.mts` does
  for wbs).
- `--write` is the only mode that touches disk under `oracle/`; without it,
  print what would change. THIS TASK NEVER RUNS `--write`: the engine is not on
  the mission branch yet, a dry run must show the current "unknown diagram
  type" verdicts, and the test (`pin-gantt.test.mts`, as the wbs twin) uses a
  temp dir, never `oracle/`.

## Write-set
The five files above under `plans/gantt-engine-port/measurements/` only.
Nothing under `oracle/`, `tests/`, `src/`, `test-results/`.

## Acceptance
- `npx vitest run --config plans/gantt-engine-port/measurements/vitest.config.mts`
  green; `npx tsc --noEmit` on the scripts (as the wbs twins are checked) clean;
  eslint/prettier clean on the five files.
- A dry run of each script against the current branch prints its plan
  without writing (show the first lines in the hand-back).

Observability: N/A. Rollback: Reversible.
