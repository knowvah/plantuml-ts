# T5a / T5b — optional ride-alongs (D9; run only if T0 journaled "T5 confirmed")

**Agent:** typescript-pro · **Depends on:** T4 · One commit each; both
single-file (plus test). Any second file is stop 15.

## T5a — repeat `break` welding

`FtileFactoryDelegatorRepeat.java:123` welds `repeat.getWeldingPoints()`
exactly as the while does (`FtileFactoryDelegatorWhile.java:95-116`, ported
in `walk-while-branch.ts#pushWhileWeldings` `:230-262`). Port the same into
`walk-repeat.ts` (shape `(break.x, break.y) -> (12, break.y)`, `asToLeft`;
read the delegator for the x it uses). Rows: `bizono`, `cixave`, `dacuga`,
`dixiku`, `doziki` (from `planning/next-missions.md`).
Write-set: `src/diagrams/activity/layout/walk-repeat.ts`, its test.

- Given a `break` inside a repeat body, when walked, then one weld edge per
  break, matching the while's shape, appended last (D7 of the prior mission)
- Given the five rows, when `--align` runs, then per-tag parity or a named residual

## T5b — `GtileBreak` is 0x0

`FtileBreak.java:62-64` returns `calculateDimensionEmpty().withoutPointOut()`;
`FtileEmpty.java:74-76` is 0x0. `tiles/gtile-break.ts` is 20x20, so every weld
starts 10 px left and 10 px low (`.agent-notes/altp-T4-gtile-break-dimension.md`).
Write-set: `src/diagrams/activity/tiles/gtile-break.ts`, its test.

- Given a `break` tile, when measured, then width 0, height 0, no point out
- Given the nine break rows, then each weld's origin moves by (-10, -10)
  toward the golden, or a named residual

## Observability / rollback

N/A — no new observable operations; the gates are the SLIs. Reversible
(revert the commit; no data, no migration).

## Quality bar

`npm test` (JSON-reporter collected count = on-disk count), `npm run
typecheck`, `npm run lint`, `npm run build` all green before the commit. One
commit, `<type>(allt-TN): …` per `~/.claude/rules/commits.md`, body says
why. `git diff --name-only HEAD~1` = this write-set only.

## Boundaries

Always: read the Java method body before stating why anything differs;
every constant carries its `file:line`. Ask first (halt + journal): any
stop condition in `../README.md`. Never: refactor while porting; fit a
value; delete an assertion; touch `layout.old.ts` or `compress-geometry.ts`.
