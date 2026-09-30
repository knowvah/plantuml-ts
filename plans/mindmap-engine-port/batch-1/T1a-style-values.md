# T1a: style values

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
Port, file per upstream file, the value layer of `style/`:
`PName.java` (79), `SName.java` (217; widen the existing union in
`src/core/style/StyleSignatureBasic.ts` into `src/core/style/SName.ts`, keeping the
constant names verbatim), `MergeStrategy.java`, `Value.java`, `ValueAbstract.java` (85),
`ValueImpl.java` (209), `ValueNull.java` (95), `ValueColor.java`, `DarkString.java` (101).
Tests pin priority merge, `asColor` via the existing colour set
(`src/core/klimt/color/HColorSet.ts#parseColor`), `asDouble`/`asInt`/`asBoolean`,
`asFontStyle`, dark-mode `DarkString#mergeWith`, with probe-backed values.

## Write-set
`src/core/style/{PName,SName,MergeStrategy,Value,ValueAbstract,ValueImpl,ValueNull,ValueColor,DarkString}.ts`
and tests under `tests/unit/core/style/`. `src/core/style/StyleSignatureBasic.ts` only to
re-export `SName` from its new module (type move, push-forward) — T1b owns the rest.

## Read-set
`~/git/plantuml/.../style/{PName,SName,MergeStrategy,Value,ValueAbstract,ValueImpl,ValueNull,ValueColor,DarkString}.java`;
`src/core/klimt/color/*` (existing colour types).

## Interface contracts
```ts
export type PName = 'Shadowing' | 'FontName' | ... ; // every PName.java constant
export interface Value { asString(): string; asColor(set: HColorSet): HColor; asInt(minmax: boolean): number;
  asDouble(): number; asBoolean(): boolean; asFontStyle(): number; getPriority(): number; mergeWith(other: Value | undefined, strategy: MergeStrategy): Value; }
export const ValueNull: { NULL: Value; COLOR: Value };
export function ValueImpl_regular(value: string, counter: AutomaticCounter): Value; // mirror static factories
```
Exact names mirror the Java statics; T1b/T2a consume them.

## Acceptance
- Given two values of different priority merged OVERWRITE_EXISTING_VALUE, then the higher
  priority wins as in `ValueImpl.java` (probe-backed).
- Given a colour value, then it resolves through the existing colour set.
- Given the visibility-icon code, then it still compiles and its tests pass.

## Architecture decisions (locked)
D1, D8, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/core/style/` and `tests/unit/core/klimt/color/`
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
`feat(style): port the style value layer`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
