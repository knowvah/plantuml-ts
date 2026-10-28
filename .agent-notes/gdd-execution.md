# gantt-divergence-drive (gdd) — execution observations

## Observation: the jar's canvas is `ensureVisible` over every primitive, not the block dimension
- **Context**: gdd T1b/T2a, xikovo-87-rosu902 (title or header + `hide footbox`, `svg/@height` 8 px short).
- **Finding**: `SvgGraphics.java:128-135` grows `maxX`/`maxY` on every drawn primitive (`svgLine` `:620-621`), seeded once with `minDim` in the constructor (`:143`); the root `width`/`height` is `format(maxY)` (`:801-813`). A text block may draw ink past its own `calculateDimension` (gantt `TimeHeaderSimple.java:145-146` draws day separators to `totalHeightWithoutFooter + 8`) and the jar's canvas simply covers it. Our `TextBlockExporter.ts` `exportMargin` arm sized the canvas from the stacked chrome dimension alone; since `0bedc6aa4` `drawBodyAt` hands back its klimt pass's canvas and `exportTo` floors at it.
- **Impact**: a canvas-only diff (`svg/@height`/`@width`, body byte-identical) under top chrome means ink outside the dimension, not a chrome-stacking bug. Instrument the body's `getMinMax` against `calculateDimension` before touching the chrome. The margin-baked arm (activity, class, sequence, description) was not measured for the same blind spot.
- **Confidence**: High

## Observation: Twemoji draws as vector paths, never `<image>`
- **Context**: gdd T0c/T1c, emoji in gantt separator names and note bodies.
- **Finding**: `Emoji.java:175-193` loads `<unicode>.svg` through `SvgSpriteParserFactory` and `drawU` emits `<path>` elements (five for the test glyph). An "expect one `<image>`" acceptance line was a planning slip.
- **Impact**: emoji fixtures diff on path counts/geometry; an `<image>` in our output for an emoji is itself a divergence.
- **Confidence**: High

## Observation: the string `'none'` paint is not `HColors.none()`
- **Context**: gdd T1a, xureco-57-lene839 (`style="stroke:none;"` on three transparent-link paths).
- **Finding**: `AbstractCommonUGraphic.ts:53,106-107` seed back/colour with the string `'none'`; upstream seeds the transparent `HColorSimple` singleton (`AbstractCommonUGraphic.java:61-62`, `HColors.java:133-135`), so `DriverPathSvg.java:64-68`'s `color.equals(back)` fast path never fired for a transparent `HColorSimple`. Fixed as an equality seam in `paintsEqual` (D1 option B); the representation mirror (option A, 10 consumer files) is filed in `planning/next-missions.md`.
- **Impact**: any `instanceof`/equality check between a `Paint` string and an `HColor` object is suspect; grep `NONE_PAINT` consumers before trusting a colour comparison.
- **Confidence**: High

## Observation: an all-engine chain can be resumed per engine after a crash
- **Context**: gdd b1 close, 2026-10-27/28; the session died to an out-of-memory kill with the chain at 4/28.
- **Finding**: `svg:survey` reads only `src/` (via the built renderer) and `test-results/dot-cache/<engine>/`; the per-engine `parity-<engine>.json` files are independent. With no `src/` change since the finished engines ran, `chain.sh <bN-eng> <remaining engines>` completes the set and `verdict-diff` is valid over the mixed run. At load ≈ 7 the full 28-engine chain takes 14 min; at load 8–12 (one concurrent heavy session) 48 min; at load 50–200 it never finishes.
- **Impact**: do not restart a chain from scratch after a crash; list the missing `parity-*.json` and pass the remaining engines. Check `uptime` and other sessions before starting one.
- **Confidence**: High

## Observation: packaging tests fail inside a task worktree
- **Context**: gdd T2a hand-back, 2026-10-28.
- **Finding**: `tests/unit/sprite-package-files`, `stdlib-package-files`, `stdlib-packages` (npm pack, LICENSE, asset listings) fail in a `mkwt.sh` worktree because `packages/*/assets` and `generated` are symlinks to the main checkout; the same files pass on the main checkout at the same commit.
- **Impact**: an agent reporting these four failures from a worktree has not broken packaging; confirm on the main checkout at the gates rather than chasing it.
- **Confidence**: High
