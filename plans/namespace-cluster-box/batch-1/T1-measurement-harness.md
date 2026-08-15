# T1 — commit the measurement harness

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the specification. This mission changes how a class or
object package's box is computed, and **both standing gates are blind to it**:

- the class DOT-parity comparator checks cluster *membership* only and
  normalizes protection nesting away (`tests/oracle/svek-dot.ts` file doc
  comment);
- `scripts/svg-conformance-census.ts` stops recursion at a `childCount`
  mismatch, so it was byte-identical across the last two real fixes on this
  branch.

This task builds the gate the rest of the mission is judged by. It was
developed as a scratch script during planning; this commits it properly.

## Task

Write `scripts/shape-match-report.ts`, a node script (run via
`npx tsx scripts/shape-match-report.ts`) that walks
`test-results/dot-cache/{class,object,state}/*/`, renders each fixture's
`in.puml` through the same helpers the oracle suites use
(`tests/oracle/svg-conformance/render-fixture-class.ts` for class AND object,
`render-fixture-state.ts` for state) with a `DeterministicMeasurer`, and
compares the drawn primitives against the cached `in.svg`.

For each fixture report: matched shapes / total, our document `WxH`, jar's
document `WxH`. Then print totals.

Two details that matter, both learned the hard way during planning:

1. **Match under best rigid alignment, not absolute coordinates.** Document
   normalization moves every shape together, so an absolute comparison scores
   a whole-document shift as "everything wrong" — and, worse, scores a
   wrongly-sized box as "matching" when its top-left happens to coincide.
   Collect candidate offsets from same-tag same-size pairs, take the top few
   by frequency plus `(0,0)`, and report the best.
2. **Compare size as well as position.** A shape whose `x`/`y` match but
   whose `width`/`height` do not is not a match. The planning-time harness
   initially ignored size and reported 8 false regressions.

Extract per-shape geometry for `rect`, `ellipse`, `line`, `text`, `path`,
`polygon`. For `path`/`polygon` use the min corner of the coordinate list.

## Write-set

- `scripts/shape-match-report.ts` (create)

## Read-set

- `tests/oracle/svg-conformance/render-fixture-class.ts` — the render helper
- `scripts/svg-conformance-census.ts` — for the existing script conventions
  (arg parsing, output shape)
- `plans/namespace-cluster-box/README.md#the-measurement-that-matters`

## Interface contracts

Consumed by every later batch as the pass/fail gate. Stable output contract:

```
<type>/<slug> <matched>/<total> <ourW>x<ourH> <jarW>x<jarH>
```

one line per fixture, followed by two total lines. Keep it diffable — later
tasks diff two runs.

## Acceptance criteria

- Given the 1069-fixture cache on an unmodified tree, when the script runs,
  then it reports **691** fixtures whose document size equals jar's and
  **20685** rigid-aligned matched shapes.
- Given a fixture that fails to render, when the script runs, then it emits
  a line marked `ERR` and continues rather than aborting the run.
- Given two runs of the script, when their outputs are diffed, then only
  genuinely changed fixtures appear.

If the baseline numbers do not reproduce, the harness is wrong — do not
adjust the pinned numbers to match a new harness. STOP and report.

## Observability requirements

N/A — no new observable operations. This IS the mission's observability.

## Rollback

Reversible. New file, no consumer in `src/`.

## Quality bar

All four gates green: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run build`. Never pipe `npm test`.

## Boundaries

- **Always:** keep the script out of `src/` — it is tooling, and YAGNI
  applies to tooling (CLAUDE.md), so no options nobody asked for.
- **Never:** run any git command. The orchestrator commits.
- **Never:** modify any fixture under `test-results/`.
