# T3c — parallel / compress-X families

Agent: typescript-pro, worktree `add2-T3c`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: PARX (fork arrowheads skipped on compress-X only for fork drawTranslate, `ParallelBuilderFork.java:172,229`; never for split, `ParallelBuilderSplit.java:207-225,264-285`), S (`ParallelBuilderSplit.java:139-140`), lapura (UNK: X compression removes 32 vs jar 16 around an empty third fork branch), gevaxi (empty fork branch margin over-compressed, .agent-notes/T2f-geometry.md), bazuma (multi-line if-label measured once in `compress/shapes-of.ts#ifLabelShape`).

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`layout/compress/**` EXCEPT `compress-geometry.ts` (T3a), `layout/walk-fork-branches.ts`, `tiles/{gtile-fork,gtile-split,gtile-merge}.ts`, their tests.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
