# Batch 3 — one collection, then close

**RETIRED, not pending.** Stopped before T4 (`decision-journal.md`'s Batch 3
STOP rows: the faithful fold cannot be byte-identical, so this batch's exit
bar clause 3 is unreachable as specified). T4 and T5 below were never
started under THIS brief. The fold they describe was completed instead under
mission `leaf-draw-order` (`plans/leaf-draw-order/`, branch
`feat/leaf-draw-order`, commits `a1c721e3..e1f4c869`) against a
movement-toward-jar bar rather than byte-identity — see that mission's
`decisions.md` D1–D6 and its README's session summary. The `[ ]` rows below
are left as historical record of the original (unreachable) plan, not as
outstanding work on this brief.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T4 | Fold notes into the class leaf collection, carrying leaf type | typescript-pro | `class/layout.ts`, `class-geo-types.ts`, `class-ink-box.ts`, `renderer*.ts` | B2 | [ ] retired into `leaf-draw-order` |
| T5 | Sweep, ledger, close | typescript-pro | brief + `.agent-notes/` | T4 | [ ] retired into `leaf-draw-order` |

Serial. T5 writes no `src/`.

Read `src/diagrams/state/layout.ts#buildFlatStateGeos` and
`state/renderer-note.ts` first — state already did this, including the
`creationIndex` mechanism that gets jar's interleaved document order for
free. Copy its shape rather than inventing one.

## Batch exit bar

1. `NoteGeo` is gone as a parallel array; notes are leaves carrying their
   upstream leaf type (D2).
2. Document order, uid assignment and ink extent each re-verified with
   named evidence, not inferred from a green suite (D5).
3. Byte-identical output; DOT unmoved; all pins hold.
4. `.agent-notes/` records the outcome and anything left.
