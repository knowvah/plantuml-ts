# add4-T3e: `<code>` via the Sheet, BoxStyle outlines and shield, if-down north pad

Branch `add4/T3e`, base `476a7904d`. Base probe Σ 493 (13 rows).

## Commits
| sha | subject | probe Σ after |
|---|---|---|
| 8b20c15cd | fix: draw `<code>` action blocks through the box's own sheet | 493 |
| a4d235a1a | fix: pad the if-down merge rhombus's empty north label | 493 (489 with patch A) |
| 468bcc0f7 | style: prettier-format gtile-if-down.ts | 493 |
| 1a3d4fae6 | feat: draw every SDL/UML box style through the action sheet | 493 |
| (this note) | | |

Two patches carry the hunks that sit outside my write-set. Both apply cleanly
on `1a3d4fae6` and were verified together: Σ 489, 0 risers, gates green.
- **A** `.agent-notes/add4-T3e-if-down-padding.patch`:
  - `layout/conditional-builder.ts#buildIfDown` gets `padding: theme.padding` (1 line);
  - `tests/diagrams/activity/if-label-padding.test.ts` drops its tolerated mid-arrow residual.
- **B** `.agent-notes/add4-T3e-box-style-layout.patch`:
  - `layout/tile-coordinates.ts` copies `t.stereotype` onto the action geo (2 lines);
  - `layout/canvas-origin-fudge.ts#boxStyleFudge` gives each outline its LimitFinder ink;
  - `layout/swimlane-context.ts` LaneItem gains `stereotype`/`height`;
  - `layout/swimlane-placement.ts#laneItemsOf` passes them;
  - new `tests/diagrams/activity/action-box-style.test.ts` (16 fixtures).

## Java -> ours
- `<code>`:
  - `CreoleParser.java:103-104` (`isCodeStart` -> `new StripeCode(fc.changeFamily(MONOSPACED))`);
  - `StripeCode.java:89-98` (raw bounder heights, no AtomText floor) and `:104-117` (draw);
  - the core port already existed (`core/klimt/creole/legacy/StripeCode.ts`). The legacy path is deleted, so the action Sheet handles `<code>`.
- BoxStyle:
  - `BoxStyle.java:61-97` shields -> `tiles/gtile-action.ts#BOX_STYLE_SHIELDS`;
  - `:126-133` fromString (`-` removed, case-insensitive) -> `boxStyleName`;
  - `:122-124` -> `boxStyleShield`.
- `FtileBox.java:241-242`:
  - width = `dimRaw + shield`;
  - `left = dimRaw/2` -> `GtileAction.width` and `hookX`.
- `FtileBox.java:132` MyStencil `getEndingX` includes the shield -> `activity-creole-sheet.ts#buildActionTextBlock(..., shield)`.
- `FtileBox.java:224-233` translate over the shielded `dimTotal` -> `renderActionLabel` box `{..., shield}`.
- `drawMe` outlines over `width - shield` (`BoxStyle.java:179-498`; constants `:110-112`) -> `activity-renderer-signal-shapes.ts`, one function per style. Mapping:

  | upstream | ours |
  |---|---|
  | input / trigger | `inputShape` |
  | output / sendSignal | `outputShape` |
  | procedure | `procedureShape` |
  | load | `loadShape` |
  | save | `saveShape` |
  | continuous | `continuousShape` (UPath) |
  | task / object | `squareShape` (unrounded) |
  | objectSignal | `objectSignalShape` |
  | acceptEvent | `acceptEventShape` |
  | timeEvent | `timeEventShape` |

- Patch B, `LimitFinder.java:169-188`: polygon X `±10`, UPath exact, rect `-1`. Text ink for timeEvent's hourglass is `:217-224`.
- If-down:
  - `ConditionalBuilder.java:176,292-303`: `getShape2(useNorth=true)` -> `withNorth(tbout1)`, and tbout1 = `Display.NULL` (`LinkRendering.java:49-53`), i.e. an empty padded Sheet `2p` tall (`SheetBlock1.java:196-199`);
  - `FtileDiamond.java:89-91,108-112`: the merge diamond's height and inY grow by `2p`;
  - the mid-point is `inY + (outY-inY)/2` (`FtileIfDown.java:262`);
  - ours: `tiles/gtile-if-down.ts#diamond2North`. `diamond2Y` is the rhombus top.

## Rows / fixtures (before -> after)
- fukika-81-gite897: 4 -> 4 committed, 4 -> 0 with patch A. Element census delta unchanged (`{}`).
- if-label-padding-down-yes (add4-T3d): tolerated residual -> 0 diffs with patch A.
- Authored `tests/fixtures/activity/add4-T3e/` (all from `scripts/oracle-render.sh`):
  - `code-{first,mixed,wide,center,padding,small}`: code-first 18 -> 0, the other 5 were already 0. The legacy path only fired when `<code>` was the first line.
  - `boxstyle-<13 styles>`, `-center`, `-hr`, `-variants`: Σ ws 1013 -> 1013 committed, -> 0 with patch B (all 16 exact).
  - `boxstyle-lanes`: 98 -> 33 with patch B. The residual is listed below.
  - `boxstyle-stereogroup`: 96 -> 111 with patch B. It is a parser residual (below).

