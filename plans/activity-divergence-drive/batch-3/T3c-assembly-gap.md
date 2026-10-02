# T3c — assembly gap 35 then compression

Agent: typescript-pro, worktree `add1-T3c`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Journal row 29(c): `FtileFactoryDelegatorAssembly.java:58` `double height = 35;` (+ the in-link label height) for EVERY sequential assembly, yet the jar's top-level gap measures 20 and its branch-internal gap 35. `NODE_MARGIN_Y = 20` (`activity-layout-constants.ts:5`) has NO upstream citation — a fitted value. Candidate mechanism: `ActivityDiagram3.getTextBlock` (`:204-213`) wraps the swimlanes in `CompressionXorYBuilder` ON_X then ON_Y; ON_Y removes vertical slack unless a parallel branch constrains it. Our `layout/compress/` is a port of that (missions activity-klimt-compress). DIAGNOSE FIRST: prove which of (35-then-compress) explains BOTH the 20 and the 35 on the four rows plus a top-level 3-action fixture, quoting the compression code, before editing. Never 'branch gap = 35' as a special case (stop 13). This changes geometry corpus-wide: measure every risen/fallen row and every pinned golden.

## Rows (b2)
- **assembly gap 35 (FtileFactoryDelegatorAssembly.java:58) then ON_Y compression; NODE_MARGIN_Y=20 is unsourced**: `fomapa-90-bore251`, `nimusa-16-tiku252`, `xenofo-81-rame803`, `zizaki-04-guvi945`

## Write-set
`src/diagrams/activity/layout/tile-layout.ts`, `src/diagrams/activity/tiles/gtile-top-down.ts`, `src/diagrams/activity/activity-layout-constants.ts`, `src/diagrams/activity/layout/compress/**`, `src/diagrams/activity/layout/assign-coordinates-full.ts`, the tests exercising them, new tests (names unique to T3c).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
