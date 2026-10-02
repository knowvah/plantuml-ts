# T1p-d — repeat break welding + cross-swimlane repeat out

Agent: typescript-pro, worktree `add2-T1p-d`. Rules: [common.md](common.md).

## Task
Port `FtileFactoryDelegatorRepeat.java` break welding (the two anonymous
`Connection`s, ~140-151: first weld asToRight, subsequent asToLeft) — mirror
how the while side already does it (`pushWhileWeldings`, find it) — and
`FtileRepeat.java:308-329` `ConnectionOut` cross-swimlane `drawTranslate`
("snake"/"small") path. Find corpus fixtures with `break` inside `repeat`
and repeat loops crossing swimlanes (grep `test-results/dot-cache/activity/*/in.puml`
and `~/git/pdiff`); author fixtures where none exist.

## Write-set
`src/diagrams/activity/layout/{walk-repeat,walk-repeat-backward,swimlane-loop-translate-repeat}.ts`,
`src/diagrams/activity/tiles/{gtile-repeat,gtile-break}.ts`, new files (note
`walk-repeat.ts` is at 499 lines — split into a new file first), their tests,
`tests/fixtures/activity/T1p-d/**`.

## Acceptance
- Break-in-repeat and cross-lane repeat fixtures: connector geometry matches
  the jar's; affected corpus rows' ws falls or the residual is named.
