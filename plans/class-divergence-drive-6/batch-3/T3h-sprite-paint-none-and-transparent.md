# T3h: sprite-paint-none-and-transparent

Added at the b2 close (journal rows 40–41). Core sprite paint, every engine (D7).
The class-side ambient-stroke forward (`renderer-usymbol-entity.ts:236`) is done by
the orchestrator in the b2 residual round; measure your rows AFTER the b2 close.

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: journal row 40.

## Task (TDD)
1. **`none` paint identity.** `svg-nanoparser-shapes.ts:140` (`fillString === 'none'`)
   uses the literal sentinel `NONE_PAINT = 'none'` (`:48`) while
   `ColorResolver.getTrueColor('none')` resolves to `{r:0,g:0,b:0,a:0}` → `#00000000`
   (`HColorSet.ts#toSvgHex`). Upstream both are the one `HColors.none()` singleton, so
   `DriverPathSvg.java`'s `color.equals(back)` fires and no stroke attribute is
   written; the port's `driver-path-svg.ts#paintsEqual` compares two different
   strings and emits `style="stroke:none;"`. Make the two paths agree (one
   representation of "none", per `HColors.none()`), quoting `SvgNanoParser.java:187-215`
   and `DriverPathSvg.java`.
2. **`transparent` keyword.** `HColorSet.ts#parseSimpleColor` has no `transparent`
   entry (only `resolveColorToSvgHex` handles it), so `getColorOrWhite("transparent")`
   falls back to WHITE → `fill="#FFF"` where the jar writes `fill="none"`. Port
   `HColorSet.java`'s handling (quote the lines) into `parseSimpleColor`.

## Rows
- `unknown/jefidu-98-gisu131` (sprite-ambient-stroke)
- `unknown/sprite-SVG-Fill-Stroke-Combinatory-1` (sprite-ambient-stroke)

## Write-set
- `src/core/klimt/sprite/svg-nanoparser-shapes.ts`
- `src/core/klimt/sprite/ColorResolver.ts`
- `src/core/klimt/color/HColorSet.ts`
- their unit tests under `tests/`

## Read-set
journal row 40; `src/core/klimt/drawing/svg/driver-path-svg.ts#paintsEqual` (read-only); `SvgNanoParser.java:187-215`, `DriverPathSvg.java`, `HColorSet.java`, `HColors.java`.

## Interface contracts
none. Every engine renders sprites through these files: run ALL the non-class ratchets in the Quality bar and report every mover with its mechanism.

## Acceptance
- Given jefidu and sprite-SVG-Fill-Stroke-Combinatory-1, then 5/0 → 0/0 or the residual is stated.
- Given the non-class ratchets, then every mover is reported with its mechanism (expected: toward the jar).

## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D2, D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin) (report the collected file count). `npm run
typecheck`; `npx eslint <changed files>`. No full `npm test`. New src module ⇒
`npm run catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per
function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules: README "Execution
rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism.
- Never: fit a value, touch the oracle or dot-engine, push.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
