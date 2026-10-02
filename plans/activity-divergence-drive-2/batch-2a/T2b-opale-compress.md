# T2b — Opale spike, compression reservations, backward note, partition title, cross-lane elbow

Agent: typescript-pro, worktree `add2-T2b`. Depends on T1b (b1 close).

## Context
add1 rows 44, 45, 47: `FtileWithNoteOpale#drawU` spike tip (`:76,177-191`) —
setting `spikeTip` was reverted because compression reserved no space for the
spike reach (rucuga hard overlap) — cubida, vimoxa, norire; a note after
`backward:` belongs to the backward box (`InstructionRepeat.java:220-228` →
`backwardNotes`, `FtileRepeat.java:183-184`) — gokagi; partition title stored on
the group tile and threaded to the composite node — caciva, jogami, sifite;
cross-lane connector elbow lands +5 y after compression (`UGraphicCompressOnXorY`
per-point transform vs our pre-compression midpoint) — jakuco, patagi, povoju,
sikino, sopape, tefuga, pakema.

## Task
For each row: `--dump`/`--align`, read the Java (quote file:line), port at the origin, apply to every fixture the mechanism governs, pin with a test. Measure the full corpus before/after (probe + elements).

## Write-set
`src/diagrams/activity/layout/{tile-coordinates,tile-layout-backward}.ts`, `src/diagrams/activity/layout/compress/**`, `src/diagrams/activity/tiles/{gtile-note,gtile-group,gtile-partition}.ts`.

## Acceptance
- Given each named row, then the diffs from this mechanism go to 0 (or the row is re-slotted with mechanism + owning file).
- Given the full corpus, then 0 unexplained risers.
- Given the pinned goldens and harness-parity test, then green.

## Rules
Worktree only (`measurements/mkwt.sh T2b`); NO Serena MCP tools, no `git stash`,
scratch files named with `T2b`; never write `oracle/**` JSON (repin dry-run only);
67+ pinned goldens byte-equal (stop and report otherwise); every riser shown from
the diff; every number carries an upstream `file:line`; anything outside the
write-set is re-slotted, never forced. Quality bar: targeted vitest + the
activity golden/diff-baseline/harness-parity tests + typecheck + eslint; files
≤ 500 lines, functions ≤ 30 NLOC / CCN ≤ 10. One commit per mechanism.
Observability: N/A (gated measurements only). Rollback: Reversible.
