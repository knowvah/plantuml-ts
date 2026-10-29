# T4a — residuals after batch 3

Agent: `typescript-pro` (sonnet, effort high), worktree `jse-T4a`. Commit:
`fix(json): <families closed> (T4a)`. Read [../task-contract.md](../task-contract.md)
and `fixtures.md`'s b3 residual list. Diagnosis mode per family
(`~/.claude/rules/diagnosis.md`): mechanism + `file:line` before the edit.

## Task
For every row the b3 close lists as not clean: `npx tsx $T/diff-one.mts <type> <slug> --structural`,
group by firstDiff family, trace to the Java (`TextBlockJson.java`,
`SmetanaForJson.java`, `JsonCurve.java`, `StyleExtractor.java`, `plantuml.skin`
json block, the theme file), fix at the origin. A family whose origin is
`src/core/` is stop 14 (report mechanism + origin, do not patch around it).

## Write-set
`src/diagrams/{json,yaml,hcl}/*`, `tests/unit/{json,yaml,hcl}/*`.

## Acceptance
- Given each listed row, then 0 structural diffs, or the hand-back names row, mechanism, origin and why it is out of scope.
- Given every pin, then byte-equal; manifest `clean` rows still clean; D6 check movers listed with mechanism.

Observability: N/A. Rollback: Reversible.
