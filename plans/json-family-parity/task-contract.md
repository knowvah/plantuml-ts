# Task contract (every jfp task)

Every task spec includes this file by reference. Read it first.

## Context shared by every task
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml/src/main/java/net/` is the spec. The json family is
`net/sourceforge/plantuml/jsondiagram/` (`SmetanaForJson`, `JsonCurve`,
`Mirror`, `TextBlockJson`), ported to `src/diagrams/json/` (yaml/hcl parse in
`src/diagrams/{yaml,hcl}/`, then share json's `layoutJson`/`renderJson`).
Layout goes through core `layoutGraph` (`src/core/graph-layout.ts`) into
`@knowvah/dot-engine`, where upstream uses Smetana (CLAUDE.md "One layout
engine"). The mission's frame: [decisions.md](decisions.md) — read "The two
known structural divergences" and D1–D5 before anything else.

Read each method body you touch and the constructor that built its inputs;
quote `file:line` for every constant and branch. Never fit a number — keeping
whatever shrank the error is forbidden, especially when it shrinks. For a
graphviz mechanism read the C at `~/git/graphviz/lib/{dotgen,common}/`, not the
`gen/`/`smetana/` transpile.

Oracles: `test-results/dot-cache/<type>/<slug>/in.svg` (+ `in.puml`). Render
ours with `renderFixtureJson` (`tests/oracle/svg-conformance/render-fixture-json.ts`)
and `DeterministicMeasurer`, or `npx tsx plans/json-family-parity/tools/diff-one.mts
<type> <slug> [--structural|--survey]`; positional magnitude with
`npx tsx plans/json-family-parity/tools/residue.mts <type> <slug>` (after T0b).
A new oracle only via `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>`.

## Rules
- Mirror upstream structure; no json-only branch in a `src/core/` file (T2a's additive field is the one sanctioned core change, D1). Do not refactor while fixing.
- Preserve upstream names; each touched exported symbol keeps or gains a JSDoc `@see` to its Java origin.
- Check `docs/catalog.md` before writing a helper.
- Tests first (TDD): expected values cite the Java (`file:line`), a jar oracle, or real `dot -Tdot` output; assert specific values. Coverage 90/90/90 on what you add.
- Diagnosis mode on every discrepancy (`~/.claude/rules/diagnosis.md`): mechanism, origin `file:line`, causal chain, ruled out — before any edit.

## Boundaries
- Write only your write-set. A needed file outside it is stop 1 (exception: a 500-line split inside your own directory — journal it in the hand-back).
- Never dot-engine (`node_modules/@knowvah/dot-engine`), the plantuml fork, the oracle jar, cached oracle bytes, `oracle/accepted-divergences.json`, or any pin/baseline/parity/golden/manifest/positional-ceiling file (orchestrator-owned). Never a hand-typed `java -jar`.
- No Serena edit tools (they write the MAIN checkout); no `git stash`; never push; no background process left running; never `cd` above or outside your worktree.
- No new runtime dependency; `src/` never imports a Node built-in, `process.env`, DOM, network, `Date`, `Math.random()`.
- Load is often high: vitest with `--maxWorkers=2`; "Test timed out" with no diff is load — rerun.
- Quality bar: your tests green, `npm run typecheck`, eslint + `npx prettier --write <your files>` (worktrees may skip git hooks).
- Observability: N/A — no new observable operations. Rollback: Reversible (revert the task commit).

## Commit
One commit, Conventional Commits (`feat(json): …`, `fix(json): …`,
`feat(core): …`, `test(oracle): …`, `docs(jfp): …`), ≤72-char subject, body =
mechanism + Java/C files read; no attribution lines. Unsigned, in the worktree.

## Hand-back (one block, no prose)
commit SHA · files changed (line counts) · Java/C read (file:line) · tests
(count, all green?) · typecheck/lint · before/after residue (`residue.mts`) for
every row the spec names · jar-compatible goldens byte-equal? · extended-mode
movers (`extended-baseline.mts --check`) with mechanism · anything stubbed,
skipped or moved · open questions. Return only the structured result — no
preamble, no trailing summary.
