# T0a — branch, b0 baseline, ledger, element census tool

Agent: orchestrator (main checkout, no worktree).

## Context
Planning measured main `8532ce8ba` (`measurements/plan-{probe,classify,elements}.json`).
The element census (per-tag count ours − jar per fixture) is what named the merge
mechanism; D7/D10 need it reproducible at every close, so it is committed.

## Task
1. `git checkout -b feat/activity-divergence-drive-2 main`; commit the brief
   (`docs(add2): mission brief`).
2. NEW `scripts/activity-probe-elements.ts` (conventions of `activity-probe.ts`:
   doc comment, `import.meta.url` CLI guard, the gate's seams
   `renderFixtureActivity` + `DeterministicMeasurer` + `{ includeStore:
   fixtureIncludeStore() }`). Per baseline row: `{ slug, ws, delta: {tag: ours−jar} }`
   for tags rect/polygon/line/path/ellipse/text; summary = shape classes
   (extra line+arrow, extra arrow only, extra line only, missing line+arrow,
   text-only, mixed, exact) with counts and ws. Flags `--json`, `--slugs a,b`.
   Unit test `tests/unit/scripts/activity-probe-elements.test.ts` on inline SVG
   pairs (pure functions only). `npm run catalog` if it changes.
3. b0: probe, classify, elements into `measurements/b0*.json`; every engine's
   survey into `measurements/b0-eng/parity-<e>.json` (`--out`, per engine).
4. `fixtures.md`: rows = cohort (un-pinned baseline, ws ≤ 150 at b0) ∪ the 38
   `error` rows ∪ add1's 67 `open -> add2` rows; columns slug | ws (b0) | element
   shape | add1 mechanism (if any) | task | mechanism | final. Journal row 1.
5. `measurements/mkwt.sh T0b`.

## Write-set
`plans/activity-divergence-drive-2/{fixtures.md,decision-journal.md,measurements/*}`,
`scripts/activity-probe-elements.ts`, `tests/unit/scripts/activity-probe-elements.test.ts`,
`docs/catalog.md`.

## Acceptance
- Given main `8532ce8ba`, when b0 runs, then Σ 31366 over 245 rows and the
  elements census reproduces `plan-elements.json` (99 extra line+arrow).
- Given `fixtures.md`, then every cohort/error/open-add1 row is present once.
- Given `npm test`, then collected = on-disk and the new unit test passes.

Observability: b0 files are the baseline. Rollback: Reversible.
