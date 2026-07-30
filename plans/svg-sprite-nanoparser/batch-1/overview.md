# Batch 1 — Foundations

Four tasks, all parallel: no interdependencies, no shared write targets.
Nothing in this batch changes rendered output — T1–T3 add new files, T4 is
additive-only. All existing behavior must be byte-identical after this batch.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Port `openiconic/SvgPath.java` — `d` → `UPath` | typescript-pro | `src/core/klimt/sprite/SvgPath.ts` + `tests/unit/core/klimt/sprite/SvgPath.test.ts` | — | [x] |
| T2 | Port `emoji/ColorResolver.java` | typescript-pro | `src/core/klimt/sprite/ColorResolver.ts` + `tests/unit/core/klimt/sprite/ColorResolver.test.ts` | — | [x] |
| T3 | Port `emoji/UGraphicWithScale.java` | typescript-pro | `src/core/klimt/UGraphicWithScale.ts` + `tests/unit/core/klimt/UGraphicWithScale.test.ts` | — | [x] |
| T4 | `AtomImageResolver` discriminated union (ADR-2) | typescript-pro | `src/core/creole-atoms.ts` (+ producers/draw sites, see journal) | — | [x] |

## Batch exit criteria

- All four quality gates green
- `npx tsx scripts/measure-description-size-deltas.ts` exits 0
- SVG goldens 310 / 22 / 57 byte-identical
- **No rendered output changed** — this batch is purely additive

## Note on T4

T4 must be additive: nothing emits the `drawable` variant until T9, so every
existing consumer keeps compiling. Verify specifically that
`EntityImageDescriptionDelegates.ts#dimensionOf` (`:127-133`), which
destructures `{width, height}` off the resolver result, compiles unchanged —
both variants carry the declared box, which is the point of ADR-2's shape.

## Outcome (2026-07-30)

All four tasks landed; all gates green. `npm test` 452 files / 11,083 tests,
typecheck/lint/build exit 0, `measure-description-size-deltas.ts` at
**320/351 (91.2%), widened 0** — identical to the pre-batch baseline, so the
"no rendered output changed" criterion holds.

Two corrections to this batch as written, both recorded in
`../decision-journal.md`:

1. **T4 could not be additive.** Its acceptance criteria ("no consumer
   modified") are impossible against ADR-2's own shape. Maintainer approved
   extending T4 with the mechanical discriminant plumbing across both
   producers and both draw sites.
2. **The test write-sets pointed at `src/`,** where `vitest.config.ts`'s
   `include` glob cannot see them — all 54 new tests would have been silently
   skipped. Relocated to `tests/unit/core/klimt/`, matching the repo's actual
   convention (zero pre-existing colocated `src` tests).

Carried into batch 2: T2's `ColorResolver` returns `ResolvedColor` while
T3's structural interface expects `Paint` — T6/T8 must reconcile. T3's
`XAffineTransform` is the one to consume; do not add a third path.
