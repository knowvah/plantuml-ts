# T0b — split the two core SVG driver files (pure move)

Agent: `refactoring-specialist` (sonnet), worktree `sdd3-T0b`. Commit:
`refactor(svg): split svg-shapes and svg-graphics-core under the cap`.
Read [../task-contract.md](../task-contract.md) first.

## Why
T2a ports `SvgGraphics#fillMe` and `DriverPathSvg`'s fore==back rule into
these files (D8); both already sit at the 500-line hook cap
(`src/core/svg-shapes.ts` 501, `src/core/klimt/drawing/svg/
svg-graphics-core.ts` 500), so any change is blocked until they are split.

## Task
Split each along an upstream boundary (e.g. `svg-graphics-core.ts`: the
`SvgGraphics` fill/stroke helpers vs element emission; `svg-shapes.ts`:
rect/ellipse vs path/polygon emitters — read both and choose the cleanest
seam, each new file with its JSDoc `@see` to the Java origin). Pure move:
no logic edits, no renamed exports; the old module re-exports what moved so
no caller or test changes. Do not edit tests.

## Write-set
`src/core/svg-shapes.ts`, `src/core/klimt/drawing/svg/svg-graphics-core.ts`,
and one new sibling file for each.

## Read-set
Both files in full; `docs/catalog.md` rows for both (run `npm run catalog`
after; the catalog drift test will otherwise fail).

## Acceptance
- Given both files, then each is ≤ 500 lines and the new siblings are too.
- Given `npx tsx $T/svg-hashes.mts --all <wt>/h.json $M/b0-hashes-all.json`,
  then it exits 0 (every fixture of every engine byte-identical — stop 7).
- Given `npm run typecheck` and the full unit suite for `tests/unit/core/**`,
  then both pass with no test edited.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
