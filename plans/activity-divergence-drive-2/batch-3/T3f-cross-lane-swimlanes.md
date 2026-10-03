# T3f — cross-lane connectors + swimlane details (wave 2)

Agent: typescript-pro, worktree `add2-T3f`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: XLANE (cross-lane connections drawn as routeEdge's generic jog `swimlane-placement.ts:344-352` instead of their own drawTranslate: `FtileIfWithLinks.java:149-174,238-286,369-420`, `FtileRepeat.java:432-438,480-511`), O (`|#color|` lane background, `Swimlanes.java:332-340`), M (title band stroke = background, `Swimlanes.java:357-366`), SLURL (`Swimlanes.java:285-293`), ELSEIFIN (`CommandElseIf2.java:70-76,147-151`), N (`end fork {label}`, `FtileBlackBlock.java:84-92,111-112`, `ParallelBuilderFork.java:115`).

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`layout/{swimlane-*,walk-if-down,walk-if-with-links,walk-if-long-horizontal,walk-repeat-backward}.ts`, `activity-renderer-swimlanes.ts`, `{dispatch-support,parallel-dispatch,if-dispatch,ast}.ts`, `activity-renderer-bars.ts`, `tiles/gtile-fork.ts`, their tests.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
