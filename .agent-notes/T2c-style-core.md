## Observation: T2c (style core) execution summary

- **Context**: mission `activity-divergence-drive-2`, task T2c
  (`plans/activity-divergence-drive-2/batch-2a/T2c-style-core.md`), worktree
  `add2-T2c`, branch `add2/T2c`.
- **Finding**: 5 commits landed closing 5 of the 14 named rows fully, 2 more
  partially (residual re-slotted), and 7 fully re-slotted with precise
  mechanism + owning file (two of them because the fix needs
  `src/diagrams/activity/activity-renderer-shapes.ts`, owned by T2f/unclaimed,
  not T2c). Every edit stayed inside T2c's write-set; no file owned by a
  concurrent task (T2a/T2b/T2d/T2e/T2f) was touched. `git status` on `main`
  was never checked (not T2c's job — orchestrator's at batch close).
- **Impact**: ready for the orchestrator's batch-close procedure (merge,
  re-pin, cohort re-cut). Two re-slotted mechanisms (dakesa's gradient
  background, kafevi's diamond-bucket-cascade residual, carapo/novata/
  perate's render wiring) need a task whose write-set includes
  `activity-renderer-shapes.ts` and/or `gtile-if-down.ts`/`gtile-if-with-
  links.ts` — recommend folding into T2f or a dedicated follow-up.
- **Confidence**: High — every number below is from a fresh
  `scripts/activity-probe.ts`/`--dump` run against this branch's own commits,
  not copied from a prior report.

## Commits (5, each green: targeted vitest + typecheck + eslint)

1. `120e66d5c` feat(activity): wire skinparam ArrowHeadColor through the Worm draw
2. `6dbb5e449` feat(activity): wire skinparam defaultTextAlignment into box text
3. `bd0c3ccbb` feat(activity): read graph.arrowFontSize for the arrow label text size
4. `c5448221c` feat(activity): add theme.conditionStyle + GtileDiamondSquare tile
5. `a05740228` fix(activity): thread the creole [[url{tooltip}]] into title/xlink:title

## Java → ours (file:line)

- `Rainbow.build(Style, HColorSet)` (`decoration/Rainbow.java:84-95`) + `Worm
  #drawInternalOneColor` (`activitydiagram3/ftile/Worm.java:126-127,146-154`)
  → `theme.colors.arrowHead` (`src/core/theme-colors-fields.ts`), `arrowheadcolor`
  handler (`src/core/skinparam-key-handlers-table-a.ts`), `activityArrowHeadColor`
  (`src/diagrams/activity/activity-style-defaults.ts`), `renderer.ts`'s
  `renderEdge`/`renderEdgeSegments`/`renderMidArrow` (split `line`/`head` colors).
- `FtileBox.java:86,89,224-233` (`style.getHorizontalAlignment()`) +
  `FromSkinparamToStyle.java:155` (`defaulttextalignment` → `PName
  .HorizontalAlignment` on `SName.root`) → `activityHorizontalAlignment`
  (`src/diagrams/activity/activity-text-style.ts`), reading the ALREADY-WIRED
  `theme.colors.elements['root'].horizontalAlignment` bucket (`skinparam-key-
  handlers-table-b.ts#setAlignment`, landed by an earlier mission for `class`).
- `FromSkinparamToStyle.java:149` (`addConFont("arrow", SName.arrow)` registers
  `arrowFontSize` as `PName.FontSize`) → `activityFontSize`'s new `sname ===
  'arrow'` tier reading `theme.colors.graph.arrowFontSize` (`src/diagrams/
  activity/activity-style-defaults.ts`), the SAME field `core/arrow-label-
  font.ts#resolveArrowLabelFont` reads for every other diagram type.
- `svek/ConditionStyle.java:41-64`, `SkinParam.java:997-1004`,
  `ConditionalBuilder.getShape1` (`:251-277`), `FtileDiamondSquare.java`
  (whole file), `Hexagon.asPolygonSquare` (`Hexagon.java:107-118`) →
  `theme.conditionStyle` (core, mirrors T1p-a's `conditionEndStyle`
  exactly) + `GtileDiamondSquare` (`src/diagrams/activity/tiles/gtile-
  diamond-square.ts`, new file) + `DiamondConditionTile` interface
  (`gtile-diamond-inside.ts`). NOT wired to `conditional-builder.ts` (see
  re-slot below).
- `klimt/creole/atom/Atom.ts#CreoleAtomUrl` (already correct) +
  `CommandCreoleUrl.ts#resolveUrlAndTooltip` (already correct) →
  `creole-text-lines.ts#textAtomMeasured` was dropping `atom.url.tooltip`;
  added `CreoleTextRun.tooltip` and wired `activity-renderer-text.ts
  #drawCreoleUrlLine` to read it.

## Per named row

| row | before → after ws | status |
|---|---|---|
| farexi-86-xanu521 | 2 → 0 | pinned-ready (conformant) |
| zanudo-86-seco241 | 2 → 0 | pinned-ready (conformant) |
| fofele-65-lozo631 | 3 → 0 | pinned-ready (conformant) |
| naroji-40-nuke022 | 3 → 0 | pinned-ready (conformant) |
| molexa-46-redi999 | 1 → 0 | pinned-ready (conformant) |
| zamagu-75-vape137 | 2 → 0 | pinned-ready (conformant) |
| kafevi-44-tesu096 | 39 → 7 | partial; residual re-slotted (below) |
| dakesa-98-mano758 | 13 → 13 | **re-slotted** (below), unchanged |
| carapo-31-bisi880 | 77 → 77 | **re-slotted** (below), unchanged |
| novata-87-muti352 | 22 → 22 | **re-slotted** (below), unchanged |
| perate-09-gale335 | 38 → 38 | **re-slotted** (below), unchanged |
| pekuxe-00-bovi270 | 1 → 1 | **re-slotted** (below), unchanged |
| gaxezi-48-zesa921 | 2 → 2 | **re-slotted** (below), unchanged |
| nisexe-68-vabu320 | 2 → 2 | **re-slotted** (below), unchanged |

Also closed as a side effect of the same mechanisms (not named rows; found
by diffing `measurements/b1.json`'s `score` against this branch's final
`activity-probe.ts` run, slug by slug — NOT the probe's own `pinned` column,
which is the stale `diff-baseline.json` reference, not my starting point):
`copisa-69-xisi273` 125→124, `fikuki-99-kulu790` 88→87, `dozaxu-98-xetu961`
23→9, `loxija-71-joku558` 126→121, `zepima-96-peco612` 219→214. All five are
genuine falls (score strictly decreased from b1), zero risers among them.

## Re-slotted rows — mechanism + owning file

- **dakesa-98-mano758** (gradient `BackgroundColor`): `skinparam activity {
  BackgroundColor red-green }` needs `acc.activityBackground: Paint` (not
  `string`) all the way to `theme.colors.graph.activity.background: Paint`.
  Reverted after discovering the ONE consumer, `ActivityColors.nodeFill`/
  `actColors()`/`renderAction()`, lives in `activity-renderer-shapes.ts` —
  **T2f's write-set**. Widening the theme field without widening that
  consumer leaves a real `string`-vs-`Paint` type error in a file T2c may
  not touch. Mechanism: `rect()`'s `BoxStyle.fill: Paint` already draws a
  `<linearGradient>` def for any gradient `Paint` — the ONLY missing piece
  is the type threaded from the skinparam handler through to `nodeFill`.
- **kafevi-44-tesu096** residual (39→7, not 0): `skinparam activity {
  BackgroundColor lightBlue; BorderColor darkBlue }` does not cascade into
  the if-condition DIAMOND's fill/stroke the same signature-SUBSET way
  `activityLineThickness`'s `sname === 'arrow'` tier already cascades the
  `activity` bucket onto `arrow` (`FtileFactoryDelegator.java:80`: the
  diamond's OWN style signature is `{root,element,activityDiagram,
  activity,diamond}` — it contains `SName.activity`, so an `activity{}`-
  scoped rule legitimately matches it). Fix is in `actColors()`'s
  `diamondFill`/`diamondBorder` resolution — `activity-renderer-shapes.ts`,
  **T2f's write-set**.
- **carapo-31-bisi880 / novata-87-muti352 / perate-09-gale335**
  (`ConditionStyle InsideDiamond`): core field (`theme.conditionStyle`) and
  the sizing tile (`GtileDiamondSquare`) are DONE and unit-tested
  (13 tests pinning its formulas against `FtileDiamondSquare.java` exactly).
  What remains: (1) `conditional-builder.ts#buildIfDown`/`buildIfWithLinks`
  must branch on `theme.conditionStyle` to construct `GtileDiamondSquare`
  instead of `GtileDiamondInside` — T2c's own file, SAFE to edit, but (2)
  blocked by it: `gtile-if-down.ts` and `gtile-if-with-links.ts` both type
  their `diamond1` param as the CONCRETE class `GtileDiamondInside`
  (TypeScript's private-field nominal typing means a same-shaped sibling
  class is NOT assignable without a shared interface — confirmed, not
  assumed). `DiamondConditionTile` (new interface in `gtile-diamond-
  inside.ts`) is ready for exactly this widening. `gtile-if-with-links.ts`
  is **T2f's write-set**; `gtile-if-down.ts` is **unclaimed** by any current
  task. (3) `activity-renderer-if-shapes.ts` (T2c's own file) needs a new
  `renderDiamondSquarePolygon`/own-label pair mirroring `Hexagon
  .asPolygonSquare`'s 4-point unclosed formula — straightforward once (1)
  and (2) land, since `renderNode`'s dispatch switch (forbidden file) never
  needs to change: it already calls back into T2c-owned functions by name,
  keyed only on `node.kind`, not on shape style. novata/perate ALSO route
  through `repeat...while`'s own diamond construction (not examined this
  session — may need its own `theme.conditionStyle` branch, found via
  `--dump novata-87-muti352`: residual is exactly the polygon x position
  for the condition shape, 79.67 vs jar's 81.76, consistent with the
  hexagon-vs-square formula, not a second unrelated cause).
- **pekuxe-00-bovi270 / gaxezi-48-zesa921 / nisexe-68-vabu320**
  (`hyperlinkUnderline`/`svgLinkTarget`): NOT given theme fields this
  session (see scope note below) — `CommandCreoleUrl.ts`'s own
  unconditional `.add(FontStyle.UNDERLINE)` and `core/svg.ts#linkWrap`'s
  `target = '_top'` default both need a `Theme` value, and the one call
  site that would supply it for an ACTION node's label
  (`activity-renderer-shapes.ts#renderAction`, building `ActivityTextStyle`)
  is **T2f's write-set**. `ActivityTextStyle` (`activity-renderer-text.ts`,
  T2c's own file) has no `theme` field today; adding one (optional, so no
  other call site breaks) is safe and T2c's, but wiring the CONSUMING call
  site is not. Scope note: given the consumption is blocked regardless, I
  chose not to add the two inert core theme fields either, to avoid
  further `theme.ts`/`skinparam-*.ts` file-size churn (both already at the
  500-line cap and required a new `skinparam-key-handlers-table-c.ts` for
  `conditionStyle` alone) for a field nothing in this task's reach can use.

