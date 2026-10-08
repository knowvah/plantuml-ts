# add4-T3gates — D9: retire the action/note label staging gates

## Commits (branch `add4/T3gates`)

1. `a4c51c6f1` feat(core): thread hyperlink skin into creole url runs and link targets
2. `be06030ff` fix(activity): draw every action/note label through the FtileBox sheet
3. `9704eb7f3` merge feat/activity-divergence-drive-4 (catalog conflict: regenerated)
4. `ec6e1c050` test(add4-T3gates): pin the separator fixtures at zero diff after the merge
5. (this note)

## Java -> ours

- `FtileBox.java:178-181` `new SheetBlock2(new SheetBlock1(sheet, wrap, skinParam.getPadding()), new MyStencil(), UStroke.withThickness(1))`
  -> `activity-creole-sheet.ts#buildActionTextBlock`. SheetBlock1 padding is now the bare `skinparam padding` (`SkinParam.java:1147-1150`); the style padding is added outside, as upstream does.
- `FtileBox.java:124-134` MyStencil (`-padding.getLeft()` .. `dim.getWidth() - padding.getRight()`) -> the stencil in `buildActionTextBlock`. `----`, `====`, `-- t --` and `== t ==` all draw through `UGraphicStencil.java:83-84` -> `UHorizontalLine.java:87-152`.
- `FtileBox.java:236-243` calculateDimensionFtile -> `activity-creole-sheet.ts#actionBoxDimension`, which `tiles/gtile-action.ts#computeActionSize` uses for every label except `<code>`.
- `FtileBox.java:205-233` drawU: border ink + `style.getStroke()` applied before `tb.drawU`, plus the LEFT/RIGHT/CENTER translate -> `renderActionLabel` + `actionTextTranslate`.
- `Style.java:259-268` getFontConfiguration (HyperLinkColor) + `SkinParam.java:1057-1060` useUnderlineForHyperlink -> `activityFontConfiguration`, `activity-text-style.ts#activityHyperlinkColor`.
- `FontConfiguration.java:146,335-340` hyperlinkUnderlineStroke / hyperlink() -> `UText.ts` `FontConfiguration.hyperlinkUnderlineStroke`, `CommandCreoleUrl.ts#applyHyperlinkStyleAndPush`.
- `FromSkinparamToStyle.java:135` hyperlinkColor -> root -> `skinparam-key-handlers-table-c.ts`.
- `UGraphicSvg.java:67,77,161` + `net/atmp/SvgOption.java:223` linkTarget -> `u-graphic-svg.ts` (stores `option`), `svg-graphics-core.ts#SvgOption.linkTarget`; set from `theme.svgLinkTarget` in `drawActionTextBlock`.
- `Swimlanes.java:285-293` getTitle (`Display#create9`, i.e. creole) -> `activity-renderer-swimlanes.ts` now draws the raw `[[url label]]` title, so its `<a>` survives.
- The `FtileWithNotes.java:122-130` note stencil is unchanged; the geometric fallback is gone. Instrumented over all 451 dot-cache fixtures before deleting it: 0 fires.

## Rows (probe, base Σ 1385 / 31 rows)

| row | b2 | after `be06030ff` | after merge |
|---|---|---|---|
| fikuki-99-kulu790 | 87 | 14 | 14 |
| letuke-04-poza319 | 94 | 13 | 13 |
| mufixi-71-koma752 | 236 | 34 | 34 |
| nesozi-09-zezu092 | 20 | 5 | 5 |
| zocifu-52-miga192 | 2 | 1 | 1 |
| zejuso-92-kexo870 | 148 | 148 | 148 |
| zivocu-77-kopa900 | 8 | 8 | 1 (merge, not mine) |

Probe Σ per commit: `a4c51c6f1` 1385 (core alone moves nothing), `be06030ff` 1013, after the merge 802 (20 rows). 0 risers at every step.

## Residuals (each one isolated by measurement)

- **zejuso 148 and letuke 13 (ACTION-TAB / CREOLE-TABLE).** Mechanism: `node-dispatch.ts#readMultilineActionBody` (around :178) pushes `raw` lines without upstream's `BlocLines.removeEmptyColumns()` (`BlocLines.java:234-264`, called at `CommandActivityLong3.java:121`). That leaves a `\t` that gets measured (zejuso +48px) and a `  |= title |` that fails `CreoleParser.TABLE_LINE_PATTERN` (`CreoleParser.java:119`). Evidence: a temporary parser patch, reverted and never committed, took zejuso 148->2 and letuke 13->0. Three rows rose +5 under that crude patch, so the real port needs its own check. Owner: parser, `node-dispatch.ts`, not in my write-set.
- **nesozi 5.** `node-dispatch.ts:62` `m[2]!.trim()` drops the trailing space that `CommandSwimlane.java:63` `([^|]+)` keeps, so the jar's ` ` `<text>` is missing. Owner: parser.
- **zocifu 1.** The partition title is drawn by `activity-renderer-composite.ts:125-129` without `...linkStyleFields(theme)`, so its url stays blue. A one-line hunk; the file is unassigned.
- **fikuki 14 / mufixi 34 (EMBED, D4).** The jar sizes every `{{ }}` as a 42x42 placeholder (rect h 86 = 12+12+42+20) but draws the real image. For CENTER it also centres the 42-wide atom (fikuki image x 92 = 26 + (174-42)/2). Ours sizes and centres the real image. This is the oracle seam, not fitted.
- **zivocu (switch label).** `""GatewayID""` loses `font-family="monospace"`: `creole-text-lines.ts#textAtomMeasured` never copies `atom.font.family` into `CreoleTextRun`, so `drawActivityText` cannot emit it. Owner: T3b.

