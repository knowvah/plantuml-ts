# T0d: jar skin extraction

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
1. Read `style/StyleLoader.java:60-187` and `skin/SkinParam.java:155-265`: which skin
   files can `loadSkin` reach (`plantuml.skin` default, `skin <name>`), and
   `skinparam style strictuml` muting with `strictuml.skin`. Decide which skins to
   extract (at least `plantuml.skin`, `strictuml.skin`; others only if reachable from the
   mindmap corpus or `skin <name>`); journal the decision with the Java quote.
2. `scripts/extract-jar-skin.ts`: read `skin/*.skin` from `oracle/dist/plantuml-oracle.jar`
   (zip read in a script; no Node built-ins in `src/`), write
   `src/core/style/skins/plantuml-skin.ts` exporting the verbatim text as string
   constants with a generated-file header (jar version, sha256 of each entry).
3. Drift test `tests/unit/core/style/plantuml-skin-drift.test.ts`: re-reads the jar and
   compares byte for byte (skip with a clear message only if the jar is absent).
4. `package.json` script `skin:extract`.

## Write-set
`scripts/extract-jar-skin.ts`, `src/core/style/skins/plantuml-skin.ts`,
`tests/unit/core/style/plantuml-skin-drift.test.ts`, `package.json` (script line only).

## Read-set
`StyleLoader.java:60-187`, `SkinParam.java:155-265`; `src/core/skins-builtin.ts:28-40`
(existing embedding style — do not modify it).

## Interface contracts
`export const PLANTUML_SKIN: string; export const STRICTUML_SKIN: string;` (+ any others
extracted), consumed by T3a's `StyleLoader`.

## Acceptance
- Given the oracle jar, then the generated string equals `skin/plantuml.skin` byte for byte.
- Given a changed jar, then the drift test fails.

## Architecture decisions (locked)
D2, stop 13.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the drift test
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
`chore(style): embed the oracle jar skins verbatim`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
