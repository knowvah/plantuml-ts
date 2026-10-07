# add4-T3d: PADDING, amiga circles, monochrome note, GOTO-LINES

Branch `add4/T3d`, base `dc20ac952`. Probe Σ at base: 1385 (31 rows).
No Serena calls, no `git stash`, no `src/core/**` edits.

## Commits
- Only this note and three patch files. No code commit landed: every one of
  the four mechanisms needs a hunk outside the write-set. Shipping only the
  in-write-set half would either raise a row (PADDING: fukika 58 -> 73) or
  break a pinned golden (GOTO: kiceze).
- The patches are verified by sandbox and apply cleanly to `dc20ac952`:
  - `.agent-notes/add4-T3d-padding.patch`
  - `.agent-notes/add4-T3d-monochrome.patch`
  - `.agent-notes/add4-T3d-goto-renderer.patch`

## Probe Σ per sandbox (no commits)

| state | Σ | risers | rows that fell |
|---|---|---|---|
| base | 1385 | — | — |
| + padding.patch | 1333 | 0 | fukika 58 -> 6 |
| + monochrome.patch | 1383 | 0 | tobajo 2 -> 0 |
| + goto-renderer.patch | 1357 | 0 baseline risers | gunuki 14 -> 0, nuvumi 14 -> 0 |
| + labala sandbox (crude, not a patch) | — | — | labala 5 -> 0 |

The goto patch alone breaks pinned golden `kiceze-91-luke737`: childCount
38 vs 36. Mechanism in item 4.

Ratchet results:
- monochrome.patch: 382/382 green.
- goto-renderer.patch: 1 red (kiceze).
- padding.patch: not run. It only changes behaviour when `theme.padding` is
  non-zero, and fukika and zivege are the only activity fixtures that set
  `skinparam padding`.

## 1. PADDING

### fukika-81-gite897: 58 -> 6 in sandbox

The brief's "note x" claim is wrong: neither fukika nor zivege has a note.

**Mechanism.** The arrow-side labels of an if's diamond1 are padded Sheets:
- `getLabelPositive` -> `create0(..., ftileFactory.skinParam(), ...)` (`ConditionalBuilder.java:280-282`).
- -> `Display.getCreole` -> `new SheetBlock1(sheet, maxMessageSize, spriteContainer.getPadding(), ...)` (`klimt/creole/Display.java:692-700`).
- `SheetBlock1.calculateDimensionSlow` adds `padding.top + padding.bottom` to both axes (`SheetBlock1.java:196-199`).
- `drawU` translates the text by `(padding.left, padding.top)` (`:209-210`).

Ours already pads only the condition text (`gtile-diamond-inside.ts#withGlobalPadding`). The side labels are unpadded, in three places:
- size;
- draw offset;
- compression ink box.

