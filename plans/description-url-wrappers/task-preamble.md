# Shared preamble (prepend to every agent prompt, after the worktree header)

The worktree header names the worktree path (`measurements/mkwt.sh Tn [base]`), the branch `dur/Tn`
and the base sha. Return only the structured report, and ALSO write the FULL report (not a stub) to
`<worktree>/Tn-report.md`, uncommitted — a resumed agent's second report can be lost:
- commit sha(s) and files changed
- per target row: render-diff structural/numeric before → after
  (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`, from the worktree root)
- the diagnosis artifact per mechanism: mechanism, origin `file:line` (Java + port), causal chain, ruled out
- surveys before → after for the trees named in the task (verdict movers with mechanisms; losses)
- residuals with mechanisms; write-set extensions
- test counts, including the collected file count
No preamble, no trailing summary.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML; the Java at `~/git/plantuml` is the spec. Read
`CLAUDE.md` first: "READ THE JAVA FIRST", "Never fit a value", "Mirror the jar's output exactly",
"Do not refactor while porting", "Preserve upstream names". Grep `src/main/java/net/`, never only
`net/sourceforge/plantuml/`.
- Brief: `plans/description-url-wrappers/` (README, decisions.md D1–D9, fixtures.md).
- Planning map with `file:line`: `plans/description-url-wrappers/measurements/seed/seam-map.md`.
- Background: `.agent-notes/codd-findings.md`, `.agent-notes/codd-T1c.md`.
- Jar output per fixture: `test-results/dot-cache/<tree>/<slug>/{in.puml,in.svg,svek-1.dot}`.
- New oracles only via `scripts/oracle-render.sh <out-dir> <puml>` (out-dir under `/private/tmp/claude-501/dur-Tn/`).
- compareSvg counts are not monotonic: adding a jar element can re-pair siblings. Before calling a rise
  a regression, check whether the row's @id/childCount diffs predate the change.

## Quality bar
- **TDD:** failing test first; expected values from the jar SVG or a jar probe, never guessed.
- Tests mirror the source path under `tests/unit/`.
- Targeted run: `npx vitest run --maxWorkers=4 <your tests> tests/architecture
  tests/oracle/svg-conformance/description.*.test.ts`; report the collected file count (a filter can
  collect zero).
- Before `git commit`: `npm run typecheck`; `npx eslint <files>`; `npx prettier --write <files>`;
  `npm run catalog` if exports changed.
- New files ≥ 90% line/branch/function coverage. Complexity hook: ≤30 NLOC/function, CCN ≤10,
  ≤5 params, ≤500-line files.
- If you touch `src/core/**`, run the D7 guards and report them.
- Surveys: `npm run -s svg:survey -- <tree> --out /private/tmp/claude-501/dur-Tn/<tree>-{before,after}.json`
  (NEVER the positional-only form: it overwrites the tracked parity.json). Before = your base, taken
  before your first edit.

## Worktree rules
- Work only in your worktree, with absolute paths; use `cd <worktree> && …` for commands.
- **No Serena edit tools** (they write the MAIN checkout). Serena read tools are fine.
- No `git stash`. Never `cd` into a subdirectory. Never `npm install`.
- The 4 npm-pack packaging tests fail in worktrees; ignore them.

## Boundaries
- Always: quote the Java (`file:line`) before claiming parity; every constant carries its citation;
  state the mechanism before the edit.
- Stop and report (do not edit): a needed file outside the write-set; Java that contradicts a
  D-decision; a core origin not covered by D7.
- Never: fit a value; touch the oracle, dot-engine or the fork; push; sign an acceptance; edit
  `oracle/goldens/**`, `*.ratchet.test.ts`, `census-*.json`, `parity-*.json`, routing/refusal baselines
  or `docs/parity-report.md`.

## Commit
`fix(description): …` / `feat(description): …` / `fix(core): …`, lowercase, ≤72-char subject, lines ≤80.
The body names the Java ported, the mechanism, and what the tests pin. No attribution lines.

**Observability:** N/A for code tasks; measurement is the close's job. **Rollback:** Reversible (revert).
