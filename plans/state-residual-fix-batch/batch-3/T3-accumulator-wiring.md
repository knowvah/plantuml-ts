# T3 — G21: concurrent-region accumulator gets its font and measurer

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the spec. vitest, tests under `tests/unit/state/`.

Batch 2 (T2) already edited a DIFFERENT function in this same file
(`regionInkGeometry`). Your edit is `buildConcurrentBranchAcc`, ~95 lines
away. Do not disturb T1's work.

## Task
`newAccumulator` is declared with both parameters optional
(`state-composite-pass.ts:98`):

```ts
export function newAccumulator(labelFont?: FontSpec, measurer?: StringMeasurer): PassAccumulator
```

and its spread guards mean a no-arg call omits both keys entirely. The three
call sites currently read:

- `state-composite-autonom.ts:195` — `newAccumulator(resolveArrowLabelFont(ctx.theme), ctx.measurer)`
- `state-composite-pass.ts:281` — `newAccumulator(resolveArrowLabelFont(theme), measurer)`
- `state-composite-concurrent.ts:235` — `newAccumulator()`  ← **the bug**

1. Fix the third to match its siblings, adding the one import it needs.
2. **Verify `jetuse-93-gopi146` (scope3 width idx0, −5.000 px) under this
   hypothesis — do not assume it.** SI29 named it a candidate and explicitly
   did not assert it ("Not asserted as shared; needs its own re-measurement").
   If the fix closes it, say so with the measurement. If it does not, diagnose
   the residual to a mechanism with a `file:line` and journal it; per D6 you
   leave that row open rather than chasing it.

## Write-set
- `src/diagrams/state/state-composite-concurrent.ts` —
  `buildConcurrentBranchAcc` and its imports ONLY.
- The module's unit test.

## Read-set
- `plans/state-declared-size-fix/findings/G21-dot-identical-geometry.md` — the
  whole record; `causalChain` carries the instrumented numbers
  (`203.09486328636427 + 61 + 12 = 276.09486…`) and `sizeEstimate` states the
  blast radius
- `decisions.md#d6`
- `src/diagrams/state/state-composite-pass.ts:98` (`newAccumulator`) and `:281`
  (correct sibling); `src/diagrams/state/state-composite-autonom.ts:195`
  (correct sibling)
- `src/diagrams/state/state-transition-label.ts:362-395` — the
  `measured !== undefined` gate you are unblocking, and the
  `perpendicularOffsetLabel` fallback it currently takes
- `src/diagrams/state/layout-ink-extent.ts` — `addTransitionInk`, which folds
  the label box (or, today, only the anchor point) into the region's extent
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135`
  and `.../ConcurrentStates.java:137-144` — jar folds each region's real label
  ink into `inner.calculateDimension()` before the composite sees a number.
  **Read both method bodies.**

## Architecture decisions (locked)
D4 (T2 owns `regionInkGeometry`; you own `buildConcurrentBranchAcc`), D6
(`jetuse-93` verified, not assumed).

## Acceptance
- Given `zacajo-09-tamu628`, when the harness runs, then scope4 width idx1 is
  exact (−3.733 → 0).
- Given `jetuse-93-gopi146`, then EITHER its scope3 width idx0 is exact, OR
  the decision journal carries its distinct mechanism with a `file:line` and
  the row stays open.
- Given all three `newAccumulator` call sites, then each passes both a
  `labelFont` and a `measurer` (assert in a unit test that a
  concurrent-region accumulator carries both).
- Given `render-manifest`, then every moved fixture is on
  `expected-moves.txt` under a `# Batch 3` heading, each with a one-line
  jar-side account of what moved and why it is jar-ward. A move you cannot
  account for is stop 4.
- Given the harness, then `0 rows appeared or grew`.

## Interface contracts
`PassAccumulator` gains no fields — the two optional keys are already declared
and simply start being populated at this site. No downstream signature changes.

## Observability
N/A — no new observable operations. Note for the close-out that this task
changes **emitted SVG**, which is the mission's one consumer-visible output
change.

## Rollback
Reversible: one commit, one call site plus an import.

## Quality bar
All four gates green, coverage >= 90/90/90. TDD: the unit test asserting the
accumulator carries both keys should fail first.

## Boundaries
- **Always:** account for every manifest move against the jar's own render.
- **Ask first:** nothing.
- **Never:** touch `regionInkGeometry` (T2's); revert a manifest move blindly
  to make the gate pass; run git.

## Report (<=500 tokens)
zacajo-09 before/after; the `jetuse-93` verdict with its evidence; the list of
moved fixtures with accounts; confirmation all three call sites now match.
