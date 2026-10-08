# add4-T3b: switch-label creole mode, ACT-SCALE, THEME-MARGIN with chrome, run family

Worktree `.claude/worktrees/add4-T3b`, branch `add4/T3b`, base `dc20ac952` (31 rows, Σ 1385).
I used no Serena tools and no `git stash`. `feat/activity-divergence-drive-4` is merged in as
`fc2a3383e`, as the orchestrator asked.

## Commits
1. `d83e68ca6` fix(add4-T3b): measure switch case labels as SIMPLE_LINE creole (core)
2. `e9af67eae` fix(add4-T3b): apply the activity scale directive to the document (core)
3. `fc2a3383e` merge of feat/activity-divergence-drive-4
4. `4ad85dbf1` fix(add4-T3b): carry each creole run's own font family (core; orchestrator add-on)
5. `0e1f25653` fix(add4-T3b): wrap activity chrome in the theme document margin (+ docs/catalog.md)
6. (this note) docs(add4-T3b): report

## Java -> ours
- **SIMPLE_LINE case labels.**
  - Java: `Branch.java:255-256` builds the case label with `display.create0(..., CreoleMode.SIMPLE_LINE, ...)`.
    `CommandCreoleBuilder.java:85-86` registers `createCreole(UNDERLINE)` only under FULL. `**bold**`
    (`:76`) is registered for every mode.
  - Ours: `core/svek/image/creole-text-lines.ts#creoleTextLines` takes an `opts.mode` (default FULL)
    and passes it to `buildLineAtoms(raw, fc, mode)`. `tiles/gtile-switch.ts#measureLabel` passes SIMPLE_LINE.
- **ACT-SCALE.**
  - Java parse: `CommandScale*.java` call `diagram.setScale`, which replaces any earlier scale
    (`AbstractDiagram.java:195-197`).
  - Java export: `TextBlockExporter.Builder#styled` reads `getScale()` (`:497`).
    `computeScaleFactor(calculateFinalDimension())` follows (`:160-166,198-208`).
    `SvgGraphics#format` multiplies every number (`:468-475`) and stroke (`:557-562`); the root
    size is `(int)(maxX*scale)` (`:801-813`).
  - Ours, parse: `dispatch-common-commands.ts#tryScale` sets `ctx.scale`, a new `ParseContext.scale`
    in `dispatch-support.ts`. `parser.ts` copies it to `ast.scale` (`ast.ts`).
  - Ours, resolve: `layout/document-margin.ts#withActivityScale` resolves the strategy against the
    raw block plus the margin (`applyActivityScale` with no chrome, `applyActivityChrome` with
    chrome). It forwards the result as a `simple` spec plus `dpi`.
  - Ours, apply: core `assemble-svg-activity.ts#finalizeActivityFragment` scales the body, the
    background rect and the canvas. It uses `scaleFragmentBody` plus an activity pass for
    `cx|cy|x1|y1|x2|y2|stroke-dasharray`.
  - Wiring: `src/index.ts` (still 531 lines) and `render-fixture-activity.ts` changed together.
- **THEME-MARGIN with chrome.**
  - Java: `TextBlockExporter.java:172-173` translates by `(margin.left, margin.top)`, and
    `:199-202,510-516` add the margin to the dimension.
  - Ours: `applyActivityChrome` still undoes the baked `same(10)` (`documentMarginTheme`) and now
    re-applies `activityDocumentMargin(theme)`. `applyActivityDocumentMargin(fragment, margin)` takes
    the margin's four sides.
- **Run family.**
  - Java: `CommandCreoleMonospaced.java` sets the family to `Parser.MONOSPACED`
    (`SkinParam.java:1068-1070`). `SvgGraphics.java:720-722` maps it at draw time.
  - Ours: `CreoleTextRun.family` is set from `atom.font.family` in `textAtomMeasured`.

## Rows before -> after (probe score)
| row | before | after | note |
|---|---|---|---|
| vimena-17-poju626 | 196 | 1 | c1; residual 1 = `""GatewayID""` font-family (see Not done 1) |
| lisade-37-vuri519 | 66 | 0 | c2 |
| zivocu-77-kopa900 | 1 | 1 | c4 is core-only; the consumer edit is outside my write-set (Not done 1) |

## Probe Σ per commit
- Pre-merge base Σ 1385 (31 rows): c1 1190, then c2 1124.
- Post-merge base: pins Σ 742 over 19 rows. After the merge plus my commits: 481. c4 and c5 do not
  move it (c5 has no corpus reach; T2e found no corpus fixture that combines a non-10 margin with chrome).
- Risers: 0 at every step.
- Element census: only vimena's and lisade's `ws` moved, and both fell. No element count moved.

## Census movers (all equal the pin's `jar` column; they need an orchestrator re-pin)
- vimena style: width 580 -> 546 (jar 546).
- lisade style: fontSize{12:3} -> {27.319:3}, strokeWidth{1:2} -> {2.277:2}, rx{12.5} -> {28.458},
  width 220 -> 500, height 149 -> 339. All equal the jar.
- lisade text: inset{10:1} -> {22.766:1} (= jar).
- Golden ratchet, harness-parity, compress invariant and swimlane census stayed green after every commit.

## engdiff per core commit (`plans/.../engdiff.py`, all 28 engines)
- c1 (eng0 -> eng1): movers=0, losses=0.
- c2 (eng1 -> eng2): movers=2 (activity lisade diverged -> conformant; unknown zovemu-18-keki646
  diverged -> conformant), losses=0.
