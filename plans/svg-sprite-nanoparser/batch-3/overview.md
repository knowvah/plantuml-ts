# Batch 3 — NanoParser shapes and text

One task. Sequential on `SvgNanoParser.ts`, which T6 created — hence its own
batch rather than parallelism with T6.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | `SvgNanoParser` part 2: `drawCircle`, `drawEllipse`, `drawText`, `applyFillAndStroke`, `applyTransform` | typescript-pro | `src/core/klimt/sprite/SvgNanoParser.ts` (+ `.test.ts`) | T6 | [ ] |

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
