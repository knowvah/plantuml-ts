# T5a: plugin, registration, chrome

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

## Task (TDD)
1. `MindMapDiagram#getTextBlock` (`MindMapDiagram.java:81-103`): stack the mindmaps,
   `width + 10`. `TitledDiagram` chrome (title, caption, legend, header, footer, scale,
   mainframe) through `src/core/assemble-svg.ts` / `TitledDiagram.ts`, with the root
   `data-diagram-type="MINDMAP"` (TextBlockExporter.java:292-294). The canvas comes from
   the klimt `LimitFinder`/`TextBlockExporter` path (D3; `src/core/TextBlockExporter.ts`).
2. `src/diagrams/mindmap/index.ts`: a `SyncPlugin` (dispatcher.ts:204) wrapping
   T1d's factory, T3a's `buildMindmapStyleBuilder` and T4a's drawing; register it in
   `src/index.ts` next to the other plugins.
3. Tests: `renderSync` over a basic mindmap equals the jar golden (render-diff 0/0), plus
   title/legend/scale chrome cases, plus the embedded `{{ }}` path.
4. Run `mindmap.diff-baseline` and routing/refusal gates. Report every `[FIXED]` /
   `[CHANGED]` line. Do NOT edit any baseline: re-pinning is orchestrator-only at the
   b5 close (D7). Re-measure class `unknown/semutu-45-zeno907` and report it.

## Write-set
`src/diagrams/mindmap/{index,MindMapDiagram}.ts` (MindMapDiagram: add `getTextBlock`),
`src/index.ts` (registration line + import), `tests/unit/mindmap/render-*.test.ts`.

## Read-set
`MindMapDiagram.java:60-104`; `src/core/dispatcher.ts:190-260`; `src/diagrams/json/index.ts`
(TitledDiagram + klimt precedent); `src/core/assemble-svg.ts`; `src/core/TitledDiagram.ts`.

## Acceptance
- Given a basic mindmap, then `renderSync` output matches the jar golden.
- Given title, legend and scale, then the chrome matches.
- Given an embedded `{{ }}` mindmap, then `semutu` re-measures (report before → after).
- Given the routing gate, then the only changes are mindmap rows reported `[FIXED]`.

## Architecture decisions (locked)
D3, D5, D7, D11.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `mindmap.*.test.ts`, `routing-conformance.test.ts`, `refusal-coverage.test.ts`, class/description/state/object golden ratchets, sequence/activity diff-baselines
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`). Expected red: routing/refusal mindmap rows — report, never re-pin.

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`feat(mindmap): register the mindmap plugin with titled chrome`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).

## Orchestrator note (added at the b1 T1d merge, journal row 14)
T1d left `MindMapDiagram` as a standalone class: it must `extend TitledDiagram` here (D5), which
requires a concrete `ISkinParam` (`getSkinParam()` is abstract on `src/core/TitledDiagram.ts`;
see `CucaDiagramBase.ts:66` for the precedent) and `CommandRankDir` wired to it instead of the
local `rankdir` field (`MindMapDiagram.java:76`, `CommandRankDir.java:76-79`). Reconcile the
opaque `UmlSource` brand in `TitledDiagram.ts` with `block-extractor.ts`'s concrete `UmlSource`.
- (journal row 22) `<style>` parse errors surface as `StyleParsingException` from
  `buildMindmapStyleBuilder`; map them to the command error page as
  `CommandStyleMultilinesCSS.java:92-93` does.
