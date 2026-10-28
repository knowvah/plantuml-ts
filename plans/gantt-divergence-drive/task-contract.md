# Task contract (every gdd task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. Gantt lives at
`net/sourceforge/plantuml/gantt/`, ported file-for-file to
`src/diagrams/gantt/`; the SVG drivers at `klimt/drawing/svg/` →
`src/core/klimt/drawing/svg/`; the chrome at `core/DiagramChromeFactory.java`
+ `core/TextBlockExporter.java` → `src/core/annotations/` +
`src/core/TextBlockExporter.ts`. Read each method body you touch and the
constructor that built its inputs; quote `file:line` for every constant and
every behavioural branch. Never fit a number. The jar's bytes are the target:
an element the jar omits is our defect; never "improve" on the jar.

Oracles: `test-results/dot-cache/gantt/<slug>/in.svg` (corpus),
`tests/fixtures/gantt/<slug>.svg` (authored). Render ours through
`tests/oracle/svg-conformance/render-fixture-gantt.ts`
(`renderFixtureGantt(markup, new DeterministicMeasurer(), ganttRenderOptions(slug))`)
or `npx tsx plans/gantt-divergence-drive/tools/diff-one.mts <slug>`. Compare
with `compareSvg` (`tests/oracle/svg-conformance/compare.ts`); the normalizer
strips `data-*` attributes (D9) — do not chase them.

## Rules
- Mirror upstream structure; a structural divergence is the bug. No
  gantt-only branch in a core file (D2). Do not refactor while fixing.
- Preserve upstream names; each touched exported symbol keeps or gains a
  JSDoc `@see` to its Java origin.
- Check `docs/catalog.md` before writing a helper.
- Tests first (TDD): expected values cite the Java (`file:line`) or a jar
  oracle; assert specific values, never truthiness. Coverage 90/90/90 on what
  you add.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1 (exception:
  a 500-line split of a file in your write-set — journal it in the hand-back).
- Never dot-engine, the plantuml fork, the oracle jar, cached oracle bytes,
  `oracle/accepted-divergences.json`, or any pin/baseline/parity/golden file
  (the orchestrator owns those). Never a hand-typed `java -jar`.
- No Serena edit tools (they write the MAIN checkout); no `git stash`; never
  push; never leave a background process running when you finish.
- No new runtime dependency; `src/` never imports a Node built-in,
  `process.env`, DOM, network, `Date`, `Math.random()`.
- Load is often high: run vitest with `--maxWorkers=2`; "Test timed out" with
  no diff is load — rerun.
- Quality bar: your tests green, `npm run typecheck`, eslint +
  `npx prettier --write <your files>` (explicit file list; worktrees skip git
  hooks).
- Observability: N/A — no new observable operations. Rollback: Reversible
  (revert the task commit).

## Commit
One commit, Conventional Commits (`fix(gantt): …`, `fix(core): …`,
`test(gantt): …`), ≤72-char subject, body says the mechanism and lists the
Java files read; no attribution lines. Unsigned, in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (line counts) · Java read (file:line) · tests
(count, all green?) · typecheck/lint result · before/after `compareSvg` diff
counts for every row the spec names · anything stubbed, skipped or moved
(must be none without a stop) · open questions. Return only the structured
result — no preamble, no trailing summary.
