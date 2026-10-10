# isw-T2-act — activity group report (2026-10-09)

Branch `isw/T2-act`, worktree `.claude/worktrees/isw-T2-act`, base `46a801487`.

## Commits
- `ae44f0593` F1 — activity measures through the render's string bounder
- `9d15ed201` F3 — measure the special swimlane's "" title
- `e839bd6f1` F2 — keep the spaces upstream's label captures keep
- `d90883577` F5 — wrap activity text where upstream passes wrapWidth
- `3639fc939` F2b — keep a multiline action's first line verbatim (found via F6 row)
- `02670be7b` F7 — split action labels as Display#getWithNewlines does
- `d0482aa55` S/P — stale expectations moved to seam-#4 jar values

## Results
- tests/unit/activity + tests/diagrams/activity: 2185 tests, 0 failures (one `it.fails` documents the wrap-switch residual).
- activity-vertical-if-t1pb, condition-end-style-t1pa, harness-parity, render-fixture-activity, tests/architecture/isw-measurer: green.
- activity.golden.ratchet (--maxWorkers=2): 415/415.
- `npm run typecheck`, eslint on every touched file: clean.
- Survey activity (`--out /private/tmp/claude-501/isw-T2-act/parity-activity2.json`): 431 conformant / 1 structural-match / 19 diverged. Owed `activity/` rows: 328/328 conformant.
- Survey unknown: of the 19 ACTIVITY rows, 16 conformant; cezeje-11-roxe484, febuci-08-zogi253, kakitu-70-kuvi013 diverged (mechanism below, core-owned).

## Per family
### F1 — measurer injection (user ruling)
- Java: `Swimlanes.java:239,246` builds the factory from `ug.getStringBounder()`; `FtileFactoryDelegator.java:223-225` -> `VCompactFactory.java:83-85,91`.
- Ours: new `src/diagrams/activity/activity-string-bounder.ts` (`withActivityMeasurer`/`activityMeasurer`, symbol-keyed on the theme; throws when absent). `layout/tile-layout.ts#layoutActivity` attaches the injected measurer and stores it on `ActivityGeometry.measurer`; `renderer.ts#renderActivity` re-attaches it. The 9 `new WidthTableMeasurer()` sites now read `activityMeasurer(theme)`. Layout and draw use the same instance.
- Production-visible: activity text widths follow the resolved measurer. NOTE: `src/core/render-options.ts#resolveMeasurer` gives activity `getDefaultMeasurer()` (Canvas/Formula), not `jarMeasurer` (only `description` gets that) — the brief's "AWT(jarMeasurer)-measured" is not what production does; core-owned.
- Owed rows: 213 (F1 family) conformant.

### F3 — trailing special swimlane
- Java: `Swimlanes.java:116-123` appends `new Swimlane("", ...)`; `Display.java:344` keeps one empty line; `StripeSimple.java:124-127` yields a `" "` atom; `getHalfMissingSpace` `:436-449` (title `:442`); band `:363`.
- Ours: `layout/swimlane-title.ts` (`swimlaneTitleBlock`/`swimlaneTitleWidth`, shared with `activity-renderer-swimlanes.ts`), `swimlane-placement.ts#measureLanes` (titles = creole block; `specialTitleWidth`), `swimlane-lane-origins.ts#computeLaneOrigins` (special lane appended to inputs; `trailingHalfMissingSpace` on the last lane), `swimlane-chrome.ts` (band right edge uses it). Dead `bounder` field removed from `PlacementInput`.
- Production-visible: unfloored multi-lane canvases/title bands widen by (title-font space − min)/2 (+2.475 at 18pt).
- Owed rows: 80 conformant.

