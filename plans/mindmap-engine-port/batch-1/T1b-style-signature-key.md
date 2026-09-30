# T1b: StyleSignatureBasic and StyleKey

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
Widen `src/core/style/StyleSignatureBasic.ts` into the full port of
`style/StyleSignatureBasic.java` (311): `of(...)`, `createStereotype`, `addLevel`,
`addStar`, `isStarred`, `addStereotype`, `add(String)`, `matchAll`, `match`,
`getStereotypes`, `mergeWith`, `equals`/`hashCode` semantics (as a stable key string for
Map use), `clean` (lowercase, strip `_`/`.`), `STAR`. Port `style/StyleKey.java` (131)
and `StyleSignature.java`/`StyleSignatures.java` as reached. Keep the existing
`VisibilityModifier` caller (`src/core/skin/VisibilityModifier.ts`) compiling unchanged.

## Write-set
`src/core/style/{StyleSignatureBasic,StyleKey,StyleSignature,StyleSignatures}.ts` + tests
under `tests/unit/core/style/`.

## Read-set
`~/git/plantuml/.../style/{StyleSignatureBasic,StyleKey,StyleSignature,StyleSignatures}.java`;
`Idea.java:65-111` (how mindmap builds signatures: `.addStereotype(st).addLevel(level)`,
`.addStar()`); `src/core/skin/VisibilityModifier.ts` (existing consumer); T1a's `SName`.

## Interface contracts
```ts
export class StyleSignatureBasic {
  static of(...names: SName[]): StyleSignatureBasic; static createStereotype(s: string): StyleSignatureBasic;
  addLevel(level: number): StyleSignatureBasic; addStar(): StyleSignatureBasic; isStarred(): boolean;
  addStereotype(st: Stereotype | undefined): StyleSignatureBasic; matchAll(other: StyleSignatureBasic): boolean;
  keyString(): string; // equals/hashCode stand-in for Map keys
}
```
The existing `{ names }` shape stays readable for `VisibilityModifier` (or is migrated in
this commit if it is the only consumer — grep first).

## Acceptance
- Given the Java inputs, then `of`, `addLevel`, `addStar`, `addStereotype`, `matchAll` and
  `isStarred` match the probe.
- Given the visibility-icon call site, then it compiles unchanged and its tests stay green.

## Architecture decisions (locked)
D1, D8, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/core/style/`, the visibility-icon tests (`tests/unit/class/*visibility*`), `tests/unit/class/`, `tests/unit/description/`
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
`feat(style): port StyleSignatureBasic matching and StyleKey`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
