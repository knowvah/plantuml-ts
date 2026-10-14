# ufp-T3-cov — authored utility fixtures

## Observation: the GPL jar's license page height is random in a multi-file run
- **Context**: capturing `license`/`licence`/`LICENSE` oracles in one `oracle-render.sh` call with 37 other files.
- **Finding**: same content, `svg/@height` 773, 834 or 842 across runs. `FlashCodeUtilsZxing#exportFlashcode` returns null when `lock.tryLock()` fails (FlashCodeUtilsZxing.java:60, :76), so a concurrent render makes `AtomImg.createQrcode` use the 10x10 blank (AtomImg.java:94-95); `PSystemLicense` builds its TextBlock separately for `calculateDimension` and `drawU`, so the canvas can be sized from the blank row. Rendered one file per run: 842 px in 9 of 9. Every other row was byte-identical across three batch runs.
- **Impact**: render any page with `<qrcode:>` one file per jar run. The MIT port has no such race (FlashCodeUtilsNone).
- **Confidence**: High (measured; `plans/utility-factories-port/measurements/T3-cov/oracle-stability.txt`)

## Observation: four DedicationSimple sentences can never match
- **Context**: authoring "two more DedicationSimple sentences".
- **Finding**: `Dedications.get` tries a line only when it is longer than 25 chars (Dedications.java:92). `linux_china` (11), `arkban` (6), `Ben and Jen 2020` (16) and `baraye` (6) are all 25 or shorter, so the jar shows a Syntax Error page for them. The port has the same gate (`src/diagrams/dedication/Dedications.ts:22`). Rows `cov-dedication-linux-china` and `-ben-and-jen` pin the refusal.
- **Impact**: only 6 of the 10 dedication PNGs can ever be drawn. Do not author fixtures expecting the other 4 to draw.
- **Confidence**: High (jar probes)

## Observation: our sequence refusal index also ignores lines the skin cut removed
- **Context**: `cov-noise-not-noise` (`Skinparam backgroundColor red` + `openiconic lightbulb`).
- **Finding**: the sequence parser sees `source.lines` = `["openiconic lightbulb"]` (the skinparam line is removed before it), so it refuses with line 0 / consumed 0, while class says line 2 / consumed 2. Patching `src/diagrams/sequence/parser.ts:266` to `origIndex + 1` fixes the 15 plain 4-line refuse rows (class -> sequence) but leaves this one: the index has to come from the line's full-source position. This extends the ufp-T2a note "our sequence engine refuses with consumed 0".
- **Impact**: a fix for the class-vs-sequence error-page name has to map to full-source positions, not just add 1.
- **Confidence**: High (controlled experiment, `experiment-error-step3b-*.json`; per-plugin probe)

## Observation: `listsprite` on a 4-line source reaches the unported ListSpriteDiagramFactory
- **Context**: `cov-refuse-listsprite` (refusal parity).
- **Finding**: the jar falls through to `ListSpriteDiagramFactory` (PSystemBuilder.java:170). Its `CommandListSprite` accepts `listsprites?` and does nothing (CommandListSprite.java:58, :69-70), so the jar draws an empty 21x21 page with `data-diagram-type="HELP"`. The port has no such factory, so every candidate refuses and we draw an error page.
- **Impact**: the only authored row where we error and the jar draws; it is recorded as `parityGap` in `authored-baseline.json`. Fixing it needs a new plugin plus registration in `src/index.ts`.
- **Confidence**: High

## Observation: the error-page listing ignores tab stops
- **Context**: `cov-charlie-leading-tab` (`\tcharlie`).
- **Finding**: the jar draws the listing line at x 35.8: `TileText#drawU` moves a `\t` to the next multiple of eight spaces' width (TileText.java:82-84, :94-104). `src/core/error/error-page-exact.ts:178-198` handles only leading spaces, so we draw at x 5.
- **Impact**: any error page whose listing has a tab is off by one diff. This is core code, reported rather than fixed.
- **Confidence**: High
