# T6h: export path warnings banner handwritten and klimt-scaled body

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
`zature-18-vidu755` (ws 77), `zirabo-51-lera821` (ws 77): the jar's `skinparam handwritten` output carries a WARNING BANNER above the diagram and every shape is hand-jiggled; `zebuzi-73-koxu022` (22 structural: ±0.001 `textLength` on body texts under `scale`).

## Task (TDD)
1. Warnings banner (journal row 33): `CommandSkinParam.java:92-93` adds a `Warning` for
   `skinparam handwritten`; `DiagramChromeFactory.java:128,176-200` (`addWarnings`) and
   `:207-266` (`WarningBannerBlock`) draw it above the diagram (rounded URectangle
   #ffffcc/#ffdd88, stroke 3, monospace 10 text). Port the producer (the factory's
   `PreprocessingArtifact`/warnings — `MindMapDiagramFactory.ts:182` passes an empty one) and
   the banner block into the port's chrome (`src/core/annotations/chrome.ts:400-401` has no
   producer today), so both goldens' extra 2 children and canvas growth (+90×20 at dpi 96,
   +282×62.5 at dpi 300) match.
2. Handwritten wiring: T6c ported `UGraphicHandwritten` + hand shapes (verified against both
   goldens modulo the banner dy). Wire it where `TextBlockExporter.java:173-175` does
   (`isHandwritten`: SkinParam.java:1076-1078 / UgDiagram.java:117-121), drawing the banner
   INSIDE the handwritten graphic as upstream does.
3. Klimt-scaled body (journal row 35): upstream draws the chromed document through ONE
   `UGraphic` with `option.scale` (TextBlockExporter.java:159-176). Resolve the factor from the
   chrome-included dimension first (two passes: chrome dims → `computeScaleFactor` → draw),
   then draw the BODY through klimt at that factor (`drawFragment`'s `scale` option) so body
   `textLength`s are rounded once; keep `finalizeTitledDiagramFragment`'s post-multiply for
   the chrome strings only. zebuzi's 22 body rows → 0; report any chrome-text residue.

## Write-set
`src/diagrams/mindmap/{index,MindMapDiagramFactory}.ts` (export path + warnings artifact only — T6f owns the factory's throw routing; coordinate by hunk), `src/core/annotations/chrome.ts` (warnings banner), `src/core/TextBlockExporter.ts`, `src/core/klimt/drawing/hand/**`, tests under `tests/unit/mindmap/`.

## Read-set
`DiagramChromeFactory.java:120-266`, `CommandSkinParam.java:70-95`, `TextBlockExporter.java:155-215`, `UGraphicHandwritten.java`, `SkinParam.java:1070-1080`; `src/core/annotations/chrome.ts`, `src/diagrams/mindmap/index.ts`, `.agent-notes/mmp-T6c-handwritten-banner.md`.

## Acceptance
- Given `zature`, then render-diff is 0/0 (banner + jiggled paths).
- Given `zirabo`, then render-diff is 0/0 (dpi 300 banner, monochrome background).
- Given `zebuzi`, then the body `textLength` rows are gone; residue carries a mechanism.
- Given every other engine's golden/diff ratchets, then they stay green (D11: chrome.ts is shared).

## Architecture decisions (locked)
D3, D5, D8, D11.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `tests/unit/core/annotations/`, `tests/unit/json/`, `tests/unit/description/`, the description/json/class golden ratchets
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
`feat(mindmap): warnings banner, handwritten export, klimt-scaled body`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