## Risers / census

- 0 probe risers.
- 4 jar-error rows (`filela`, `pixisi`, `putega`, `runima`, status `jar-error`: the jar crashes with "IllegalArgumentException start=end") changed score. They are not scored.
- Census movers (pins not re-pinned; orchestrator only). All moved to `=jar` except:
  - fikuki height 281->273 (jar 203), D4.
  - mufixi width 239->334 (jar 322; nearer the jar), D4.
  - mufixi height 509->779 (jar 567, **away**): D4. Mechanism above: the jar's box is sized for the 42x42 placeholder while its own image is 477 tall.
  - mufixi inset 122.338 (new), D4.
  - letuke strokeWidth[0.5] 0->4 (jar 5): one table row is missing because of the removeEmptyColumns residual.
  - nesozi fill#000 3->4 (jar 5): the trailing-space text.
  - zocifu #00F 2->1, #FFF 1->2 (jar 0/3): the partition title.
- Element counts never move away from the jar.
- 381 goldens byte-equal at `be06030ff`; 392 after the merge, all byte-equal.
- harness-parity, invariant, routing (1165) and refusal tests green.

## Core survey (rule 11)

All 28 engines were surveyed before (identical to `measurements/b2-eng`) and after `be06030ff`. engdiff: movers=2, conformant-losses=0. The 2 movers are activity fikuki and mufixi, diverged -> structural-match.

## Gates retired

- `isActionSheetEligible` (non-LEFT, table row, HR, `[[`) and its per-line fallback sizing in `gtile-action.ts` (`creoleLineWidth`/`creoleLineHeight`/`TABLE_BLOCK_MARGIN_Y`).
- `renderNoteLabel`'s geometric size-equality fallback.
- The swimlane title's `resolveInlineLinks` strip.

## Gates remaining (owner, hunk)

- `activity-renderer-shapes.ts` (T3d), now dead:
  - `renderAction`'s `if (sheetText !== null)` fallback after it, the `renderMultilineText`/`renderLabel` branch and `renderCreoleTableGrid`.
  - `renderNote`'s `if (sheetLabel !== null)` fallback.
  - Once those go, `activity-renderer-text.ts#renderCreoleTableGrid` is dead too.
- `<code>` blocks: `renderAction` dispatches `renderActionCodeBlock` (`activity-renderer-action-code.ts`) before the Sheet. So `gtile-action.ts#codeBlockSize` keeps a legacy `0.6*fontSize` monospace sizer. Upstream uses `StripeCode` inside the Sheet. Owner: T3d (dispatch order) + action-code file.
- SDL boxes (`<<input>>`/`<<output>>`/`<<save>>`): `activity-renderer-signal-shapes.ts#renderSignalLabel` draws per line while `GtileAction` now sizes them via the Sheet. The `BoxStyle` shield (`BoxStyle.java:61-97`, 10 for input/output) is not ported. Unassigned.
- `activity-renderer-text.ts` (mine; only retirable by migrating callers to Sheets):
  - `floorCoordinated` (documented as not upstream).
  - the `ruleLeft/ruleWidth/ruleStroke` HR fallback.
  - `drawCreoleLine`'s `kind !== 'text'` literal draw.
  - the JAR_DEFAULT/HYPERLINK colour sentinels.
  - Callers: renderer.ts (T3a), if-shapes/switch (T3b), signal-shapes, composite.

## Not done + why

- removeEmptyColumns and the lane-name trim: parser files are outside the write-set (mechanisms above).
- Composite title hyperlink: file outside the write-set.
- zivocu family: T3b's creole-text-lines.
- No `wrapWidth` (`style.wrapWidth()`, MaximumWidth) on the action Sheet: `LineBreakStrategy.NONE` as before. No row in scope exercises it.

## Resume (after T3-gates merge 1916ce346; merged feat at 78608da61, Σ 742)

Commits: `b26384548` removeEmptyColumns (action + note), `4165abe20` lane
name untrimmed, `5dd4aef6a` composite title hyperlink style.

Rows: zejuso 148->2, letuke 13->0, nesozi 5->0, zocifu 1->0.
Probe Σ: 742 -> 583 -> 578 -> 577. 0 risers at every commit; 451-fixture
render diff per commit moved only the named rows (+ jar-error pixisi
565->560, runima 560->557 on commit 1).

Crude-patch +5 risers (bozido/gufuma/pufuzi/fikuki/mufixi): all end `}}`
then `;`; the crude patch kept the empty closing TEXT that
`Display.createFoo` (Display.java:190-193) drops after `}}`. The faithful
port applies that rule -> 0 risers.

Other removeEmptyColumns callers: CommandNoteLong3 (ported, note-dispatch.ts;
0 corpus movers, authored fixture multiline-columns 37->0),
CommandBackwardLong3 (shares readMultilineActionBody, covered),
CommandArrowLong3 (multi-line `->` label command is NOT ported at all --
a new command in dispatch, T3b's dispatch-support.ts; not done).

Census movers, all = jar: letuke strokeWidth[0.5] 4->5, zejuso width ->813,
nesozi fontSize[18] ->3, textCount ->5, fill#000 ->5, titles ->jar;
zocifu fill #00F ->0, #FFF ->3.

Finding: the deterministic-text jar crashes ("IllegalArgumentException
start=X end=X") on ANY blank line inside an action/note label (bisected:
`:first\n\nlast;`, a note with a blank line, `:\n  x\n;`). Same crash as the
4 jar-error rows. We keep blank lines (upstream BlocLines does); cannot be
oracle-verified.

Not done: CommandArrowLong3 port (see above).
