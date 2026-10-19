# T7b — pavuzo: uniform 1 px x shift (item 16)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `gtc-S`. Depends on T7a.

## Context
After T7a, every numeric diff in pavuzo is exactly Δ1 in x: svg width 218 vs 219, and every element sits 1
px left of the jar. The TRACKER 16 history traces the composite width chain:
`SvekResult.java:130-133` `delta(15,15)`, `InnerStateAutonom.java:186-195` `+20`, mirrored by
`computeSvekResultGeometry` (`layout-ink-extent.ts`) and `measureAutonomWrapper`
(`state-composite-sizing.ts`). Issue 17 placed the old 1.583 in the ortho edge port offset. It is now 1.0:
measure where it enters (a `LimitFinder` ink term, an integer cast, or the outer canvas `minX`) before
touching any arithmetic. A uniform shift means the error is in the global translate or the canvas extent,
not per-element.

## Task
Instrument (gated, reverted) to locate the first value that departs from the jar. Write the diagnosis
artifact, fix at the origin, add a test.

## Write-set
`src/diagrams/state/**` files named in the artifact, `tests/unit/state/**`.

## Acceptance
- Given pavuzo, when rendered, then the svg width is 219 and render-diff is 0/0.
- Given the state survey, then there are no losses; every mover has a mechanism (a canvas term is shared,
  so expect movers).
- Given the state golden ratchet, then it is green.

**Observability:** N/A. **Rollback:** reversible.
