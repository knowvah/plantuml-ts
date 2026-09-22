# T10 follow-up — wire note dividers and tables in row order

## Two independent bugs, both required for sodizo/jovigo/fomofi to reach conformance

1. **Append instead of interleave.** The original T10 cut appended every
   divider/table's markup once, AFTER the note's whole text block
   (`renderNoteExtras`, called once per note from a wrapper layer). Jar
   draws a block-separator's divider INTERLEAVED, immediately before its
   own block's content (`BodyEnhancedAbstract.java:107-121`,
   `TextBlockLineBefore#drawU`) — never after everything. Fixed by giving
   `renderer-note.ts#renderNoteText`'s own per-row loop (the ONE place
   with the correct cumulative `lineTop`) a second per-row push,
   `renderer-note-lines.ts#renderNoteRowExtra(note, lineTop, i,
   baselineOffset, theme)`. `renderer-note.ts` is now the SOLE place a
   note's text/extras interleave; `renderer-note-lines.ts` shrank to pure
   per-row/per-cell drawing primitives with no per-note orchestration and
   no import of `renderer-note.ts` (that direction would now cycle, since
   `renderer-note.ts` imports `renderNoteRowExtra` from here).

2. **A third `NoteGeo` constructor never threaded the new fields.**
   `note-layout-tip.ts#tipNoteGeo`/`plainNoteGeo` (T10's own write-set)
   both copied `NoteMeasurement.lineDividers`/`.lineTables` correctly.
   `note-opale.ts#buildOpaleNoteGeo` — NOT touched by T10, and not on
   ANY of its "Never" boundaries because nobody had reason to look at it
   — has its own narrower structural parameter type (`m: {width, height,
   lines, lineWidths, lineAtoms, lineHeights}`) that never listed the two
   new fields, so they were silently dropped for every note this
   constructor builds. This is the ONE constructor `singletonNoteGeo`
   tries FIRST for any non-strict-uml single-link note
   (`note-layout-tip.ts:175-177`) — i.e. the COMMON case. Both
   `sodizo-26-salo123` and `jovigo-38-tuni063` are opalised (their golden
   `<path>` carries a zigzag notch, not a separate connector), so BOTH
   went through this exact silent-drop path. Fixed by widening
   `buildOpaleNoteGeo`'s own `m` parameter type with the same two
   optional fields and copying them through.

Both bugs had to be fixed together: fixing only #1 makes the interleave
correct but the fields are still absent for opalised notes (no visible
change on sodizo/jovigo, since `note.lineDividers`/`.lineTables` are
`undefined` for them either way); fixing only #2 makes the fields present
but still wrong-ordered (fomofi's regression: `structural 1→2`, divider
now present but appended after all text, which is a WORSE, not better,
positional mismatch — jar-verified by the coordinator before this fix
landed).

## Result

`sodizo-26-salo123`, `jovigo-38-tuni063`, `fomofi-36-lova857` all reach
FULL byte-for-byte conformance (`structural=0 numeric=0`) after both
fixes — better than either fix alone, and better than what T10's own
report anticipated (it expected only a childCount improvement, not full
conformance, since it never diagnosed the `buildOpaleNoteGeo` gap).

## Checked and found correct (per the coordinator's own suggestion)

`class-layout-shift.ts#shiftNoteGeo` spreads `...note` and only
translates `x`/`y`/`connector`. `NoteDividerDraw`/`NoteTableDraw` carry no
absolute coordinates (`dividerYOffset` is relative to the row's own top;
`colBounds`/`rowBounds` are relative to the table's own origin) — the
existing shift is correct as-is, no fix needed. Verified by reading the
function, not by assumption.
