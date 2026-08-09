## Observation: a fixture that ERRORS in renderSync is excluded from the dot-sync denominator

- **Context**: SI5a batch 5 — wiring `!include` into the TIM interpreter. Needed
  to know whether making an unresolved include *throw* could regress
  `scripts/dot-sync-report.ts`.
- **Finding**: `dot-sync-report` counts only fixtures that produce a DOT dump. A
  fixture whose `renderSync` throws (error SVG, no layout call) emits no DOT and
  drops out of BOTH numerator and denominator — e.g. `component` reports
  `251/259` out of 384 fixtures in `tests/visual/data/component.json`.
  Consequence, and it cuts both ways: turning an error into a *rendered but
  wrong* diagram GROWS the denominator and lowers the ratio, even though nothing
  regressed. Making an already-failing case throw is free; making it render is
  not.
- **Impact**: when changing error behavior, check whether the affected fixtures
  currently error. Here all 10 include-bearing fixtures across component/usecase/
  class/object/state are stdlib angle-bracket includes that already hit
  `renderSync`'s `!include` guard, so keeping them an error (a typed
  `StdlibNotBundledError` instead of the guard) left every number identical.
- **Confidence**: High (verified: report numbers byte-identical before/after).

## Observation: `TContext#executeOneLineSafe` flattens any non-EaterException

- **Context**: the include seam's typed errors (`IncludeNotFoundError`,
  `StdlibNotBundledError`) were arriving at the caller as
  `EaterException: Fatal parsing error`.
- **Finding**: `src/core/tim/TContext.ts#executeOneLineSafe` catches everything
  and rethrows `new EaterException('Fatal parsing error', s)` unless it is
  already an `EaterException` (faithful to upstream's `RuntimeException` wrap).
  Any new typed error thrown from inside the interpreter must be carved out
  there or it is erased. The seam's errors now share an `IncludeError` base
  class purely so that one carve-out is a single `instanceof`.
- **Impact**: applies to any future error type raised inside the interpreter.
- **Confidence**: High (observed in a failing test, fixed at the site).
