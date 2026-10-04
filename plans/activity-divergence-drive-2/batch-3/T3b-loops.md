# T3b — loop families

Agent: typescript-pro, worktree `add2-T3b`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: WORD (while body drawn after diamond1, `FtileWhile.java:553-556`), EMPHB (no emphasize on ConnectionBackBackward1, `FtileRepeat.java:451-452`, `FtileWhile.java:354`), WSPEC (stop/end after endwhile becomes specialOut, `ActivityDiagram3.java:177-192`, `FtileWhile.java:142,165-168`), RNOOUT (`FtileRepeat.java:136-137`), BACKLBL (`CommandBackward3.java:71-72,143-146`).

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`layout/{walk-while-branch,walk-while-backward,walk-repeat,walk-repeat-backward,walk-repeat-weldings,walk-repeat-back-shapes,tile-layout,tile-layout-backward,tile-layout-structural}.ts`, `tiles/{gtile-while,gtile-repeat}.ts`, `{node-dispatch,list-backward-dispatch,ast}.ts` (ast: new fields only), their tests.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
