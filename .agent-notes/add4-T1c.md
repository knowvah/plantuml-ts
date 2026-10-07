# add4-T1c — NOTE-MULTI canvas ink + note colour (D3)

Worktree `.claude/worktrees/add4-T1c`, branch `add4/T1c`, base `a8d6b3b70`.
I used no Serena tools and no `git stash`. `src/core/**` is untouched, so
the rule-11 all-engine survey did not apply.

## Commits

1. `7fc8eade9` fix(add4-T1c): size NOTE-MULTI stacked notes by the creole sheet
2. `bdc79a5d7` feat(add4-T1c): parse note #color and fill the Opale with it
3. `422b3a9d5` fix(add4-T1c): draw a floating note's Opale without a link

Before each commit: targeted vitest, `npm run typecheck` and eslint on the
touched files were green. After each commit the golden ratchet and harness
parity stayed green, and every pinned golden stayed byte-equal. The
text/swimlane census tests were green. The only failures were style-census
movers, and each one equals the pin's `jar` column (listed below).

## Task 1 (canvas ink): the premise does not hold at this branch point

`FtileWithNotes.java:134` calls `TextBlockUtils.withMargin(opale, 10, 10)`.
That builds a `TextBlockMarged`, which uses margin 10 on all four sides
(`TextBlockMarged.java:51-58`). Its `drawU` method (`:74-81`) draws
`UEmpty.create(dim)`, a box that covers the outer, margin-inclusive area.

T3j's `walk-with-notes.ts#marginBoxReservation` already pushes that box into
`out.reservations`. The box then reaches the canvas ink scan along this path:

- `assign-coordinates-full.ts:294` builds `allReservations`
- it passes them to `finalizeGeometry`
- `canvas-origin.ts#computeCanvasOrigin` runs `extendForReservation` on each one

So the canvas ink scan already counts the margin box, and
`canvas-origin*.ts` needs no edit.

mifejo is wrong for a different reason. Its 20 px over-width came from
`GtileWithNotes` measuring the raw string with `measureOpaleText`. Upstream
builds each Opale over the creole `Sheet` (`FtileWithNotes.java:117-120`).
Commit 1 fixes this, and the canvas is now 224 x 189, equal to the jar.

## Java -> ours

- Creole sizing: `FtileWithNotes.java:117-120` ->
  `tiles/gtile-with-notes.ts#buildStack` now calls `measureOpaleCreole`.
  The constructor takes a `Theme`.
- Colour parse:
  - The COLOR group is `ColorParser.simpleColor(ColorType.BACK)`
    (`CommandNote3.java:65-67`, `CommandNoteLong3.java:72-73`).
  - `executeArg` reads it (`CommandNote3.java:121`).
  - Ours: `dispatch-support.ts` `RE_NOTE_SINGLE`/`RE_NOTE_MULTI` now capture
    group 3 into `ActivityNote.color` in the new `note-dispatch.ts`.
- Colour fill:
  - `Style#eventuallyOverride(Colors)` (`style/Style.java:195-200`) sets the
    background. It is called from `FtileWithNoteOpale.java:137-139`,
    `FtileWithNotes.java:109-111` and `FtileIfWithDiamonds.java:113-114`.
  - Ours: the colour is carried on `GtileNote.color`, `WithNotesEntry.color`
    and `StackedNote.color`, then on the note node in
    `walk-with-notes.ts#walkNoteOpale` and `#pushStackedNote`.
  - `activity-renderer-note-shapes.ts#noteFillOf` returns `parseColor`, so a
    `#a-b` gradient stays whole.
- `FtileNoteAlone.java:104-106` never calls `eventuallyOverride`. The bare
  `'gtile-note'` walker therefore does not read the colour. The oracle fixture
  `note-alone-color` confirms this (`#FEFFDD`).
- Floating notes: `NoteType.defaultType` (`NoteType.java:43-48`) returns
  `FLOATING_NOTE`, and `FtileWithNoteOpale.java:132-133` then sets
  `withLink = false`. Ours: `ActivityNote.floating` ->
  `tile-layout-structural.ts#tileNote` builds the `GtileNoteOpale` with
  `withLink` false.

## Rows before -> after (probe score)

| row | b0 | after | status |
|---|---|---|---|
| giteso-65-mefo026 | 440 | 462 | riser, explained below; open |
| mifejo-31-sovi184 | 25 | 0 | fixed |
| tajuxe-32-sexo680 | 4 | 0 | fixed |
| kavoro-11-jife299 | 37 | 37 | open: lane width (T1b) |
| xolazi-74-vamu265 | 5 | 1 | colour fixed; branch exit-y open |
| tuneta-22-mega154 | 2 | 2 | open: swimlane spike translate (T1b) |
| jageti-56-kume076 | 1 | 1 | open: while body exit-y |

Rows outside the assignment that also improved: katime 4->0, vopidi 20->0,
xirixi 20->0, lebile 227->223, xovigi 400->399.

## Probe Σ per commit

The probe runs over the b0p 100-row manifest. Σ 12056 at the base equals
`b0p.json`.

| point | Σ | the 7 assigned rows |
|---|---|---|
| base | 12056 | 514 |
| after commit 1 | 12031 | 489 |
| after commit 2 | 12019 | 481 |
| after commit 3 | 11996 | 503 |

## Riser

giteso-65-mefo026 rose 440 -> 462 at commit 3, and its element counts did
not change.

- The cause is a measurement short-circuit. Before commit 3, two of our
  note paths were spiked: WHAT 4/4 and note 4/4, both floating. The jar
  draws those two notes without a spike, so their command structures
  differed. `compareSvg` short-circuited each to one `@d` unit (2 total).
