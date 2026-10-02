# T2d — tile geometry

Agent: typescript-pro, worktree `add1-T2d`. Commit: `fix(activity): <mechanism>`.

## Context
Filed tile-sizing mechanisms the cohort may reach: `activity-gtile-break-size`
(`GtileBreak` 20×20; jar `FtileBreak` is `calculateDimensionEmpty().
withoutPointOut()` = 0×0, `FtileBreak.java:62-64`, `FtileEmpty.java:74-76` —
every welding starts 10 px off, `bareka`); `activity-repeat-break-welding`
(the jar welds breaks inside a repeat as inside a while, `FtileFactory
DelegatorRepeat.java:123`; ours welds only the while — `bizono`, `cixave`,
`dacuga`, `dixiku`, `doziki`); `activity-if-with-links-sizing-6px` (`gakelo`,
`vozane`: uniform +6 px x on 36/40 elements; candidate `getYdelta1b`'s
`hasTwoBranches ? 6 : 0`, `cond/FtileIfWithDiamonds.java:162-166`, on the
wrong axis/branch — diagnose with `--dump` first).

## Task
For each assigned row: dump, locate the tile whose size/offset differs,
quote the Java `calculateDimension`, port, pin in `tests/diagrams/activity/
tiles/`. The if +6 is a diagnosis task first (journal the ruled-out list
before editing).

## Write-set
`src/diagrams/activity/tiles/gtile-*.ts` (only the files the assigned rows
name), `src/diagrams/activity/layout/{walk-while-branch,walk-if-with-links}
.ts`, `tests/diagrams/activity/tiles/**`.

## Read-set
`decisions.md#D6`; assigned rows; `.agent-notes/altp-T4-gtile-break-dimension
.md`; `planning/next-missions.md` entries named above; the named `gtile-*.ts`;
Java `ftile/FtileBreak.java:55-70`, `ftile/FtileEmpty.java:70-80` (in `ftile/`, not `ftile/vertical/`), `FtileFactoryDelegator
Repeat.java:110-130`, `FtileFactoryDelegatorWhile.java:95-116`,
`cond/FtileIfWithDiamonds.java:150-175`.

## Acceptance
- Given each assigned row, then its named family diff is 0 with the Java
  quote, or its residual is mechanised and re-slotted; 0 unexplained rises.

Quality bar: targeted vitest + typecheck + eslint. Boundaries: `gtile-top-
down.ts` is T2b's; `tile-coordinates.ts`/`walk-repeat.ts` are T2a's; renderer
files are T2c's. Observability: N/A. Rollback: Reversible.


## Assigned at the b1b close (2026-10-01, journal row 21) — supersedes the write-set above

Rows by named next mechanism:
- **if-with-links geometry (-96 y / arrowhead line-vs-polygon)**: `gakelo-29-neno787`, `vozane-63-kepe177`, `fonabu-93-xama593`, `ziboco-73-kazu841`, `livigo-47-negi605`, `nusajo-97-bemo713`, `zukori-83-fiso705`, `nimusa-16-tiku252`
- **split tile geometry with long branch**: `fomapa-90-bore251`, `xenofo-81-rame803`, `zizaki-04-guvi945`
- **end inside an if branch (tile/out-point)**: `becaje-01-vaji284`, `jecoxu-17-zama003`, `bocaga-53-nale241`

Source write-set: `src/diagrams/activity/tiles/gtile-*.ts` except `gtile-{top-down,kill,note,partition}`, `src/diagrams/activity/layout/{walk-if-with-links,walk-while-branch,walk-fork-branches}.ts`, `src/diagrams/activity/{activity-layout-constants,if-dispatch,parallel-dispatch}.ts`, plus the tests exercising those files and new tests. Rules: see `overview.md` (no Serena edits, no baseline writes, risers shown from the diff).
