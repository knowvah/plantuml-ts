# add4-T2c — notes in lanes

Worktree `.claude/worktrees/add4-T2c`, branch `add4/T2c`, base `380f86bfb`.
No Serena tools, no `git stash`, no `src/core/**` edits (rule 11 n/a).

## Commits

1. `c538e3c1f` fix(add4-T2c): give a leading floating note no out point
2. `ad3083f57` fix(add4-T2c): wrap a note from another lane and draw it in its own lane
3. `97522f27a` fix(add4-T2c): count a stacked note's margin box toward its lane width
4. `1a3bf9369` docs(add4-T2c): regenerate the module catalog (out of write-set:
   `docs/catalog.md`, generated, drift-gated; 4 new exports from
   `swimlane-context.ts`. Expect a count-line conflict with siblings;
   resolve with `npm run catalog`).
5. this note

## Java -> ours

- FLOATING-NOTE (c1): `FtileFactoryDelegatorAddNote.java:61-68` (`ftile ==
  null` -> `FtileNoteAlone(..., note.getType() == NoteType.NOTE, ...)`),
  `FtileNoteAlone.java:103,129-132` (no out point unless `withOutPoint`),
  `FtileFactoryDelegatorAssembly.java:68-70` (no connector after a tile
  without out point); `InstructionList.java:136-146,189-195` (a note on an
  empty list is the list's own, built first). Ours:
  `tiles/gtile-note.ts` `GtileNote.withOutPoint` (4th ctor param, default
  true) + `hasPointOut()`; `layout/tile-layout-structural.ts#tileNoteAlone`
  (the `last === undefined` arm of `tileNote`). The existing
  `tile-coordinates.ts#pushTopDownSiblingEdge` gate does the rest.
- NOTE-SWIMLANE (c2): `InstructionList.java:190-195` forwards a note to
  `getLast()` whatever the lane, carrying `swimlaneNote`
  (`ActivityDiagram3.java:480`). `FtileWithNoteOpale.java:217` draws the
  Opale only in `swimlaneNote`'s one-lane pass (`Swimlanes.java:342`);
  measurement dispatches it to `getSwimlanes()` = tile lanes +
  `swimlaneNote` (`FtileWithNoteOpale.java:92-99`,
  `UGraphicInterceptorAllSwimlanes.java:88-101,160-168`).
  `FtileWithNotes.java:87-97` ignores `swimlaneNote`. Ours:
  `tile-layout-structural.ts#tileNote` lost its `sameLane` guard (both the
  first-wrap and merge arms); `walk-with-notes.ts#walkNoteOpale` tags the
  note node with the note tile's lane and calls `markNoteMeasureLanes`
  (`collectTouchedLanes(tile)` + note lane);
  `swimlane-context.ts#MeasureSpec`/`markMeasureSpec`/`measureSpecOf`/
  `specLaneItems` (a `WeakMap` keyed by the walk's node object, so no
  public geometry or lane copy carries it); consumed by
  `swimlane-placement.ts#laneItemsOf`.
- NOTE-STACK-LANE-INK (c3): `FtileWithNotes.java:134`
  (`withMargin(opale, 10, 10)`), `TextBlockMarged.java:79-86` (`UEmpty`
  over the margin box), `LimitFinder.java:159-162` (`drawEmpty`, unfudged),
  `Swimlanes.java:379-395` (per-lane `LimitFinder`). Ours:
  `walk-with-notes.ts#pushStackedNote` marks each stacked note
  `{ marginX: 10 }`; `specLaneItems` adds the kindless (unfudged) margin
  box to the lane items. No change to `Reservation` /
  `assign-coordinates-full.ts` was needed.

## Rows (probe score)

| row | before | after | status |
|---|---|---|---|
| cofubo-18-koju711 | 17 | 0 | c1 |
| japeku-46-kulo799 | 18 | 0 | c1 |
| razuzu-32-faje125 | 158 | 0 | c2 |
| kavoro-11-jife299 | 37 | 0 | c3 |
| giteso-65-mefo026 | 3 | 3 | not note-owned (below) |
| sojono-24-tufe806 | 2 | 2 | not note-owned (below) |

## Probe Σ (85 baseline rows)

| point | Σ | movers |
|---|---|---|
| base `380f86bfb` | 8130 | — |
| c1 | 8095 | cofubo 17->0, japeku 18->0 |
| c2 | 7937 | razuzu 158->0 |
| c3 | 7900 | kavoro 37->0 |

Risers: 0 at every commit.

## Element census (vs `b1-elements.json`)

- c1: cofubo `{polygon:+1,line:+1}` -> `{}`, japeku same -> `{}`.
- c2: razuzu `{polygon:+1,line:+5}` -> `{}`.
- c3: no movers.
No row moved away from the jar; every note is still drawn.

## Gates

After each commit: golden ratchet, harness-parity, compress invariant,
text census green; `npm run typecheck` + eslint clean. Also
`tests/diagrams/activity` + `tests/unit/activity`: 116 files, 1860 tests
green after c4. Style/swimlane census pins RED by design (re-pin is
orchestrator-only); every mover equals the pin's `jar` column:

- cofubo style: strokeWidth `{1:1}` -> `{}`, height 98 -> 88 (== jar).
- japeku style: strokeWidth `{1:1}` -> `{}`, height 110 -> 100 (== jar).
- razuzu style: strokeWidth `{1:12}` -> `{1:7}`, width 243 -> 314,
  height 357 -> 295 (== jar). razuzu swimlane: dividerXs
  `[20,99.7,288.556]`, titles x 25.819/160.041, band width 267.556, lanes
  79.7/188.856, width 314, height 295 (all == jar).
- kavoro style: width 322 -> 342 (== jar). kavoro swimlane: dividerXs
  `[20,103.238,316.9]`, title 2 x 175.531, band 295.9, lane 2 213.662,
  width 342 (all == jar).

New fixtures (`tests/fixtures/activity/add4-T2c/`, oracles via
`scripts/oracle-render.sh`): `note-alone-floating`, `note-alone-plain`,
`note-xlane-floating` (razuzu source), `note-xlane-spike` (non-floating
cross-lane note, spike drawn), `note-xlane-left` (cross-lane notes merged
into a stacked `FtileWithNotes`). All five compare with 0 diffs. Tests:
`tests/diagrams/activity/note-alone-floating.test.ts`,
`tests/diagrams/activity/layout/note-cross-lane.test.ts`.

## Not done + why (mechanism, owner)

- **giteso (3) / sojono (2): not note-owned.**
  - 2 units each: the switch's empty merge diamond is drawn as a 4-point
    diamond; the jar draws `Hexagon.asPolygon(shadowing, w, h)`
    (`FtileDiamondInside.java:89`, `Hexagon.java:65-74`): 7 points with
    zero-length top/bottom sides. Owner: T2d (diamond-empty /
    renderer-shapes).
  - giteso's 3rd unit (`line[7]/@y1` 319.5 vs 314): the case body ending
    `:second;` + `floating note right` exits at the note's bottom because
    `GtileTopDown.getCoord(SOUTH_HOOK)` returns `this.height`
    (`tiles/gtile-top-down.ts:87-89`); upstream
    `FtileGeometryMerger.java:49-50` uses the last child's own outY.
    Verified by a reverted experiment (SOUTH = last child offset + its
    SOUTH.y): the line diff goes, only the 2 polygon units remain. Same
    mechanism as T1c's xolazi/jageti finding. Owner: T2d
    (`gtile-top-down`).

## Observations

- ## Observation: the jar keeps only the first leading note
  - **Context**: porting `FtileNoteAlone` (c1).
  - **Finding**: `FtileFactoryDelegatorAddNote.java:63` uses
    `notes.iterator().next()`; a second note before any instruction is
    silently dropped by the jar. Ours still pushes it as a sibling note.
    Also the alone note's lane is the list's `getSwimlaneIn()`
    (`InstructionList.java:146`), not the note's own; ours uses the note's.
    No corpus row exercises either.
  - **Impact**: if a row ever does, decide mirror vs DIVERGENCES.md (the
    drop loses information).
  - **Confidence**: High (read), unmeasured.
- ## Observation: `collectTouchedLanes` omits `swimlaneNote`
  - **Context**: c2.
  - **Finding**: `FtileWithNoteOpale#getSwimlanes` adds `swimlaneNote`
    (`:92-99`), but `tile-coordinates-group.ts#collectTouchedLanes` walks
    `children` only (the note tile is not a child). An enclosing group
    whose only touch of a lane is a cross-lane note would draw one frame
    too few. No corpus row exercises it.
  - **Impact**: owner of `tile-coordinates-group.ts` if a row surfaces.
  - **Confidence**: Medium.
- ## Observation: a lane-measurement side channel without type changes
  - **Context**: kavoro needed lane-tagged reservations; plumbing them
    through `assign-coordinates-full.ts` was out of write-set.
  - **Finding**: `placeSwimlanes` receives the walk's own node objects, so
    a `WeakMap` keyed by node (`swimlane-context.ts#MeasureSpec`) carries
    measurement-only data with no leakage into copies or public geometry.
    The specs read the node's current `x`/`width`.
  - **Impact**: reuse for any other "drawn in one lane, measured in
    others" primitive instead of adding fields to `ActivityNodeGeo`.
  - **Confidence**: High.
