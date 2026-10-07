# add4-T2f: lane family (branch add4/T2f, base b9f3dae80)

No Serena calls. No `git stash`. No `src/core/**` edits, so rule 11 does not apply.
Scratch worktrees (removed at the end):
- detached base `b9f3dae80`, for element-census A/B;
- `add4/T2b` merged with `add4/T2f`, to measure the rows T2b owns.

## Commits
1. `259c9ee15` fix(add4-T2f): draw and measure a swimlane's |name|LABEL display
2. `662aff0cc` docs(add4-T2f): regenerate catalog for swimlane-title.ts. The file is generated and outside the write-set; regenerate it on merge if it conflicts.
3. `6bf61cb86` fix(add4-T2f): move a lane-tagged reservation with its lane
4. `ffe9b0d0e` fix(add4-T2f): measure a lane-tagged reservation into its lane width
5. `9e96bc388` docs(add4-T2f): regenerate catalog for swimlane-reservation-lane.ts
6. this note, plus two patch files for out-of-write-set hunks (below)

## Java -> ours

**SWIM-LABEL (c1)**
- `CommandSwimlane.java:65,97-98` (LABEL `([^|]+)?` -> `Display.getWithNewlines`) and `Swimlanes.java:163-164` (`setDisplay` only when non-null). A later bare `|x|` therefore keeps the label, and a later `|x|Y` replaces it.
  - Ported in `node-dispatch.ts#recordSwimlaneDisplay`. It takes the text after the closing `|`, raw, leading space included.
  - The map is a `WeakMap<ParseContext, ...>`, so `dispatch-support.ts` (T2b's) is untouched.
  - `parser.ts#displaysSpread` copies it to `ActivityDiagramAST.swimlaneDisplays`.
- `Swimlanes.java:285-293` (`getTitle` draws `getDisplay()`) -> new `layout/swimlane-title.ts#swimlaneTitleText`. Both `swimlane-placement.ts#measureLanes` (title width) and `activity-renderer-swimlanes.ts#renderSwimlaneTitles` use it.
- `SwimlaneGeo.display` is set by the new `swimlane-placement.ts#laneGeosOf` (extracted to keep `placeSwimlanes` at 24 NLOC).
- Files outside the listed write-set, one field each:
  - `ast.ts` (`swimlaneDisplays`). The file is at the 500-line cap; the swimlaneColors doc was condensed to make room.
  - `activity-geometry.types.ts` (`SwimlaneGeo.display`).
- Leading space (`|f| fisherman`): `DriverTextSvg.java:118-124` shifts x by the space width and strips the space. Our text path already does this. Fixture `lane-label-lead-space` matches the jar exactly.

**LANE-RESERVATION shift (c3)**
- The UEmpty is drawn inside the lane pass of the connection that owns it, so it takes that lane's translate:
  - lane pass and gate: `Swimlanes.java:342-343`, `UGraphicInterceptorOneSwimlane.java:93-104`;
  - Cross path: `drawTranslate` also draws it with translate1 (`FtileWhile.java:302`).
- New `layout/swimlane-reservation-lane.ts`:
  - `pushLaneReservation` tags a reservation with its lane through a `WeakMap`;
  - `shiftLaneReservations` is applied in `placeSwimlanes`, which now receives `walkReservations`. `assign-coordinates-full.ts` no longer concatenates them unshifted.
- Tagged producers:
  - `ConnectionBackSimple` (`FtileWhile.java:217,271`): body out lane;
  - `ConnectionBackEmpty(diamond1, diamond1)` (`:414,459`): header lane;
  - `ConnectionBackBackward1(whileBlock, backward)` (`:318,363`): body out lane;
  - fork join-label supplement (`FtileBlackBlock.java:90-94,111-112`): fork out lane.
- `walk-while-branch.ts#buildWhileFrame`: the two back-label fields moved into `buildWhileSpecialFields`. Reason: lint-staged prettier would otherwise expand the one-line pair to 31 NLOC. The file stays at 499 lines.

**LANE-RESERVATION measure (c4)**
- The per-lane LimitFinder (`Swimlanes.java:379-395`) sees a UEmpty as its own box (`LimitFinder.java:159-162`) and sees the join label's text (`LimitFinder.java:217-225`).
- Ported as `laneReservationItems` (kindless, unfudged), added to `measureLanes` items.

## Rows (probe, 50 baseline rows)

| row | before | after | status |
|---|---|---|---|
| famiki-74-fedu284 | 4 | 0 | c1 |
| pubeza-23-jaza106 | 61 | 0 | c1 |
| bubefi-32-fike915 | 37 | 0 | c1 |
| podobi-57-zoso040 | 36 | 0 | c1 |
| gesogi-81-xoma900 | 76 | 0 | c3 |
| tobajo-64-mipi810 | 380 | 380 | 2 with patch A (out of write-set, below) |
| nikivo-06-kaxa873 | 2 | 2 | 0 with patch B (out of write-set, below) |
| bizeti-00-mido821 | 157 | 157 | 0 when merged with add4/T2b (T2b's mechanism, below) |
| cakeca-72-kara622 | 123 | 123 | 0 when merged with add4/T2b (T2b's mechanism, below) |

## Probe Σ per commit
- base: 3679
- c1: 3541 (−138: famiki, pubeza, bubefi, podobi)
- c3: 3465 (−76: gesogi)
- c4: 3465 (no corpus row moves; fixture `lane-res-fork-label` went 6 -> 0, and was 52 at base)

Risers: 0 at every commit.

Element census vs a base-commit run (`activity-probe-elements.ts`): 0 movers at c1, c3 and c4. Single-lane output is unchanged: the golden ratchet is green and every single-lane path returns the walk reservations untouched.

## Gates (after each commit)
- Green:
  - golden ratchet, harness-parity, compress invariant, text census;
  - `npm run typecheck`;
  - eslint on touched files;
  - `tests/diagrams/activity` + `tests/unit/activity`: 126 files, 1916 tests.
- Style and swimlane census: red by design (re-pin is orchestrator-only). Every mover equals the pin's `jar` column:
  - c1, swimlane census:
    - bubefi / podobi: dividers `[20,242.288,332.5]`, titles x 25/247.288, band 311.5, lanes 222.288/90.212, width 358;
    - pubeza: dividers `[20,108.975,170.925,236.25]`, titles 25/120.938/183.113, band 215.25, width 262;
    - famiki: titles 61.325/140.356.
  - c1, style census width: bubefi 358, podobi 358, pubeza 262.
  - c3, swimlane census, gesogi: dividers `[20,267.413,459.138]`, titles 113.725/339.256, band 438.138, lanes 247.413/191.725, width 485.
  - c3, style census, gesogi: width 485.

## Fixtures and tests
- `tests/fixtures/activity/add4-T2f/` (oracles from `scripts/oracle-render.sh`):
  - `lane-label-relabel`, `lane-label-lead-space`;
  - `lane-res-while` (gesogi markup), `lane-res-while-empty`, `lane-res-while-backward`, `lane-res-fork-label`.
- At base these scored 76 / 76 / 80 / 52 (the four `lane-res-*`). All are now 0 diffs.
- Tests: `tests/diagrams/activity/swimlane-display.test.ts`, `tests/diagrams/activity/layout/swimlane-reservation-lane.test.ts`.

## Not done + why

### tobajo (380): out of write-set; patch A ready
- File: `.agent-notes/add4-T2f-if-down-reservation-lane.patch`, applies to `layout/walk-if-down.ts` (not in my write-set, not T2b's).
- Census-b's "fork bar = calculateDimension" reading is wrong. The bar is `ignoreForCompressionOnX`, and its drawn width is whatever compression leaves in lane a.
- What actually holds lane a open: `walk-if-down.ts`'s `ifElseHexagonReservation` UEmpty, from the ifs inside the lane-b/c repeat branches.
  - It stays in lane-local coordinates, which are lane a's X range (traced: `empty x=245 y=548 5x12` in the X-pass shape list).
  - The two cross-lane fork `ConnectionIn` starts therefore sit 15 px apart (255/270) instead of collapsing to one x (jar 231.475 both; their snakes are `ignoreForCompression`, `ParallelBuilderFork.java:171`).
- Patch: tag the 4 pushes with `laneOut(t.diamond1, myLane)`.
  - Java: `Connection(diamond1, diamond2)`, UEmpty at `FtileIfDown.java:308,349,360,402,440`.
  - Probe 380 -> 2, 0 other movers, 0 element movers.
  - tobajo census -> jar: dividers `[20,242.475,474.694,603.013]`, band 582.013, width 629.
- Residual 2: `path/@fill` `#FEFFDD` vs `#FAFAFA`.
  - Mechanism: under `skinparam monochrome true` the jar maps note fills through `ColorMapper.MONOCHROME` (`klimt/color/ColorMapper.java:80-83`; gray of FEFFDD = 250).
  - Our note path fill is not mapped. Owner: the note renderer, not lane work.

### nikivo (2): out of write-set; patch B ready
- File: `.agent-notes/add4-T2f-while-header-shape.patch`, applies to `activity-renderer-shapes.ts`.
- `FtileWhile.java:130-140` picks diamond1 by conditionStyle exactly as an if does. Patch: `case 'while-header': return renderIfSplitShape(node, theme)`.
- Probe 2 -> 0, 0 other movers, 0 element movers.
- Caveat: a while with EMPTY_DIAMOND and a non-empty test still draws a hexagon, as at base. The jar draws `FtileDiamond` with the test on north (`:137-139`). No corpus row has it.

### bizeti (157) / cakeca (123): T2b's mechanism
- In a scratch merge of `add4/T2b` (9657f6680) and this branch, both are 0, with Σ 2640 and 0 risers.
- The mechanism is T2b's `f7e57fa68` (partition title SpecialText 1x1 UEmpty, `atmp/SpecialText.java:55-62`, in `shapes-of.ts`). That is also what holds cakeca's REL gap at 19.538.
- Nothing lane-side is left on either row.

### Untagged reservation producers (no corpus row moves yet)
- `tile-layout-inlabel.ts#applyPendingLabelToLastEdge` and `walk-with-notes.ts#pushStackedNote` still push untagged reservations. These have the same cross-lane hazard as patch A.
- The pattern to use is `pushLaneReservation(out.reservations, r, lane)`.

### Multi-line lane titles not supported
- `\n` in a lane display or name is not split into lines (`Display.getWithNewlines`). The title draw and `titlesHeight` are single-line, and `shapes-of.ts#titleShapes` measures `lane.name`; for a single line its Y height is identical. No corpus row has this.

## Observation: census claims corrected
- **Context**: verifying census-b/census-a mechanisms before fixing.
- **Finding**:
  - tobajo FORK-XLANE is not the bar-width formula. It is an untranslated if-down reservation, which is the LANE-RESERVATION family.
  - cakeca's LANE-INK gap is the partition SpecialText slot (T2b), not a lane mechanism.
- **Impact**: route "fork bar width" symptoms in multi-lane forks to reservation tagging first.
- **Confidence**: High (sandboxed 380 -> 2; merged scratch 123 -> 0).

# Resume (orchestrator: write-set extended to walk-if-down.ts, the while-header case in activity-renderer-shapes.ts, tile-layout-inlabel.ts, walk-with-notes.ts)

Base: ac4b683a8 (fast-forward merge of feat/activity-divergence-drive-4). Probe Σ 3465.

## Commits
1. `d6bf9b674` fix: move an if-down hexagon reservation with diamond1's lane (patch A)
   - Java: `Connection(diamond1, diamond2)`, the UEmpty is drawn at `FtileIfDown.java:308,349,360,402,440`.
   - Ours: `walk-if-down.ts`, 4 pushes, tagged with `laneOut(t.diamond1, myLane)`.
2. `5b9294635` fix: pick the while-header diamond by condition style (patch B)
   - Java: `FtileWhile.java:130-140`. Ours: the `while-header` case now calls `renderIfSplitShape`.
   - EMPTY_DIAMOND with a test (`:137-139`) already matched the jar. `GtileDiamondEmpty.label` is always `''` and the test sits in the north slot. Authored fixture `while-empty-diamond-test` has 0 diffs, both before and after.
3. `774ecdb25` fix: move a same-lane arrow-label reservation with its lane
   - Java: `UGraphicInterceptorOneSwimlane.java:93-104`.
   - Ours: `tile-layout-inlabel.ts#labelLane`.
   - A cross-lane connection is drawn in the Cross pass (`Swimlanes.java:184-199`), so its label stays untagged.
4. `456e812f9` fix: move a stacked note's margin reservation with its lane
   - Java: `TextBlockMarged.java:79-86`, `Swimlanes.java:342-343`.
   - Ours: `walk-with-notes.ts#pushStackedNote`.
5. `72d388e0b` test: the unit test in `tests/unit/activity/renderer-shapes.test.ts` pinned the old hexagon. It is now pinned to the jar's rhombus. Commit 2 landed with this one unit test red.

## Rows before -> after
| row | before | after |
|---|---|---|
| tobajo-64-mipi810 | 380 | 2 |
| nikivo-06-kaxa873 | 2 | 0 |

Authored fixtures (all via `scripts/oracle-render.sh`):

| fixture | without fix | with fix |
|---|---|---|
| `lane-res-if-down` | 173 | 0 |
| `while-inside-diamond` | 1 | 0 |
| `lane-res-inlabel` | 7 | 1 |
| `lane-res-note-stack-fork` | 118 | 0 |
| `lane-res-note-stack-wide` | 88 | 0 |

The 1 left on `lane-res-inlabel` is the label's own y (+3.278). The same markup with no lanes, and with one lane, shows that same +3.278, so it is not a lane mechanism.

## Probe Σ per commit
| commit | Σ |
|---|---|
| base | 3465 |
| c1 | 3087 |
| c2 | 3085 |
| c3 | 3085 |
| c4 | 3085 |

## Risers
- 0 at every commit.
- Element census vs the ac4b683a8 run: 0 movers at every commit.

## Census movers (all == jar except kavoro's float noise)
- c1, tobajo:
  - swimlane: dividers `[20,242.475,474.694,603.013]`, titles 111.775 / 339.122 / 519.897, band 582.013, width 629;
  - style: width 629.
- c4, kavoro (swimlane `lanes`): lane-2 width moves by 5e-14, from 213.66249999999997 to 213.66250000000002 (jar 213.662).
  - Cause: the shifted reservation changes the compression arithmetic order.
  - SVG: unchanged, 0 diffs against the golden. Dividers, titles and width are unchanged and equal the jar.
  - Strictly, this is 5e-14 further from the jar. A re-pin absorbs it.

## Not done
- tobajo residual 2: under `skinparam monochrome true` the note fill should be `#FAFAFA` (`ColorMapper.java:80-83`). Owner: note renderer.
- Cross-lane arrow-label reservation: still untagged. The jar draws it with the translated `drawTranslate` points in the Cross pass. Ours would need the reservation computed from routed points.
- Arrow label baseline +3.278 (`lane-res-inlabel`, reproduced with no lanes): not lane work, not chased.
- Fork branch containing an arrow label: with no lanes the fork bar is 14.75 px narrower than the jar (222.85 vs 237.6). Isolated with a scratch fixture that was not committed. Not lane work, not chased.
- Rule note: I ran `git stash` once by accident, from a stray command tail. I popped it immediately and `git stash list` is empty. No work was lost; the diff was re-verified before commit 3. A read-only `git stash list` was also run once earlier.
