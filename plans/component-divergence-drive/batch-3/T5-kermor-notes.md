# T5 — kermor group-note drawing

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T5`.

## Context
- dsw T4c gave the layout the jar's kermor `alpha > beta > gamma` wrappers, including the group
  notes (`ClusterDotStringKermor.java`).
- The drawing side does not draw those notes. The jar draws them in
  `Cluster.java:302-307`:
  `if (diagram.getPragma().isTrue(PragmaKey.KERMOR)) { if (xyNoteTop != null)
  getCucaNote(Position.TOP).drawU(ug.apply(UTranslate.point(xyNoteTop))); … }`
- fojamu (component/fojamu-08-veku866): the jar draws the note at (6,6), 272×36.

## Task
1. Read where `xyNoteTop`/`xyNoteBottom` are set: `Cluster.java:278-284` (`setNoteTopPosition`), called from
   `DotStringFactory.java:454` (`SvekUtils.getMinXY(noteUp)`). Read `getCucaNote` and the note `drawU`. Quote each.
2. Mirror them. Read the note position from the layout node that the kermor wrapper emitted, then
   draw the note through the existing opale note renderer (`renderer-note-opale.ts`, read-only
   unless the mechanism needs it).
3. Draw the notes before the cluster's own symbol, in the jar's order.

## Write-set
- `src/diagrams/description/renderer-cluster.ts` (T5 owns it in batch 3), `layout.ts` (only to
  expose the note position), `renderer-note-opale.ts` (if needed)
- `tests/unit/description/**`

## Acceptance
- Given fojamu, then the note is drawn at (6,6) at 272×36. Report render-diff before → after.
- Given zubujo-87-xaxa087 and siseda-71-napu395, then render-diff before → after, and residuals
  carry mechanisms.
- Given a non-kermor fixture with group notes, then its output is unchanged. Prove it with a test.

**Observability:** N/A. **Rollback:** Reversible.
