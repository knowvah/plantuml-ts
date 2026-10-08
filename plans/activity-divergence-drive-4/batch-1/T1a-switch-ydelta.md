# T1a — switch case-row +11 px (D3)

Agent: typescript-pro, worktree `add4-T1a`. Rules: [../common-rules.md](../common-rules.md).
Read `.agent-notes/add3-T3b.md`, `add3-T3b-2.md` first.

## Task
Every switch row draws the case row 11 px high: literal `FtileSwitchWithManyLinks#getYdelta1a`
(`:412-423`) gives `max(10,11)+10 = 21` in SMALL_DIAMOND, the jar needs 32; single-line case
labels cannot tell candidate formulas apart. Author fixtures in
`tests/fixtures/activity/add4-T1a/<case>/` (1-, 2- and 3-line case labels; mixed heights;
BIG and SMALL diamond modes; a single-case `FtileSwitchWithOneLink`), render each with
`scripts/oracle-render.sh`, then read `FtileSwitchWithDiamonds.java` (Ydelta1a/1b,
translate formulas) and `FtileSwitchWithManyLinks` until one Java formula reproduces every
fixture. Port it; test per fixture.
Rows: sojono-24-tufe806, rujixe-89-sumo552, demibe-40-moda439, pateca-54-lija084,
ruzazu-94-meso880, rekuxa-78-lidi292, mojezi-43-gamu360 (+ any new switch rows in the census).

## Write-set
`tiles/gtile-switch*.ts`, `layout/walk-switch.ts`, `layout/switch-connection-points.ts`,
their tests, `tests/fixtures/activity/add4-T1a/**`.

## Acceptance
- Given each authored fixture, when rendered, then the case-row y and canvas height = jar.
- Given the switch rows, then the +11 px is gone or a residual is named with its Java site.
- 0 risers; element counts never decrease; pins byte-equal.
Observability: N/A. Rollback: Reversible.
