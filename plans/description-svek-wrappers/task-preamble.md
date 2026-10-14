# Shared preamble (prepend to every agent prompt, after the worktree header)

Return only the structured report:
- commit sha(s) and files changed
- layoutParity `equal`/`firstDiff` before → after for every named fixture the task touches
- render-diff structural/numeric before → after where rows can move
  (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`)
- residuals with mechanisms (Java + port `file:line`)
- write-set extensions
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml` is the
specification. Read `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value", "Do not
refactor while porting", "Preserve upstream names", "One layout engine").

- Brief: `plans/description-svek-wrappers/` (README, decisions.md D1–D8, fixtures.md).
- Background: `.agent-notes/dot-engine-2.4.0-bump.md`.
- Jar DOT for every fixture: `test-results/dot-cache/<tree>/<slug>/svek-1.dot`; jar SVG `in.svg`.
- Render a new oracle only with `scripts/oracle-render.sh <out-dir> <puml>`.
- Grep `src/main/java/net/`, never only `net/sourceforge/plantuml/`.
- Key Java:
  - `svek/ClusterDotString.java:85-204,245-252,299-314`
  - `svek/ClusterDotStringKermor.java`
  - `svek/ClusterHeader.java:60-120`
  - `svek/Cluster.java:261-268,671-673`

Wrapper nesting already exists for class and state. Read `src/core/svek-dot-wrappers.ts` (whole file,
104 lines) and `src/core/graph-layout-cluster.types.ts:60-170` (field contracts) before touching
description. **Do not edit those core files** (stop 7).

## Quality bar
- **TDD:** failing test first, with values from the jar DOT/SVG or a jar probe, never guesses.
- Tests mirror the source path under `tests/unit/`.
- Targeted run: `npx vitest run --maxWorkers=4 <your test files> tests/architecture`. Report the
  collected file count (a filter can collect zero).
- Before `git commit`:
  - `npm run typecheck` must pass.
  - `npx eslint <changed files>`.
  - `npx prettier --write <changed files>`.
  - A new src module ⇒ `npm run catalog`, and commit `docs/catalog.md`.
- Coverage of new files ≥ 90% lines/branches/functions.
- Complexity hook: ≤30 NLOC per function, CCN ≤10, ≤5 params, ≤500-line files.
- **Determinism:** no `Math.random`/`Date.now` in rendering paths.
- **Worktree rules:**
  - Work only in your worktree, with absolute paths.
  - **No Serena edit tools** (they write the MAIN checkout).
  - No `git stash`; never `cd` below the repo root; never `npm install`.
  - The 4 npm-pack packaging tests fail in worktrees; ignore them.

## Boundaries
- **Always:** quote the Java (`file:line`) before claiming parity; every constant carries its citation.
- **Stop and report (do not edit):**
  - a needed file outside the write-set
  - a core builder change (stop 7)
  - Java that contradicts a D-decision
- **Never:**
  - fit a value
  - touch the oracle, dot-engine or the fork
  - push
  - sign an acceptance
  - edit `oracle/goldens/**`, `*.ratchet.test.ts`, routing/refusal baselines or `docs/parity-report.md`,
    unless the task file names them

## Commit
`feat(description): …` / `test(oracle): …` / `fix(description): …` (lowercase, ≤72 chars). The body
names the Java ported and what the tests pin. No attribution lines.

**Observability:** N/A for code tasks (no runtime operations); measurement is the close's job.
**Rollback:** Reversible (revert).
