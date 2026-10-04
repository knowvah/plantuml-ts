# T3g — note wrapper + partition tab (wave 2)

Agent: typescript-pro, worktree `add2-T3g`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: NOTE (note wraps the preceding Ftile: `FtileFactoryDelegatorAddNote.java:54-61`, `FtileWithNoteOpale.java:76,125-191`, `Opale.java:56-59`; ours is a GtileTopDown sibling with phantom edges — .agent-notes/T2b-opale-compress.md and planning/next-missions.md `activity-note-opale-attachment`), PART (`FtileGroup.java:176-186` asBig: rect + folded tab path + title, title height, per-lane frame). 15 + 5 rows, Σ ~2100: the largest single weight left.

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`layout/{tile-layout,tile-layout-structural,tile-layout-backward,tile-coordinates}.ts`, `tiles/{gtile-top-down,gtile-note,gtile-group,gtile-partition}.ts`, `layout/compress/**` EXCEPT `shapes-of.ts` (T3f), `activity-renderer-shapes.ts#renderComposite` ONLY (T3h owns the rest of that file; prefer a new `activity-renderer-composite.ts` called from one line), `activity-layout-constants.ts` (note margins), their tests.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