- After commit 3 the paths have the jar's shape, so `compareSvg` counts each
  mismatched coordinate (88 -> 112 `@d[]` units). This is the D5
  non-monotone count.
- The coordinates are still wrong because of the switch-note defect below.
- The drawn output got closer to the jar: no false link.

## Census movers (all equal the jar column)

All are style-census `width` moves.

| row | ours before | now | jar |
|---|---|---|---|
| mifejo | 244 | 224 | 224 |
| katime | 124 | 114 | 114 |
| vopidi | 344 | 334 | 334 |
| xirixi | 344 | 334 | 334 |

None moved away from the jar. Element census: no count decreased.

## Writes outside the listed write-set (each minimal)

None of these files belongs to any batch-1 sibling.

- `layout/tile-layout-structural.ts`:
  - the two `GtileWithNotes` call sites now pass `theme`; one unused import
    was removed
  - `entriesOf`, `mergeIntoWithNotes` and `wrapGroupNote` carry `color`
  - `tileNote` builds a link-less wrap for a floating note
- `tiles/gtile-note.ts`: a `GtileNote.color` field.
- `dispatch-support.ts`: the note regexes' colour group is now capturing.
- `activity-renderer-shapes.ts#renderNote`: one line, `noteFillOf`.
- New file `note-dispatch.ts`. The note parsers moved there verbatim, plus
  the colour and floating handling, because `node-dispatch.ts` would have
  passed the 500-line cap after lint-staged's Prettier pass.
- `docs/catalog.md` was regenerated with `npm run catalog`.

Prettier (lint-staged) also re-wrapped some existing lines in
`activity-renderer-shapes.ts` and `tile-layout-structural.ts`.

## Not done, with mechanisms

1. **giteso switch notes (this row's main residual).** Owner: switch
   parse/tiling, not this write-set.
   - `InstructionSwitch.java:186-192`: a note before the first `case`, or
     while the current case is still empty, belongs to the SWITCH itself.
   - `InstructionSwitch.java:122-125` (`createFtile`) wraps the switch with
     `eventuallyAddNote(..., VerticalAlignment.TOP)`. Two notes make a
     `FtileWithNotes` with TOP alignment. Only the switch passes TOP.
   - Ours drops a pre-case note silently at `switch-dispatch.ts:57` (the
     `'unexpected'` arm). This loses information: WHAT 1/4 is missing.
     WHAT 2/4 stays as the first node of case 1.
   - A note after `endswitch` recurses through `InstructionList.java:190-196`
     -> `getLast().addNote` -> the current branch -> its last instruction.
     Ours has a `redirectNoteOntoIf` for `if` (`list-backward-dispatch.ts`),
     but nothing equivalent for switch.
   - Also needed: TOP alignment in `GtileWithNotes` and `GtileNoteOpale`.
2. **xolazi / jageti exit-y.** `GtileTopDown.getCoord(SOUTH_HOOK)` returns
   `this.height` (`tiles/gtile-top-down.ts:87-89`). Upstream
   `FtileGeometryMerger.java:49-50` uses `outY = geo2.getOutY() +
   geo1.getHeight()`, which is the last child's own outY. A note taller than
   its action therefore moves the branch's exit to the note's bottom.
   - Measured experiment, reverted and not committed: setting SOUTH to
     `childOffsets[n-1] + last.getCoord(SOUTH).y` moves xolazi 1->0,
     jageti 1->0, cokoja 2->0, dabulu 1->0, jusama 2->0 and bizeti 158->157,
     with 0 risers and the ratchet green.
   - It breaks one unit test that pins the old behaviour
     (`gtile-top-down.test.ts` "SOUTH_HOOK.y === height").
   - `gtile-top-down.ts` is a shared primitive outside this write-set.
3. **kavoro lane width (T1b).** `swimlane-context.ts#laneExtentOf` folds in
   nodes and edges but not the stacked-note margin `UEmpty` reservations.
   `Swimlanes.computeDrawingWidths` (`Swimlanes.java:379-395`) runs a
   per-lane `LimitFinder` that does count them, so the lane is 20 px short
   (10 px on each side).
4. **tuneta spike (T1b).** `swimlane-placement.ts:225,245` shifts `node.x`
   by the lane delta but not `node.spikeTip.x`. `canvas-origin.ts:396` does
   shift it. The result is a spike tip left at its pre-lane x.
5. **Colour not carried for these notes** (no assigned row uses them):
   - if-own notes (`IfOwnNote` -> `walk-if-*.ts`), even though upstream
     `FtileIfWithDiamonds.java:113-114` does apply the colour
   - repeat-backward notes

## Observations

- ## Observation: a stacked note's size went through a raw-text path
  - **Context**: mifejo-31-sovi184's width.
  - **Finding**: before commit 1, `measureOpaleText` was used only by
    `GtileWithNotes`. It is now dead in `src/`, but kept in `gtile-note.ts`,
    which is outside this write-set. Its doc comment there is now stale.
  - **Impact**: delete it in the next edit of `gtile-note.ts`.
  - **Confidence**: High
- ## Observation: lint-staged Prettier pushes 500-line files over the cap
  - **Context**: `node-dispatch.ts` sat at 500 lines with one import line
    that Prettier had never formatted.
  - **Finding**: any commit that touches the file makes Prettier expand that
    import by 7 lines, past the cap.
  - **Impact**: measure line counts AFTER `npx prettier`. I split the module
    instead.
  - **Confidence**: High
- ## Observation: our parser refuses a leading-colour action
  - **Context**: authoring fixtures.
  - **Finding**: ours refuses `#red:a;`. Upstream accepts it with a
    deprecation warning (`CommandActivity3.java:133-134`).
  - **Impact**: no corpus row uses it, so the behaviour is unverified
    against the corpus.
  - **Confidence**: Medium
