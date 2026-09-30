# T6e: creole in node labels

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
`rinamu-56-tabi421` (ws 52: `<&flag>`/`<&globe>` openiconic sprites missing → childCount −2, root rect 64.45 vs 75.783), `kijaru-67-buco967` (ws 44: `**bold**` inside orgmode lines drawn bold here, plain in the jar), `kelome-99-naso291` (ws 25: `MaximumWidth 300` splits a long URL text differently), `zebuzi` sprites/`<s>` after T6d.

## Task (TDD)
1. Diagnose each with the jar first: for `kijaru`, why the jar does NOT bold `**$index**`
   after `  ** ` (the orgmode regex `([ \t]*[*#]+)` + `RegexLeaf.spaceZeroOrMore` and creole
   `**` parsing — quote `CommandMindMapOrgmode.java:59-64` and the creole bold atom); for
   `rinamu`, how `FingerImpl.getPhalanx` → `FtileBoxOld` → `sheet()` reaches openiconic
   sprites (`<&name>`) and why the port's mindmap `AtomOps` yields none (T4a note: one
   diagram-wide `AtomOps`; `getSprite` has no internal-store fallback — T5a); for `kelome`,
   `SheetBlock1` wrapping at `MaximumWidth` vs `LineBreakStrategy` for a URL with no spaces
   (`Sheet`/`StripeSimple` line-breaking, `StringBounder` width) and the `[[url]]` link atom.
2. Fix each at its origin; no fix without the stated mechanism.

## Write-set
`src/diagrams/mindmap/FingerImpl.ts` (label/AtomOps path; `mindmap-skin-param.ts` is T6b's — a needed `getSprite` hook is reported, not edited), `src/diagrams/activity/ftile/vertical/FtileBoxOld.ts` (sheet call only), creole modules ONLY as a cited port of an unported branch (name them in the report; D11 gates them), tests under `tests/unit/mindmap/`.

## Read-set
`CommandMindMapOrgmode.java:59-64`, `FingerImpl.java:200-236`, `FtileBoxOld.java:148-176`, `klimt/creole/{Sheet,StripeSimple,SheetBlock1,atom/*}.java`, `openiconic` sprite loading in `SkinParam.java`; `src/core/klimt/creole/*`, `src/core/annotations/blocks-creole.ts:340`.

## Acceptance
- Given each of the three fixtures, then render-diff is 0/0, or the residue carries a mechanism + owner.
- Given the activity/class/sequence creole suites, then they stay green (D11).

## Architecture decisions (locked)
D3, D8, D11, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`, `tests/unit/creole*.test.ts`, `tests/unit/activity/`, `tests/unit/class/`
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
`fix(mindmap): creole sprites, bold and wrapping in node labels`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (revert the commit).
