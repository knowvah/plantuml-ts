# isw-T2c-stereo report

## Commits (branch isw/T2c-stereo)
- e9f3c0989 json: keep stereotype label untrimmed (+ headerRowCount for stereotyped json)
- cf4a3fb0b description: keep stereotype padding; hide <<p>> stereotype compares the raw label
- ea0a54e66 class: hide/show <<p>> compare against the raw label
- (this notes commit)

## 1. json
Java -> ours: StereotypePattern.java:68 captures `<<.+?>>` verbatim (CommandCreateJson.java:88 `optional("STEREO")`, :122/:214 pass it to Stereotype.build) -> src/core/command/CommandCreateJson.ts STEREO regex (no `\s*` inside the brackets) and the two `.trim()` calls (parseJsonMultilineMatch, applyJsonSingleLine).
Second defect found by the jar fixture (pre-existing, independent of padding): a stereotyped json leaf never drew its NAME text. measureJsonClassifier returned header rows [stereo, name] without headerRowCount, and the json renderer path draws `rows[0..headerRowCount)` as header and the body from `jsonBody` only (renderer-classifier-box.ts:209-220, :434), so the name row was dropped. Fix: class-json-sizing.ts sets `headerRowCount` when header rows > 1 (jar: stereotype row then name). Verified on base: `json J <<st>> {..}` lacked the name text with plain `<<st>>` too.
Fixtures: json-stereotype, json-stereotype-oneline (0 diffs). Test: tests/unit/json/stereotype-padding.test.ts.
Not fixed: a 3-node json fixture (3 stereotyped json leaves in one diagram) differs from the jar by a uniform +0.167 y translate on every element (27 diffs, all delta 0.167) while each leaf alone has 0 diffs; not investigated (looks like a layout/translate question, not stereotype; not in this task).

## 2. description
Mechanism: `stripUrl` (parse-helpers-strings.ts) whitespace-collapsed everything outside quotes/brackets, including the inside of `<<  spaced  >>`, before `extractNodeStereotype` ran (that function and the core Stereotype port already keep padding: `' spaced '`). StereotypePattern.java:68 -> copy a `<<.+?>>` run verbatim (new `stripUrlTokenAt`; also lowers stripUrl 33 NLOC/CCN 14 -> 33/13).
Hide/show:
- Portion form `hide|show [<<p>>] stereotype` (CommandHideShowByGender.java:76 GENDER `\<\<.*\>\>`, :250 `byStereotype(arg1)`; CucaDiagram.java:608-616 `gender.equals(label)` over `getLabels(Guillemet.DOUBLE_COMPARATOR)`; Guillemet.java:87-89 manageGuillemetStrict returns `st` unchanged for DOUBLE_COMPARATOR) compares the RAW `<<..>>` run. Jar (description-hide-portion): `<<  x  >>` is NOT hidden by `hide << x >>`, `<< y >>` IS hidden by `hide << y >>`. Ours: command-table-directives.ts RE_HIDE_SHOW_PORTION pattern group `(.*)` untrimmed; element-grammar.ts#visibleStereotypeLabels compares `<<pattern>>` with the raw label, found through `rawStereotypeLabels(labels)` (WeakMap keyed by the array identity extractNodeStereotype returns; falls back to `<<label>>` for any other array).
- Entity form `hide <<p>>` / `remove <<p>>`: HideOrShow.java:60-85 trims p and matches `getMultipleLabels` (one padding space per side consumed). Existing code already matched that (strict label vs trimmed pattern); verified by jar fixture description-hide-entity (0 diffs), no change.
- Style tags (`.tag { }` in `<style>`): jar applies `.pad` red to `<<pad>>` and `<< pad >>` but not `<<  pad  >>` (probe in scratch). The description engine applies NO stereotype style tags at all (no consumer of getStyleNames in src/diagrams/description or EntityImageDescription*; `component { .pad {..} }` is ignored entirely) -> unported feature, not a padding defect; no fixture added. Owner: description style cascade (src/core/style-*).
Fixtures: description-stereotype, description-hide-portion, description-hide-entity (0 diffs). Test: tests/unit/description/stereotype-padding.test.ts.

