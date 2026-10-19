# T6e report: dpi-scale-double-rounding

Commit 83cd84f73 (unsigned). Files: src/diagrams/description/index.ts, src/core/assemble-svg.ts (core; `finalizeDescriptionFragment`), tests/unit/description/gtc-t6e-chrome-scale-single-rounding.test.ts (new). No catalog change.
Write-set: census listed index/renderer (+ assemble-svg if needed); renderer.ts not needed.

## Render-diff unknown/deroxu-29-gude369
Before 86 structural / 43 numeric. After 56 / 43 (numeric unchanged).

## Diagnosis
- Mechanism: `SvgGraphics#format` is `String.format("%.3f", xx * option.getScale())` (SvgGraphics.java:468-475), and TextBlockExporter draws chrome + body through ONE scaled UGraphic (TextBlockExporter.java:159-177), so each number rounds once, after the multiply. A CHROMED description (title/legend/etc.) is drawn at 1x, formatted to 3 decimals, then string-rescaled by `finalizeDescriptionFragment` (assemble-svg.ts) via `scaleActivityBody`: 33.5125 -> "33.513" -> 20.946 vs the jar's 20.945.
- Origin (port): description/index.ts#render emitted the chromed fragment drawn non-deferred; assemble-svg.ts finalize returned early at factor 1 and otherwise rescaled formatted strings.
- Fix: the activity mechanism, reused (`withDeferredFormat` + `RenderFragment.numbersDeferred`, isw-T2c-scale). A chromed geometry with `isExportScaled(scale, dpi)` is drawn deferred and marked `numbersDeferred`; `applyChrome` already draws the chrome deferred for such fragments; `finalizeDescriptionFragment` now also formats at factor 1 when deferred. `scaleActivityBody` already covers cx/cy/x1.. and dasharray.
- `scale` vs `dpi`: same path in the jar and in the port (both enter `computeScaleFactor`, TextBlockExporter.java:204-208; `isExportScaled` covers both). Oracles confirm both double-rounded before and match after.
- Unchromed descriptions were not affected: oracles dpi 60 / dpi 150 / scale 1.5 without chrome were byte-identical before the change (klimt draws through the scaled UGraphic directly).
- Ruled out: the `cx/cy` attribute vocabulary (already in `scaleActivityBody`); core engines other than description (flag only set by activity and now chromed+scaled description).

## Reduced oracles (/private/tmp/claude-501/gtc-T6e)
dpi60, dpi150, sc15 (no chrome): identical before and after. dpi60t, dpi150t, sc15t, sc07t (title + legend): 4/16/14/11 differing tokens before, only the legend-rect attribute form after (below).

## Tests
gtc-t6e-chrome-scale-single-rounding.test.ts, 4 tests (dpi 60, dpi 150, scale 1.5, scale 0.7; tokens taken from the jar oracles); all 4 fail with the src change reverted.
Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1281 files collected, 26267 passed, 0 failed (golden + diff-baseline ratchets green). typecheck, eslint, prettier clean.

## Surveys (before -> after; conformant/structural-match/diverged)
- component 212/12/42, usecase 66/7/20 (+1 oracle-error), class 723/0/0, object 63/8/9, state 99/14/160: unchanged
- unknown 502/16/307 -> 504/16/305: fimiku-32-firu782, nunexe-00-luba528 diverged -> conformant (scaled chromed fixtures; verdict moved with the rounding fix, not individually diagnosed further)
- Losses: none. The two movers need the orchestrator's re-pin.

## Residuals
- Pre-existing, found in the oracles, not fixed: the chrome legend background rect is emitted as `stroke="#000" stroke-width=".."` attributes where the jar writes `style="stroke:#000;stroke-width:..;"` (also unscaled). compareSvg does not count it as a verdict diff in the survey; it is chrome (annotations), not description.
- deroxu 56 structural / 43 numeric. Next family per the overview is T6f inline-link-colour-dropped (`OS ...> BUS #aaa` draws #181818); its first paths come from g[178+] links. Other remaining diffs: g[106]/rect[1..4]/@fill exp=#8FF act=#FF0 (entity with two stereotypes; T6j tie order); g[109]/text[1..2]/@fill exp=#A00 act=#000 and g[110]/ellipse[1]/@stroke exp=#A00 act=#181818 (T6h stereo font/interface border keys). Early diffs: missing `rect/@filter` on clusters g[3..17] and defs[1] childCount (T6g Shadowing), canvas size/title/legend centring (T6g cascade). Nothing traces into dot-engine.
