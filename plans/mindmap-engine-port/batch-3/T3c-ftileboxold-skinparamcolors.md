# T3c: FtileBoxOld and SkinParamColors

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
1. `src/core/skin/SkinParamColors.ts`: port `skin/SkinParamColors.java`, the part
   `FingerImpl` and `FtileBoxOld` reach (`getColors`, delegation to the wrapped
   ISkinParam, `Colors.empty().add(ColorType.BACK, c)` — `src/core/abel/Colors.ts` exists).
2. `src/diagrams/activity/ftile/vertical/FtileBoxOld.ts`: port `FtileBoxOld.java:139-243`,
   i.e. `createWbs`, `createMindMap`, the constructor (`style.eventuallyOverride(specBack)`,
   border/back colour, font configuration, horizontal alignment, round corner, shadowing,
   wrap width, minimum width; `SheetBlock2(new SheetBlock1(sheet, wrapWidth, style),
   MyStencil, UStroke.withThickness(1))`), `drawU` (`BoxStyle.PLAIN.drawMe`, three
   alignment arms), `tbWidth`, `calculateDimensionFtile` (`FtileGeometry`). Port
   `BoxStyle.PLAIN.drawMe` and the `FtileGeometry` slice reached, at upstream paths, if
   they are not ported yet (grep first; the activity engine's `tiles/` is a different
   structure and is NOT edited).
3. Tests: box dims and drawn SVG against the jar for a plain, a `[#color]` and a
   multi-line label (probe + one cached fixture's root node).

## Write-set
`src/diagrams/activity/ftile/vertical/FtileBoxOld.ts` (+ `BoxStyle`/`FtileGeometry`
slices at their upstream paths if absent), `src/core/skin/SkinParamColors.ts`, tests
under `tests/unit/activity/ftile/` and `tests/unit/core/skin/`.

## Read-set
`FtileBoxOld.java:100-243`, `skin/SkinParamColors.java`, `BoxStyle.java`,
`FtileGeometry.java`; `src/core/klimt/creole/SheetBlock1.ts`, `SheetBlock2` users;
T2a `Style`.

## Interface contracts
```ts
export class FtileBoxOld implements TextBlock { static createMindMap(style: Style, skinParam: ISkinParam, label: Display): TextBlock;
  static createWbs(style: Style, skinParam: ISkinParam, label: Display): FtileBoxOld; drawU(ug: UGraphic): void; calculateDimension(sb: StringBounder): XDimension2D }
export class SkinParamColors /* implements ISkinParam by delegation */ { constructor(skinParam: ISkinParam, colors: Colors); getColors(): Colors }
```
Consumed by T4a.

## Acceptance
- Given a label and style, then box size and drawn SVG match the jar for plain,
  `[#color]` and multi-line labels.
- Given the existing activity, class and description suites, then they stay green.

## Architecture decisions (locked)
D3, D4, D8, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the new tests, `tests/unit/activity/`, `tests/unit/class/`, `tests/unit/description/`, `activity.diff-baseline.ratchet.test.ts`
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
`feat(mindmap): port FtileBoxOld and SkinParamColors`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