## Probe Σ (full 244-row corpus, `scripts/activity-probe.ts`)

- Baseline (branch head before T2c, `measurements/b1.json`): **Σ 25086**.
- After commit 1 (ArrowHeadColor): Σ 25076.
- After commit 2 (defaultTextAlignment): Σ 25073.
- After commit 3 (ArrowFontSize): Σ 25017.
- After commit 4 (conditionStyle core+tile, inert): Σ 25017 (unchanged, as
  expected — nothing consumes the new field/class yet).
- After commit 5 (creole tooltip): **Σ 25015**.
- **0 risers at every step** (`activity-probe.ts`'s own riser/faller
  classification, re-run after each commit, not just once at the end).

## Survey verdict changes per engine (shared-core touch)

Ran a 7-engine (class/state/sequence/component/usecase/mindmap/object)
before/after survey via two worktrees (`measurements/mkwt.sh`). First
attempt ran all 7 in parallel with `&` (a rule violation I caught myself —
see `.agent-notes/T2c-background-concurrency-confound.md`), which produced
a confounded result (`timeout` in the "before" run that was really CPU
contention, not a code effect). Re-verified by hand: **0 non-timeout
regressions in any engine** — every verdict change between before/after
was `timeout → <real verdict>`, never `conformant → anything worse`. Spot-
re-ran `class` (709→709) and `state` (73→73) conformant counts sequentially
after all 5 commits landed, byte-identical — confirms the shared-core edits
(`theme.ts`, `skinparam-*.ts`, `creole-text-lines.ts`) are inert for every
engine but activity, as designed.

