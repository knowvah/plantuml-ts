# Batch 5 — engine wiring for M2

Two tasks, parallel, disjoint write-sets. Both consume T8's merged-box function.
Geometry moves, so D4's census bar is live.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T9 | State note-on-link | `typescript-pro` | `src/diagrams/state/state-dot-graph.ts`, `src/diagrams/state/state-composite-edge-label.ts`, `tests/unit/state/state-note-link-dot.test.ts`, `oracle/goldens/state/label-size-backlog.json` | T8 | [ ] |
| T10 | Class note-on-link | `typescript-pro` | `src/diagrams/class/class-layout-edge-labels.ts`, `oracle/goldens/class/label-size-backlog.json` | T8 | [ ] |

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
