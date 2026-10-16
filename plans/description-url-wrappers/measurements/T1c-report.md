# T1c report
Commit 384d0b9f0 (dur/T1c). Files: src/diagrams/description/command-table-directives.ts, tests/unit/description/dur-t1c-url-statement.test.ts (new, 8 tests).

## Render-diff (after; parser-only change, no layout/render consumer yet -> unchanged vs base by survey)
- component/givape-84-xano421: structural=1 numeric=0 (S svg/g[1]/g[2][childCount] exp=1 act=5) -- the missing <a> wrapper, owned by T4/T5.
- component/tukipe-82-ziva562: structural=1 numeric=0 (S svg/g[1]/g[1][childCount] exp=1 act=5) -- same.

## Diagnosis
- Mechanism: the `url of|for X` handler resolved the name via nodesById but never stored the token (and its comment wrongly called addUrl a no-op); jar's addUrl (CommandUrl.java:100) stores on the entity, replacing, and the jar draws <a> for leaf and group (both fixtures' in.svg contain <a>).
- Origin: port command-table-directives.ts (handler, ~:300-312); Java CommandUrl.java:86-102, CucaDiagram.java:246-275.
- Chain: no node.url -> T4's layout seam has nothing to wrap -> no anchor.
- Fix: node.url = match[2] (raw token, D4). New resolveUrlTarget mirrors quarkInContext(true): no separator -> global name; dotted -> resolveQualifiedNode; undotted -> unique quark unless current group, else current-group child. Groups are reached (same node type).
- Error: jar probe (oracle-render) `url of Nope` -> "Nope does not exist"; `set separator .` + `url of p.Nope` -> "Nope does not exist" (quark.getName() = last segment). Port now uses leafDisplayName; refusal kind 'execution' unchanged.
- Ruled out: separate group/leaf handling (jar uses one Entity); existing error path already matched for the no-separator case.

## Surveys (before -> after, identical)
- component: conformant 184 / structural-match 13 / diverged 69 / errored 0 / timeout 0 / oracle-error 0
- usecase: 59 / 4 / 30 / 0 / 0 / oracle-error 1
- No verdict movers, no losses (expected: rendering of node.url is T4/T5).

## Tests
tests/unit/description + tests/architecture + tests/oracle/svg-conformance/description.*.test.ts: 83 files collected, 1532 tests passed. typecheck, eslint, prettier clean. Catalog not run (no exports changed).

## Residuals / extensions
- Anchor rendering depends on T4/T5.
- Write-set extension: none (imports countQuarksByName/leafDisplayName/resolveQualifiedNode from namespace-groups.ts, ParseState type, read-only).
- Not covered by a jar probe: `url` inside a group with a separator when name count is 1 and equals current group (follows CucaDiagram.java:271-274 by reading, not probed).
