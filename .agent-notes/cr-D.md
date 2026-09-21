# code-review-tasks.md batch D — dead code deletion (2026-09-21)

## Item 1 — activity `layout.old` engine

Dependency-closure verification (grep, not the ~10-file estimate in the
task text) found the closure was NOT "layout.old.ts + all 10
`activity-layout-*.ts` siblings":

- `activity-layout-constants.ts` is LIVE — imported directly by 11
  `tiles/*.ts` files and `activity-renderer-shapes.ts`, independent of
  `layout.old.ts`. NOT deleted.
- `activity-layout-types.ts` is PARTLY live — six of its interfaces
  (`ActivityNodeGeo`, `ActivityEdgeGeo`, `SwimlaneGeo`, `SwimlaneBandGeo`,
  `SwimlaneDividerY`, `ActivityGeometry`) are imported directly by
  8 live `layout/**` files, not only via `layout.old.ts`'s re-export.
  Its other four exports (`BranchResult`, `BranchResultInternal`,
  `LayoutSequenceFn`, `LayoutCtx`) were dead-cluster-only.
  Relocated the live six to a new `activity-geometry.types.ts`
  (verbatim docs/@see), then deleted the whole original file.
- The other 9 siblings (`fork`, `helpers`, `if`, `leaf`, `measure`,
  `repeat`, `sequence`, `swimlane`, `while`) had zero importers outside
  the cluster — confirmed deletable.

Deleted: `layout.old.ts` + the 9 siblings above + `activity-layout-types.ts`
(2250 LOC) + `tests/unit/activity/layout.test.ts` (748 LOC, exercised only
`layoutActivity`, the dead entry point).

**Knock-on dead constants found**: deleting the cluster made 5 of
`activity-layout-constants.ts`'s 18 exports unreachable too —
`NOTE_SIDE_GAP`, `SWIMLANE_HEADER_H`, `SWIMLANE_MIN_WIDTH`,
`DEFAULT_WIDTH`, `LAYOUT_MARGIN` were imported ONLY by the deleted
files (`LAYOUT_MARGIN` here is a distinct, same-named constant from
`layout/tile-coordinates.ts`'s own live `LAYOUT_MARGIN` — two separate
symbols, same value 12, same name, different modules). Removed all
five plus the stale doc citing `layout.old.ts:53` as the reason
`SWIMLANE_HEADER_H` couldn't be retired (that reason is now moot).

Repointed every live `import type {...} from '.../layout.old.js'` and
`'.../activity-layout-types.js'` (8 src files, 8 test files spanning
`tests/unit/activity/**` and `tests/diagrams/activity/layout/**`) to
`activity-geometry.types.js`. `tests/diagrams/activity/layout/**` is
outside the brief's stated write-set, but repointing was mandatory —
the deletion breaks those imports otherwise; this is collateral of the
deletion, not scope creep.

Left untouched (deliberately): comments in `walk-while-branch.ts`,
`gtile-while.test.ts`, `loop-routing.test.ts`,
`swimlane-loop-translate-while.test.ts` that mention `layout.old.ts` as
historical prose ("grep shows no reader ... outside ... layout.old.ts")
— none are live symbol references, all describe past-mission decisions,
same treatment as `planning/`/`.agent-notes/` history prose.

## Item 2 — archived mission scripts

All four scripts verified zero code/CI references (only prose mentions
in `plans/**/*.md`, `.agent-notes/*.md`, `planning/*.md`) before
deletion. Confirmed `pin-activity-baselines.ts` (deleted, archived) is
never imported/executed anywhere — the live `scripts/repin-activity-*.ts`
family is a different, unrelated set of files (substring-matched in an
early grep pass, verified not aliased).

## Config sweep

`tsconfig.json`, `tsconfig.node.json`, `vitest.config.ts`,
`eslint.config.ts` — none name any deleted file; all use directory
globs. No changes needed.

## Surprising finding: stdlib build lock does not protect across worktrees

Not in this batch's write-set; reported for the orchestrator/an infra
mission, not fixed here.

**Observed**: `npm test` intermittently but reproducibly failed 18 tests
across `tests/unit/stdlib-all-exports.test.ts`,
`tests/unit/stdlib-package-files.test.ts`,
`tests/unit/sprite-package-files.test.ts`,
`tests/unit/stdlib-packages.test.ts`, `tests/integration/stdlib-remote-e2e.test.ts`
with `Cannot find module '.../packages/stdlib-*/generated/*.js'`, even
though the file demonstrably existed on disk before and after each
failing run (`node -e "import(...)"` succeeded moments apart) — none of
these files or their dependencies were touched by this batch.

**Mechanism**: `tests/helpers/with-stdlib-build-lock.ts`'s `REPO_ROOT`
is computed from its own file location, two directories up — i.e. the
CALLING WORKTREE's checkout root, a different absolute-path string per
worktree. `scripts/build-stdlib-packages/build-lock.ts:136-138`
(`defaultLockPath`) SHA256-hashes that `repoRoot` string to derive the
lock file path under `os.tmpdir()`. Two sibling worktrees therefore
compute two DIFFERENT lock files, even though `packages/*/generated/`
is a symlink (`packages/stdlib-aws/generated ->
.../plantuml-ts/packages/stdlib-aws/generated`) shared by every
worktree, pointing at ONE physical directory in the main checkout. The
cross-process lock added by `stdlib-build-race`/`stdlib-run-isolation`
(`.agent-notes/sre-T0.md`, `.agent-notes/sri-T0.md`) protects
same-worktree concurrent processes only; it provides zero mutual
exclusion between worktrees, so a sibling worktree's concurrent
`buildStdlibPackages()` rmSync-to-rewrite window can still be observed
by this worktree's readers, reproducing the exact `ENOENT`/`Cannot find
module` signature those missions set out to close.

**Confidence**: High — read `build-lock.ts:136-138` and
`with-stdlib-build-lock.ts`'s own `REPO_ROOT` doc comment directly; the
`[build-stdlib-packages] stdlib-aws: skip -- generated/ content hash
already matches` log line in the failing run proves THIS worktree's own
lock/skip logic considered the tree fine, ruling out a bug in this
worktree's own build step.

**Not fixed here**: out of batch D's write-set (`tests/helpers/`,
`scripts/build-stdlib-packages/`) and unrelated to activity dead-code
deletion. None of the 18 failures are oracle/ratchet/conformance/
baseline-pin tests, so the brief's STOP condition does not apply.
