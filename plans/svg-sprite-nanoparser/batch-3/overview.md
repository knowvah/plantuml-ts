# Batch 3 — NanoParser shapes and text

One task. Sequential on `SvgNanoParser.ts`, which T6 created — hence its own
batch rather than parallelism with T6.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | `SvgNanoParser` part 2: `drawCircle`, `drawEllipse`, `drawText`, `applyFillAndStroke`, `applyTransform` | typescript-pro | `src/core/klimt/sprite/SvgNanoParser.ts` + `svg-nanoparser-shapes.ts` + `svg-nanoparser-transform.ts` + `tests/unit/core/klimt/sprite/SvgNanoParser.test.ts` | T6 | [x] |

## Batch exit criteria

- All four quality gates green
- SVG goldens 310 / 22 / 57 byte-identical
- `npx tsx scripts/measure-description-size-deltas.ts` exits 0
- Still no rendered output change — nothing consumes the parser until T9

## Why this is its own batch

T6 and T8 write the same file, so they cannot be parallel. The maintainer
approved the split (2026-07-30) over a single 522-line task: one task per
commit at the 5–15 min target beats a shorter critical path here, because
`SvgNanoParser` is the class the mission is named for and a half-reviewed
522-line port is the expensive failure mode.

## Outcome (2026-07-30)

Landed; all gates green. 455 files / **11,139 tests**, typecheck/lint/build
exit 0, size-deltas **320/351, widened 0** — unmoved, as required while
nothing consumes the parser. Commit records the detail.

**Write-set grew by two files**, under the brief's complexity-hook
push-forward condition: the combined port peaked at 637 lines, over the
500-line ceiling. Split into `svg-nanoparser-shapes.ts` (266) and
`svg-nanoparser-transform.ts` (124), leaving `SvgNanoParser.ts` at 305.
Neither new module reads instance state, so both extract as free functions.

ADR-4 honoured: `drawEllipse` ships with **zero** corpus reach across all 34
bundles, tested against an authored `<ellipse>` fixture verified analytically
against `[cx±rx]×[cy±ry]`, since every `SEG_ARCTO` contributes only its
endpoint to `UPath`'s minmax.
