# isw-T2b-obj report

## Commits (branch isw/T2b-obj)
- ff1b12866 feat: collect FontName/FontStyle for object/map/json styles (OUTSIDE write-set: src/core/style-map-element.ts + theme-graph-colors.ts, additive; see "Core touched")
- 07515535d fix: apply object/map/json `<style>` to box, rows, header
- d98077643 fix: keep stereotype padding beyond one space per side
- a296d7542 fix: hide <<pattern>> matches getMultipleLabels
- (this notes commit)

## 1. Object/map/json `<style>` (lisepi)
Java -> ours:
- Signatures `{root,element,objectDiagram,<sname>[,header]}` + `withTOBECHANGED(stereotype)`: EntityImageObject.java:93-134, EntityImageMap.java:87-159, EntityImageJson alike -> src/diagrams/class/object-kind-style.ts (resolveObjectBodyFont, resolveHeaderFontOverride, headerFontSpec).
- Member rows font = `getStyle().getFontConfiguration` (EntityImageMap.java:106; MethodsOrFieldsArea.java:240 FontConfiguration.create(skinParam, style, colors); Style.java:241-253 getUFont) -> class-object-fields.ts (measureObjectFields takes the body font), class-map-sizing.ts, class-json-sizing.ts, class-object-sizing.ts (enhanced body).
- Header font (FontName/FontSize/FontStyle) = `getStyleHeader()` (EntityImageObject.java:98) -> class-object-map-header.ts#headerRows(nameFont), class-object-sizing.ts#computeObjectTitle, map/json sizing. Map/json used to measure the name at theme.fontSize ignoring even header FontSize.
- Box: RoundCorner (EntityImageObject.java:96), LineColor (:149 / EntityImageMap.java:155), LineThickness+LineStyle via `style.getStroke()` (:158) -> renderer-classifier-colors.ts (classBorder, classStyleLineThickness, objectKindDasharray), renderer-classifier-box.ts (roundCorner).
- Divider dash: only the empty-fields placeholder divider (EntityImageObject.java:110-113, drawn under the box stroke :215) takes the LineStyle dash; a populated object's divider is thickness-only (jar lisepi: Object_user line `stroke-width:2`, London placeholder `stroke-width:2;stroke-dasharray:10,5`). -> classDividerDasharray. Mechanism below the placeholder/BodyEnhanced1 split inferred from the two jar renders, not traced in UHorizontalLine/driver (stated, not proven).
- Jar fixtures (tests/fixtures/isw-T2b-obj/): obj-body-font, obj-header-font, obj-stroke, map-style, json-style; all 0 compareSvg diffs. Test: tests/unit/class/object-kind-style.test.ts.

Result: lisepi `maxSizeDeltaIn` 0.140799 -> **0** (oracle/goldens/object/size-backlog.json entry `lisepi-64-mudo307` can be DELETED). lisepi svg diffs 265 -> 2, both pre-existing and unrelated to style: `g[4]/@id ent0004 vs ent0005` and `g[5]/@id lnk5 vs lnk4` (entity/link uid numbering around the `json "JSON_data" as j` entity). Not investigated.

## 2. Stereotype padding
Java: Guillemet.java:60 GUILLEMET_PATTERN `<<\s?(..)\s?>>` (== Stereotype.java:122 p) and manageGuillemetStrict :87-100 consume ONE space per side; StereotypePattern.java:68 captures `<<.+?>>` untrimmed; StereotypeDecoration.java:196-216 + StringUtils.java:172-178 (whitespace-only LABEL = empty). Display path: CucaDiagram.getVisibleStereotypeLabels (atmp/CucaDiagram.java:596) -> getLabels(DOUBLE_COMPARATOR) raw -> creole manageGuillemet.
Ours:
- src/core/stereotype-decoration.ts: splitStereotypeTokens no longer trims (strictLabel = one space per side; decoration residue untrimmed; whitespace-only residue = no label); new hasMultipleLabel (Stereotype.getMultipleLabels).
- Declaration regexes kept the blob verbatim: class-declaration-extractors.ts, class-object-commands.ts, class-map-commands.ts, class-container.ts (package), class-stereotype-command.ts. Classifier.stereotype / Namespace.stereotype now carry the padding (` Stereotype `); AST tests re-pinned (class-singles2, class-tag-visibility, parser, class-url-command) to the verbatim label per StereotypePattern.java:68.
- class-directives-removal.ts: `hide/show <<pat>>` pattern directive now matches via hasMultipleLabel (HideOrShow.java:60-85); without it salupu-93-neja895 (`class foo2 << My Stereo >>` + `hide << My Stereo >>`) lost conformance.
- Jar fixtures: stereotype-spaces (class/decorated/package/object), stereotype-hide-padded; test tests/unit/class/stereotype-padding.test.ts. Probed jar facts: `<<   z   >>` -> «  z  »; `<< (R,#FF7700)  >>` draws no text; `<<(R,#FF7700)  lbl  >>` -> « lbl ».