### F2 — capture trims (each site verified)
- Kept verbatim (no space leaf around the capture): CommandActivity3 LABEL, CommandRepeat3 LABEL, CommandIf2/If4 TEST+WHEN, CommandIfLegacy1 TEST, CommandElseIf2/3 INCOMING/TEST/WHEN, CommandElse3 WHEN, CommandWhile3 TEST/YES, CommandWhileEnd3 OUT, CommandRepeatWhile3 TEST/WHEN/OUT, CommandSwitch TEST, CommandCase TEST (`:61,82-86`), CommandBackward3 LABEL (`:77-79`, RE_BACKWARD fixed) + INCOMING/OUTCOMING, CommandActivityList LABEL (spaceZeroOrOne before), CommandActivityLong3 DATA (`:81-82,139`, empty first line kept).
- CommandArrowLong3: trim only decides the closer (`Trim.BOTH`, `CommandMultilines2.java:105`); content = raw block via `removeEmptyColumns` + `removeStartingAndEnding(LABEL, 1)` (`:100-116`) — `dispatch-arrow-long.ts` rewritten.
- Left trimmed (equivalent upstream): CommandNote3 NOTE (space leaf before, line trimmed), CommandElseLegacy1 / IfLegacy1 WHEN, CommandBackwardLong3 DATA (space leaf before), repeat head rest.
- `Display#isWhite` (`Display.java:170-175`) mirrored for while/repeat/switch tests (`FtileWhile.java:124`, `FtileRepeat.java:127`, `FtileFactoryDelegatorSwitch.java:142`): `layout/display-white.ts`.
- Owed rows: 34 conformant (+ vamazo-19-tufu812 kept conformant by isWhite).
- Production-visible: labels with inner padding draw wider/shifted like the jar.

### F5 — wrapWidth
- Java sites wired: FtileBox.java:175, FtileWithNoteOpale.java:143, FtileNoteAlone.java:109, FtileWithNotes.java:115, ConditionalBuilder.java:120-121,244,280-283, FtileFactoryDelegatorSwitch.java:110-111,134, Branch.java:248-258, FtileIfLongHorizontal.java:174. Not wrapped (verified by jar fixture): while/repeat `Display#create`, FtileIfLongVertical test, swimlane titles (`Swimlanes#getWrap` NONE test is by reference vs fresh `new LineBreakStrategy(null)`, `SkinParam.java:981-984` — only `swimlaneWrapTitleWidth` wraps).
- Ours: `activity-text-style.ts#activityWrapWidth` (bucket MaximumWidth ?? skinparam wrapWidth), `DiamondText` (`CONDITIONAL_TEXT`/`CREATE_TEXT`) on the diamond tiles, `wrapped` on label nodes / `labelWrapped` on edges, `edgeLabelBlock`, `gtile-switch.ts#measureLabel` now the real Branch block.
- Rows: tajiri-57 (owed), javivi-33, lefobe-62, mukaxi-27 conformant. Authored jar fixtures `tests/fixtures/isw-T2-act/wrap-{if,elseif,while,swimlane,switch}` (test `tests/diagrams/activity/isw-T2-act-wrap-width.test.ts`).
- Production-visible: diagrams with wrapWidth/MaximumWidth wrap actions, notes, if/switch/elseif tests, branch/case labels.

### F6 — bozido-07-geze049
- Mechanism: our nested renderer has no wbs/salt/gantt engine, so `{{wbs}}`/`{{salt}}`/`{{gantt}}` render the error-sentinel plugin's 300x60 "unknown diagram type" placeholder (`src/core/dispatcher.ts:340-350`, ERROR_SENTINEL). Not activity; owner: those unported engines. The activity part (": sub-dia" leading space) fixed by F2b; weightedScore back to its pin (68).

### F7 — filela-40-rumo296, putega-59-fuzi707 (both now conformant)
- `\\n` in a single-line action: `Display.getWithNewlines` (`Display.java:262-345`) reads `\\` as one backslash, so the creole table cell gets a literal `\n`; ours regex-split it. Now `dispatch-newline-sentinels.ts#displayWithNewlines` (core `parseWithNewlines`).
- `%newline()` in a multiline action: `BlocLines#toDisplay` = `Display.createFoo` (`BlocLines.java:124-128`) — no scan; the sentinel reaches `CreoleStripeSimpleParser.java:164`. Our decoder removed (dead: `decodeNewlineSentinels`, `RE_ESCAPED_NEWLINE`, their test).

