# T3 — klimt core: rules 1, 2, 4, 6 + root `g` attributes

**Agent:** typescript-pro · **Depends on:** T1 · **Commit:** `feat(T3): apply upstream SVG size reduction to klimt emitter core`

## Context

`src/core/klimt/drawing/svg/svg-graphics-core.ts` is this port of
upstream's `SvgGraphics.java`. It owns the document skeleton (root `g`),
the style-string builder, color resolution and numeric formatting. This
task applies four of the six rules here, plus the root-`g` half of rule 3.

⚠️ **The goldens are stale until batch-2d (ADR-5).** SVG-comparing tests
WILL fail after this task. That is expected and is not a stop condition.
`npm run typecheck` and `npm run lint` must still pass.

## Read-set

- `.agent-notes/svg-output-size-reduction-measured.md` — **the spec**
- `src/core/svg-format.ts` — T1's module; import, do not reimplement
- `src/core/klimt/drawing/svg/svg-graphics-core.ts` — specifically
  `SvgOptions` (~:83-100), `getG` (:370), `fixColor` (:332), the style
  builder (:315-316), `fill-opacity` (:326), `createSvgGradient` stop-color
  (:409, :412), `format` (:432)
- `plans/svg-output-size-reduction/decisions.md#adr-2`, `#adr-3`
- `~/git/plantuml/.../klimt/drawing/svg/SvgGraphics.java` at pin `11ed6720`

## Write-set

- `src/core/klimt/drawing/svg/svg-graphics-core.ts`
- its existing test file(s) under `tests/unit/core/klimt/drawing/svg/`

## Task

**Rule 1 — decimal as an option (ADR-2).** Add `decimal` to the
`SvgOptions` interface, defaulting to `DEFAULT_SVG_DECIMALS` (3). Rewrite
the private `format()` to delegate to `formatDecimal(x * scale, this.option.decimal)`.
Keep the existing `x === 0 → "0"` short-circuit and the scale
multiplication **here** — T1 deliberately does not scale.

**Rule 2 — `shortenColor`.** Apply at every color-emitting site:
`fixColor`'s result, the `stroke:` value in the style builder, and both
`stop-color` assignments in `createSvgGradient`. Import from T1's module.

**Rule 4 — `stroke:none` suppression.** The style builder currently emits
`stroke:${stroke};stroke-width:${w};` unconditionally and appends
`stroke-dasharray` separately. Move **both** `stroke-width` and
`stroke-dasharray` inside a single `stroke !== 'none'` guard, matching
upstream's `if ("none".equals(stroke) == false)`.

**Rule 6 — opacity/percent.** Replace the literal `opacity.toFixed(5)` at
:326 with `formatOpacity(opacity, this.option.decimal)`. Route any percent
formatting through `formatPercent`. The module doc comment at :123-126
documents the old `toFixed(5)` bypass — update it, don't leave it lying.

**Rule 3 (root half only).** In the constructor where `gRoot` is created
(:171), set `font-family="sans-serif"` unconditionally, and `lengthAdjust`
to `spacing` or `spacingAndGlyphs` per `option.lengthAdjust`. Per-element
removal is T4 — do not touch `svg-graphics-elements.ts`.

## Interface contract (consumed by T4)

After this task the root `g` carries `font-family` and `lengthAdjust`, and
every descendant text element inherits them. `SvgOptions.decimal` exists
and defaults to 3. T4 relies on both.

## Acceptance criteria

1. Given `stroke:none`, when the style string is built, then it contains
   neither `stroke-width` nor `stroke-dasharray`.
2. Given a stroke, fill, or gradient stop of `#FF0000`, when emitted, then
   `#F00`; given `#181818`, then unchanged.
3. Given any coordinate, when emitted, then 3 decimals with trailing zeros
   trimmed (`77.8125 → 77.813`, `28.4805 → 28.481`).

   > **Corrected 2026-08-08 (T1).** This read `28.4805 → 28.48`. Wrong:
   > `28.4805`'s shortest round-trip decimal is `28.4805`, so HALF_UP on
   > the 4th decimal rounds **up**. Verified on a live JVM —
   > `String.format(Locale.US, "%.3f", 28.4805)` → `28.481`.
4. Given the root `g`, when the document is built, then it carries
   `font-family="sans-serif"` and the correct `lengthAdjust`.
5. Given `fill-opacity`, when emitted, then `formatOpacity`'s form — `0`
   and `1` collapse to `"0"`/`"1"`, not `"0.00000"`/`"1.00000"`.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — but only together with the rest of batch-2a–2d (ADR-5).
Reverting this commit alone leaves the emitter half-ported.

## Quality bar

- `npm run typecheck` and `npm run lint` pass. **Cold-tree `npm test` is
  expected to fail** on SVG-comparing suites until batch-2d.
- Every changed site keeps or gains a JSDoc `@see` to its Java origin.
- Do not refactor adjacent code. Porting discipline: this file is a
  faithful port; change only what the six rules require.

## Boundaries

- **Always:** import the rules from `src/core/svg-format.ts` (ADR-3).
- **Ask first:** if a rule appears to need a change in a file outside the
  write-set — that is a stop condition, log it.
- **Never:** touch `svg-graphics-elements.ts` (T4) or `core/svg.ts` (T5);
  regenerate goldens; run any `git` command.