Not changed (still trim; other owners / not in write-set):
- src/core/command/CommandCreateJson.ts:63 `STEREO = '(?:\s*<<\s*([^<>]+?)\s*>>)?'` trims json stereotypes (same defect for `json x <<  st  >>`).
- description engine (component/usecase/node): jar render in /private/tmp/claude-501/isw-T2b-obj/desc-fixture/stereotype-spaces-desc.{puml,svg}: ours 29 diffs (`component Cmp <<  spaced  >>` +7.7px) -> owner T2b-ca (description). State: 0 diffs.
- class-directives.ts#stereotypeGenderMatches and class-stereotype.ts#isStereotypeLabelHidden still compare trimmed (Java: exact `label.equals(gender)` on the raw `<<..>>` text, EntityGenderUtils.java:68-82, CucaDiagram.java:608-616).

## Surveys (own --out, before = base fc1b997a7 src, after = HEAD)
object 63/8/9 -> 63/8/9 (lisepi maxDelta 23.9 -> 0, maxosa-84-juci042 596 -> 403; verdicts unchanged), class 710/3/10 -> 710/3/10, unknown 366/54/405 same, component 67/66/133 same, usecase 29/18/46 same, state 73/12/188 same, sequence 0/0/1141 same. 0 conformant losses, 0 movers beyond the two object rows above. No survey fixture carries a padded stereotype, so part 2 moves no survey row (guarded by the authored jar fixtures).

## Production-visible changes
- object/map/json `<style>` / `skinparam object|map|json` now change: box RoundCorner, LineColor, LineThickness, LineStyle; member-row FontName/FontSize/FontStyle; name FontName/FontStyle (header or bare); map/json name now follows FontSize/header FontSize. Geometry (node sizes) follows. Previously ignored.
- `<<  x  >>` stereotypes (class/object/map/package/sequence participants via splitStereotypeLabels) keep one inner space per side: «  x » -> « x ». `<<(C,#red) lbl>>`-style decorated labels keep padding beyond the one consumed space. Style tags from a padded stereotype are padded too (Java getStyleNames), so `.x { }` no longer matches `<< x >>`... exactly one space is consumed, so `<< x >>` still matches `.x`; `<<  x  >>` does not (jar behaviour).
- `hide <<pat>>` on a padded stereotype follows Java matching (see above).

## Core touched (outside write-set) — orchestrator to reconcile with T2b-ca
- src/core/theme-graph-colors.ts: ElementColors + `headerFontFamily?`, `headerFontStyle?`.
- src/core/style-map-element.ts: `collectObjectKindFont` (fontname/fontstyle for object|map|json bucket and its `.header`), restricted to those three SNames so package/others keep skinparam-only fonts. Additive, 23 lines; style-map-element.ts is 451 lines.

## For the orchestrator
- Delete `lisepi-64-mudo307` from oracle/goldens/object/size-backlog.json (now 0).
- Regenerate docs/catalog.md (`npm run catalog`): new module src/diagrams/class/object-kind-style.ts (tests/architecture/catalog.test.ts is red until then; everything else in tests/architecture green).
- renderer-classifier-box.ts is exactly 500 lines, class-directives-removal.ts 500.
