# Batch 5 — engine wiring for M2

Two tasks, parallel, disjoint write-sets. Both consume T8's merged-box function.
Geometry moves, so D4's census bar is live.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T9 | State note-on-link | `typescript-pro` | `src/diagrams/state/state-dot-graph.ts`, `src/diagrams/state/state-composite-edge-label.ts`, `tests/unit/state/state-note-link-dot.test.ts`, `oracle/goldens/state/label-size-backlog.json` | T8 | [x] |
| T10 | Class note-on-link | `typescript-pro` | `class-layout-edge-labels.ts`, `class-note-link-box.ts` (new), `class-dot-edges.ts`, `class-dot-graph.ts`, `class-layout-helpers.ts`, `class-notes.ts`, `class-relationship-ast.ts`, `class-command-containers.ts`, class + object backlogs | T8 | [x] |

**Write-set conflicts:** none within the batch. Note that T10 re-opens
`class-layout-edge-labels.ts` and the class backlog, both of which T6 edited in
Batch 3 — sequential, not concurrent, so no conflict. Rebase awareness only.

**Batch exit:** all four gates; state and class DOT EQUAL at or above baseline;
**no fixture rises**; the state SVG ratchet (59 pins) holds or moves toward jar
with the measurement journalled.

## Watch-out

T9 has an extra obligation the other wiring tasks do not:
`tests/unit/state/state-note-link-dot.test.ts#expectAllPassesEqual` currently
**excludes `labelSizeOk`** — SI22 narrowed it deliberately, because the note
text reaching the label (presence and topology) was correct while the merged box
size was not. T9 closes the size half, so the exclusion must go. A green suite
that still excludes the check is not a pass.

## Write-set correction, recorded after the fact

T10's declared write-set above was **two files**; it needed **nine**. Three
widenings were authorized during execution, each verified necessary rather
than convenient before approval — see `decision-journal.md`:

1. **Parser position capture** (`class-notes.ts`, `class-relationship-ast.ts`,
   `class-command-containers.ts`). `NOTE_ON_LINK_RE` used a *non-capturing*
   group for `left|right|top|bottom` and `linkNote?: string` carried no
   position, so `computeMergedLabelBox`'s `position` argument could only have
   been hardcoded — a fitted value.
2. **`NoteBoxContext`/`Theme` threading** (`class-dot-edges.ts`,
   `class-dot-graph.ts`, `class-layout-helpers.ts`). Without it the merge sat
   behind an optional param no caller supplied, so T10's first commit was
   functionally inert.
3. **Sprite dimensions**, on the same plumbing — which took
   `lozego-15-coci435` to an exact `137x135`.

The lesson is not that the write-set was drawn carelessly. It is that batch 5's
write-sets were drawn **before** the mechanisms were diagnosed, and a
note-on-link box turns out to need the note's *position* and its *sprite* —
neither of which the class engine carried. A write-set fixed at planning time
cannot anticipate that; the mission's stop-and-log rule is what surfaced it.
