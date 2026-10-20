# T2e — notes and the box (englober)

Agent: `typescript-pro`, worktree `sdd1-T2e`. Commit:
`fix(sequence): paint notes and boxes from the merged style`.
**Read [family-contract.md](family-contract.md) first — it is part of this
prompt.**

## The family
Notes (`note`, `hnote`, `rnote`, `note over`, `note across`) and `box ...
end box` englobers. Planning measurement: note `<path>` `stroke-width` 1.5
where the jar draws 0.5 (729 elements) — `note { LineThickness 0.5 }`
(`plantuml.skin:322-326`; read which block applies in the
`sequenceDiagram` scope) merged with the stereotype's styles and
`eventuallyOverride(colors)` at use time (`Note.java:71-82`,
`NoteStyle.java:46-74`). Box: `box { BackGroundColor #d; FontSize 13;
FontStyle bold }` (`plantuml.skin:172-177`), `Doll.java:103-108` with the
englober's stereotype.

`renderer.ts` is yours in this batch: change only `renderNote`
(`:95-148`) and `renderBoxBackground` (`:332-362`) and what they call; the
frame/ref/newpage/delay functions belong to T3a (batch 3).

Java: `sequencediagram/Note.java`, `NoteStyle.java`, `Doll.java:80-120`;
`skin/rose/ComponentRoseNote.java`, `ComponentRoseNoteBox.java`,
`ComponentRoseNoteHexagonal.java`, `ComponentRoseEnglober.java`.

## Write-set
`src/diagrams/sequence/{renderer,sequence-layout-note,sequence-note-tile}.ts`,
their tests under `tests/unit/sequence/`.

## Read-set
`family-contract.md`; `decisions.md#d1`, `#d2`, `#d5`; `renderer.ts:60-150,
330-362`; `sequence-layout-note.ts`, `sequence-note-tile.ts` (whole);
`geo-annotation.ts:18-40,112-137`; `src/core/rose-note-dim.ts` (read only);
`sequence-skin-param.ts` (`noteStyle`, englober style, `paintOf`).

## Acceptance
- Given a default `note left of A`, then the note path's stroke-width is the
  merged note thickness (unit test cites the skin line) and its fill is the
  jar's.
- Given `note #pink` and `note <<X>>` with a `<style> .X { … }`, then the
  colour override and the stereotype style arrive as `Note.java:76-79`
  applies them.
- Given `box "B" #LightBlue`, then fill, title font size 13 bold arrive
  through the Style path.
- Given the note/box rows at b1b, then no row rises without a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.
