## Observation: AtomText clamps a text height to 10
- **Context**: sdd1 T3a, `referenceHeader { FontSize 9 }` against the jar.
- **Finding**: `AtomText#calculateDimensionSlow` does `if (h < 10) h = 10`
  (`klimt/creole/legacy/AtomText.java:179-181`). Jar header tabs measure
  `max(FontSize, 10) + 2` (sizes 8/9/10 all give 12). The sequence engine
  measures line heights with `measurer.measure('M').height`, which has no
  clamp, so any sequence text below 10 px is one or more px short.
- **Impact**: only reachable with a style/skinparam font under 10 px (every
  sequence default is 11 or more). A shared fix belongs where sequence
  measures a line height, not per family.
- **Confidence**: High (jar probe at 8, 9, 10, 11, 12, 13, 16, 20).

## Observation: sequenceGroupBodyBackgroundColor is a legacy ColorParam, not a style
- **Context**: sdd1 T3a, frame body band.
- **Finding**: `SequenceDiagram#grouping` sets an opener's or else's general
  colour from `getSkinParam().getHtmlColor(ColorParam.sequenceGroupBody
  Background, …)` when the command wrote none (`SequenceDiagram.java:418-419`),
  at the command. The style path never sees it. The port's parser does not
  do this, so 9 corpus fixtures (cabeve, darupa, koleji, murori, nofegi,
  padomu, xebixi, xeneru, xuzedu) miss their band.
- **Impact**: the fix is in `command-grouping.ts` (sets `FrameEvent
  .backColorGeneral`/`branchColors`), not in the frame renderer.
- **Confidence**: High.

## Observation: a transparent font colour draws no text
- **Context**: sdd1 T3a, `group { FontColor transparent }` (pizupi-41).
- **Finding**: `DriverTextSvg.java:93-94` returns without drawing when the
  text colour is transparent. `FontConfigurationBridge` reads a transparent
  font colour as `null`, so a renderer falling back to `font.color` must skip
  a null, not substitute the theme text colour.
- **Impact**: `renderer-frame-header.ts#drawnRuns` does this for frames, refs
  and delays; other families still fall back to `theme.colors.text`.
- **Confidence**: High (jar probe).

## Observation: a test UmlSource needs skinparamAssignments for positioned skinparams
- **Context**: sdd1 T3a, testing that an `else` reads its own builder.
- **Finding**: `{ ...block.source, stylePositions, styleSource }` (the
  `sourceOf` in `sequence-skin-param.test.ts`) omits `skinparamAssignments`,
  so `createSequenceStyleDispatch` falls back to `positionedDeclarationsOf`
  and every skinparam executes before line 0. `index.ts#umlSourceOfBlock`
  also sets `rawStyles` and `skinparamAssignments`.
- **Impact**: per-line skinparam tests must mirror `umlSourceOfBlock`
  (`tests/unit/sequence/frame-paint-fixtures.ts#sourceOf` does).
- **Confidence**: High.

## Observation: else separators are drawn out of tile order
- **Context**: sdd1 T3a classify risers.
- **Finding**: upstream draws each `ElseTile` among the group's child tiles
  in order (`GroupingTile.java:280-281`); the port draws every separator
  right after the header (`renderer.ts#renderFrame`), so under index pairing
  each else rule/condition is compared with a message's polygon/text. Each
  attribute of a mismatched node costs one unit (`compare.ts:182-194`).
- **Impact**: 32 rows rose by +1 per else when the rule gained the jar's
  `stroke-width="1"`. Mirroring needs an else event in the geo stream
  (`geo-frame.ts`/`ast.ts`), outside T3a's write-set.
- **Confidence**: High.
