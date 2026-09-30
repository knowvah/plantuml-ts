# T6c: handwritten and monochrome export path

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
`zature-18-vidu755` (ws 77: `skinparam handwritten true` — links are the jar's jiggled polylines), `zirabo-51-lera821` (ws 79: `monochrome true` + `handwritten true` — background `#EAEAEA` vs our `#EEEBDC`, jiggled paths).

## Task (TDD)
1. `handwritten`: upstream wraps the export graphic in `UGraphicHandwritten`
   (`TextBlockExporter.java:174-175`; `klimt/drawing/hand/UGraphicHandwritten.java`,
   `HandJiggle`, `UPathHand`/`ULineHand`/`URectangleHand`...). The port has
   `src/core/klimt/drawing/hand/{HandJiggle,JavaRandom,shapes}.ts` (activity's hand path)
   — grep how activity applies it and reuse; port the missing hand shapes at their upstream
   paths so the mindmap's curved `UPath` links equal `zature`'s golden `<path d>` (the
   `JavaRandom` seed sequence must match: read `UGraphicHandwritten.java` for the seed).
2. `monochrome`: `TitledDiagram#muteColorMapper` (`TitledDiagram.java:291-300`) →
   `ColorMapper.MONOCHROME`; port the mapper arm the mindmap export reaches and apply it in
   `src/diagrams/mindmap/index.ts#drawFragment` where the skinparam says so.
3. Tests pinned against both goldens.

## Write-set
`src/diagrams/mindmap/index.ts`, `src/core/klimt/drawing/hand/**` (new hand shapes at upstream paths; do not change existing exports), `src/core/klimt/color/ColorMapper*.ts` (new), tests under `tests/unit/mindmap/` and `tests/unit/core/klimt/`.

## Read-set
`TextBlockExporter.java:160-215`, `klimt/drawing/hand/*.java`, `TitledDiagram.java:285-300`, `klimt/color/ColorMapper*.java`; activity's use of `HandJiggle`.

## Acceptance
- Given `zature`, then every `<path d>` equals the golden (render-diff 0/0).
- Given `zirabo`, then background, fills and paths equal the golden.

## Architecture decisions (locked)
D3, D8, D11 (activity's hand output must not move).

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `tests/unit/core/klimt/`, `tests/unit/activity/`
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
`feat(mindmap): handwritten and monochrome export`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
