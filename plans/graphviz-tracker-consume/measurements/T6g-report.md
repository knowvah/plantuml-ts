# T6g report: cluster-stereo-shadowing + canvas-shadow-extent

Commit f05769be2 (unsigned). Files: src/core/{theme-graph-colors,skinparam-stereo-keys,theme-element-resolve,assemble-svg}.ts, src/core/svg-defs-scale.ts (new), src/diagrams/description/{renderer-cluster,renderer-entity}.ts, docs/catalog.md, tests/unit/description/gtc-t6g-stereotype-shadowing.test.ts (new). Core (touchesCore).
Write-set extensions: assemble-svg.ts + new svg-defs-scale.ts (for the filter scaling, a second mechanism found; see below), renderer-entity.ts (entities carry the same stereotype Shadowing).

## Render-diff unknown/deroxu-29-gude369
Before 38 structural / 43 numeric. After: see numbers at the end of this section.
### unknown/deroxu-29-gude369  pass=false structural=20 numeric=5

(38/43 -> 20/5; the canvas and title/legend numeric diffs are gone, including the +/-1.875 centring.)

## Diagnosis
- Mechanism 1 (stereotype Shadowing): `skinparam component { Shadowing<<package>> true }` is a stereotype-re-signed Shadowing style (FromSkinparamToStyle.java:282 `addConvert(cleanName + "Shadowing", PName.Shadowing, sname)`, :306-310 `true` -> 3, :396-408 `addPriorityForStereotype`). `Cluster#getStyle` signs `group.getStereotype()` (Cluster.java:384-390) and `drawU` reads `style.getShadowing()` (:314-315); `EntityImageDescription` does the same for leaves. Origin (port): `resolveElementShadowing(theme, sname)` (theme-element-resolve.ts:167) took no stereotype and `componentshadowing<<package>>` was never stored. Fix: `ElementColors.shadowingByStereo`; the `shadowing` role added to `GROUP_BY_STEREO_RE`/`applyShadowingByStereo` (`parseShadowingValue`); `resolveElementShadowing(theme, sname, stereotypes)`, last label wins; the cluster and entity renderers pass the full stereotype list. The ELK cluster draw still ignores the stereotype (MyElkCluster.java:92-101), as in T6d.
- Mechanism 2 (not in the census; second cause of `defs[1]`): the shadow `<filter>` def is `stdDeviation=format(2)`, `dx=dy=format(4)` (SvgGraphics.java:1081,1084), scaled by `option.getScale()` (:468-475). A chromed description composes its body as strings and its defs stayed at 1x (deroxu: 2/4 vs the jar's 1.25/2.5 at dpi 60). `finalizeDescriptionFragment` now scales them (`svg-defs-scale.ts#scaleShadowFilterDefs`, multiply then format once).
- canvas-shadow-extent cascade: LimitFinder.java:186-187 `drawRectangle` adds `getDeltaShadow() * 2` to the far corner; it was short only because the rects carried no deltaShadow. It cleared with mechanism 1, no separate change (the canvas, title and legend numeric diffs vanished).
- Filter id and count: oracle ids match (the seeded `f<uid>` id from `svg-defs-seeded.ts`, no index), one `<filter>` per document, 4 shadowed rects in the reduced fixture, identical to the jar with the shadow filter at dpi 60, dpi 150 and scale 1.5, with and without a title.
- Ruled out: dpi-dependent canvas arithmetic (identical once shadows are drawn); filter id generation (already faithful).

## Reduced oracles (/private/tmp/claude-501/gtc-T6g/s1..s6)
Components with `<<package>>` Shadowing, a rectangle cluster with `Shadowing<<sh>> 2`, nested/stereotyped/plain members. s1 (plain), s2 (dpi 60), s3 (title + dpi 60), s4 (title + dpi 150), s5 (title + scale 1.5), s6 (scale 1.5) are IDENTICAL to the jar after the fix (ignoring `data-qualified-name`, see Residuals); s3/s4/s5 differed only in the filter numbers before.

## Tests
gtc-t6g-stereotype-shadowing.test.ts, 5 tests (4 filtered rects + one filter def; title + dpi 60 scaled filter; scale 1.5; `scaleShadowFilterDefs` x2). Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1283 files collected, 26280 passed, 0 failed (class/object/state/description golden + diff-baseline ratchets green). typecheck, eslint, prettier clean; catalog regenerated. (assemble-svg.ts is 538 lines; it was 536 before my 2-line change, already over the 500 cap.)

## Surveys (before -> after; conformant/structural-match/diverged)
- component 213/12/41, usecase 66/7/20 (+1 oracle-error), class 723/0/0, object 63/8/9, state 99/14/160: unchanged
- unknown 504/16/305 -> 505/16/304: fefeza-33-xute344 diverged -> conformant
- Losses: none. One row to pin.

## Residuals
- deroxu 20 structural / 5 numeric. Next in the overview: T6h stereo-font-and-interface-border-keys. First paths: svg/g[1]/g[109]/text[1..2]/@fill exp=#A00 act=#000; g[110]/ellipse[1]/@stroke exp=#A00 act=#181818; g[110]/text[1]/@fill; g[111..112] (#0A0); g[178..181],g[192],g[203..206]/text[1]/@fill (link label colours, ArrowFontColor<<X>>). Also open: g[106]/rect[1..4]/@fill exp=#8FF act=#FF0 (T6j tie order) and numeric g[19]/rect[1]/@width exp=163.125 act=186.875 + x diffs (T6i port-cluster title min width).
- Pre-existing, out of family, seen in my reduced oracles: `data-qualified-name` of an entity declared inside a cluster is `Inner` in ours and `Svc One.Inner` in the jar (3 entities of the s* fixtures). It does not appear in the deroxu diff (the compare path does not weigh it for that fixture); not diagnosed.
- Nothing traces into dot-engine.
