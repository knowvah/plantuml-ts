# T3b: FromSkinparamToStyle (mindmap subset)

Return only the structured report: commit sha(s), files changed, per-check or per-fixture
before → after, residuals with mechanisms (Java + port `file:line`), write-set extensions,
test counts (collected files). No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(`src/main/java/net/sourceforge/plantuml/`) is the specification. Read `CLAUDE.md` first
("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting", "Preserve
upstream names"). The oracle is the 1.2026.8beta1 jar (`oracle/dist/plantuml-oracle.jar`);
mindmap goldens are cached at `test-results/dot-cache/mindmap/<slug>/in.svg`. Render new
oracles only via `scripts/oracle-render.sh <out-dir> <puml>`. Jar values for tests come
from the T0c probes (`plans/mindmap-engine-port/tools/probe/`), never from guesses.
Brief: `plans/mindmap-engine-port/` (README, decisions.md D1–D12).

## Task (TDD)
1. List the skinparam keys in the 7 skinparam fixtures (`grep -h skinparam
   test-results/dot-cache/mindmap/*/in.puml`) plus the `!theme` fixture's expanded
   skinparams (theme `aws-orange`, preprocessed through the port).
2. Port `style/FromSkinparamToStyle.java` (431): the constructor's key table and
   `convertNow`, for every key in that list, with the table rows copied verbatim. Rows
   outside the list stay unported and are named in a comment; do not invent any.
3. Test each listed key's converted style values against `StyleProbe`.

## Write-set
`src/core/style/FromSkinparamToStyle.ts` + `tests/unit/core/style/from-skinparam-to-style.test.ts`.

## Read-set
`~/git/plantuml/.../style/FromSkinparamToStyle.java`; `SkinParam.java:228-260`.

## Interface contracts
```ts
export function convertSkinparam(key: string, value: string, builder: StyleBuilder): Style[]; // FromSkinparamToStyle(key).convertNow(value) + getStyles()
```
Consumed by T3a.

## Acceptance
- Given each listed skinparam, then the converted style values match the probe.
- Given an unlisted key, then no styles are produced (and the gap is named in the comment).

## Architecture decisions (locked)
D2, D8.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/core/style/`
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`feat(style): port the skinparam-to-style subset mindmap uses`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
