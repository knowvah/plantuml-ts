# Task contract (every jff task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. The json family is
`net/sourceforge/plantuml/jsondiagram/` (`JsonDiagram`, `SmetanaForJson`,
`StyleExtractor`), ported to `src/diagrams/json/` (yaml/hcl parse in
`src/diagrams/{yaml,hcl}/`, then share json's `layoutJson`/`renderJson`).
Chrome (title, caption, header, footer, legend) is composed outside the
renderer by `applyExportedChrome` (`src/core/annotations/chrome-export.ts`,
called from `src/index.ts:193`); the document is finalized in
`src/core/assemble-svg.ts#assembleSvg`. Layout is `@knowvah/dot-engine` where
upstream uses Smetana (CLAUDE.md "One layout engine") — a Smetana number is
never a target. The mission frame: [decisions.md](decisions.md), D1–D6.

Read each method body you touch and the constructor that built its inputs;
quote `file:line` for every constant and branch. Never fit a number — keeping
whatever shrank the error is forbidden, especially when it shrinks.

Oracles: corpus rows at `test-results/dot-cache/<type>/<slug>/in.{puml,svg}`;
authored rows at `tests/fixtures/<type>/<slug>.{puml,svg}`. Render ours with
`renderFixtureJson` (`tests/oracle/svg-conformance/render-fixture-json.ts`) and
`DeterministicMeasurer` (`src/core/measurer-deterministic.ts`), or
`npx tsx plans/json-family-followons/tools/diff-one.mts <type> <slug> [--structural|--survey]`;
positional magnitude with `npx tsx plans/json-family-followons/tools/residue.mts <type> <slug>`.
A new oracle only via `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>`.

## Rules
- Mirror upstream structure; reuse the TitledDiagram seam (`exportMargin`, `scaleSpec`, `exportTo`) rather than a json-only path. Do not refactor while fixing.
- Preserve upstream names; each touched exported symbol keeps or gains a JSDoc `@see` to its Java origin.
- Check `docs/catalog.md` before writing a helper.
- Tests first (TDD): expected values cite the Java (`file:line`) or a jar oracle; assert specific values. Coverage 90/90/90 on what you add.
- Diagnosis mode on every discrepancy (`~/.claude/rules/diagnosis.md`): mechanism, origin `file:line`, causal chain, ruled out — before any edit.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1 (exception: a 500-line split inside your own directory — journal it in the hand-back).
- Never dot-engine (`node_modules/@knowvah/dot-engine`), the plantuml fork, the oracle jar, cached oracle bytes, `oracle/accepted-divergences.json`, or any pin/baseline/parity/golden/manifest/positional-ceiling file unless your write-set names it. Never a hand-typed `java -jar`; never hand-edit a fixture `.svg`.
- No Serena edit tools (they write the MAIN checkout); no `git stash`; never push; no background process left running; never `cd` above or outside your worktree.
- No new runtime dependency; `src/` never imports a Node built-in, `process.env`, DOM, network, `Date`, `Math.random()`.
- Load is often high: vitest with `--maxWorkers=2`; "Test timed out" with no diff is load — rerun.
- Quality bar: your tests green, `npm run typecheck`, eslint + `npx prettier --write <your files>` (worktrees may skip git hooks).
- Observability: N/A — no new observable operations. Rollback: Reversible (revert the task commit).

## Commit
One commit, Conventional Commits (`fix(json): …`, `refactor(json): …`,
`feat(core): …`, `test(oracle): …`, `docs(jff): …`), ≤72-char subject, body =
mechanism + Java files read; no attribution lines. Unsigned, in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (line counts) · Java read (file:line) · tests
(count, all green?) · typecheck/lint · before/after residue (`residue.mts`) for
every row the spec names · jar-compatible goldens byte-equal? · anything
stubbed, skipped or moved · open questions. Return only the structured result —
no preamble, no trailing summary.
