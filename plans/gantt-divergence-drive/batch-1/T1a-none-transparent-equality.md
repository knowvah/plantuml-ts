# T1a — none/transparent equality in the path driver (D1)

Agent: `typescript-pro` (sonnet), worktree `gdd-T1a`. Commit:
`fix(core): treat the default none paint as HColors.none() in the path fast path (T1a)`.
Read [../task-contract.md](../task-contract.md) first.

## Diagnosis artifact (planning, 2026-10-27)
- **Symptom:** `xureco-57-lene839` (three tasks `… with transparent link`):
  three `<path>` elements carry `style="stroke:none;"` where the jar emits
  none (`npx tsx $T/diff-one.mts xureco-57-lene839` → 3 diffs, all `svg/g/path/@style`).
- **Mechanism:** `src/core/klimt/AbstractCommonUGraphic.ts:53,106-107` seed
  colour and back colour with the string `'none'`; the Java seeds both with
  `HColors.none()` (`AbstractCommonUGraphic.java:61-62`), which is the
  transparent `HColorSimple` `TRANSPARENT` (`HColors.java:133-135`). A
  transparent link colour is an `HColorSimple` (`HColorSet.ts:163`
  `TRANSPARENT`), so `driver-path-svg.ts:41-44` `paintsEqual(color, back)`
  is false and the fast path of `DriverPathSvg.java:64-68` (fill = colour,
  stroke colour `""`, stroke width 0, no `style`) never fires; the else arm
  (`applyStrokeColor`) writes `stroke:none`.
- **Ruled out:** `GanttConstraint`/`GanttArrow` (they hand `HColors.transparent()`
  exactly as `GanttArrow.java` does); the stroke driver (identical arms);
  `toSvgPaint` (`#00000000` as `HColor.java:74-79`).

## Task (D1, option B — the only decision; do not seed the singleton)
In `paintsEqual`, return true when one side is the string `'none'` and the
other an `HColorSimple` whose `isTransparent()` is true (both orders), with a
comment citing `HColors.java:133-135` and `XColor.java:91-98`. Keep gradients
unequal (java:64-65) and keep the string/string and simple/simple arms.
Export nothing new. Then: `npx tsx $T/diff-one.mts xureco-57-lene839` → 0.

## Tests (first)
`tests/unit/core/klimt/drivers.test.ts` (existing): a `UPath` drawn with
`HColorSimple` transparent over the default back emits no `style`, `fill`
per `toSvg` and stroke width 0; an opaque colour over the default back keeps
its stroke style; a transparent colour over an opaque back keeps the else arm.
Cite `DriverPathSvg.java:64-72`.

## Write-set
`src/core/klimt/drawing/svg/driver-path-svg.ts`, `tests/unit/core/klimt/drivers.test.ts`.

## Acceptance
- Given a transparent `HColorSimple` colour and the default back, when a `UPath` is drawn, then the element has no `style` attribute and the fill is the colour's `toSvg` (`DriverPathSvg.java:66-68`).
- Given an opaque colour over the default back, when drawn, then the output is byte-identical to before.
- Given xureco through the harness, then diffs go 3 → 0; `npx vitest run tests/oracle/svg-conformance --maxWorkers=2 --coverage.enabled=false` green (every engine's golden ratchet; report any mover by slug — the orchestrator's chain decides).

Observability: N/A. Rollback: Reversible.
