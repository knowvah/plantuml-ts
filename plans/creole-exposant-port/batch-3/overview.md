# Batch 3 — Class consumers · State consumers (parallel, after T3)

Both consume T3's `{size, dy}` + Sea line height. Disjoint write-sets. Each
runs the `planning/sizer-renderer-parity.md` audit and notes it (D7).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Class: member atoms + notes measured with muted size and Sea `dy`; renderers draw the SAME | typescript-pro | `src/diagrams/class/class-member-creole.ts`, `renderer-classifier-rows.ts`, `renderer-note.ts`, `note-layout-measure-rows.ts`, class unit tests, class fixture ratchet/goldens | T3 | [x] |
| T5 | State: `StateTextRun` gains `size`/`dy`; box/composite/note renderers draw per-run `font-size` + `dy`; juvagu-33 closed | typescript-pro | `src/diagrams/state/state-sizing-creole.ts`, `renderer-box.ts`, `renderer-composite-box.ts`, `state-note-layout.ts`, `renderer-note.ts` (state), `tests/unit/state/state-sizing-creole.test.ts` (+ note test), `oracle/goldens/state/size-backlog.json` (juvagu-33 + state fixture) | T3 | [x] |

**Expected manifest moves.** T4 → the class authored slug. T5 →
`juvagu-33-dupa212`, the state authored slug. Anything else is stop 4.
