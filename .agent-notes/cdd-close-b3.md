# cdd-close-b3 — batch 3 close (class-divergence-drive)

Written 2026-09-22. Survey 455/55/213 → 460/56/207; census 457 → 462;
ratchet 457 → 462; DOT 711/712.

## Observation: a note's geometry has THREE constructors
- **Finding**: `NoteGeo` is built in `note-layout-tip.ts` (two builders)
  AND `note-opale.ts#buildOpaleNoteGeo`, whose parameter type is a
  narrower structural subset — any new `NoteGeo` field added to the first
  two is silently dropped for every opalised note (the common single-link
  case) until the third is widened too. T10's dividers/tables did not
  reach sodizo/jovigo for exactly this reason.
- **Impact**: adding a `NoteGeo` field = three constructors + `shiftNoteGeo`
  (which spreads, so only absolute coordinates need translating).
- **Confidence**: High.

## Observation: the batch-1 link order does not yet cover note connectors
- **Finding**: T9 emits the note connector after the ordinary edges via the
  same `wrapLink`; upstream mints it into `dotData.getLinks()` in
  declaration order (`CommandFactoryNoteOnEntity.java:359 addLink`), so a
  diagram that declares a note BETWEEN two relationships would place the
  connector group between them in the jar. No corpus fixture with a plain
  attached note has that shape (batch 3 closed with 0 movers outside the
  targets), so it is untested, not disproved.
- **Confidence**: Medium (reasoned from the Java; no fixture exercises it).

## Observation: note-on-link boxes use the wrong Opale stroke rule
- **Finding**: `renderer-edge-extras.ts#renderEdgeNoteBox` (T7) calls the
  plain-note builder (`EntityImageNote.drawNormal`, body 0.5 / fold 1);
  the jar's link note is `Opale#drawU` (both 0.5) and carries the link's
  note colour. lipazi/lozego/nuvake rose after T8 for this reason (row 34).
- **Confidence**: High.
