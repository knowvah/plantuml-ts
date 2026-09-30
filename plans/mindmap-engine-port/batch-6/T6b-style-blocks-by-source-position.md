# T6b: style blocks by source position

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
`petoda-11-duza898` (ws 5: 5 rect fills), `somife-42-levu771` (ws 1: rect fill): a `<style>` block placed AFTER some `*` lines is applied upstream only to ideas created after it.

## Task (TDD)
1. Mechanism (T5a, journal row 26): each `Idea` captures `getCurrentStyleBuilder()` when it
   is added (`MindMap.java:124-125`); `muteStyle` swaps in a new builder
   (`SkinParam.java:164-167`), so earlier ideas keep the earlier style. The port's
   `MindMapDiagramFactory.ts#buildSkinParam` builds ONE builder from every block up front.
2. Mirror upstream: dispatch skinparams and `<style>` blocks as they occur in source order
   between the mindmap commands, using the preprocessor's `linePositions`/`stylePositions`
   (see how the class parser does it — grep `stylePositions` under `src/diagrams/class/`),
   so `getCurrentStyleBuilder()` changes between lines exactly as `SkinParam.java:155-265`.
3. Keep `buildMindmapStyleBuilder`'s tests green; add position tests pinned with
   `DumpProbe ideas` on both fixtures.

## Write-set
`src/diagrams/mindmap/{MindMapDiagramFactory,mindmap-skin-param}.ts`, `src/core/style/mindmap-style-builder.ts`, tests `tests/unit/mindmap/parse-style-position.test.ts`.

## Read-set
`MindMap.java:117-152`, `SkinParam.java:155-265`, `CommandStyleMultilinesCSS.java`, `CommonCommands.java`; `src/core/preprocessor-collector.ts` (positions), the class engine's position handling.

## Acceptance
- Given `somife`, then the first node's fill is the FIRST block's colour as the jar draws it (render-diff 0/0).
- Given `petoda`, then all 5 rect fills equal the golden.

## Architecture decisions (locked)
D2, D6, D8.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `tests/unit/core/style/`
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

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
`fix(mindmap): apply style blocks by source position`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
