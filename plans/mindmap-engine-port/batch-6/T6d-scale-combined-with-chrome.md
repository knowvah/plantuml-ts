# T6d: scale combined with chrome

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
`zebuzi-73-koxu022` (ws 1010, diffs 975: `scale 1480*740` + `title` — every font-size/textLength/stroke-width is unscaled; also `<&sprite>` and `<s>` creole, shared with T6e).

## Task (TDD)
1. Mechanism (T5a): on the chrome path the plugin composes chrome outside klimt
   (`src/diagrams/mindmap/index.ts#rawTextBlock` → `assemble-svg.ts` `case 'MINDMAP'` →
   `TextBlockExporter.ts#finalizeTitledDiagramFragment`), so `scale` never applies; upstream
   scales the whole chromed document (`TextBlockExporter.java:205-209`, `Scale.java`).
2. Apply the scale after chrome as upstream does (a `UGraphicWithScale`/transform pass or
   the port's existing scale seam — grep `scale-command.ts` and how json/description apply
   `scale` with chrome), so `zebuzi`'s `svg/@width/@height/viewBox`, font sizes and stroke
   widths equal the golden. Sprite/creole diffs that remain belong to T6e — report them.

## Write-set
`src/core/TextBlockExporter.ts` (`finalizeTitledDiagramFragment`), `src/core/assemble-svg.ts` (MINDMAP case only), `src/diagrams/mindmap/index.ts` chrome path only if T6c has merged (else report), tests `tests/unit/mindmap/render-scale.test.ts`.

## Read-set
`TextBlockExporter.java:160-215`, `Scale*.java`, `TitledDiagram.java:270-300`; `src/core/scale-command.ts`, the json engine's scale path.

## Acceptance
- Given `scale 1480*740` + `title`, then the root `width/height/viewBox` and every `font-size` equal the golden; render-diff falls from 173/802 to the creole residue only.

## Architecture decisions (locked)
D3, D5, D8, D11.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `tests/unit/json/`
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
`fix(mindmap): apply scale after titled chrome`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