## Risers / census movers
- 0 probe risers at every commit. 451-fixture corpus render diff: no corpus SVG changes at any commit. Element census movers: none committed (fukika ws only with A).
- 399 pinned goldens byte-equal; harness-parity, compress invariant, style/text/swimlane census green at every commit and with both patches.
- boxstyle-stereogroup rises 96 -> 111 under patch B (authored, unpinned). Mechanism: `:colour after stereo; <<save>> #pink` matches no upstream single-line command (`CommandActivity3.java:68-77` has no COLOR group after the stereogroup). So the jar opens a multi-line activity that the next line closes with `<<foo>> <<procedure>>`, and draws one procedure box. Ours parses two boxes, and once patch B lands it draws the save outline for the first box. Parser-owned (`dispatch-support.ts#RE_ACTION`).

## Code deleted
- `activity-renderer-action-code.ts` (whole file: `codeBlockLines`, `renderActionCodeBlock`, `ActionCodeBlockArgs`).
- `tiles/gtile-action.ts#codeBlockSize` and its `<code>` first-line branch.
- `activity-renderer-shapes.ts`: `renderMultilineText`, the `renderSignalLabel`/chevron/parallelogram re-exports, renderAction's dead `cx/cy/opts/floored` locals, and `renderLabel`'s `floorCoordinated` (production callers are diamond-only).
- `activity-renderer-signal-shapes.ts`: `renderSignalLabel`, `renderChevronLeft`, `renderChevronRight`, `renderParallelogram` (invented 60/75-degree outlines).

## Now unreferenced outside my write-set (owners delete)
- `activity-renderer-text.ts` (T3g):
  - `ActivityTextStyle.floorCoordinated`: no setter left anywhere in `src/`;
  - `ruleLeft`/`ruleWidth`/`ruleStroke`: their only setter was `activity-renderer-line-heights.ts#actionRuleFields`.
  - My files still call `drawActivityText` (renderLabel, diamond) and `drawActivityTextLines` (`textLines`, used by if-shapes).
- `activity-renderer-line-heights.ts` (unassigned): imported by nothing now. `actionLines`, `centeredBaselines`, `actionRuleFields`, `ActionLine` are all dead.
- `activity-text-placement.ts#measureMonoLineWidth` (unassigned): only its own unit test references it.

## Not done + why
- Patches A and B: their hunks are outside my write-set. Mechanisms are above; the owner applies them at merge.
- boxstyle-lanes 33 (with B). Mechanism, instrumented: X compression removes 10px (`compressGeometry` x.removed = 10; the jar removes 0). `layout/compress/shapes-of.ts` occupies an action as its node rect, but the acceptEvent/objectSignal outline reaches `x - DELTA_INPUT_OUTPUT` (`BoxStyle.java:387,467`). The compressor therefore sees a free 10px column inside lane B. Owner: `shapes-of.ts` (T3a).
- Stereogroup: `Stereogroup#getBoxStyle` (`Stereogroup.java:100-107`) takes the FIRST non-PLAIN label, but ours keeps only the first stereotype. The `#color` after a stereotype is also accepted (see above). Owner: parser.
- `backward:`/`repeat :x; <<input>>`: `CommandBackward3.java:138` and `CommandRepeat3.java:119` pass a boxStyle, but `ActivityBackward` carries no stereotype. Owner: parser/ast.
- The faithful home of the outlines and the shield table is `ftile/BoxStyle.ts`, whose SDL/UML half is unported (outside my write-set). They live in signal-shapes/gtile-action with citations.
- If-down diamond2 east label (`withEast(tbout2)`, also a padded empty Sheet): it affects no geometry (`FtileDiamond#calculateDimensionFtile` reads only north), so it is not modelled.
- `npm run typecheck` reports a pre-existing error on base: `tests/diagrams/activity/layout/compress/invariant.test.ts(695,51)` (`ALLOWED_HARD_OVERLAPS` infers `never[]`). Not mine, untouched.

## Rule deviations
- I ran a read-only `git stash list` once (a stray command tail). No stash was created.
- `docs/catalog.md` was regenerated (`npm run catalog`) for the deleted file and the new exports; it is generated and drift-gated.

## Observation: SDL box styles were unreachable in the tiles engine
- **Context**: authoring BoxStyle fixtures.
- **Finding**: `tile-coordinates.ts` never copied `stereotype` onto the action geo, so `renderNode`'s `<<input>>/<<output>>/<<save>>` branches never fired in production. Every stereotyped action drew as a plain rounded rect. The activity corpus has no box-style fixture, so no gate saw it.
- **Impact**: a renderer branch keyed on a geo field needs a fixture through the full pipeline. Unit tests that build the geo by hand cannot see a dropped field.
- **Confidence**: High (patch B: 16 fixtures to 0).

## Observation: deterministic jar crashes on an empty line after `</code>`
- **Context**: `:<code>...</code>\n;` (the closer leaves an empty last line).
- **Finding**: "IllegalArgumentException start=10.0 end=10.0" is the same crash add4-T3gates found for any blank label line. The fixture closes with text instead.
- **Confidence**: High
