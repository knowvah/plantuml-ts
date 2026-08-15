# Batch 3 — one collection, then close

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T4 | Fold notes into the class leaf collection, carrying leaf type | typescript-pro | `class/layout.ts`, `class-geo-types.ts`, `class-ink-box.ts`, `renderer*.ts` | B2 | [ ] |
| T5 | Sweep, ledger, close | typescript-pro | brief + `.agent-notes/` | T4 | [ ] |

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
