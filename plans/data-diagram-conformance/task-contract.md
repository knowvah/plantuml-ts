# Task contract (every ddc task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. The json family lives at
`net/sourceforge/plantuml/jsondiagram/` (+ `json/`, `yaml/`, `hcl/`), ported
to `src/diagrams/{json,yaml,hcl}/` (yaml/hcl parse, then share json's
`layoutJson`/`renderJson`); files at `net/sourceforge/plantuml/filesdiagram/`
→ `src/diagrams/files/`; creole/klimt at `src/core/klimt/`; chrome at
`src/core/annotations/` + `src/core/TextBlockExporter.ts`. Read each method
body you touch and the constructor that built its inputs; quote `file:line`
for every constant and every behavioural branch. Never fit a number.

Two bars (D1): json/yaml/hcl are Smetana paths — geometry (positional
attributes, root width/height/viewBox) is accepted residue, EVERYTHING else
must match; files has no layout engine — the jar's bytes are the target. An
element the jar omits is our defect; never "improve" on the jar.

Oracles: `test-results/dot-cache/<type>/<slug>/in.svg` (corpus),
`tests/fixtures/<type>/<slug>.svg` (authored). Render ours through
`renderFixtureJson` (`tests/oracle/svg-conformance/render-fixture-json.ts`) or
`renderFixtureFiles` (`render-fixture-files.ts`, from T0b), both with
`new DeterministicMeasurer()`, or `npx tsx plans/data-diagram-conformance/tools/diff-one.mts <type> <slug> [--structural]`.
Compare with `compareSvg` (`tests/oracle/svg-conformance/compare.ts`); the
normalizer strips `data-*` attributes — do not chase them.

## Rules
- Mirror upstream structure; a structural divergence is the bug. No
  engine-only branch in a core file. Do not refactor while fixing.
- Preserve upstream names; each touched exported symbol keeps or gains a
  JSDoc `@see` to its Java origin.
- Check `docs/catalog.md` before writing a helper (creole `Display`,
  `SheetBlock1`, `Opale`, `AtomEmoji`, the emoji store all exist).
- Tests first (TDD): expected values cite the Java (`file:line`) or a jar
  oracle; assert specific values, never truthiness. Coverage 90/90/90 on what
  you add.
- Styling the jar discards (json/yaml/hcl/files `StyleExtractor`) is an
  honoured extension measured only in extended mode; conformance renders in
  jar-compatible mode (`withJarCompatibleStyleInput`). Never widen the cut.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1 (exception:
  a 500-line split of a file in your write-set — journal it in the hand-back).
- Never dot-engine, the plantuml fork, the oracle jar, cached oracle bytes,
  `oracle/accepted-divergences.json`, or any pin/baseline/parity/golden/
  manifest file (the orchestrator owns those). Never a hand-typed `java -jar`.
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
One commit, Conventional Commits (`fix(json): …`, `feat(files): …`,
`test(files): …`, `chore(ddc-T0c): …`), ≤72-char subject, body says the
mechanism and lists the Java files read; no attribution lines. Unsigned, in
the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (line counts) · Java read (file:line) · tests
(count, all green?) · typecheck/lint result · before/after `compareSvg` diff
counts (structural for json/yaml/hcl, raw for files) for every row the spec
names · anything stubbed, skipped or moved (must be none without a stop) ·
open questions. Return only the structured result — no preamble, no trailing
summary.
