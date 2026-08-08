# Batch 1 — Isolate the mechanism

**This batch produces a diagnosis, not a fix.** Per
`~/.claude/rules/diagnosis.md`, no change is proposed until the mechanism,
its origin (`file:line`), the causal chain, and what was ruled out can all
be stated. The decomposition beyond this batch depends on what T1 finds,
which is why it does not exist yet.

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T1 | Locate where our spline first departs from the jar's | investigation only — no source changes | — | [x] |

## Gate

Normal. Nothing in this batch changes `src/`, so all four gates must stay
green exactly as they are today, and
`npx tsx scripts/rebaseline-svg-goldens.ts` must stay `CHANGED=0`.

## The three candidates, and how to tell them apart

Ordered by how cheap they are to eliminate:

1. **The layout engine computes a different spline.** Our DOT input is
   byte-identical to the jar's (`parity-class.json`: `dotEqual: true`), so
   feed that same DOT to `@knowvah/dot-engine` and read the raw control
   points back. If they already differ from the jar's before any of this
   port's code touches them, the cause is the library and the deliverable
   is a `docs/graphviz-issues/` entry.
2. **Post-layout clipping moves the point.** `spline-clip.ts`'s
   `simulateCompound` subdivides 8 times (1/256). A ~0.0097 divergence is
   suspiciously near that granularity. Compare our subdivision count,
   starting interval and midpoint rule against upstream's
   `DotPath#simulateCompound`.
3. **Edge-geometry assembly** in `class-edge-geo.ts` transforms the point
   after clipping.

The test that separates 1 from 2/3: **read the spline at each stage** —
raw from the layout engine, after clipping, and as emitted — and find the
first stage where it is no longer the jar's value. That is the origin, and
it decides the entire rest of the mission.

## Do not

Change the tolerance, the golden, or `accepted-divergences.json`. See the
mission README's "Do NOT" section for why each is off the table.
