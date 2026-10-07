# add4-T2e — chrome (WARN-BANNER, THEME-MARGIN, ACT-SCALE, EMPH-STROKE)

Branch `add4/T2e`, base `380f86bfb` (Σ 8130 over 85 rows).

## Commits
| sha | subject | probe Σ after |
|---|---|---|
| 229e1365c | fix(add4-T2e): draw emphasize arrowhead with the line stroke | 8128 |
| 7bd060d7a | feat(add4-T2e): draw the activity warning banner | 7945 |
| b04457736 | refactor(add4-T2e): split the canvas-origin shift out of canvas-origin.ts | 7945 (no-op) |
| 77e47e653 | fix(add4-T2e): take the activity document margin from the theme | 7830 |

## Java -> ours
- EMPH-STROKE: `Worm.java:126-131,139,177-181` (the mid-segment decoration draws through the line's `ug`: arrowColor fore/back + worm stroke; only start/end decorations take `arrowHeadColor` + `UStroke.simple()`, `:152-166`) -> `src/diagrams/activity/renderer.ts` `renderEdgeSegments` (emphasis tip gets `colors.line` + `strokeWidth`), `arrowTip` gains a `strokeWidth` param defaulting to `SIMPLE_STROKE_WIDTH` (`UStroke.java:75-77`). The colour half (line colour rather than head colour) is the same `ug` mechanism; it moves output only when `ArrowHeadColor` differs from the line colour.
- WARN-BANNER: `TitledDiagram.java:321-334` (addWarning -> pragma; getWarnings = join(preprocessing, pragma), LinkedHashSet), `CommandSkinParam.java:92-99`, `DiagramChromeFactory.java:124-135,176-266` -> new `src/diagrams/activity/activity-warnings.ts` (`withSkinParamWarnings`, `activityWarnings`, `withWarningBanner`, reusing core `WarningBannerBlock` + `renderDrawableToFragment`), `ast.ts` `warnings` field (skinparam warnings, ahead of `ast.pragma`'s), `index.ts` plugin geometry is now `ActivityPluginGeometry { geo, warnings, measurer, margin }`; harness mirrors. The banner is composed inside the baked document margin and grows `preChromeWidth/Height`, so `applyActivityChrome` composes title/legend around banner + body (upstream's inside-out order).
- THEME-MARGIN: `TextBlockExporter.java:172-173,199-202,510-516`, `TitledDiagram.java:275`, `puml-theme-amiga.puml:40` -> `activity-layout-constants.ts` `activityDocumentMargin(theme)` (replaces `CANVAS_ORIGIN_SHIFT`/`CANVAS_PADDING_TOTAL`), `layout/canvas-origin.ts#computeCanvasOrigin`, `renderer.ts#preChromeDims` fallback. Harness theme now built by core `buildTheme` (its local copy skipped `withDocumentStyle`, so `diagramMargin` never reached the harness while it reached `renderSync`).

## Rows before -> after
| row | before | after | note |
|---|---|---|---|
| xovano-23-tazo278 | 2 | 0 | EMPH-STROKE |
| fukika-81-gite897 | 150 | 58 | banner exact; residual = `skinparam padding 15` effects on note/diamond-label x (not banner) |
| zivege-92-rise076 | 140 | 49 | banner exact; residual = padding effects (as fukika) |
| labala-74-juki864 | 120 | 5 | margin exact (183x243 = jar); residual 5 = start/stop ellipse fill/stroke under `!theme amiga` (jar `#0B58A8`/`#FFF`, ours `#222`), owner activity-renderer-terminals.ts; theme lines `puml-theme-amiga.puml:34,38` — mechanism NOT verified |
| tozecu-08-ride878 | 562 | 562 | channel ready; waits on T2b emitters (below). Simulated with the two warnings added to `ast.pragma`: banner rect 298.437x35 and both texts byte-equal to the jar |
| lisade-37-vuri519 | 66 | 66 | ACT-SCALE not done (below) |

## Risers
0 across all 85 rows. Element census: fukika/zivege `rect-1,text-1` -> exact; labala unchanged exact. No other row moved.

## Census movers (all equal the pin's `jar` column)
- fukika style: fontSize{10:0->1} rx{2.5:0->1} textCount 9->10 (= jar); height 610->630 (jar 640, residual 10 is padding, not banner). text: fill/anchor 9->10, inset{7:0->1}, textCount 9->10 (= jar).
- zivege style: fontSize{10:0->1} rx{2.5:0->1} textCount 8->9 (= jar); height 446->466 (jar 474). text: fill/anchor 8->9, inset{7:0->1}, textCount 8->9 (= jar).
- labala style: width 193->183, height 253->243 (= jar).
Ratchet (327 pinned) byte-equal, harness-parity green, compress invariant green, swimlane census unchanged. Census pins need an orchestrator re-pin.

## For T2b (group-dispatch.ts — not edited)
Channel: `ctx.pragma.addWarning(new Warning(msg))` (`core/warning/Warning.js`); the banner reads `ast.pragma.getWarnings()` via `activityWarnings`.
1. `CommandPartition3.java:155-157` -> `group-dispatch.ts:67` (after `hasBracket`, BEFORE `parseNodes` at :70 so set order matches execution order): `if (!hasBracket) ctx.pragma.addWarning(new Warning("You should use a bracket ({) when defining your container '" + TYPE + "' " + NAME))` — TYPE is the keyword as written (`arg.get("TYPE")`, not `typeRaw`'s lower-cased copy), NAME after `eventuallyRemoveStartingAndEndingDoubleQuote` (:143).
2. `CommandCloseGroupLegacy3.java:75` (regex `(end ?group|group ?end)`, :57) -> `group-dispatch.ts:75` when `RE_CLOSE_GROUP_LEGACY` matches: `new Warning("You should use a bracket (}) instead of '" + CMD + "'")`, CMD = the matched text.
Other activity emitters exist upstream (`CommandActivity3.java:130-135`, `CommandActivityLong3.java:125-127`, `CommandRepeat3.java:121-123`) — not in any T2 write-set; untracked.

## Not done + why
- ACT-SCALE (lisade 66): stopped, write-set. Mechanism verified: ours renders the unscaled 220x149, jar = 220x149 x 2.27661 (`ScaleWidth`, `TextBlockExporter.java:160-166` resolves the factor on `calculateFinalDimension()` = post-chrome, post-margin dims; `SvgGraphics.java:469,801-802`). The parsed spec has nowhere to go: `tryScale` (dispatch-common-commands.ts) only sees `ParseContext` (dispatch-support.ts, not in write-set) and `ast.ts` is warnings-only. Faithful design: `ctx.scale`/`ast.scale` (+ `parser.ts` copy), the fragment carries `scaleSpec`/`dpi`, and core `assemble-svg-activity.ts#finalizeActivityFragment` resolves + applies after chrome, as `TextBlockExporter.ts#finalizeTitledDiagramFragment` does for mindmap (core edit -> all-engine survey). A plugin-only scale would be wrong whenever chrome is present.
- THEME-MARGIN with chrome: a diagram with title/legend/... keeps `same(10)` (`documentMarginTheme`) because `layout/document-margin.ts#applyActivityChrome` is called from `src/index.ts:233-234` with no theme and undoes/re-applies the fixed 10; using the theme margin in layout alone would misplace the body by (10 - m) against its chrome. Fix needs `src/index.ts` + `document-margin.ts` (outside write-set). No corpus fixture combines a non-10 margin with chrome.
- Banner colour mapping: `ColorMapper.IDENTITY`; activity has no `muteColorMapper` (dark/monochrome), so the banner keeps light colours under `mode dark`.
- Preprocessing-artifact warnings (`EaterOption.java`, `!option`) do not reach activity (no `PreprocessingArtifact` on the block).
- Skinparam/command warning order: skinparam warnings are placed first (mindmap precedent); upstream is source order, so a `skinparam` after a warning command is reordered.
- `docs/catalog.md` is stale (new modules activity-warnings.ts, canvas-origin-shift.ts): `npm run catalog` at merge (not committed here to avoid cross-task conflicts).
- `SKINPARAM_WARNINGS` table duplicates `mindmap/MindMapDiagramFactory.ts:54-58`; a shared core `CommandSkinParam` port would own it.

## Observation: activity harness theme builder had drifted from production
- **Context**: labala did not move in the probe although `renderSync` produced the jar's 183x243.
- **Finding**: `render-fixture-activity.ts#buildThemeForFixture` was a local copy that skipped `build-theme.ts#withDocumentStyle` (and declaration-order segments), so `theme.diagramMargin` never existed in the harness. Replaced by core `buildTheme`; only labala moved, ratchet byte-equal.
- **Impact**: any root/document style field read through `withDocumentStyle` was invisible to the activity probe before 77e47e653.
- **Confidence**: High

## Observation: klimt text uses U+00A0 for spaces in the banner
- **Context**: string assertions on banner text failed.
- **Finding**: `UText` emits NBSP for spaces (the jar does the same); assert on `replaceAll(' ', ' ')`.
- **Impact**: test authoring only.
- **Confidence**: High
