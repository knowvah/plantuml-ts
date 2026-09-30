# T6g: semutu embedded-mindmap canvas

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
class `unknown/semutu-45-zeno907` (structural 1→0 at close-b5, numeric 4: canvas 240×112 vs the jar's 224×86 — Δ16 width, Δ26 height — around an embedded `{{mindmap}}` image of the correct 213×75 at (10,10)); plus T5a's finding that the outer preprocessor swallows the `<style>` block inside `{{ }}` (`preprocessor-collector.ts:169-182`), invisible to `compareSvg` (image bytes exempt).

## Task (TDD)
1. Instrument first: where do 16 and 26 come from? Ruled out by T5a: the image size
   (EmbeddedDiagram.java:126-132 → 213×75, identical) and mindmap sizing. Candidates: the
   class title chrome around an embedded image (`EmbeddedDiagram`'s `TextBlock` margins vs
   the title's), the `+10` in `MindMapDiagram.getTextBlock`, `TextBlockExporter` margins
   applied twice. Read the class engine's title/embedded path in the port and quote the Java.
2. Fix at the origin (class chrome or embedded image sizing — the write-set follows the
   diagnosis; report before editing outside it).
3. Fix the swallowed nested `<style>` in `preprocessor-collector.ts` (the block belongs to
   the inner `{{mindmap}}` source), with a test that the embedded map is styled.

## Write-set
`src/core/preprocessor-collector.ts` (nested-block `<style>`), the class embedded-diagram/title module the diagnosis names (report first), tests under `tests/unit/class/` and `tests/unit/`.

## Read-set
`EmbeddedDiagram.java`, `TextBlockExporter.java:160-215`, `TitledDiagram.java:270-300`; the port's class title and embedded paths, `preprocessor-collector.ts:160-190`.

## Acceptance
- Given `semutu`, then render-diff is 0/0 and the class golden/ratchet gates stay green.
- Given a `{{mindmap}}` with a nested `<style>`, then the inner render is styled.

## Architecture decisions (locked)
D5, D8, D11, D12 (only `semutu`).

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`
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
`fix(class): size the canvas around an embedded mindmap like the jar`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
