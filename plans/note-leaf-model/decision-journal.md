# Decision journal — note-leaf-model

Appended during execution. Every non-trivial judgement call gets a row.

Also record here, because later batches are measured against them:

- **T1's baseline** — the note-order/uid report, and the standing numbers
  (776 / 25695, DOT 100% EQUAL, pin counts).
- **Batch 2's verdict** — whether draw-time Opale resolution is
  byte-identical, and if NOT, which input the draw stage lacks. That answer
  is the mission's pivot: it either unblocks Batch 3 or ends the mission
  with a real finding.
- **Every fixture whose document order, uid or ink changed** — expected to
  be none; any entry here is a stop, not a note.
- **The member-tip (`::member`) fixtures checked by name** in Batch 2. A
  green suite is not evidence for that family.

| Date | Task | Decision | Why | Alternative rejected |
|---|---|---|---|---|
| 2026-08-15 | B1 | Batch 1 executed directly by the orchestrator, not via `typescript-pro` agents. | Both tasks were small (one script; one field + 4 producers + 10 test literals), well under the ~30-min delegation threshold, and T2's stamp rule needed a corpus probe first. Logged per the autonomous rules. | Two parallel agents — more tokens for two files' worth of work. |
| 2026-08-15 | T1 | **Baseline re-pinned.** The brief's standing numbers (776/25695, class DOT 100% EQUAL of 712, 14291 tests) predate `feat/edge-label-box-closeout` (merged `0cc54633`, AFTER the brief was drafted `b535c1d2`), which deliberately re-baselined class DOT to 680/711 EQUAL via the new `labelSizeOk` check (its journal, 2026-08-15) and moved shape-match. Measured on this mission's starting main: shape-match **779 / 25975**; class DOT **680/711 EQUAL** (7 oracle-blind, 1 `directionOk` fail besepi-37, 30 `labelSizeOk` fails — the named backlog); `npm test` **14307**. Saved verbatim under `plans/note-leaf-model/baseline/` (`shape-match.txt`, `dot-sync-class.txt`, `note-order.txt`). The bar is unchanged in kind — "exactly unchanged" — against THESE files. | A number that has drifted is worse than no number; the gate is a diff against the saved report, not a memorised figure. | Editing the brief's numbers in place — loses the provenance of why they moved. |
| 2026-08-15 | T1 | Report reads ORDER and UIDs back from the rendered SVG and note identity from the PARSE output (`ast.notes[].id`), never from `geo.notes`; adds a whole-SVG sha per fixture and a `--check` mode. | The report must survive Batch 3, which deletes the very array a geometry-side report would read; the sha makes "byte-identical" directly checkable on all 97 note fixtures, not inferred from shape-match's rigid-alignment score. | Reading `geo.notes[].tip/opale/dropped` — would need rewriting mid-mission. |
| 2026-08-15 | T1 | Baseline: 97/802 class-engine fixtures carry notes; 28 carry TIPS; 144 wrapped `note:` entries. Two runs byte-identical (`cmp`), `--check` exit 0. TIPS leaves appear only via the sha and `tips=` count (they draw unwrapped, no uid — `EntityImageTips#drawU`). | — | — |
| 2026-08-15 | T2 | `NoteGeo.leafType` is REQUIRED and stamped by the shape DRAWN: `buildTipNoteGeo`/`droppedNoteGeo` -> `'TIPS'`, `plainNoteGeo`/`buildOpaleNoteGeo` -> `'NOTE'`. Corpus probe (scratch script over all 802): 33 TIPS = 31 resolved + 2 dropped, 144 NOTE = 105 opale + 39 plain, **0** `::member` notes falling through to the plain path — so draw-side and parse-side (`targetPort`) stamps agree everywhere the corpus reaches. | The value is what `GeneralImageBuilder` dispatches on; Batch 3's dispatch-by-leaf-type can only be byte-identical if the stamp matches the drawn shape. The one divergent case (a `::member` note whose host never resolves) is a note upstream never creates (`CommandFactoryTipOnEntity:208-209`); documented on the field. | Stamping from `ClassNote.targetPort` regardless of draw path — identical today, but would make Batch 3's dispatch move output if that case ever appears. Optional field — hides which producer forgot it. |
| 2026-08-15 | B1 | Gates: typecheck/lint/build/test all exit 0 (14307 passed, 1 todo, no expectation moved); shape-match `diff` empty vs baseline; class DOT-sync `diff` empty; note-order `--check` identical. Batch 1 exit bar met on all three clauses. | — | — |
