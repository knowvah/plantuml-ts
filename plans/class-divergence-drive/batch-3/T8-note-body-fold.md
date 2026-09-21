# T8 — note body and fold: vertex order, two-path shape, paint

**Agent:** typescript-pro (sonnet) · **Depends on:** —

## Context

A plain note is TWO `UPath`s upstream: the pentagon body stroked at 0.5,
and the dog-ear fold drawn on the UNSTROKED graphic — so the fold gets the
diagram's DEFAULT stroke-width (1) and keeps the note's BACKGROUND fill
(`#FEFFDD`), while the body gets stroke-width 0.5
(`EntityImageNote.java:275-289`: `stroked = applyStroke(ug); stroked.draw(
polygon); ug.draw(Opale.getCorner(...))` — the corner draws on `ug`, not
`stroked`). This port draws a `<polygon>` body running the OPPOSITE vertex
direction and an open, unfilled 3-point fold. The correct fold path already
exists at `src/core/svek/image/Opale.ts:180-190` (`opaleCorner`, used by
`renderTipNote`/`renderOpaleNote`) and the correct two-path shape exists at
`src/core/svg-shapes.ts:394-418` (`noteBox`, used by activity/files/
sequence, a DIFFERENT vertex convention — not the reuse target here). This
is a class-only wiring gap, not a missing port. Mechanism: `diagnosis/
A5-geometry.md` M2. Re-read `EntityImageNote.java`/`Opale.java` before
editing — the report is a lead.

## Task

1. Tests first: assert the exact `d`/point-order string and
   `fill`/`stroke-width` attributes for a plain note — not just presence.
2. Rewrite `renderer-note.ts`'s two `parts.push` calls (`:366-382`): emit
   `Opale.getPolygonNormal`'s point order (`Opale.java:149-157` — starts
   `moveTo(0,0)`, goes DOWN the left side first) as a `<path>`, stroke-width
   `0.5`.
3. Reuse `opaleCorner` (`src/core/svek/image/Opale.ts:180-190`) for the
   fold, with `fill` = the note's own background color (not `none`) and
   `stroke-width = 1` (the diagram default, not the note style's 0.5).
4. Confirm `src/core/svg-shapes.ts#noteBox` (`:394-418`) is NOT the right
   reuse target — it is the activity/files/sequence shape with a different
   vertex convention; this task ports the class-specific `Opale` order,
   don't blend the two.
5. `.agent-notes/cdd-T8.md`: `Opale.getCorner`'s exact 4-point sequence
   (`Opale.java:134-147`), for anyone touching note shapes later.

## Read-set

`net/sourceforge/plantuml/svek/image/EntityImageNote.java:275-289`;
`net/sourceforge/plantuml/svek/image/Opale.java:134-157`; `src/diagrams/
class/renderer-note.ts:354-382`; `src/core/svek/image/Opale.ts:180-190`;
`src/core/svg-shapes.ts:394-418` (read-only, for contrast — not the reuse
target).

## Write-set

`src/diagrams/class/renderer-note.ts`, its `.test.ts` file,
`.agent-notes/cdd-T8.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T9, T10)

`renderPlainNote(...)` returns `{ entityParts: string[]; connector?: string
}` — the connector path is returned separately from the body/fold parts so
T9 can emit it as its own `<g class="link">` instead of inlining it into
the note's entity group.

## Acceptance criteria

- Given `nuxoni-26-xala894` (`note as Note1`), when rendered, then the note
  body is a `<path>` with the jar's exact vertex order and `stroke-width
  0.5`, and the fold is a closed `<path>` with `fill` equal to the note
  background and `stroke-width 1`
- Given `befasi-62-vimu310`, when rendered, then its note `<path>`s are
  byte-equal to the oracle (GEO2's share of its 3-mechanism diff cleared)
- Given the 14 GEO2 fixtures in `diagnosis/mechanisms.json`'s `GEO2` row,
  when rendered, then each loses its polygon-vs-path structural diff (not
  necessarily fully conformant — some carry other mechanisms)

## Observability

N/A — no new observable operation.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green.
`render-diff.mts` on `nuxoni-26-xala894`, `befasi-62-vimu310`, and 3 more
GEO2 slugs before/after.

## Boundaries

Always: use `Opale.ts`'s existing `opaleCorner`, don't hand-roll a new
fold function. Ask first: any stop condition in `../README.md`. Never:
touch `svg-shapes.ts#noteBox` (a different diagram family's shape) or
`note-layout-groups.ts`/`renderer.ts` (T9's write-set) or create
`renderer-note-lines.ts` (T10's write-set).

## Commit

`fix(cdd-T8): correct note body vertex order and fold paint`

Body: cites `EntityImageNote.java:275-289`/`Opale.java:134-157`; why this
is a wiring fix — both correct primitives already exist elsewhere.
