# add4-T3f: labala-74-juki864, start/stop circle colours by style priority

## Commits
| sha | subject | probe Σ after |
|---|---|---|
| fe08c119a | fix(activity): resolve start/stop circle colours by style priority | 493 -> 488 |

## Mechanism (verified in the Java)
- Each circle reads one merged Style for `root, element, activityDiagram, circle, start|stop` (`activitydiagram3/ftile/vcompact/VCompactFactory.java:99-121`).
- Every parsed value takes `counter.getNextInt()` as its priority (`style/ValueImpl.java:51-55`). The counter is the StyleBuilder's own (`StyleBuilder.java:121-123`), and skinparam converts draw from it too (`FromSkinparamToStyle.java:357`, `SkinParam.java:227-233`).
- `Style.mergeWith` -> `ValueImpl.mergeWith` -> `DarkString.mergeWith`, which keeps the higher priority (`Style.java:121-135`, `DarkString.java:54-57,73-78`). This holds for any selector inside `computeMergedStyle` (`StyleStorage.java:101-115`).
- So the LATER declaration wins, whatever its specificity. Jar oracles confirm it: `circle{}` then `root{}` paints root; `root{}` then `circle{}` paints circle.
- `skin rose` replaces plantuml.skin entirely (`TitledDiagram.java:159-182`, `SkinParam.java:183-197`). Rose's circle rule comes after its root rule (`rose.skin:400-405`), so it paints black.
- Dark mode (`skinparam mode dark`, `SkinParam.java:114-116`) selects `ColorMapper.DARK_MODE` (`TitledDiagram.java:294`), which paints `darkSchemeTheme()` (`ColorMapper.java:68-72`, `HColorSimple.java:236-240`; the base HColor returns `this`, `HColor.java:117-119`).
- Drawing: CircleStart strokes in lineColor and fills in backColor (`svek/image/CircleStart.java:72-82`). CircleEnd draws a ring in lineColor, then a disc filled in backColor and stroked in lineColor. When the two colours are equal it uses `HColors.middle`, which is that same colour (`CircleEnd.java:74-102`).

## Java -> ours
- `VCompactFactory.java:99-121` + `StyleStorage.java:101-115` -> `src/core/activity-circle-style.ts#resolveActivityCircleStyle`/`circleColors`. These replay the faithful engine through `style/mindmap-style-builder.ts#buildMindmapStyleBuilder` (diagram-agnostic: the skin, then skinparams and `<style>` in source order).
- `ValueImpl.java:92-108` + `ColorMapper.java:68-72` -> `activity-circle-style.ts#paintOf`.
- `CommandStyleMultilinesCSS.java:92-93` (a rejected block) -> `resolveActivityCircleStyle` returns undefined, and the renderer keeps its old defaults.
- Theme field `graph.activity.circleStyle` (`src/core/theme-graph-colors-b.ts`). It is set in `src/core/build-theme.ts` through `withActivityCircleStyle`, after `withDocumentStyle` and before Stage 4.
- `CircleStart.java:72-82` / `CircleEnd.java:74-102` -> `src/diagrams/activity/activity-renderer-terminals.ts#renderStart`/`renderStop` (via `circleColors`). Each half falls back to the old default only when absent.

## Rows before -> after
- labala-74-juki864: 5 -> 0 (diverged -> conformant).
- Probe Σ: 493 -> 488. 1 faller, 0 risers.

## engdiff (28 engines, before = HEAD 476a7904d, after = fe08c119a's tree)
- `movers=1 conformant-losses=0`: activity labala diverged -> conformant.
- The first after-pass reported 9 timing fixtures diverged -> timeout. Load average was 70-82 from other agents. A timing rerun gave 126 diverged / 0 timeout, identical to before.

## Gates
- Ratchets green: activity golden + diff-baseline + harness-parity, style/text/swimlane census (1579 tests). class, sequence (golden + diff-baseline), state, description, mindmap, skin, object, json, yaml, hcl and dot golden ratchets also green (2501 passed).
- No census test moved. Pinned goldens byte-equal (ratchets green).
- typecheck: one pre-existing error, `tests/diagrams/activity/layout/compress/invariant.test.ts:695` (`ALLOWED_HARD_OVERLAPS` is inferred `never[]`). Not mine; it is present at 476a7904d.
- `docs/catalog.md` regenerated (`npm run catalog`, one added row). The new core module trips the drift gate. This file is outside the named write-set; the change is generated output only.

## Fixtures (`tests/fixtures/activity/add4-T3f/`, oracle-render.sh)
- theme-amiga, style-root, style-circle-then-root, style-root-then-circle, skin-rose, skin-rose-style-root, skinparam-bg (plantuml.skin wins: #222), skinparam-start-stop (ActivityStartColor fill, ActivityStopColor line).
- Every fixture's ellipses equal the jar. theme-amiga, skinparam-bg and skinparam-start-stop are whole-document equal.

## Not done (out of write-set), with mechanisms observed
- `<style> root { BackgroundColor; LineColor }` also paints the jar's action box fill and the arrow lines/heads. Ours keeps #F1F1F1 / #181818: 7 diffs in style-root, style-circle-then-root and style-root-then-circle. Those are other activity renderers' readers (renderer.ts / action shapes), not the circles.
- skin rose: jar action box #FEFECE and arrows #A80036, plus `filter` shadow defs (rose Shadowing) and a 6px larger canvas. Ours has none of these: 15-17 diffs.
- `end` (`FtileCircleEndCross`) and `spot` still read their old fields. The brief scoped T3f to start/stop. `activityEndColor` is a LineColor convert (`FromSkinparamToStyle.java:138`), but ours applies it to the end fill too; that is unverified against a jar here.
- Port note: the `mindmap-style-builder.ts` names are generic in behaviour. A rename/move to a neutral core name would suit a cleanup task.

## Observation: probe --json is an OUTPUT path
- **Context**: running `scripts/activity-probe.ts --json <f>` as the brief's usage line reads.
- **Finding**: `--json` names the file the probe WRITES. Passing `tests/oracle/svg-conformance/parity-activity.json` overwrote that pinned baseline. It was restored with `git checkout` before anything else ran.
- **Impact**: always point `--json` at a scratch path.
- **Confidence**: High
