# add4-T1b — lane widths by oracle A/B (D3)

Worktree `.claude/worktrees/add4-T1b`, branch `add4/T1b`, base `a8d6b3b70`.
No Serena calls, no `git stash`. A temporary detached `git worktree` of the
base commit (scratchpad, node_modules symlinked) was used only to measure the
probe/element baseline, then removed (`git worktree list` clean).

## Commits

1. `7c63a1c0f` fix(add4-T1b): port swimlaneWidth and anchor divider UEmpty at content
2. `8f8289601` fix(add4-T1b): measure elseif ConnectionHline into every touched lane
3. `5fb4b5485` fix(add4-T1b): keep elseif branch exits in their own lane
4. `02ba066eb` fix(add4-T1b): put the cross-lane while back-edge xx in the tile frame
5. `4370c5f36` fix(add4-T1b): shift an Opale note's spike tip with its lane
6. this note

## STOP 16 check: not triggered

The A/B renders measure `swimlaneWidth` through the pinned jar; no fork-side
change was needed. Fixtures: `tests/fixtures/activity/add4-T1b/swimw-*.puml`
(absent, 0, 100, 400, 9000, `same`, block `swimlane { width same }`, wide
titles) and `laneink-a..h.puml`, `lastelse-out-xlane.puml`.

What the jar shows: absent == 0; 100 == 400 == 9000 == `same` == block form,
byte-identical. The floor IS applied (`Swimlanes.java:399-409`), but every lane
divider's `UEmpty(x1+x2,1)` (`LaneDivider.java:91`) is drawn at the lane's
CONTENT left minus the divider width (`Swimlanes.java:331,345-346`). So a
floor's padding always sits right of a `UEmpty`, and `CompressionXorYBuilder`'s
`reverse().smaller(5)` (`klimt/compress/CompressionXorYBuilder.java:66`)
collapses every gap wider than 10 to 10. The floor's size can't be seen once
it is at least 10 px wider than the content. That disproves add3 T3e's "min is
not applied" reading.

## Java -> ours

- `SkinParam.java:1121-1130` (`same` -> -1, `isDigits` `:130-136` -> int,
  else 0) -> `src/core/skinparam-key-handlers-table-c.ts` `swimlanewidth`
  handler -> `Theme.swimlaneWidth` (`theme-root-fields.ts`, accumulator,
  builder `ROOT_SCALAR_FIELDS`, `theme-merge.ts` `OPTIONAL_SCALAR_KEYS`) ->
  `swimlane-placement.ts#measureLanes`.
- `Swimlanes.java:331,345-346` -> `swimlane-lane-origins.ts#computeDividers`
  (reservation `x = left - dividerWidth`), `#trailingDivider`
  (`x = xpos + min/2`).
- `FtileIfLongHorizontal.java:476-482` (`ConnectionHline super(null,null)`) +
  `UGraphicInterceptorAllSwimlanes.java:88-101` + `getSwimlanes()` `:131-141`
  -> `HlinePayload.measureLanes` (`swimlane-hline.ts`), set by
  `walk-if-long-horizontal.ts#hlineMeasureLanes`, consumed by the new
  `swimlane-measure-edges.ts#sameLaneEdges` (moved out of
  `swimlane-placement.ts` for the 500-line cap).
