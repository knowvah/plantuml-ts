# T1a: edge paint — lollipop colour and gradient arrows

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
1. **sejube (`link-middle-decor-partial`, cdd6 row 63).** `skinparam
   ArrowLollipopColor` has no path to the class Theme, so the `(0` middle decor's
   inner circle is filled with the background (#FFF) where the jar fills #F00.
   Upstream: `SvekEdge.java:266-268` reads `ColorParam.arrowLollipop` and falls
   back to `backgroundColor`; `:986` hands it to
   `MiddleCircleCircled.java:74-75`. Port per D2: an accumulator field
   (`skinparam-key-handlers-table-a.ts`, next to the `arrowcolor` handler at
   `:110-113`; `skinparam-accumulator.ts`), one Theme field, read at the middle-decor
   call site `class/renderer-edge.ts:401-411` (`buildMiddleDecorMarkup`) — follow the
   fill through `renderer-arrowhead.ts`'s existing parameters rather than adding a
   second colour channel. Fallback = background, as upstream.
2. **bisefo (`skinparam-gradient-flattened`, cdd6 row 42).** The `arrowcolor`
   handler stores the flattened `color` (`resolveColor`), so `Red/Green` lands
   verbatim in `stroke=` and no gradient def is emitted. Per D3 `acc.arrow` becomes
   `Paint` via `resolveColorPaint` (`skinparam-key-handlers.ts:155`); the 26 files
   reading `.arrow` are typecheck-driven: those needing a flat string call
   `core/paint.ts`'s flatten helper (journal the list in your report). The class
   edge renderer emits the gradient through `HColorGradient` and the klimt svg
   driver path (`driver-path-svg.ts`, mindmap-engine-port T6a) — never a hand-built
   def. Quote the upstream gradient direction for edges (`HColorGradient.java`,
   `UGraphicSvg`/`SvgGraphics` `getGradientId` path) before choosing the def's
   attributes.

## Rows
- `unknown/sejube-03-bote542` (structural 1: `ellipse@fill` #F00 vs #FFF)
- `unknown/bisefo-56-dumu120` (edge stroke + missing gradient def)

## Write-set
- `src/core/skinparam-key-handlers-table-a.ts`
- `src/core/skinparam-accumulator.ts`
- `src/core/theme*.ts` — exactly the file that declares the arrow colour fields
- `src/core/paint.ts` (flatten helper only if none exists)
- the `acc.arrow` consumers typecheck names (pure type move — journal each)
- `src/diagrams/class/renderer-edge.ts`, `src/diagrams/class/renderer-edge-extras.ts`,
  `src/diagrams/class/renderer-arrowhead.ts` (fill parameter only)
- their unit tests under `tests/unit/`

## Read-set
`decisions.md#D2`, `#D3`; cdd6 journal rows 42, 63; `SvekEdge.java:160-170,260-270,980-990`;
`MiddleCircleCircled.java`; `skinparam-key-handlers.ts:150-175`;
`src/core/klimt/color/HColorGradient.ts`; `driver-path-svg.ts` (gradient arm).

## Interface contracts
Out: `Theme.arrowLollipopColor?: string` (hex or undefined → background at draw);
`SkinparamAccumulator.arrow: Paint | undefined`. Consumed inside this task only.

## Acceptance
- Given `skinparam ArrowLollipopColor #F00` and a `(0` middle decor, when rendered,
  then the inner ellipse fill is `#F00`; without the skinparam it is the background.
- Given `skinparam arrowColor Red/Green`, when rendered, then exactly one
  `<linearGradient>` def is emitted and the edge stroke references it; a flat colour
  emits no def and the output is byte-identical to before.
- Given sejube and bisefo, when render-diff runs, then 0/0.
- Given the description/state/object/usecase/component surveys (they share the
  accumulator), then 0 conformant losses; movers reported with mechanisms.

## Architecture decisions (locked)
D2, D3, D7, D11. One style path; upstream names.
