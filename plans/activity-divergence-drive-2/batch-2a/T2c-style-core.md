# T2c — style core fields

Agent: typescript-pro, worktree `add2-T2c`. Depends on T1b (b1 close).

## Context
add1 rows 26, 40, 41, 53: `skinparam ArrowHeadColor` → `PName.HeadColor`
(`FromSkinparamToStyle.java:153`, `Rainbow.java:84-95`, `Worm.java:146-154`) needs an
`acc.arrowHeadColor: Paint` (`skinparam-accumulator.ts`, `skinparam-theme-builder.ts`)
— farexi, zanudo, fofele, naroji; gradient activity background (`Paint`, not
`string`) — dakesa; `defaultTextAlignment` for action text
(`activity-text-style.ts#activityHorizontalAlignment`, `FtileBox.java:86,89`) —
molexa; `ArrowFontSize` inside `skinparam activity {}` — kafevi;
`hyperlinkUnderline`/`svgLinkTarget` theme fields; the url tooltip field in
`creole-text-lines.ts` — gaxezi, nisexe, pekuxe, zamagu. Shared core: survey
class, state, sequence, component, usecase, mindmap, object before/after; a
conformant loss = stop 4.

## Task
For each row: `--dump`/`--align`, read the Java (quote file:line), port at the origin, apply to every fixture the mechanism governs, pin with a test. Measure the full corpus before/after (probe + elements).

## Write-set
`src/core/skinparam-*.ts`, `src/core/theme*.ts`, `src/core/svek/image/creole-text-lines.ts`, `src/diagrams/activity/{activity-style-defaults,activity-style-defaults-swimlane,activity-text-style,activity-renderer-text}.ts`.

## Acceptance
- Given each named row, then the diffs from this mechanism go to 0 (or the row is re-slotted with mechanism + owning file).
- Given the full corpus, then 0 unexplained risers.
- Given the pinned goldens and harness-parity test, then green.

## Rules
Worktree only (`measurements/mkwt.sh T2c`); NO Serena MCP tools, no `git stash`,
scratch files named with `T2c`; never write `oracle/**` JSON (repin dry-run only);
67+ pinned goldens byte-equal (stop and report otherwise); every riser shown from
the diff; every number carries an upstream `file:line`; anything outside the
write-set is re-slotted, never forced. Quality bar: targeted vitest + the
activity golden/diff-baseline/harness-parity tests + typecheck + eslint; files
≤ 500 lines, functions ≤ 30 NLOC / CCN ≤ 10. One commit per mechanism.
Observability: N/A (gated measurements only). Rollback: Reversible.
