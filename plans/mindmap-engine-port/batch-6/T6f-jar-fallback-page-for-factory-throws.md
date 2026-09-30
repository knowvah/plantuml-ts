# T6f: jar fallback page for factory throws

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
`fogari-75-febu345` (indented `*` levels → `getSmartLevel` throws `UnsupportedOperationException`), `femiba-70-duvi238` (`++ """` triple-quote lines), `susipa-95-tedu015` (`<style>`-only source → NPE in `Branch.hasChildren`, Branch.java:112): the jar renders a fallback page. femiba/fogari: the black `PlantUML version …` banner (`PSystemVersion`); susipa: the stack-trace error page.

## Task (TDD)
1. Read `PSystemBuilder.java:270-285` (the catch around `createPSystem`) and what page each
   throw becomes (`PSystemVersion.createShowVersion`? / `PSystemError`?) — quote it. Read
   the three goldens' `<text>` content and colours (`#33FF02` on `#000000`).
2. Make the mindmap plugin's factory/render path throw where upstream throws (D6: T1d's
   `getSmartLevel` throw, the unguarded `Branch.hasChildren`, and whatever femiba's `"""`
   lines hit — diagnose) and route the throw to the same page the jar draws, through
   `src/core/error/error-diagrams.ts` (port the version-banner page at its upstream path if
   absent). The version TEXT is a permanent divergence (`plantuml-ts version 0.1.0` vs the
   jar's) — record it in `DIVERGENCES.md`; layout, colours, `textLength` of the shared
   lines and the stack-trace structure are targets.
3. T6b and T6c have merged; T6h runs in parallel and owns `index.ts`.

## Write-set
`src/core/error/error-diagrams.ts` (+ a `PSystemVersion` page module at its upstream path if absent), `src/diagrams/mindmap/MindMapDiagramFactory.ts` (throw routing only — T6h edits the same file's warnings artifact: different hunk; `src/diagrams/mindmap/index.ts` is T6h's — report a needed catch there), `DIVERGENCES.md`, tests `tests/unit/mindmap/render-error-page.test.ts`.

## Read-set
`PSystemBuilder.java:260-290`, `PSystemVersion.java`, `PSystemError.java:140-235`, `MindMapDiagram.java:136-159`, `Branch.java:105-115`; the three goldens.

## Acceptance
- Given each of the three sources, then the port renders the same page KIND with the same colours and layout; render-diff residue is only the version text (documented).

## Architecture decisions (locked)
D6, D8.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `tests/unit/core/error*`
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
`feat(mindmap): route factory throws to the jar's fallback page`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