## Risers

**None.** Every probe run after every commit reported `risers (0)`.

## Not done / why

- `gtile-if-down.ts`/`gtile-if-with-links.ts` widening + `activity-
  renderer-shapes.ts`'s `actColors()`/`ActivityColors`/`renderAction` edits
  — outside T2c's write-set (see re-slot table above). Recommend a
  dedicated follow-up task with a write-set spanning `conditional-builder
  .ts` (already T2c's), `gtile-if-down.ts` (unclaimed), `gtile-if-with-
  links.ts` (currently T2f's), `activity-renderer-if-shapes.ts` (T2c's),
  and `activity-renderer-shapes.ts` (T2f's) — i.e. this mechanism needs
  ONE agent owning both sides, not two agents split across a shared type
  boundary.
- `hyperlinkUnderline`/`svgLinkTarget` theme fields: not added (scope
  decision above — inert fields with a blocked-regardless consumer, and
  `theme.ts`/`skinparam-*.ts` already at the file-size cap).
- Repeat-while's own diamond-condition construction (whichever file builds
  it — not `conditional-builder.ts`, not yet located this session) was not
  traced; novata/perate's residual is consistent with (not proven
  independent of) the `ConditionStyle` mechanism above.

## Quality gates

`npm run typecheck`, `npm run lint`, `npm run build` all green at HEAD of
this branch. Targeted vitest run covering every touched file plus the full
`tests/unit/activity/`, `tests/diagrams/activity/`, `tests/unit/core/`,
and the three activity oracle tests (golden ratchet / diff-baseline ratchet
/ harness-parity): **407 files, 7321 passed, 1 pre-existing skip, 0
failed**. The 84 pinned goldens this branch started with are still
byte-equal (`activity.golden.ratchet.test.ts` green).