**Patch, three files:**
- `tiles/gtile-diamond-inside.ts`: `padSide`, so each non-empty side label is `+2p` on both axes.
- `activity-renderer-if-shapes.ts#renderIfLabel`: text at `x + p`, `y + p`.
- `layout/compress/shapes-of.ts#ifLabelShape` (T3a's file): the same `+p` offset. Upstream's compressor sees only the drawn text atoms, never the padded box.

Without the shapes-of hunk fukika rises to 73, so it cannot land without it.

**Residual 6:**
- south "no" text `y`: 461.556 vs jar 457.5;
- east "yes" text `y`: 405.556 vs jar 400.056;
- one arrowhead (polygon[11]) `y`: 15 off.

The diamond itself is exact. Only the labels move against it, so this is how the compressor treats the padded label band. It was not instrumented further (it is inside `layout/compress`).

### zivege-92-rise076 (49): not done, out of write-set

Each endif merge rhombus sits 4 px low in the jar (8 px cumulative over two nested ifs). Ours: gap 6 between branch bottom and merge top. Jar: gap 10.

Jar sweep on this markup, same fixture:

| padding | none | 0 | 1 | 5 | 10 | 30 |
|---|---|---|---|---|---|---|
| gap | 6 | 6 | 8 | 10 | 10 | 10 |

**Mechanism:**
- The merge diamond's `tbout1`/`tbout2` are `Display.NULL` (`LinkRendering.none()`, `LinkRendering.java:49-53`). That is non-null, so `create7` builds a padded empty Sheet of size (2p, 2p) (`ConditionalBuilder.java:292-303`).
- `FtileIfWithLinks#getYdeltaForLabels` returns `FtileDiamond#getWestEastLabelHeight` = 2p (`FtileIfWithLinks.java:83-88`, `FtileDiamond.java:118-122`).
- That is added in `FtileIfWithDiamonds.java:187-190`.
- Y compression then trims the band: +2 at p = 1, capped at +4.

**What is missing in ours:**
- `getYdeltaForLabels` is unported: `gtile-if-with-links.ts:190-195` adds only ydelta1a/1b.
- The empty diamond1 side labels (also padded 2p x 2p upstream) are omitted:
  - `conditional-builder.ts:398-400` only passes the sides that have text;
  - `walk-if-*.ts` skip null labels.
- Owners: `gtile-if-with-links.ts`, `conditional-builder.ts`, `walk-if-down.ts`, `walk-if-with-links.ts`. None is in this write-set.

**Caveat, measured in a sandbox and reverted.** Padding ALL four sides of `GtileDiamondInside` makes zivege worse (49 -> 59). Upstream's `north` stays `TextBlockUtils.empty(0,0)` on the with-links path (`ConditionalBuilder.java:238-256`, `FtileDiamond.java:53-56`), so only the sides the builder actually sets may be padded.

## 2. labala-74-juki864 (5): verified, out of write-set (core)

**Jar isolation, oracle renders of start/stop:**
- `<style> root { BackgroundColor #0B58A8; LineColor #FFF }` alone gives fill `#0B58A8` and stroke `#FFF`.
- `skinparam Activity {...}` alone gives `#222`.
- `skinparam BackgroundColor` alone gives `#222`.

So it is the theme's `<style> root` block. The brief's `puml-theme-amiga.puml:34,38` ARE that block's `BackgroundColor`/`LineColor` lines (`root {` at :33), so the citation stands. What the brief did not have was the mechanism, below.

**Mechanism:**
- Every parsed style value takes `counter.getNextInt()` as its priority (`ValueImpl.java:51-55`).
- A merge keeps the higher priority (`DarkString.java:54-57,73-78`).
- So a later `root` value beats `plantuml.skin`'s earlier `activityDiagram circle start/stop/end { #2 }` rule (`plantuml.skin:376-381`) inside `computeMergedStyle` (`StyleStorage.java:101-115`).

**Drawing:**
- `CircleStart`: lineColor stroke, backColor fill (`svek/image/CircleStart.java:72-82`).
- `CircleEnd` inner ellipse: backColor fill, lineColor stroke (`CircleEnd.java:74-102`).
- Ours draws both stop ellipses in `circleInk`.

**Why ours cannot do it:**
- `graph.rootElementBackground` exists, but it is order-blind. It would be wrong under `skin rose`: `rose.skin` sets root `#FEFECE`, and its later circle rule `black` wins (`rose.skin:400-405`).
- No theme field carries root LineColor only when declared. `colors.border` always holds a default.

**Needed (core, T3b or a core owner):** a priority-ordered resolution of `activitydiagram.circle.{start,stop}` BackgroundColor/LineColor in `style-map-theme.ts`, exposed as fields. Then `activity-renderer-terminals.ts` reads them; the stop inner fill is the back colour. A crude sandbox (fill = `rootElementBackground`, stroke = `colors.border`) gave 5 -> 0, which confirms the five diffs are exactly these two properties.

## 3. tobajo-64-mipi810 (2): verified, out of write-set (renderer.ts)

- **Mechanism:** `ColorMapper.MONOCHROME` is applied to EVERY colour the jar draws (`TitledDiagram#muteColorMapper`, `ColorMapper.java:80-83`). It is not a note-specific mapping. `#FEFFDD` maps to gray 250 = `#FAFAFA`; every other colour in tobajo is already gray.
- **Ours:** activity applies no colour mapper.
- **Patch** (`add4-T3d-monochrome.patch`, `renderer.ts`): wrap `body` in `applyColorMapperToFragment(..., colorMapperOf(theme))`, which is class's post-process. 2 -> 0, 0 risers, ratchet 382/382.
- **Follow-ups:**
  - `class-monochrome.ts` should move to core rather than be imported across engines.
  - Chrome added later by `index.ts` (title, legend) is not mapped by this hunk.

## 4. GOTO-LINES gunuki (14) / nuvumi (14): verified, needs renderer.ts plus a layout flag

**Mechanism:**
- `UGraphicDispatchFtile.draw` records `positions.put(label, translate)` after drawing an `FtileLabel`.
- On an `FtileGoto` it draws `hline(dx)` then `vline(dy)` in `gotoColor` (`UGraphicDispatchFtile.java:70-85,101-119`):
  - `gotoColor` is the `activityDiagram.goto` LineColor, i.e. root LineColor (`Swimlanes.java:246-249`);
  - the stroke is the default `UStroke.simple()`, width 1 (`UStroke.java:75-77`).
- The dispatcher is installed only when there is a single swimlane (`Swimlanes.java:251-258`).
- Our label/goto node coordinates already equal the jar's (dumped: label 37.6625,53; goto 37.6625,172).

**Patch** (`add4-T3d-goto-renderer.patch`):
- `renderNodesDispatchingGotos` in `activity-renderer-terminals.ts`, with 6 unit tests in `tests/unit/activity/renderer-goto.test.ts`;
- the one-line `renderer.ts` single-lane loop swap.

Result: gunuki 14 -> 0, nuvumi 14 -> 0, Σ 1385 -> 1357.

**Blocker: kiceze-91-luke737 (pinned) goes red.** `FtileDecorate.drawU` calls `ftile.drawU(ug)` directly (`vertical/FtileDecorate.java:79-80`), and `FtileMinWidthCentered` (every if branch, `ConditionalBuilder.java:138-139,171-172`) inherits that. A label or goto that is the SOLE instruction of a branch therefore bypasses the dispatcher: it is neither recorded nor drawn.

Jar evidence (oracle renders, scratch):
- goto alone in a then-branch: no goto lines;
- `:x; goto` in the same branch: goto lines drawn;
- label alone in a branch: no goto lines.

The goto patch needs a layout-side `dispatched` flag on label/goto nodes (`tile-coordinates.ts:337-353` + `activity-geometry.types.ts`). This in turn needs an audit of every container that draws a child via direct `drawU` rather than `ug.draw`. Known so far:
- direct `drawU`: `FtileDecorate`, `FtileMinWidthCentered`;
- `ug.draw` (dispatched): `FtileMarged`, `FtileMargedRight`, `FtileAssemblySimple`.

## Risers
None. Nothing is committed. Every sandbox probe showed 0 baseline risers.

## Census movers
None. No code is committed, so the style/text/swimlane census is unchanged.

## Not done + why
- All four items: they need hunks outside the write-set (`shapes-of.ts` and `renderer.ts`, both T3a; `gtile-if-with-links.ts`/`conditional-builder.ts`/`walk-if-*`; core style resolution).
- fukika residual 6: compression of the padded label band; not instrumented.

## Observation: activity draws every colour unmapped under monochrome
- **Context**: tobajo's 2-unit residual.
- **Finding**: the class engine applies `ColorMapper.MONOCHROME` as a whole-fragment post-process; activity does not. Only the `#FEFFDD` note showed up, because every other default activity colour is already gray.
- **Impact**: any activity fixture with `monochrome true` and a non-gray colour (`#red` action, swimlane colour) diverges.
- **Confidence**: High

## Observation: FtileDecorate bypasses UGraphicDispatchFtile
- **Context**: GOTO-LINES regressed pinned kiceze.
- **Finding**: `FtileDecorate.drawU` calls the child's `drawU` directly, so the dispatcher's `instanceof FtileLabel`/`FtileGoto` hooks never fire for a decorated sole child.
- **Impact**: any dispatcher-driven behaviour (goto lines, label positions) depends on tile-tree wrapping, not only on node order.
- **Confidence**: High (three jar renders)
