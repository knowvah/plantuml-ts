# T3f — diamonds and conditions

Agent: typescript-pro, worktree `add1-T3f`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
(1) Repeat entry/merge diamond: `Hexagon.asPolygon(shadowing)` closes (5 points) and the jar draws it with `stroke-width 0.5` + `stroke-linejoin miter`/`miterlimit 10`; our `renderDiamond` is unclosed without them (row 34). (2) If own-label vs branch-label order: UNRESOLVED (row 31) — `GtileIfHexagon`/`GtileHexagonInsideLabelled` (own label first) contradicts the jar SVG on tamaxe/rosizo (branch label first). Instrument the jar (which class runs? which draw call emits each text?) before any change; diagnosis.md applies. (3) `skinparam ConditionStyle InsideDiamond` (carapo, novata, perate): `tile-layout.ts:129-134`'s 'out of scope' note is a claim, not a ruling — port the style (parser/skin -> shape -> tile). (4) `ConditionEndStyle hline` (`FtileIfDown.java:147-150`, `SkinParam.java:1007-1011`). (5) multiline branch label: one `<text>` per line and the label height reserved in layout (bazuma).

## Rows (b2)
- **repeat entry diamond: Hexagon.asPolygon(shadowing) closed, stroke 0.5**: `biguku-39-voxu233`, `bozuro-33-celo170`, `guceja-66-tola192`, `ziboco-73-kazu841`
- **if own-label vs branch-label order (unresolved: GtileHexagonInsideLabelled vs jar SVG) — instrument first**: `cagoze-40-tete366`, `lacuci-13-nogo718`, `nonusu-50-nute147`, `pedoco-30-mose082`, `rerovo-62-nazo755`, `rosizo-69-mera514`, `secepo-00-febi326`, `tamaxe-36-mono574`, `vaxuta-95-cico162`, `vimako-25-mega336`
- **ConditionStyle InsideDiamond (unported style)**: `carapo-31-bisi880`, `novata-87-muti352`, `perate-09-gale335`
- **ConditionEndStyle hline (FtileIfDown.java:147-150)**: `saxeku-17-gume203`
- **multiline branch label height + one <text> per line**: `bazuma-86-metu353`

## Write-set
`src/diagrams/activity/{activity-renderer-shapes,activity-renderer-if-shapes,activity-renderer-terminals,parser,if-dispatch}.ts`, `src/diagrams/activity/layout/{diamond-labels,conditional-builder}.ts`, `src/diagrams/activity/tiles/gtile-diamond*.ts`, the tests exercising them, new tests (names unique to T3f).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