### S/P tests updated (new value source)
- FtileBoxOld (12): `test-results/dot-cache/mindmap/{bepinu-34-tiji715,zenigi-93-gofu307,rinamu-56-tabi421}/in.svg`; one-JVM renders of `tests/unit/activity/ftile/fixtures/*.puml`.
- activity-warnings: one-JVM render of `skinparam padding 15`+`start` (textLength 229.5, rect 239.5, svg 270).
- activity-text-sheet-diamond: fround width (jar textLength 23.788).
- invariant: ALLOWED_HARD_OVERLAPS -> [] (none of the six occur).
- swimlane-chrome / swimlane-width-ab / walk-if-with-links-hline-lanes: one-JVM renders of `tests/fixtures/activity/add4-T1b/*.puml`, `add4-T1g/hline-links-*.puml`.
- switch-merge-hexagon: re-captured `tests/fixtures/activity/add4-T2d/*/in.svg`.
- walk-switch-cross-lane-merge: re-captured mojezi-43-gamu360 lines, compared at jar precision.
- parser tests (ubrr-t10 backward/case, arrow-long, multiline sentinel), activity-text-sheet `__u__` (one-JVM render), renderer-shapes table grid (niletu-83-lego826): cited inline.

## Not done / open
- wrap-switch residual: case labels draw where the jar draws them, but the jar's `getYdelta1a` (`FtileSwitchWithManyLinks.java:413-423`) exceeds ours by 2.944 for a 2-line wrapped case label and by 13.944 for 4 lines (experiment: `/private/tmp/claude-501/isw-T2-act/jw3/sw{1,2,3}`). Mechanism NOT isolated; ruled out: label line count/positions (measured equal in both renders), Branch block construction (Java read: same create0 args). Not yet ruled out: BIG/SMALL mode choice, a measure-vs-draw bounder difference. Next: instrument `Branch#getTextBlockPositive().calculateDimension` in the jar (SheetBlock1.initMap caches per StringBounder class, `SheetBlock1.java:117-120`).
- sesodi-22-lupe361, tirizu-79-niza262: need `skinparam swimlaneWrapTitleWidth auto` — `Theme` has no field (owner: src/core skinparam handlers + theme). Also our title height uses lane names not displays (`layout/swimlane-vertical.ts#measureSwimlaneTitlesHeight`).
- cezeje-11-roxe484, febuci-08-zogi253, kakitu-70-kuvi013 (unknown/): bare `activityDiagram { MaximumWidth 100 }` is dropped by `src/core/style-map-element.ts#resolveElementBucketSelector` (only `<diagram>.<bucket>` selectors feed buckets) — the cascade to activity SNames is core-owned.
- jetigu-21-zaje860, nuzise-60-temi305: teoz/sequence markup routed to activity; not owed.

## Orchestrator actions
- `oracle/goldens/svg-activity/diff-baseline.json`: 18 `jar-error` rows now have rendered goldens; 16 conformant (fakece-07, filela-40, javivi-33, juleki-83, kivada-26, lefobe-62, mijoso-20, mukaxi-27, nudonu-37, nupiko-03, pixisi-38, putega-59, roroko-26, runima-82, tajiri-57, vafupe-19), 2 diverged (sesodi-22, tirizu-79). No baseline row rose.
- style-baseline: ours census == jar census for 430/448 non-`error` rows; text-baseline 432/448; swimlane-baseline 96/100 (script `/private/tmp/claude-501/isw-T2-act/census.mts`, ours vs golden census, swimlane without the geometry lanes). Re-pin all three from a fresh measurement.
- ratchet.json: candidates for pinning — the 16 newly conformant jar-error rows.
- DIVERGENCES.md: nothing.

## Observations
- Observation: activity production measurer. Context: F1. Finding: `resolveMeasurer` maps only `description` to `jarMeasurer`; activity uses Canvas/Formula. Impact: "production = AWT" is false for activity. Confidence: High.
- Observation: Swimlanes#getWrap reference-equality quirk. Finding: `skinparam wrapWidth` never wraps swimlane titles (jar fixture wrap-swimlane). Impact: do not thread style.wrapWidth into titles. Confidence: High.
- Observation: the conformance census helpers can be driven from jiti outside vitest except the style census (defined in the test file). Confidence: High.
