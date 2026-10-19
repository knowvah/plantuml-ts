# Shared preamble (prepend to every agent prompt)

The header names your checkout. The description lane uses the mission checkout
`/Users/scottseely/git/knowvah/plantuml-ts` on `fix/graphviz-tracker-consume`. The state lane uses the
worktree `/Users/scottseely/git/knowvah/plantuml-ts/.claude/worktrees/gtc-S` on `gtc/S`.

Return only the structured report, and also write the FULL report to `<checkout>/Tn-report.md`,
uncommitted. A resumed agent's second report can be lost. The report contains:
- commit sha and files changed
- per target row: render-diff structural/numeric before → after
  (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`, from the checkout root)
- the diagnosis artifact per mechanism: mechanism, origin `file:line` (Java + port), causal chain, ruled out
- surveys before → after for the trees the task names (verdict movers with mechanisms; losses)
- residuals with mechanisms; write-set extensions
- test counts, including the collected file count

No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at `~/git/plantuml` is the spec. Read
`CLAUDE.md` first: "READ THE JAVA FIRST", "Never fit a value", "Mirror the jar's output exactly",
"Do not refactor while porting", "Preserve upstream names". Grep `src/main/java/net/`, never only
`net/sourceforge/plantuml/`.
- Brief: `plans/graphviz-tracker-consume/` (README, decisions.md D1–D7, fixtures.md).
- Background: `.agent-notes/dot-engine-2.4.0-bump.md`, `.agent-notes/codd-findings.md`, and the target
  item's block in `docs/graphviz-issues/TRACKER.md` (read only; the orchestrator edits it).
- Layout is already equal to native on every target row: the residual is post-layout. If the evidence
  says otherwise, prove it with `dot -Tdot` on `test-results/dot-cache/<tree>/<slug>/svek-1.dot` and
  report it. Do not patch around it (stop 6).
- Jar output per fixture: `test-results/dot-cache/<tree>/<slug>/{in.puml,in.svg,svek-1.dot}`.
- New oracles only via `scripts/oracle-render.sh <out-dir> <puml>` (out-dir under `/private/tmp/claude-501/gtc-Tn/`).
- compareSvg counts are not monotonic: adding a jar element can re-pair siblings. Before calling a rise a
  regression, check whether the row's `@id`/childCount diffs predate the change.

## Quality bar
- **TDD:** failing test first. Expected values come from the jar SVG or a jar probe, never guessed.
- Tests mirror the source path under `tests/unit/`.
- Targeted run: `npx vitest run --maxWorkers=4 <your tests> tests/architecture
  tests/oracle/svg-conformance/<engine>.*.test.ts`. Report the collected file count (a filter can collect zero).
- Before `git commit`: `npm run typecheck`; `npx eslint <files>`; `npx prettier --write <files>`;
  `npm run catalog` if exports changed.
- New files need ≥ 90% line/branch/function coverage. Complexity hook: ≤30 NLOC/function, CCN ≤10, ≤5 params,
  ≤500-line files.
- Surveys: `npm run -s svg:survey -- <tree> --out /private/tmp/claude-501/gtc-Tn/<tree>-{before,after}.json`.
  Never use the positional-only form: it overwrites the tracked parity JSON. "Before" is taken before your first edit.

## Worktree rules (state lane)
- Work only in the worktree, with absolute paths; use `cd <worktree> && …` for commands.
- **No Serena edit tools** (they write the MAIN checkout). Serena read tools are fine.
- No `git stash`. Never `cd` into a subdirectory. Never `npm install`.
- The 4 npm-pack packaging tests fail in worktrees; ignore them.

## Boundaries
- Always: quote the Java (`file:line`) before claiming parity; every constant carries its citation; state the
  mechanism before the edit.
- Stop and report (do not edit): a needed file outside the write-set; Java that contradicts a D-decision;
  a residual that traces into dot-engine.
- Never: fit a value; touch the oracle, dot-engine or the fork; push; sign; edit `TRACKER.md`,
  `oracle/goldens/**`, `*.ratchet.test.ts`, `census-*.json`, `parity-*.json`, routing/refusal baselines or
  `docs/parity-report.md`.

## Commit
`fix(description): …` / `fix(state): …` / `fix(core): …`: lowercase, ≤72-char subject, lines ≤80. The body
names the Java ported, the mechanism, and what the tests pin. No attribution lines.

**Observability:** N/A for code tasks; measurement is the close's job. **Rollback:** reversible (revert).
