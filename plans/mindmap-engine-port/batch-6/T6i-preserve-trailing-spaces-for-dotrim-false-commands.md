# T6i: preserve trailing spaces for doTrim false commands

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

## Rows
`kijaru-67-buco967` (ws 44): the jar draws bold `1` PLUS a separate `<text> </text>` because `CommandMindMapOrgmode.java:55` is `super(false, …)` (`doTrim=false`, SingleLineCommand2.java:60-78) and the label keeps its trailing space (`  ** **$index** `); the port's `src/core/preprocessor.ts:166` `trimEnd()`s every line for every engine before any command runs (journal row 34).

## Task (TDD)
1. Read `SingleLineCommand2.java:55-80` (`doTrim`) and `BlocLines`/`StringUtils.trin` to
   establish exactly what upstream trims and where (the preprocessor keeps trailing
   whitespace; each command decides). Grep every `super(false` / `super(true` under
   `src/main/java/net/` to list the doTrim=false commands the port has ported.
2. Fix at the origin: stop the global `trimEnd()` in `preprocessor.ts:166` (or move the trim
   to where upstream trims) so a doTrim=false command sees the trailing space. This is a
   GLOBAL change: run the all-engine survey (`plans/mindmap-engine-port/measurements/chain.sh
   T6i-eng` after `uptime` load < 8, then `python3 measurements/T6i-eng/engdiff.py b5-eng`
   with `engdiff.py` copied in) and every golden/diff ratchet; every non-mindmap mover needs a
   mechanism in the report (D11) — a loss is a stop.
3. kijaru render-diff 11/4 → 0/0 with a test pinned on the authored oracle T6e made
   (`* **1** ` → bold `1` + `<text> </text>` of width 0).

## Write-set
`src/core/preprocessor.ts` (and the exact trim site the Java names, if different), tests `tests/unit/preprocessor.test.ts` additions + `tests/unit/mindmap/`.

## Read-set
`SingleLineCommand2.java:55-80`, `CommandMindMapOrgmode.java:55`, `BlocLines.java`, `StringUtils.java:500-520`; `src/core/preprocessor.ts:150-175`, `src/core/BlockUmlBuilder.ts`.

## Acceptance
- Given kijaru, then render-diff is 0/0.
- Given the all-engine survey vs b5-eng, then every mover has a mechanism and none is a loss.

## Architecture decisions (locked)
D6, D8, D11.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/preprocessor.test.ts`, `tests/unit/mindmap/`, `tests/unit/class/`, `tests/unit/sequence/`, `tests/unit/activity/`, `tests/unit/description/`, all golden + diff ratchets
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names. Measure with
  `npx jiti plans/class-divergence-drive/tools/render-diff.mts mindmap/<slug>` before and
  after; run `mindmap.golden.ratchet` + `mindmap.diff-baseline.ratchet` (never edit either
  manifest — pins are orchestrator-only at the close; report the fall).
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`fix(preprocessor): keep trailing spaces for doTrim=false commands`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
