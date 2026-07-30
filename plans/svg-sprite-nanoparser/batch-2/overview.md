# Batch 2 — Parser core + renderer seam

Three tasks, all parallel: distinct write-sets, dependencies all satisfied by
Batch 1.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Re-express `pathBBox` over `UPath` | typescript-pro | `src/core/klimt/sprite/svg-path-bbox.ts` | T1 | [x] |
| T6 | `SvgNanoParser` part 1: `getData`, `drawU` dispatch, `<g>` stack, `drawPath` | typescript-pro | `src/core/klimt/sprite/SvgNanoParser.ts` + `tests/unit/core/klimt/sprite/SvgNanoParser.test.ts` | T1, T2, T3 | [x] |
| T7 | `drawAtoms` handles the `drawable` variant | typescript-pro | `src/core/svek/image/EntityImageDescriptionSupport.ts` + `tests/unit/core/svek/image/EntityImageDescriptionSupport.test.ts` | T4 | [x] |

## Batch exit criteria

- All four quality gates green
- `npx tsx scripts/measure-description-size-deltas.ts` exits 0
- SVG goldens 310 / 22 / 57 byte-identical
- **Still no rendered output change** — nothing emits `drawable` until T9, so
  T7's new branch is unreachable in production paths this batch. That is
  expected, and it is why T7 ships with its own unit tests rather than
  relying on fixtures.

## Note on T5

T5 is the ADR-1 equivalence proof. Its existing test suite must pass
**unmodified**. Editing a `pathBBox` test to accommodate the new
implementation destroys the evidence and is a STOP (README stop condition 7).

## Outcome (2026-07-30)

All three landed; gates green. `npm test` 454 files / 11,106 tests,
typecheck/lint/build exit 0, size-deltas **320/351, widened 0** — unchanged,
so "still no rendered output change" holds. ADR-1's equivalence proof came
back clean: 46/46 `pathBBox`-covering tests pass unmodified.

**Batch 3 is BLOCKED pending a maintainer ruling.** T6 accumulates the `<g
transform>` stack, but nothing applies it to path geometry, and T8's
`drawEllipse` needs `UPath.affine`. See the decision journal's final row for
the mechanism, the ~40-line sizing, and the corpus reach.
