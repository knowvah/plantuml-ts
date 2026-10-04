# T2d — the two klimt fixes (D8)

Agent: typescript-pro, worktree `add2-T2d`. Depends on T1b (b1 close).

## Context
`decisions.md#D8`. setecu-78-cuko533: `preserveAspectRatio` is hardcoded
`none` in `src/core/klimt/document-shell.ts:197`; find where the Java reads it
(pragma/skinparam → `SvgOption`/`SvgGraphics`) and thread it through. laxibe-66-
teme800: `CommandCreoleUrl`'s `{tooltip}` has no whitespace boundary, so a glued
`{dd}sss` parses as a tooltip; the Java keeps it literal — quote the Java regex.
All-engine survey before and after EACH edit; any non-activity conformant loss =
stop 4. No other klimt line changes (stop 8).

## Task
For each row: `--dump`/`--align`, read the Java (quote file:line), port at the origin, apply to every fixture the mechanism governs, pin with a test. Measure the full corpus before/after (probe + elements).

## Write-set
`src/core/klimt/document-shell.ts`, `src/core/klimt/creole/command/CommandCreoleUrl.ts`, the non-theme option plumbing between them (name files in the report), their tests. `src/core/theme*.ts` and skinparam handlers are T2c's — if the value must ride a theme field, re-slot that half.

## Acceptance
- Given each named row, then the diffs from this mechanism go to 0 (or the row is re-slotted with mechanism + owning file).
- Given the full corpus, then 0 unexplained risers.
- Given the pinned goldens and harness-parity test, then green.

## Rules
Worktree only (`measurements/mkwt.sh T2d`); NO Serena MCP tools, no `git stash`,
scratch files named with `T2d`; never write `oracle/**` JSON (repin dry-run only);
67+ pinned goldens byte-equal (stop and report otherwise); every riser shown from
the diff; every number carries an upstream `file:line`; anything outside the
write-set is re-slotted, never forced. Quality bar: targeted vitest + the
activity golden/diff-baseline/harness-parity tests + typecheck + eslint; files
≤ 500 lines, functions ≤ 30 NLOC / CCN ≤ 10. One commit per mechanism.
Observability: N/A (gated measurements only). Rollback: Reversible.
