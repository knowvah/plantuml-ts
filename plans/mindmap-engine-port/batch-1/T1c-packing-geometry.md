# T1c: packing geometry

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
Port the pure packing layer of `mindmap/`, one file each, upstream names:
`Stripe.java` (80), `StripeFrontier.java` (154), `SymetricalTee.java` (81),
`SymetricalTeePositioned.java` (117), `Tetris.java` (141; `add`, `balance`, `getHeight`,
`getWidth`, `getElements`, min/max tracking — `Tetris.java:45-80` sentinels
`Double.MAX_VALUE` → `Number.MAX_VALUE`). No style, no text: numbers in, numbers out.
Tests use `LayoutProbe` outputs (child SymetricalTee inputs → element y's, width, height).

## Write-set
`src/diagrams/mindmap/{Stripe,StripeFrontier,SymetricalTee,SymetricalTeePositioned,Tetris}.ts`
+ `tests/unit/mindmap/{tetris,stripe-frontier,symetrical-tee}.test.ts`.

## Read-set
`~/git/plantuml/.../mindmap/{Stripe,StripeFrontier,SymetricalTee,SymetricalTeePositioned,Tetris}.java`;
`FingerImpl.java` (`getTetris`, `asSymetricalTee`) for how they are consumed.

## Interface contracts
```ts
export class SymetricalTee { constructor(thickness1: number, elongation1: number, thickness2: number, elongation2: number); ... }
export class SymetricalTeePositioned { getY(): number; getMinY(): number; getMaxY(): number; move(dy: number): void; ... }
export class Tetris { constructor(name: string); add(tee: SymetricalTee): void; balance(): void;
  getHeight(): number; getWidth(): number; getElements(): readonly SymetricalTeePositioned[] }
```
Consumed by T4a (`FingerImpl`). Mirror mutation where the Java mutates; document it.

## Acceptance
- Given the probe's child sizes, then positions, `balance()`, width and height equal the jar's.
- Given `balance()` called twice, then it throws as `Tetris.java` does (IllegalStateException → Error).

## Architecture decisions (locked)
D8, D12 (upstream names, no refactor).

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`
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
`feat(mindmap): port the tetris packing geometry`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
