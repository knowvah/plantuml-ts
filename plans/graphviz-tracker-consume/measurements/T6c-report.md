# T6c report: stereo-only-skinparam-block

Commit 72d9f78bf (unsigned). Files: src/core/preprocessor-collector.ts, tests/unit/description/gtc-t6c-stereo-only-skinparam-block.test.ts (new). Core (touchesCore).

## Render-diff unknown/deroxu-29-gude369
Before 212 structural / 43 numeric (255). After 144 / 43 (187). 68 paths cleared (census said 66 direct; +2 shared entries).

## Diagnosis
- Mechanism: upstream opener `^skinparam[%s]*(?:[%s]+([\w.]*(?:\<\<.*\>\>)?[\w.]*))?[%s]*\{$` (CommandSkinParamMultilines.java:50) accepts an empty name. SkinLoader#execute pushes group1 `<<Public>>` (SkinLoader.java:78-80), keys entries `getFullParam()+NAME` (:101) = `<<public>>arrowcolor`; cleanForKeySlow moves the stereotype to the end (SkinParam.java:292-297) = `arrowcolor<<public>>`.
- Origin (port): preprocessor-collector.ts:73 RE_SKINPARAM_SELECTOR_BLOCK_OPEN required `(\w+)` before `<<`; the block was never collected (and the existing cleanSkinKey already does the stereotype move). Fix: name optional; `(selectorBlock[1] ?? '')`.
- Causal chain: block unopened -> ArrowColor/ComponentBorderColor/InterfaceBackgroundColor<<Public>> entries never set -> #181818/#000 instead of #0A0 on g[178..195], g[203..206] links.
- Ruled out: flat spelling (already worked, T6a probe c7). Reduced jar oracle (/private/tmp/claude-501/gtc-T6c/{blk,flat}): block and flat spellings render byte-identically apart from data-source-line (fill #FF0, stroke #0A0, arrow #0A0).

## Tests
gtc-t6c-stereo-only-skinparam-block.test.ts, 3 tests (2 failed before the src change, all pass after): oracle colours, block == flat spelling, no body leak.
Full run `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1279 files collected, 26249 passed, 1 failed: tests/unit/scripts/parity-dashboard.test.ts (D9 drift gate vs docs/parity-report.md). That failure is PRE-EXISTING: it fails identically with my change reverted (report not regenerated after T6b's six movers); orchestrator's regen. All golden/diff-baseline ratchets (class/object/state/description) green. typecheck, eslint, prettier clean. Catalog: no exports changed.

## Surveys (before -> after; identical in all trees)
component 208/12/46; usecase 66/3/24 (+1 oracle-error); unknown 499/16/310; class 723/0/0; object 63/8/9. No verdict movers, no losses (deroxu's gain is sub-verdict).

## Residuals
deroxu 144 structural / 43 numeric. Next family T6d hide-stereotype-drops-stereo-style, first paths (entity fills, exp #8FF / #FF0, act #FFF):
- svg/g[1]/g[10]/rect[1..4]/@fill exp=#8FF act=#FFF (also g[5], g[6], g[11], g[19])
- svg/g[1]/g[30]/rect[1..4]/@fill exp=#FF0 act=#FFF; g[31] same
Other early diffs belong to later families: g[2]/text[1]/@textLength 20.945 vs 20.946 (T6e); rect/@filter missing and defs[1] childCount (T6g). Nothing traces into dot-engine.
