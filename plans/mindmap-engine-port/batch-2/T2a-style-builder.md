# T2a: Style, StyleStorage, StyleBuilder

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
Port `Style.java` (387), `StyleStorage.java` (146), `StyleBuilder.java` (163) on T1a/T1b:
- `Style`: `value(PName)`, `mergeWith(other, strategy)`, `deltaPriority`, `eventuallyOverride`
  (Colors / Fashion / PName+HColor overloads reached by `FtileBoxOld.java:148-179`),
  `getMargin`, `getPadding`, `getStroke`, `getFontConfiguration(HColorSet)`,
  `getHorizontalAlignment`, `wrapWidth`, `getShadowing`, `getSignature`. Map klimt types to
  the ported ones (`src/core/klimt/**`, `abel/FontConfiguration.ts`, `UStroke`, `LineBreakStrategy`).
- `StyleStorage`: insertion-ordered storage, `put`, `get`, `putAll`, `getStyles`,
  `computeMergedStyle`.
- `StyleBuilder` (`:86-160`): `muteStyle`, `loadInternal`, `getMergedStyle` with the
  per-builder cache, `getMergedStyleSpecial(signature, deltaPriority)`, `cloneMe`,
  `createStereotype`, `getNextInt` (AutomaticCounter). The cache is per builder instance
  (no module-level state); document the concurrency contract.
Tests: build storages from probe inputs; merged values equal `StyleProbe`'s, including
star + level + deltaPriority cases (`Idea.java:95-104`, `STEP_BY_PARENT` =
`WElement.java:110` `1000_1000`).

## Write-set
`src/core/style/{Style,StyleStorage,StyleBuilder,AutomaticCounter,AutomaticCounterBasic}.ts`
+ tests under `tests/unit/core/style/`.

## Read-set
`~/git/plantuml/.../style/{Style,StyleStorage,StyleBuilder,AutomaticCounter*}.java`;
`Idea.java:65-111`; `FtileBoxOld.java:148-179` (getters used); T1a/T1b modules.

## Interface contracts
```ts
export class Style { value(p: PName): Value; mergeWith(o: Style | undefined, s: MergeStrategy): Style; deltaPriority(d: number): Style;
  eventuallyOverride(c: Colors | undefined): Style; getMargin(): ClockwiseTopRightBottomLeft; getPadding(): ClockwiseTopRightBottomLeft;
  getStroke(): UStroke; getFontConfiguration(set: HColorSet): FontConfiguration; getHorizontalAlignment(): HorizontalAlignment;
  wrapWidth(): LineBreakStrategy; getShadowing(): number; getSignature(): StyleSignatureBasic }
export class StyleBuilder { muteStyle(s: readonly Style[]): StyleBuilder; loadInternal(sig: StyleSignatureBasic, s: Style): void;
  getMergedStyle(sig: StyleSignatureBasic): Style; getMergedStyleSpecial(sig: StyleSignatureBasic, deltaPriority: number): Style | undefined; cloneMe(): StyleBuilder }
```
Consumed by T3a (parser/loader), T3b, T3c, T4a.

## Acceptance
- Given stored styles built from probe inputs, then merged values equal `StyleProbe`'s,
  including star and level priorities.
- Given two styles on one signature, then `muteStyle` merges OVERWRITE_EXISTING_VALUE.
- Given `getMergedStyleSpecial` with no match, then it returns undefined (Java null).

## Architecture decisions (locked)
D1, D8, D11, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/core/style/`
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
`feat(style): port Style, StyleStorage and StyleBuilder`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).

## Orchestrator note (added at the b1 T1a merge, journal rows 11–12)
The T1a port corrected the value-layer contract to the Java: `ValueImpl.regular/dark` statics,
`ValueImpl#mergeWith(Value)` (no strategy; `MergeStrategy` is read in `Style#mergeWith`,
Style.java:121-135), `asFontFace()`/`asHorizontalAlignment()`, `asString(): string | null`, no
`ValueNull.COLOR`. `src/core/style/Value.ts` declares minimal `HColor`/`HColorSet` interfaces
(`getColorOrWhite`, `withDark`) because the port has no concrete `HColorSet`; the test double is
`tests/unit/core/style/helpers/hcolor-set.ts`. Read `src/core/style/*.ts` before starting.
