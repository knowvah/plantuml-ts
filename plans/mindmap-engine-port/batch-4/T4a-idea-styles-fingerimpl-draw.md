# T4a: Idea styles, FingerImpl, MindMap/Branch drawing

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
1. `Idea`: `getDefaultStyleDefinitionNode` (`Idea.java:65-92`: root/leaf/boxless
   signatures + stereotype + level), `getStyle` (`:95-104`: `getMergedStyleSpecial` with
   `STEP_BY_PARENT * 1000`, the parent walk with `addStar()` and `deltaPriority -=
   STEP_BY_PARENT`, `mergeWith OVERWRITE_EXISTING_VALUE`; `STEP_BY_PARENT` =
   `WElement.java:110` `1000_1000`), `getStyleArrow` (`:106-111`).
2. `FingerImpl.java` whole: `build`, `drawU` (phalanx placement, children at
   `getTetris` y's, link line), `drawLine` (the UPath cubic, both rankdirs: 3/10 and
   10/25 deltas), `getTetris`, `asSymetricalTee`, `getX1`/`getX2` (`+5`/`+30`),
   `getX12`, phalanx thickness/elongation, `getPhalanx` (BOX → `FtileBoxOld.createMindMap`
   with `SkinParamColors`, margin; NONE → `Display.create0` with `(3,0,1,1)`/`(0,3,1,1)`
   margins), nail thickness/elongation, `doNotDrawFirstPhalanx`, `Finger.java`.
3. `MindMap.java:63-112` (`computeFinger`, `calculateDimensionSlow`, `drawU`) and
   `Branch.java` drawing/geometry (`initFinger`, `drawU`, `getHalfThickness`,
   `getFullElongation`, `getX12`).
Tests: node translations and curve paths equal `LayoutProbe` for single-branch,
two-sided, top-to-bottom and boxless sources.

## Write-set
`src/diagrams/mindmap/{Idea,MindMap,Branch,Finger,FingerImpl}.ts` + `tests/unit/mindmap/{finger-impl,mindmap-layout,idea-style}.test.ts`.

## Read-set
`FingerImpl.java`, `Idea.java:65-111`, `MindMap.java:63-152`, `Branch.java:48-129`,
`WElement.java:110`; T1c, T2a, T3a (`buildMindmapStyleBuilder`), T3c modules.

## Interface contracts
```ts
export class MindMap implements UDrawable { calculateDimension(sb: StringBounder): XDimension2D; drawU(ug: UGraphic): void }
```
Consumed by T5a (`MindMapDiagram#getTextBlock`).

## Acceptance
- Given single-branch, two-sided, top-to-bottom and boxless sources, then node
  translations and curve paths equal `LayoutProbe`'s.
- Given a `:depth(1)` / `*` style, then the merged node style equals `StyleProbe`'s.
- Given a transparent arrow LineColor, then no link is drawn (`FingerImpl` `isTransparent`).

## Architecture decisions (locked)
D1, D3, D8, D12.

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

## Commit
`feat(mindmap): port idea styles, FingerImpl layout and drawing`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
