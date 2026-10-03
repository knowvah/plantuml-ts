# T3a — edge / canvas families

Agent: typescript-pro, worktree `add2-T3a`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: C/EMMID (emphasize mid-arrow at ct(uncompressed midpoint), `Worm.java:178-182`, `UGraphicCompressOnXorY.java:117-126`), A/H1 (lane-divider vline in height, `LaneDivider.java:97`, `Swimlanes.java:422-423`), B/ORD (every compressed line normalised y1<=y2, `UGraphicCompressOnXorY.java:142-146`; reuse `orderedLine`), P (split 1.5 thickness, `FtileThinSplit.java:88,95`), Q (`LimitFinder.java:217-224`), E (chrome x on floored dims, `DecorateEntityImage.java:144-150`). Highest pin yield: ~80 rows at ws <= 10.

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`layout/{canvas-origin,assign-coordinates-full}.ts`, `layout/compress/compress-geometry.ts`, `activity-geometry.types.ts`, `renderer.ts`, `activity-renderer-terminals.ts`, their tests.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