- c4+c5 on the merged base (eng3 = `fc2a3383e` -> eng4 = `0e1f25653`): movers=0, losses=0.
- Final conformant counts: activity 394, class 709, mindmap 137, state 73, unknown 354.

## Not done + why
1. **zivocu-77-kopa900 1 and vimena 1 (`""GatewayID""` in a diamond label drawn with font-family "").**
   - The core half is landed (c4).
   - The consumer is `activity-renderer-text.ts#fontConfigForRun`, which returns
     `family: style.fontFamily`. It needs `family: run.family ?? style.fontFamily` (one line).
   - That file is outside my write-set (T3-gates).
   - Scratch-verified, then reverted: probe 481 -> 479, zivocu -> 0 and vimena -> 0, 0 risers. It
     emits `font-family="monospace"` because the draw path already maps `monospaced`.
2. **SNAKE-LABEL-CREOLE (authored jar fixture `switch-case-simple-line`, `it.fails` in
   `gtile-switch-creole-fixtures.test.ts`).**
   - Two sites still box the connector's case label at its RAW width:
     `layout/tile-layout-inlabel.ts#inLabelReservation` (`LABEL_MEASURER.measure`) and
     `layout/compress/shapes-of.ts#edgeLabelShape` (`bounder.getDimension`).
   - So X compression (`SlotFinder#drawText`) cannot close the 10 px the jar closes after an
     overhanging `**bold**` label.
   - Scratch fix (measure both through `creoleTextLines(..., SIMPLE_LINE)`), reverted: the fixture
     becomes exact and the probe does not move.
   - Owners: T3a (compress) and whoever owns `tile-layout-inlabel.ts`. When fixed, flip `it.fails` to `it`.
3. **The `__under__` case label is drawn underlined.** The jar keeps it literal (fixture
   `switch-case-creole-width`, text-only diffs). The renderer draws branch labels through
   `activity-renderer-text.ts` in FULL mode (its own doc says "neither caller passes its own
   `CreoleMode`"). Owner T3-gates. No probe row has it.
4. **The root `width`/`height` attributes are truncated.** `klimt/document-shell.ts` writes
   `Math.trunc(width)`, while the jar writes `format(maxX*scale)` (`500.854px`). The style and
   viewBox match. compareSvg does not charge this; the mindmap scale fixtures have the same gap.
   This is core shell, not in my write-set.
5. **Stale doc.** `activity-layout-constants.ts#documentMarginTheme` still calls the chrome margin a
   residual. It is now handled; that file is not mine.

## Observations
## Observation: shiftFragmentBody leaves float noise
- **Context**: margin25 fixture text x.
- **Finding**: `coord-shift.ts#shiftFragmentBody` adds unrounded: `126.04375000000002` where the jar
  writes `126.044`. compareSvg's tolerance hides it.
- **Impact**: byte-level only. Tests must compare with `toBeCloseTo(…, 3)`.
- **Confidence**: High
## Observation: scaleFragmentBody also scales `stroke-width="…"`
- **Context**: ACT-SCALE vocabulary.
- **Finding**: `TextBlockExporter.ts#SCALABLE_ATTR_RE`'s `\bwidth` matches after the `-` in
  `stroke-width`. Activity relies on that, and `assemble-svg-activity-scale.test.ts` pins it. Adding
  `stroke-width` to a second pass would scale it twice.
- **Impact**: anyone tightening that regex must add `stroke-width` to the activity pass.
- **Confidence**: High
## Observation: survey-all.sh cds into the MAIN checkout
- **Context**: all-engine survey.
- **Finding**: `plans/.../measurements/survey-all.sh` hardcodes `cd /Users/.../plantuml-ts`. Run from
  a worktree, it measures main. I ran the per-engine loop in the worktree instead.
- **Impact**: worktree agents must not use it as is.
- **Confidence**: High

---

# add4-T3b resume: SNAKE-LABEL-CREOLE (Not done 2)
- Merged feat/activity-divergence-drive-4 (`6229edef5`, 400 pinned).
- Commit: `127a293c6` fix(add4-T3b): box connector labels at their SIMPLE_LINE creole width (+ docs/catalog.md).
- Java -> ours:
  - Java: every Snake label is SIMPLE_LINE (`FtileFactoryDelegator.java:111`, `Branch.java:255-256`,
    `ConditionalBuilder.java:282,295,299`, `FtileRepeat.java:171-200`,
    `AbstractParallelFtilesBuilder.java:195`).
  - Ours: new `layout/tile-layout-inlabel.ts#snakeLabelLineWidth`. It is used by
    `inLabelReservation` (occupied width) and `compress/shapes-of.ts#edgeLabelShape`.
  - Placement still uses the raw width, as `renderer.ts` places the text with it.
- Fixture `switch-case-simple-line`: 83 diffs -> 4. All geometry is exact: case x positions and
  canvas width now equal the jar, and the test's `it.fails` is flipped to `it`.
  - The 4 left are all on the renderer side, Not done 3: `activity-renderer-text.ts` draws
    `x __under__ y __line__ z` in FULL mode, as 5 runs with underlining. The jar draws one literal
    run. Owner: T3-gates / renderer.
- Probe: Σ 232 over 12 rows, unchanged. No corpus row moved; 0 risers, 0 fallers.
- Census movers: none.
- Ratchet, harness-parity, compress invariant and style/text/swimlane gates: all green.
- Activity survey: 400 conformant, which equals the 400 pinned.
- Pre-existing, not mine: `npm run typecheck` fails at
  `tests/diagrams/activity/layout/compress/invariant.test.ts:695` (string vs never on
  `ALLOWED_HARD_OVERLAPS.includes`), arriving with the merged branch.