## 3. class
Java -> ours: EntityGenderUtils.java:68-82 + CucaDiagram.java:608-616 (above).
- class-stereotype.ts: `parseHideStereotypeDirective` keeps the pattern untrimmed; new `rawStereotypeLabels(blob)` = core `Stereotype.build('<<blob>>').getLabels(GUILLEMET_DOUBLE_COMPARATOR)`; `isStereotypeLabelHidden(rawLabel, ...)` now takes the raw `<<..>>` label and compares `<<pattern>>`; `applyStereotypeHideShow` zips display labels with raw labels.
- class-cluster-header.ts#visibleNamespaceStereotypeLabels: same for package stereotypes (cutLabels DOUBLE_COMPARATOR vs NONE).
- class-directives.ts#stereotypeGenderMatches: `rawStereotypeLabels(stereotype).includes(what)` (what = raw GENDER token).
Fixtures: class-hide-portion (classes + non-empty packages), class-hide-gender (`hide <<x>> members`): 0 diffs. Tests: tests/unit/class/stereotype-hide-exact.test.ts; updated class-stereotype.test.ts (isStereotypeLabelHidden now takes the raw label `<<stereo1>>`; parse test pins the untrimmed pattern) and class-hide-entity.test.ts (stacked-stereotype case: blob `'Green>> <<Blue'` = source `<<Green>> <<Blue>>`; added the padded counter-case `'Green >>  << Blue'` + `<<Blue>>` does NOT match, source of the value: jar fixture class-hide-gender, `hide << y >>` vs `<<  x  >>`).
Not fixed (found by fixture): hide on a COLLAPSED EMPTY package (`package P << q >> { }` + `hide << q >> stereotype`): jar hides the block (EntityImageEmptyPackage.java:126-128 `showPortion(STEREOTYPE, entity)`), ours still draws it, because the leaf is created by `collapseEmptyNamespacesFinal` at layout time, after `applyStereotypeHideShow` ran, so `visibleStereotypeLabels` is unset (class-layout-helpers.ts:324 uses resolveVisibleStereotypeLabels). Pre-existing, independent of padding (same with `<<q>>`); owner: class layout (layout.ts / class-namespace.ts).

## Surveys (own --out, base src via `git checkout 50b39c1ba -- src`, restored afterwards)
class 710/3/10, object 63/8/9, component 67/66/133, usecase 29/18/46 (+1 oracle-error), json 13/24/13, yaml 7/28/4, unknown 370/54/401: identical before and after; JSON files differ only in the timestamp line. 0 conformant losses, 0 movers (no survey fixture carries a padded stereotype or a patterned stereotype hide; guarded by the authored jar fixtures).

## Gates
tests/unit/{description,class,json} + tests/architecture/isw-measurer.test.ts: 301 files / 4387 tests green; class+object golden ratchets and description-parity ratchet green (1378 tests); `tsc --noEmit` clean; eslint clean on touched dirs.

## Production-visible changes
- json: `json x <<  st  >>` draws `« st »` (was `«st»`); a stereotyped json box now draws its name text (it was missing).
- description (component/usecase/node/...): `<<  spaced  >>` keeps padding beyond the consumed space (`« spaced »`); node width grows accordingly. `hide|show <<p>> stereotype` no longer matches by trimmed text (padded patterns/labels compare raw, as in the jar).
- class: `hide|show <<p>> stereotype`, `hide|show <<p>> members|fields|methods|circle|stereotype` (entity-gender form) and package stereotype hiding compare raw labels: `hide << x >>` no longer hides `<<x>>`/`<<  x  >>`; `<<x>>` still hides `<<x>>`.

## For the orchestrator
No pin/baseline/DIVERGENCES changes (surveys identical). Regenerate docs/catalog.md only if the catalog drift test flags `rawStereotypeLabels` exports (no new module). Outside-write-set files touched: none.
