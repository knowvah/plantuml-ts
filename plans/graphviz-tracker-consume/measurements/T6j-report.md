# T6j report: multi-stereotype-tie-order (last family)

Commit cbec1a714 (unsigned). Files: src/core/theme-element-resolve.ts, src/diagrams/class/{class-package-style,renderer-classifier-colors,renderer-edge}.ts, src/diagrams/description/renderer-note.ts, tests/unit/description/gtc-t6j-stereotype-label-order.test.ts (new), tests/unit/core/element-stereotype-paint-codd-t1c.test.ts (edited, see below). Core; widest blast radius.
Write-set extensions: the four class/note files (same last-label loop); the codd-T1c unit test (it asserted the last-label rule for `<style>` `.a/.b` and is the matching unit test of the function changed; the new expectation is jar-verified, oracle `nl`).

## Render-diff unknown/deroxu-29-gude369
Before 4 structural / 0 numeric. After 0 / 0, `pass=true`: deroxu is CONFORMANT (survey: diverged -> conformant).

## Diagnosis (T6a's hypothesis replaced)
- T6a guessed "first-DEFINED declaration wins" (MEDIUM). The crossed jar oracles disprove it: in all 8 combinations (skinparam spelling and `<style>` spelling x declaration order A-then-B / B-then-A x element labels `<<A>><<B>>` / `<<B>><<A>>`) the fill follows the LABEL ORDER ALONE: `<<A>><<B>>` -> A's value, `<<B>><<A>>` -> B's value, whichever was declared first (/private/tmp/claude-501/gtc-T6j/dAB_lAB .. sBA_lBA; sname-less `.a/.b` in `nl`).
- Mechanism: `StyleSignatureBasic#withTOBECHANGED` (:119-132) adds one signature per label in label order; the per-label styles merge in that order and on a priority tie `DarkString#mergeWith` returns `other`, the PREVIOUS value (DarkString.java:50-57; `Style.java:132` `ent.getValue().mergeWith(previous)`). Both declarations sit at the same +1000 stereotype priority, so the earliest label wins. Each property resolves independently (oracle `m3`, three labels: background from the first label that has one, border from the first that has one, font likewise).
- Origin (port): `theme-element-resolve.ts` `stereotypePaint` (`hit = byTag[...] ?? hit`, last wins) and my T6g/T6h shadowing/font tiers copied it; the same last-wins loop in `class-package-style.ts#byStereo`, `renderer-classifier-colors.ts#resolveElementBackground`, `class/renderer-edge.ts` arrow tag cascade and `description/renderer-note.ts#tagBackground`. The class `skinparam *ByStereo` tiers, `resolveClassBackgroundByStereo` etc. and the stereotype font size already took the first (the class oracle `cls` confirms them).
- What the theme must carry: nothing new. Declaration order is irrelevant, so the theme needs no ordering data; only the per-element LABEL order, which the geo already carries (`styleStereotype ?? stereotype`, source order).
- Fix: one `firstTaggedValue` lookup in theme-element-resolve.ts (labels in order; for the same label the SName bucket before the SName-less one, as before); the other four sites return on the first label with a value.
- Ruled out: declaration order (8-way crossed oracle); bucket-vs-label precedence changing anything observable (corpus unchanged).

## Reduced oracles
dAB_lAB, dAB_lBA, dBA_lAB, dBA_lBA, sAB_lAB, sAB_lBA, sBA_lAB, sBA_lBA, m3 (three labels, background/border/font/shadowing), nl (`<style>` `.a/.b`, node), uc (usecase): IDENTICAL after the change. cls (class): fills match the jar; the only token differences are the class engine's `stroke=` attribute form vs the jar's `style="stroke:.."`, unrelated.

## Tests
gtc-t6j-stereotype-label-order.test.ts, 7 tests (4 declaration spellings, 3-label per-property, class, usecase); 6 fail with the src change reverted (class already took the first). The codd-T1c test now asserts `['a','b']` -> `.a` and `['b','a']` -> `.b`. Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1286 files collected, 26299 passed, 0 failed (class/object/state/description golden + diff-baseline ratchets green). typecheck, eslint, prettier clean; catalog unchanged.

## Surveys (before -> after; conformant/structural-match/diverged)
- component 214/12/40, usecase 67/7/19 (+1 oracle-error), class 723/0/0, object 63/8/9, state 99/14/160: unchanged
- unknown 505/17/303 -> 506/18/301: deroxu-29-gude369 diverged -> conformant; dunila-61-licu078 diverged -> structural-match
- Losses: none. Two rows to pin (deroxu is the family target; dunila not diagnosed individually).

## Residuals
- deroxu 0 / 0: the close can tick 28 (the orchestrator runs the all-engine chain).
- Carried from earlier families, not deroxu: the single-line port-cluster 3.75 px x offset (T6i `one`); chrome legend rect attribute form (T6e); `data-qualified-name` of an entity inside a cluster (T6g). Nothing traces into dot-engine.
