# Task contract (every jse task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. The json family is
`net/sourceforge/plantuml/jsondiagram/` (+ `json/`, `yaml/`, `hcl/`), ported to
`src/diagrams/{json,yaml,hcl}/` (yaml/hcl parse, then share json's
`layoutJson`/`renderJson`). The style engine is `src/core/style/` (`StyleBuilder`,
`StyleSignatureBasic`, `Style`, `FromSkinparamToStyle`, the embedded
`plantuml.skin`), built per diagram by `createMindmapSkinParam` +
`executeDeclaration` (`src/core/style/mindmap-style-builder.ts`). The live
pattern for a data-diagram engine on it is files
(`src/diagrams/files/{parser,files-skin-param,files-style-input,files-extensions,layout,index}.ts`).
Read each method body you touch and the constructor that built its inputs;
quote `file:line` for every constant and branch. Never fit a number.

Two modes: conformance renders in jar-compatible mode
(`withJarCompatibleStyleInput`, `src/core/internal-render-options.ts`) and must
stay byte-identical to the jar where it already is; extended mode (the library
default) honours styling the jar's `StyleExtractor` drops, through
`FromSkinparamToStyle` (decisions D4; DIVERGENCES "Extensions").

Oracles: `test-results/dot-cache/<type>/<slug>/in.svg` (corpus),
`tests/fixtures/<type>/<slug>.svg` (authored). Render ours with
`renderFixtureJson` (`tests/oracle/svg-conformance/render-fixture-json.ts`) or
`npx tsx plans/json-style-engine/tools/diff-one.mts <type> <slug> [--structural|--survey]`.
`--structural` mirrors the gate (`isPositionalDiff` drops x/y/d/points/root dims).

## Rules
- Mirror upstream structure; no engine-only branch in a core file. Do not refactor while fixing.
- Preserve upstream names; each touched exported symbol keeps or gains a JSDoc `@see` to its Java origin.
- Check `docs/catalog.md` before writing a helper.
- Tests first (TDD): expected values cite the Java (`file:line`) or a jar oracle; assert specific values. Coverage 90/90/90 on what you add.
- Never widen the jar-compatible cut.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1 (exception: a 500-line split inside your own directory — journal it in the hand-back).
- Never dot-engine, the plantuml fork, the oracle jar, cached oracle bytes, `oracle/accepted-divergences.json`, or any pin/baseline/parity/golden/manifest file (orchestrator-owned). Never a hand-typed `java -jar`.
- No Serena edit tools (they write the MAIN checkout); no `git stash`; never push; no background process left running.
- No new runtime dependency; `src/` never imports a Node built-in, `process.env`, DOM, network, `Date`, `Math.random()`.
- Load is often high: vitest with `--maxWorkers=2`; "Test timed out" with no diff is load — rerun.
- Quality bar: your tests green, `npm run typecheck`, eslint + `npx prettier --write <your files>` (worktrees may skip git hooks).
- Observability: N/A — no new observable operations. Rollback: Reversible (revert the task commit).

## Commit
One commit, Conventional Commits (`feat(json): …`, `fix(json): …`, `refactor(core): …`,
`test(json): …`), ≤72-char subject, body = mechanism + Java files read; no
attribution lines. Unsigned, in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (line counts) · Java read (file:line) · tests
(count, all green?) · typecheck/lint · before/after structural diff counts for
every row the spec names · jar-compatible goldens byte-equal? · extended-mode
movers (`extended-baseline.mts --check`) with mechanism · anything stubbed,
skipped or moved · open questions. Return only the structured result — no
preamble, no trailing summary.
