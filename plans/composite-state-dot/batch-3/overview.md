# Batch 3 — border-point pins

Independent of batches 1-2. Split into a DIAGNOSIS task and a FIX task, with the
fix blocked on the diagnosis — the same shape that worked for the port-label
collision port, and for the same reason: the mechanism is not yet known, and a
plausible-looking fix without one would encode a guess.

## The gap

On `temuxi-28-cega322`, `<<inputPin>>`/`<<outputPin>>` members end up in the wrong
place relative to their composite frame. Document height 316 against jar's 418.

## What is ALREADY verified — do not re-walk

- **Nothing is missing.** Element inventories are identical (20 rects, 13 paths,
  2 ellipses, 29 texts, same strings). The `childCount` diff is `<g>` grouping and
  order, not absent content.
- **Recognition works.** `parseState` + `getEntityPosition` classify all seven pins
  correctly at runtime.
- **The frontier port is faithful.** `borderPointMemberIds` is populated for all
  four clusters; `borderPointBox` partitions correctly; `frontierCalculator` fires,
  taking `flop`'s raw polygon `(y=-8.000012, h=171.5)` to `(y=6, h=143.5)` — exactly
  the pin centres. `Cluster#manageEntryExitPoint` (`Cluster.java:410-436`) does the
  identical thing: non-normal nodes contribute `getPointCenter()`, normal ones
  rectangles, then `FrontierCalculator` + `ensureMinWidth`.
- **Therefore the defect is UPSTREAM of the frontier.** Shrinking to pin centres is
  by definition `span(pin centres)`. Ours spans 143.5, which IS our frame height;
  jar's frame is 170, so jar's pin centres span 170. The pins are laid out 26.5px
  closer together than jar's. The frontier faithfully reports whatever it is given.
- **"Jar puts pins outside the border" is NOT the rule.** Pins straddling their
  frame is what both implementations do — the frame is defined as passing through
  their centres. The visible outside-ness is a consequence of a taller frame.

## Tasks

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | **Diagnose** why our pin centres span 143.5 where jar's span 170 | debugger | none (diagnosis) — findings to `decision-journal.md` | — | [x] |
| T6 | Implement the fix | typescript-pro | `graph-layout-build.ts`, `graph-layout-build-borderpoint.ts`, `tests/unit/core/graph-layout-build.test.ts` | T5 | [x] |

**If T5's mechanism lands outside `src/diagrams/state/state-composite-*.ts` or
`state-dot-graph.ts`, STOP.** T6's write-set is deliberately open; widening it
without a decision is how a scoped mission becomes an unscoped one.

## Exit bar

`temuxi-28-cega322` reaches document height 418 with each pin-bearing frame
matching jar's, and no state fixture rises. If that cannot be reached, T5's
mechanism entry says which number and why, with the measurement.
