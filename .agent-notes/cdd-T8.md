# T8 — note body vertex order and fold paint

## `Opale.getCorner`'s exact 4-point sequence (`Opale.java:134-147`, `roundCorner === 0`)

For anyone touching note shapes later — this is the fold triangle EVERY
note kind in this codebase now shares (plain note, tip note, opalisable
note):

```
moveTo(width - cornersize, 0)
lineTo(width - cornersize, cornersize)
lineTo(width, cornersize)
lineTo(width - cornersize, 0)
```

`cornersize = 10` (`Opale.java:53`, `OPALE_CORNERSIZE` in
`core/svek/image/Opale.ts`). No `Z`/closePath is emitted — the path's own
last point already coincides with its `moveTo`, and this codebase's SVG
driver does not append an explicit close command for `UPath#closePath()`
(jar-verified: `nuxoni-26-xala894`'s golden `<path d="M87.119,6 L87.119,16
L97.119,16 L87.119,6" .../>` has no trailing `Z`).

The already-ported `core/svek/image/Opale.ts#opaleCorner(origin, width)`
implements exactly this (it predates T8 — `renderTipNote`/`renderOpaleNote`
already called it); T8 only added a THIRD caller (`renderPlainNote`'s
fold) and corrected the STROKE-WIDTH those two other callers already had
right for their own mechanism (see below).

## Two different upstream stroke rules for what looks like the same shape

`EntityImageNote.java:275-289` (`drawNormal`, the PLAIN note this task's
`renderPlainNote` implements) applies stroke to a SEPARATE graphic for the
body only (`stroked = applyStroke(ug); stroked.draw(polygon)`) and draws
the fold on the UNSTROKED `ug` — so plain-note fold is stroke-width 1
(diagram default), body is 0.5 (`note { LineThickness 0.5 }`).

`Opale.java`'s OWN `drawU` (its instance method, used by the
"opalisable"/tip-note mechanism — `renderTipNote`/`renderOpaleNote` in this
file) applies stroke to `ug` ONCE, before EITHER `ug.draw(polygon)` OR
`ug.draw(getCorner(...))` — so THAT mechanism's fold and body share the
SAME 0.5 stroke. This is why `renderTipNote`/`renderOpaleNote` already
used `NOTE_STROKE_WIDTH` (0.5) for both shapes, unchanged by this task —
they were already correct, for a DIFFERENT reason than the plain note.

## Finding: `renderer-edge-extras.ts#renderEdgeNoteBox` (T7's file, not
## touched here) reuses the WRONG one of the two mechanisms

`renderEdgeNoteBox` (a `note on link` box) calls `renderNote`/
`renderPlainNote` — i.e. `EntityImageNote.drawNormal`'s split-stroke
mechanism. Jar-verified this is the wrong mechanism for a note-on-link
box: `lipazi-06-care921`, `lozego-15-coci435`, `nuvake-96-gofe203` all show
`path[.]/@stroke-width exp=0.5 | act=1` on the fold after this task's fix
(their body/fold now at LEAST agree on element TYPE, but the fold's
stroke-width is wrong for this caller). Before T8 this was invisible —
the fold was a `<polygon>`/malformed `<path>` mismatch that short-circuited
before the comparator reached `@stroke-width`. `renderEdgeNoteBox` also
never threads the link's own note `color` onto its synthetic `NoteGeo`,
so a coloured `note on link #red` box now visibly diffs on `@fill`
(previously masked the same way). Neither is in T8's write-set
(`renderer-edge-extras.ts` is T7's file); filed here for whichever task
next touches `renderer-edge-extras.ts` or `renderer.ts` for real — likely
needs its OWN Opale-uniform-stroke code path (mirroring `renderTipNote`/
`renderOpaleNote`'s pattern) plus threading `Relationship`'s note color
onto the synthetic `NoteGeo`, not a `renderPlainNote` reuse.

## `renderPlainNote`/`renderNote` split (T9/T10 interface)

`renderPlainNote(note, theme)` now returns `{ entityParts: string[];
connector?: string }` (T9/T10's declared interface-in). `renderNote`
(unchanged signature, still returns a plain `string`) is now a thin
wrapper (`(connector ?? '') + entityParts.join('')`) — kept so BOTH
existing callers (`renderer.ts`'s note dispatch, `renderer-edge-extras.ts
#renderEdgeNoteBox`) compile and behave unchanged without editing either
file. No mechanical edit to `renderer.ts` was needed: the return-type
change lives entirely behind the NEW `renderPlainNote` export: `renderNote`
kept its pre-T8 string signature. T9 can switch `renderer.ts`'s own call
from `renderNote` to `renderPlainNote` when it needs the connector
separated into its own `<g class="link">`.
