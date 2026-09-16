# T0 — commit the measurement tools

**Agent:** orchestrator · **Depends on:** —

## Context

Two tools every task of this mission measures with lived only in awrl's
session scratchpad and are copied into [`../tools/`](../tools/): `diag-scan.mts`
(renders the 268 baseline fixtures through `renderFixtureActivity`, counts
`<line>` elements with both dx and dy > 0.01, pairing out `kill`/`end`
crosses — two 45° lines sharing one bounding box; calibrated to awrl's 19
at `6f1c04f7`) and `render-all.mts` (renders every baseline fixture to
`<dir>/<slug>.svg` for a per-slug `cmp`). The probe (`scripts/activity-
probe.ts`) is the pattern: `import.meta.url`-relative paths, a CLI guard,
pure functions exported for a unit test.

## Task

1. `scripts/activity-diag-scan.ts`: the scratch tool with repo-relative
   paths (no `/Users/...`), `--json <out>` and `--slugs a,b`; export the
   pure segment filter (`diagonalSegments(svg: string): string[]`) and unit
   test it in `tests/unit/scripts/activity-diag-scan.test.ts` (a cross is
   not counted; a 0.001 dx is not counted; a real diagonal is).
2. `scripts/activity-render-all.ts <dir> [--slugs a,b]`: same treatment.
3. Run both at HEAD: scan 0 fixtures; render-all twice into two dirs and
   `cmp` — 0 differences (determinism).
4. `measurements/base.json` is already awrl's `final.json` (aggregate
   49658); confirm `npx tsx scripts/activity-probe.ts --json <scratch>`
   reproduces it before any other task starts.

## Write-set

`scripts/activity-diag-scan.ts`, `scripts/activity-render-all.ts`,
`tests/unit/scripts/activity-diag-scan.test.ts`; `docs/catalog.md` on
drift (scripts are not catalogued today — verify).

## Acceptance criteria

- Given the 268 baseline fixtures at `3651a1ec`, when the scan runs, then
  it reports 0 fixtures with a diagonal
- Given an SVG with a `kill` cross, when `diagonalSegments` runs, then the
  two 45° lines are not returned
- Given render-all at HEAD twice, when `cmp` runs per slug, then 0 differ

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

`npm test` collects the new test file; typecheck, lint, build exit 0.
Build tooling: YAGNI applies, no extra flags.

## Commit

`chore(altp-T0): commit the activity diagonal scan and render-all tools`
