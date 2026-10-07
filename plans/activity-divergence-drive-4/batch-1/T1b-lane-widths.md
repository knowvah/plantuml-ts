# T1b — lane widths by oracle A/B (D3)

Agent: typescript-pro, worktree `add4-T1b`. Rules: [../common-rules.md](../common-rules.md).
Read `.agent-notes/add3-T3e.md`, `add3-T3h.md`, `add3-T3i.md`, `add3-T3c.md` (razuzu) first.

## Task
Establish lane geometry from the jar before porting. Author A/B fixtures in
`tests/fixtures/activity/add4-T1b/` and render with `scripts/oracle-render.sh`:
`skinparam swimlaneWidth` (absent / 100 / 400 / `same`) on 2-3 lanes with uneven content;
lane titles wider than content; an `if` with `ConditionEndStyle hline` across lanes
(`FtileIfLongHorizontal.java:438-520`); a note on a composite touching an extra lane
(razuzu shape, `FtileWithNoteOpale.java:86,92-99,217`); a partition spanning lanes with no
sibling edge (vodobe). Read `Swimlanes.java` (lane width + divider half-margins `:398-430`),
`SkinParam.java:1121-1130`, every reader of `swimlaneWidth`. Port what the renders show.
If `swimlaneWidth` needs a fork-side oracle change to observe, STOP 16.
Rows: cemipu-87-dinu624, nikinu-06-sace939, jucidi-98-zato093, pezubu-98-niba240,
razuzu-32-faje125, vodobe-33-kefa909, ruzica-16-deli877 (while back-edge `xx`,
`swimlane-loop-translate-while.ts:44`, `FtileWhile.java:277-310`), kavoro-11-jife299 lane width.

## Write-set
`layout/swimlane-*.ts`, `layout/swimlane-context.ts`, `layout/tile-coordinates-group.ts`,
`layout/walk-if-long-horizontal.ts`, `layout/walk-while-*.ts`, a core skinparam handler
only if the renders prove it (rule 11), tests, `tests/fixtures/activity/add4-T1b/**`.

## Acceptance
- Given each A/B fixture, then our divider x positions = jar.
- Given the rows, then diffs gone or residual named; single-lane output byte-identical.
- 0 risers; element counts never decrease; pins byte-equal; 0 conformant losses if core touched.
Observability: N/A. Rollback: Reversible.