- `FtileIfLongHorizontal.java:359,444` (`super(tile, null)`) +
  `Swimlanes.java:189-193` (Cross skips a null tile) ->
  `walk-if-long-horizontal.ts#connectionVerticalOut/#connectionLastElseOut`
  (lane2 = the tile's own out lane).
- `FtileWhile.java:298` (`xx` is in the tile's local frame, because Cross
  reaches it via `tile.drawU(this)`, `Swimlanes.java:186-189`) ->
  `WhileBackLoop.originX` (`swimlane-loop-translate.ts`),
  `swimlane-loop-translate-while.ts:44`, `walk-while-branch.ts`.
- `FtileWithNoteOpale#drawU` (one lane pass draws note + pointer) ->
  `swimlane-placement.ts#shiftNode` now shifts `spikeTip`, mirroring
  `canvas-origin.ts#shiftNodeGeo`.

## Probe Σ (100 baseline rows; b0 aggregate 12056)

| after | Σ | movers |
|---|---|---|
| base `a8d6b3b70` | 12056 | — |
| c1 | 11980 | cemipu 82->6 |
| c2 | 11712 | zeporo 129->0, nojije 113->0, jucidi 81->55 |
| c3 | 11688 | jucidi 55->31 |
| c4 | 11564 | ruzica 105->0, kijazo 8->0, nikivo 13->2 |
| c5 | 11520 | vodobe 42->0, tuneta 2->0 |

0 risers at every commit. Element census: one mover, jucidi
`{polygon:+1,line:+5}` -> `{polygon:+1,line:+3}` (toward the jar). No row's
element delta grew.

## Gates

- Engines: commit 1 touched `src/core`. Before = mission b0 surveys (`b0-eng` +
  `b0p-eng` for activity/unknown, measured at this branch point). After =
  all 28 engines re-surveyed: `engdiff` movers=0, conformant losses=0. After
  c5, activity + unknown were re-surveyed: 6 activity rows went
  structural-match -> conformant (kijazo, nojije, ruzica, tuneta, vodobe,
  zeporo); 0 losses.
- Golden ratchet + harness-parity + text census: green after every commit.
  `npm run typecheck` and eslint on touched files: clean.
- Style and swimlane census pins: RED by design on 7 rows. Re-pinning is
  orchestrator-only (rule 5). Every mover equals the pin's `jar` column:
  - cemipu, jucidi, nojije, zeporo, ruzica, vodobe: swimlane census
    (dividers, titles, band, lanes, width) and style width now == jar.
  - nikinu: lane widths == jar. Dividers, band and width are still 13 px off;
    see "Not done".
  - kijazo, nikivo, tuneta: swimlane `lanes` == jar (they have no failing pin).
- Commits 1-2 were red on `compress/invariant.test.ts` until commit 3 updated
  it. They surfaced three non-hard `empty×centeredText` overlaps (cemipu
  `[21,24]`, nojije `[21,25]`, `[22,25]`) in the already-pinned class, on rows
  whose lane census now equals the jar. Allowlisted in c3 with that reasoning.

## Rows

| row | before | after | status |
|---|---|---|---|
| cemipu-87-dinu624 | 82 | 6 | residual: one x is 338.863 vs jar 338.862 (a .xxx5 rounding at 3 dp); not chased |
| nikinu-06-sace939 | 105 | 105 | lane widths == jar; band anchor out of write-set (below) |
| zeporo-46-zicu301 | 129 | 0 | pinned-ready |
| nojije-35-teta491 | 113 | 0 | pinned-ready |
| jucidi-98-zato093 | 81 | 31 | residual = ConnectionLastElseIn (below) |
| pezubu-98-niba240 | 55 | 55 | same hline mechanism in `walk-if-with-links.ts`, out of write-set (below) |
| ruzica-16-deli877 | 105 | 0 | pinned-ready |
| vodobe-33-kefa909 | 42 | 0 | pinned-ready |
| razuzu-32-faje125 | 158 | 158 | out of write-set (below) |
| kavoro-11-jife299 | 37 | 37 | out of write-set (below) |
| cakeca-72-kara622 | 123 | 123 | not isolated (below) |
| tobajo-64-mipi810 | 380 | 380 | not moved by any lane fix (FORK-XLANE stays with `gtile-fork.ts`) |
| (bonus) kijazo / nikivo / tuneta | 8 / 13 / 2 | 0 / 2 / 0 | nikivo rest = `conditionStyle foo1` while header drawn as our 6-point hexagon vs the jar's 4-point diamond; not a lane mechanism, not investigated |

## Not done + why (mechanism, owner)

- **nikinu band anchor (out of write-set).** `drawTitlesBackground` draws the
  band at `UTranslate.dx(5)` from the block origin, width
  `lastSpecial.translate - 11` (`Swimlanes.java:358-367`). Its `URectangle`
  is ignored on X but reserves 2 px at each edge
  (`URectangle.java:193-199`). With a floor, the first divider no longer sits
  at origin+5. `computeSwimlaneChrome`'s `x = first.x` is therefore wrong only
  for floored diagrams, and the canvas min-x moves with it (jar band 16 /
  first divider 33). Fix verified in a throwaway prototype: all 8 swimw
  fixtures matched the jar exactly, and nikinu went 105 -> 0 with no other
  probe movers. The fix needs three changes:
  - add an optional `bandX` to `computeSwimlaneChrome`, with band width
    `last.x + last.width - 1 - bandX` (mine);
  - in `assign-coordinates-full.ts:293`, pass `baseX + 5` (unowned);
  - in `canvas-origin.ts#finalizeGeometry`, pass
    `shifted.reservations.find(r => r.ignoreX && r.ignoreY)?.x` (T1c).
- **pezubu (out of write-set: `walk-if-with-links.ts`).** `FtileIfWithLinks`'
  `ConnectionHline` is also `super(null, null)`
  (`cond/FtileIfWithLinks.java:425-426`). `getSwimlanes()` is `in ∪ tile1 ∪
  tile2` (`FtileIfNude.java:79-87`). Setting
  `measureLanes = {myLane} ∪ collectTouchedLanes(tile1) ∪
  collectTouchedLanes(tile2)` in `hlinePayloadLinks` (prototyped) gives
  pezubu 55 -> 45 with no other movers. The consumer is already in place.
- **jucidi residual (decision needed).** `ConnectionLastElseIn` is not
  `ConnectionTranslatable` (`FtileIfLongHorizontal.java:323`).
  `ConnectionCross#drawU` (`ConnectionCross.java:49-64`) draws only
  translatable connections, so the jar silently drops the else-branch entry
  connector whenever the else tile is in another lane. Ours still draws it
  (3 lines + 1 arrow). Matching the jar would delete a connector, which the
  acceptance bar forbids ("element counts never decrease"). It may be
  upstream behaviour that should be preserved. Orchestrator to rule: mirror,
  or record in DIVERGENCES.md.
- **razuzu (out of write-set: parser / `tile-layout-structural.ts` / note
  tiles, T1c).** Correction to add3 T3c: the `FtileWithNoteOpale.java:217`
  gate does NOT pass unconditionally in the content pass. `drawWhenSwimlanes`
  draws content through `UGraphicInterceptorOneSwimlane`
  (`Swimlanes.java:342`), so the opale draws only in the `swimlaneNote` lane's
  pass, with that lane's translate, beside a tile drawn in its own lane.
  `getSwimlanes()` adds `swimlaneNote` (`:92-99`). In measurement (the
  AllSwimlanes interceptor) the opale goes to every touched lane. The jar's
  laneOne is still narrow (action right 84.7, divider 99.7 = the
  compressed-gap signature 10+5). Needs the floating note attached to the
  preceding instruction with `swimlaneNote`, via `InstructionList.addNote`
  (`:190-195`).
- **kavoro (out of write-set: `walk-with-notes.ts`, T1c).**
  `TextBlockUtils.withMargin(opale,10,10)` (`FtileWithNotes.java:134`) draws
  `UEmpty(dim)` incl. margins (`TextBlockMarged.java:79-86`). The lane
  `LimitFinder` sees the note ±10, giving the jar's divider-to-note gap of
  15 vs our 5 on both sides. `walk-with-notes.ts` already pushes that box as
  an untagged `Reservation`. To measure it per lane, the reservation must
  carry the note's lane, and `placeSwimlanes` must receive reservations,
  which means plumbing through `assign-coordinates-full.ts`.
- **cakeca (not isolated).** In lane REL, the gap between the outer split's
  two branches is 10 in ours vs 19.538 in the jar ("Send email Request CR#"
  at 740.525 vs 750.063). Lane 3 is +11 in the jar. A gap >10 that survives
  compression means some shape occupies X there in the jar. Not identified.
  Candidates (unverified): the nested split's in/out connectors or the thin
  bars (`ParallelBuilderSplit.java:76-180`).
- add3 claims corrected: T3e's "min not applied" (it is applied, then
  compressed); T3i's "per-lane frame width" for vodobe (it was the
  unshifted spike tip blocking compression); T3c's razuzu gate reading.
