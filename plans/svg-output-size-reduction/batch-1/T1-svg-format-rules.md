# T1 — Shared SVG format rules module

**Agent:** typescript-pro · **Depends on:** — · **Commit:** `feat(T1): add shared SVG format rules module`

## Context

plantuml-ts is a TypeScript port of PlantUML (Java). This mission ports
upstream's "reduce SVG output size" change (commits `ba68279df92`,
`4f3a0dcc63b`) into **two** SVG emitters. This task builds the shared
rules both emitters will import (ADR-3), so they cannot drift.

This is a **pure, additive** task: create the module and its tests. Do
**not** wire it into any emitter — that is T3/T4/T5. Existing output must
stay byte-identical after this task.

Browser-safe `src/`: no Node built-ins, no `process.env`, no `require`.

## Read-set

- `.agent-notes/svg-output-size-reduction-measured.md` — **the spec.** The
  six rules, read off the upstream Java diff. Do not re-derive them.
- `src/core/number-format.ts` — the whole file (83 lines). `javaFixed4`'s
  HALF_UP-on-shortest-round-trip-decimal algorithm is the one you
  generalize; its doc comment explains why `toFixed` is wrong here.
- `plans/svg-output-size-reduction/decisions.md#adr-2`, `#adr-3`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java`
  — `format`, `formatOpacity`, `formatPercent`, `shortenColor`, `trimZeros`

## Write-set

- `src/core/svg-format.ts` (create)
- `tests/unit/core/svg-format.test.ts` (create)

## Task

Create a leaf module (no imports from klimt or any diagram engine — same
discipline as `number-format.ts`) exporting:

```ts
export const DEFAULT_SVG_DECIMALS = 3;
export function trimZeros(s: string): string;
export function formatDecimal(x: number, decimals: number): string;
export function shortenColor(color: string): string;
export function formatOpacity(value: number, decimals: number): string;
export function formatPercent(value: number, decimals: number): string;
```

Semantics, verbatim from upstream:

- `formatDecimal` — `x === 0` returns `"0"`. Otherwise `%.<decimals>f`
  with Java's HALF_UP-on-shortest-round-trip-decimal rounding (generalize
  `javaFixed4`; keep its documented reasoning), then `trimZeros`. **Do not
  apply a scale factor here** — upstream's `format` multiplies by
  `option.getScale()` at the emitter, which is the emitter's job, not this
  module's.
- `shortenColor` — returns input unchanged unless `length === 7` and
  `charAt(0) === '#'`. If all three pairs have identical digits, return
  `'#' + c[1] + c[3] + c[5]`. `#RRGGBBAA`, named colors, and `url(...)`
  pass through untouched. Null/undefined-safe.
- `formatOpacity` — `<= 0` → `"0"`, `>= 1` → `"1"`, else
  `%.max(decimals,2)f` + `trimZeros`.
- `formatPercent` — `%.max(decimals,2)f` + `trimZeros`, then `+ "%"`.
- `trimZeros` — drop trailing zeros, and the decimal point if it becomes
  orphaned (this is `number-format.ts#trimTrailingZeros`'s behavior; reuse
  or re-export rather than writing a second implementation).

Keep upstream's names (`shortenColor`, `trimZeros`, `formatOpacity`,
`formatPercent`) — porting discipline, they are how the maintainer and 16
years of issues refer to this code.

## Interface contract (consumed by T3, T4, T5, T8)

The six signatures above. `decimals` is always passed explicitly by the
caller; `DEFAULT_SVG_DECIMALS` is the value emitters default their option
to (ADR-2), not a value this module applies implicitly.

## Acceptance criteria

1. Given `#FF0000`, `#FFFF00`, `#000000`, when `shortenColor`, then `#F00`,
   `#FF0`, `#000`.
2. Given `#181818`, `#ADD1B2`, `#FF0000AA`, `red`, `url(#g1)`, when
   `shortenColor`, then each is returned unchanged.
3. Given `8.69375` and decimals 4, when `formatDecimal`, then `8.6938` —
   the HALF_UP-on-shortest-decimal case `number-format.ts` documents
   (`toFixed(4)` would give `8.6937`). This proves the generalization did
   not lose the existing algorithm.
4. Given `0` then `"0"`; given `77.8125` and decimals 3 then `77.813`;
   given `28.4805` and decimals 3 then `28.481`.

   > **Corrected 2026-08-08 (T1 execution).** This criterion originally
   > read `28.48`. That was a transcription error: `28.4805`'s shortest
   > round-trip decimal is `28.4805`, so HALF_UP on the 4th decimal rounds
   > **up**. Verified on a live JVM —
   > `String.format(Locale.US, "%.3f", 28.4805)` → `28.481`. The Java is
   > the spec (CLAUDE.md); the implementation follows it.
5. Given opacity `0`, `1`, `0.5` with decimals 3, when `formatOpacity`,
   then `"0"`, `"1"`, `"0.5"`.

## Observability

N/A — no new observable operations. This is a pure-function leaf module.

## Rollback

**Reversible** — additive module with no callers; reverting the commit
removes it cleanly.

## Quality bar

- `npm run typecheck`, `npm run lint`, `npm run build`, and cold-tree
  `npm test` all pass. Never pipe a gate.
- Coverage thresholds are 90/90/90; a pure-function module should be at
  or near 100.
- Every exported function carries a JSDoc `@see` to its Java origin, e.g.
  `/** @see .../klimt/drawing/svg/SvgGraphics.java#shortenColor */`.

## Boundaries

- **Always:** keep upstream names; keep the module free of klimt/diagram
  imports.
- **Never:** wire this into an emitter (T3/T4/T5 own that); modify
  `number-format.ts` (T8 owns its retirement); run any `git` command.
