# T2a — `#RRGGBBAA` fills split; fore == back paths drawn strokeless

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2a`. Commit:
`fix(svg): split alpha hex fills and drop strokes on same-colour paths`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (D8, stops 4, 13).

## Mechanism (sdd2: `alpha-hex-fill-unsplit`, `upath-fore-equals-back-strokeless`)
`SvgGraphics#fillMe` writes an 8-digit fill as `fill=#RRGGBB` plus
`fill-opacity = alpha/255` (`klimt/drawing/svg/SvgGraphics.java:880-887`);
`DriverPathSvg#draw` draws a path whose colour equals its back colour (neither
a gradient) with `setStrokeColor("")` and `setStrokeWidth(0, null)`
(`DriverPathSvg.java:65-69`; sdd2 cited `:64-67`/`:65-68`). The class-driver
path is ALREADY ported: `svg-graphics-core.ts:336-346` (`fillMe`) and
`driver-path-svg.ts:55-64` — do not touch them. The gap is the string
emitters sequence draws through: `rect`/`path`/`polygon` in `svg-shapes.ts`
(`rect` at `:49-76`, `path` at `:240-262`) resolve the fill through
`resolvePaint`, which only shortens the colour, and emit a stroke whenever
asked. Port both rules INSIDE the emitters, by post-processing
`resolvePaint`'s result (an 8-digit `#RRGGBBAA` value -> value + `fill-opacity`
via `formatOpacity`); `src/core/svg.ts` is T2c's file and is not edited — if
the split cannot be done without it, that is stop 1. T0b has split
`svg-shapes.ts`: read its result (`git log` of batch 0) and write the
post-split files, not a monolith.
The fore==back rule at an emitter belongs to whoever decides the stroke:
`strokeAttrsOf` (`svg-shapes.ts:36-43`) already omits the stroke when the
width formats as `"0"`, so a caller passing `strokeWidth: 0` for a
fore==back path is the mechanism; the sequence-side callers are T2b's
(`renderer-frame-blotter.ts:177`). zuravu's emitter site is NOT yet located:
find it first; if it is `renderer-frame-blotter.ts`, hand it to T2b (stop 1),
if elsewhere in sequence outside this write-set, report it.

## Targets
kixani-97-giji283 (also needs T2b's `+1`/band part), vasuvo-82-boxu402,
koleji-09-doni016, nofegi-58-kilo738, xeneru-44-kuma826, darupa-17-dujo243,
meleno-54-zume276, xebixi-82-duji787, gadiva-05-pogi376 (document background:
find its emitter), nivelo-54-caze822, xonimo-63-fure722, zogane-85-raja214,
zuravu-52-mike252. Expected: the alpha-fill rows to 0; kixani/vasuvo/zuravu
conditional on T2b and the located stroke site. State per row which
mechanism closed it.

## Write-set
`src/core/svg-shapes*.ts` (the post-T0b files) and their tests.

## Read-set
`svg-shapes*.ts` rect/path/polygon (`svg-shapes.ts:30-76,236-262,332-362` before
the split); `svg.ts:214-240` (`resolvePaint`, read-only); `klimt/drawing/svg/
svg-graphics-core.ts:330-346`, `driver-path-svg.ts:40-70`; Java:
`SvgGraphics.java:876-890`, `DriverPathSvg.java:58-75`.

## Acceptance
- Given a `#00FF0040` fill, when `rect`/`path`/`polygon` emit, then
  `fill="#0F0" fill-opacity="0.25"` (`formatOpacity`), and 6-digit and named
  fills are byte-identical to before (unit test citing `:880-887`).
- Given each target, then it diffs to 0 or is listed with its remaining
  mechanism and owner; every mover in every engine (survey diff vs the
  previous close) is explained row by row — no unexplained non-sequence
  mover (stop 13), no conformant loss in any engine.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
