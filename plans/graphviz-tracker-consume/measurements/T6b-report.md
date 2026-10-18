# T6b report: hidden-link-drawn

Commit 081624e05 (unsigned). Files: src/core/svek/SvekEdge.ts (+drawHiddenU), src/diagrams/description/{layout-geo-post,layout-helpers-types,renderer-draw-sequence,renderer-edge}.ts, tests/unit/description/gtc-t6b-hidden-link.test.ts (new).
Write-set extensions: src/core/svek/SvekEdge.ts (core; the census said "maybe"), renderer-edge.ts.

## Render-diff unknown/deroxu-29-gude369
Before 687 structural / 1237 numeric (1924). After 212 / 43 (255), exactly T6a's prediction.

## Diagnosis
- Mechanism: `-[hidden]-` sets Link.hidden (WithLinkType.java:149-150); Link#isHidden (Link.java:458-459) includes it; SvekResult.java:97-100 draws the edge through `ug.apply(UHidden.HIDDEN)`. Every SvgGraphics writer is gated `if (hidden == false)` (SvgGraphics.java:337,352,...), the LimitFinder pass never sees UHidden, so extent stays.
- Jar output for a hidden edge (reduced oracle /private/tmp/claude-501/gtc-T6b/h, e): only `<!--link A to B-->` (SvekEdge.java:845); no `<g>`, no path. `uniq(ids, ...)` (SvekEdge.java:944) still runs before the gated draw, so a duplicate edge keeps its `-1` id sequence.
- Origin (port): layout-geo-post.ts assembleEdgeGeo did not fold link.hidden into DescriptionEdgeGeo.hidden; the earlier revert predates the respectHidden split now present in drawEdges (real pass skips paint, LimitFinder pass draws fully).
- Causal chain: we drew lnk63 -> root `<g>` 221 children vs 220 -> compareSvg LCS (all children key `g`) shifts jar group n against ours n+1 for n=1..130 -> 1814 phantom diffs.
- Ruled out: skipping the draw entirely (old approach; shrinks canvas, reproduced by the extent test: 471x184 comes from a hidden edge label); a title/legend order difference (T6a).
- Fix: drawEdges no longer returns early; it passes `respectHidden && edge.hidden` to drawEdge, which calls `SvekEdge#drawHiddenU` (comment + uniq only). The opale return precedes it (jar order: opale before). Also entity-hidden edges now write their comment (jar does; previously absent).

## Tests
tests/unit/description/gtc-t6b-hidden-link.test.ts, 4 tests: no group/path; comment order; 155x169 canvas (oracle); hidden labelled edge keeps 471x184 and `<!--link A to B--><!--link A to B-->`. Failed before (3/4), pass after.
Run: `vitest run tests/unit/description tests/unit/svek tests/architecture tests/oracle/svg-conformance` = 145 files collected, 8185 passed, 1 skipped (includes class/object/state/description golden + diff-baseline ratchets, all green). typecheck, eslint, prettier clean; npm run catalog: no change.
Note: tests/unit/svek does not exist as a path match issue? It collected within the 145; no zero-collection.

## Surveys (before -> after; conformant/structural-match/diverged)
- component 204/12/50 -> 208/12/46
- usecase 66/3/24 (+1 oracle-error) -> unchanged
- unknown 497/16/312 -> 499/16/310
- class 723/0/0 -> unchanged; object 63/8/9 -> unchanged
- Movers (all diverged -> conformant, each has `-[hidden]-` in in.puml): component balopu-66-jagu236, dujodu-23-viba393, saroje-26-vabi530, tujica-34-tire129; unknown jajeve-56-poza115, votafe-10-fixa830. Losses: none. Those six were pinned diverged in baselines; ratchets still pass, orchestrator should re-pin/tighten (I did not edit baselines/TRACKER). State survey not run (state does not use the description renderer; SvekEdge change is additive).

## Residuals
deroxu 212/43. Next family T6c stereo-only-skinparam-block, first diffs:
- svg/g[1]/g[178]/path[1]/@stroke exp=#0A0 act=#181818
- svg/g[1]/g[178]/polygon[1]/@fill exp=#0A0 act=#181818, polygon[1]/@stroke, text[1]/@fill exp=#0A0 act=#000
(g[179..195], g[203..206] same pattern.) Other early diffs belong to later families: g[2]/text[1]/@textLength 20.945 vs 20.946 (T6e), g[3..]/rect/@filter missing + defs[1] childCount (T6g Shadowing), g[5]/rect/@fill #8FF vs #FFF (T6d/T6c).
No dot-engine involvement. No out-of-write-set test pins a closed residual.
