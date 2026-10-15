# T3 — childCount family

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T3`.

## Rows
- **childCount only:** cuxelu-66-zopu195, gacida-77-joku810, jazabe-68-bica131, givape-84-xano421
- **childCount with id/fill/d:** gekato-87-lisi598, lakuti-06-dobi447, tijexo-10-zipo222
- **childCount with background:** sugaca-11-boma467
- **Census:** childCount reaches 49+30 rows in total. Run `--families` and take the top 10 by row
  count as the stretch set.

## Task
Diagnose each row before editing. Follow `~/.claude/rules/diagnosis.md`; a childCount diff names
WHERE, never WHY.
1. Align the jar's `<g>` children against ours element by element (segment compare beats align
   counts: [[segment-compare-beats-align-counts]]). Name the element the jar draws and we do not,
   or the reverse.
2. Find the Java that draws (or omits) it. Quote it.
3. Mirror it. An element we draw that the jar omits is our defect: remove it, with the Java quote
   ([[always-mirror-the-jar]]).
4. Group the rows by mechanism, and fix each mechanism once.

If a mechanism lives in `renderer-cluster.ts` or `layout.ts` (T2's files), report it for re-slotting
to the T2 owner. Do not edit it.

## Write-set
- `src/diagrams/description/renderer.ts`, `renderer-draw-sequence.ts`, `renderer-edge.ts`,
  `renderer-entity.ts` (only if T1c has merged; otherwise re-slot), `renderer-note-opale.ts`,
  `renderer-uid.ts`
- other description files where a stated mechanism lives (journal each)
- `tests/unit/description/**`

## Acceptance
- Given each of the 8 rows, then its childCount diff is 0, or its residual is named with the jar
  element and a mechanism.
- Given the surveys in the worktree, then there are zero conformant losses, and every mover is
  listed with its mechanism.
- Given the census, then no row's count rises without a mechanism. Check @id re-pairing first (D2).

**Observability:** N/A. **Rollback:** Reversible.
