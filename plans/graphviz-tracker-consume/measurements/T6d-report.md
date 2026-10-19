# T6d report: hide-stereotype-drops-stereo-style

Commit c601f591e (unsigned). Files: src/diagrams/description/{layout-helpers-types,layout-helpers,layout-dot-tree,renderer-entity,renderer-cluster,renderer-note,description-elk-adapter}.ts, src/core/theme-element-resolve.ts (`stereotypePaint` now exported; core), docs/catalog.md (regenerated), tests/unit/description/gtc-t6d-hidden-stereotype-style.test.ts (new).
Write-set extensions: renderer-note.ts, description-elk-adapter.ts, theme-element-resolve.ts (export only).

## Render-diff unknown/deroxu-29-gude369
Before 144 structural / 43 numeric (187). After 86 / 43 (129).

## Diagnosis
- Mechanism: EntityImageDescription styles from the FULL `entity.getStereotype()` (`getStyleSignature().withTOBECHANGED(stereotype)`, java:151-159) and prints only `portionShower.getVisibleStereotypeLabels(entity)` (:193). Cluster#getStyle signs `group.getStereotype()` (Cluster.java:364,389). We stored only the visible labels in `geo.stereotype` (layout-dot-tree.ts:535-536,578-579; layout-helpers.ts:239) and resolved style from that.
- Second mechanism, found while verifying clusters: the census attributed g[5,6,10,11,19] (#8FF) to entities, but those are CLUSTERS (`component "..." <<V3>> {`). Our `clusterBackground`/`clusterBorder` (renderer-cluster.ts) had no stereotype tier at all, so a stereotype-scoped cluster colour was ignored even with labels shown (reduced oracle `cshown`: jar #ABCDEF/#F0F, ours none).
- Fix: `DescriptionNodeGeo.styleStereotype` (full list, set only when filtering shortened it); entity/port/note paint and stereotype font read `styleStereotype ?? stereotype`; printed labels unchanged; cluster fill/border consult `stereotypePaint` first.
- ELK exception (found by a loss, unknown/foraba-98-sagi735 conformant -> diverged, then fixed): `MyElkCluster#drawU` merges the style and `Cluster.getBackColor` WITHOUT the stereotype (MyElkCluster.java:92-101); only `getMagneticBorder` signs it (:147-149). The ELK adapter now passes stereotypes only for `getClusterStyleForMagneticBorder`.
- Ruled out: `hide <<X>> stereotype` needs nothing extra (same filter, oracle matches); font colour keys `ComponentFontColor<<X>>` mismatch even with labels shown (T6h, excluded from my oracles); sizing path (filtered list, matches jar's layout; dotEqual unchanged).

## Reduced oracles (/private/tmp/claude-501/gtc-T6d)
shown, hide stereotype, hide <<V3>> stereotype (entities+package+node) and cshown/chide (rectangle cluster) all MATCH the jar on fills/strokes/label text; elk (cluster unstyled). One jar quirk noted, not ported here: with both `RectangleBackgroundColor<<V3>>` and a later `PackageBackgroundColor<<V3>>` declared, the jar's rectangle cluster took the Package value (#FF8) (probe `cshown` before I removed the Package line); ours takes the Rectangle value. Unexplained, unrelated to hide; not in deroxu.

## Tests
gtc-t6d-hidden-stereotype-style.test.ts, 6 tests (3 entity forms; cluster shown/hide via it.each; ELK). Entity tests failed before (2/3), cluster + ELK pins added.
Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1280 files collected, 26256 passed, 0 failed (includes class/object/state/description golden + diff-baseline ratchets). typecheck, eslint, prettier clean; catalog regenerated.

## Surveys (before -> after; conformant/structural-match/diverged)
- component 208/12/46 -> 212/12/42: garopu-71-riri890, kafopo-19-doxu941, lufiba-62-dubi670, saveja-25-bezi839 diverged -> conformant
- usecase 66/3/24 -> 66/7/20: berufi-69-dara369, bobije-35-nigi914, seline-83-vifi756, xoculo-95-fuvi894 diverged -> structural-match
- unknown 499/16/310 -> 502/16/307: lulupi-98-gogi744, luvufe-13-lifi483, xigele-78-sija109 diverged -> conformant
- class 723/0/0 and object 63/8/9: unchanged
- Losses: none (foraba-98-sagi735 appeared as a transient loss and is fixed; conformant at the commit). I did not verify each mover's individual mechanism beyond the survey; they are all stereotype-colour fixtures per the verdict change. The 10 pinned rows will need the orchestrator's re-pin.

## Residuals
deroxu 86 structural / 43 numeric. Next family T6e dpi-scale-double-rounding, first paths:
- svg/g[1]/g[2]/text[1]/@textLength exp=20.945 act=20.946
- svg/g[1]/g[7]/text[1]/@textLength exp=159.305 act=159.304
- svg/g[1]/g[11]/text[1]/@textLength exp=74.812 act=74.813
Remaining other early diffs: missing `rect/@filter` on clusters g[3..17] and defs[1] childCount (T6g Shadowing). Nothing traces into dot-engine.
