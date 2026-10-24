# T2g — `HSLColor` arithmetic in Java `float`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2g`. Commit:
`fix(preproc): compute lighten and darken in float32 like HSLColor`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (stops 4, 13).

## Mechanism (sdd2: `hsl-float32`; Java re-read)
`HSLColor.fromRGB` and `toRGB` use `float` throughout
(`klimt/color/HSLColor.java:231-272,326-380`): components come from
`XColor#getRGBColorComponents` as `red / 255.0f` (`klimt/awt/XColor.java:
68-79`), every intermediate is rounded to 32 bits, and `toRGB` ends in
`XColor.fromFloat`, which rounds `Math.round(r * 255.0f)` in float
(`XColor.java:36-45`). `%lighten`/`%darken` go through
`HColorSimple#lighten/#darken` (`HColorSimple.java:98-113`):
`hsl[2] += hsl[2] * (ratio / 100.0)` — a float compound-assigned from a
DOUBLE expression (computed in double, narrowed to float on store) — then
`new HSLColor(hsl).getRGB()`, whose one-argument constructor uses alpha
`1.0f` (`HSLColor.java:74-76,85-88`). Ours computes `rgbToHsl`/`hslToRgb`
in double (`color-utils.ts:77-123`), so a channel on a rounding boundary
differs by 1 (gaxera: 2 units). Wrap every Java `float` expression in
`Math.fround`, in the same evaluation order; keep the double step for the
`ratio / 100.0` product and `fround` only at the store; `fround` the
`h % 360.0f`, `/= 360f`, `1.0f / 3.0f`, `2.0f / 3.0f` constants and the
`Math.round(x * 255.0f)` product. Also read whether `lighten`'s `c.a` carry
(`:134,140`) matches Java's alpha-1.0 construction; change it only if the
Java says so and a fixture shows it (report either way).

## Targets
gaxera-69-muma363 to 0.

## Write-set
`src/core/tim/builtin/color-utils.ts` and its tests (311 lines).

## Read-set
`color-utils.ts:70-145`; Java: `HSLColor.java:228-275,324-382`,
`XColor.java:33-48,68-79`, `HColorSimple.java:95-114`.

## Acceptance
- Given `%lighten("012345", 50)` and gaxera's other calls, when evaluated,
  then each result equals the golden `in.svg` value (unit test citing
  `HColorSimple.java:98-104`); named/hex colours with exact arithmetic are
  unchanged.
- Given gaxera, then it diffs to 0.
- Given the all-engine survey, then no conformant loss and every mover
  explained row by row (any `%lighten/%darken/%hsl_color` fixture in any
  engine is checked).
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
