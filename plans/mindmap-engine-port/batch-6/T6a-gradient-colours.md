# T6a: gradient colours

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
`nukose-24-funi267` (ws 322, `!theme aws-orange`: `#F18E3E-#EC7211`), `vacofo-66-puno159` (ws 307, `#cc33cc-#0c33ac`): both throw `unported: HColorGradient` in `HColorSet.ts#parseColor` and render a crash page (routing known-misroute, refusal known-gap since close-b5).

## Task (TDD)
1. Port `klimt/color/HColorGradient.java` at `src/core/klimt/color/HColorGradient.ts` and the
   gradient arm of `HColorSet.java:81-104` (`parseColor`: `-`, `/`, `\\`, `|` policies →
   `HColorGradient(color1, color2, policy)`), keeping T2a's `HColorSimple`/`HColors` intact.
   `HColorScheme`/`HColorAutomagic` stay unported unless a mindmap fixture reaches them
   (say so in the comment).
2. Emit the gradient the way the port's SVG driver already does for `Paint` gradients
   (`src/core/paint.ts` `Gradient`, `paintToSvg`): `HColorGradient#asPaint()` returns a
   `Gradient` whose `<linearGradient>` def and `fill="url(#...)"` match the jar's
   `SvgGraphics` output for these two fixtures (read the cached `in.svg` `<defs>`).
3. Re-measure both rows; any remaining diff (nukose is also `!theme aws-orange` with dark
   background and theme skinparams) gets a mechanism in the report.

## Write-set
`src/core/klimt/color/{HColorGradient,HColorSet}.ts` (class arm only), tests under `tests/unit/core/klimt/color/`.

## Read-set
`HColorSet.java:69-104`, `HColorGradient.java`, `klimt/color/ColorMapper*.java` as reached, `SvgGraphics.java` gradient `<defs>` emission; `src/core/paint.ts`, the two fixtures' `in.svg`.

## Acceptance
- Given `#cc33cc-#0c33ac`, then `parseColor` returns an `HColorGradient` and the drawn `<rect fill>` + `<linearGradient>` equal `vacofo`'s golden.
- Given the aws-orange theme, then `nukose` renders (no crash page); remaining diffs carry a mechanism.

## Architecture decisions (locked)
D1, D8, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/core/klimt/`, `tests/unit/mindmap/`
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
`feat(color): port HColorGradient for mindmap fills`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
