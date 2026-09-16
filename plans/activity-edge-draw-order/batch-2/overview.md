# Batch 2 — parallel connector order (rule a)

Sequential after Batch 1: measured against T2's `measurements/t2.json` so the
move is attributable to this rule alone.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Push every in-connector, then every out-connector | typescript-pro | `src/diagrams/activity/layout/walk-fork-branches.ts`, `tests/diagrams/activity/layout/{tile-layout,tile-coordinates,swimlane-placement}.test.ts` and `compress/{compress-geometry,invariant}.test.ts` ONLY where the order breaks them, `measurements/t3.json` | T2 | [x] |

Spec: [`T3-parallel-connector-order.md`](T3-parallel-connector-order.md).
Expected movers: split and fork rows of [`../fixtures.md`](../fixtures.md).
~~`misiji-27-buje656` rose +32 under this rule alone in the planning scratch —
T1's Q5 says whether T2 already removed that (stop 5 either way).~~
**STALE, corrected at execution (2026-09-15):** T1's Q5 answered that T2
absorbs it, and T3 measured `misiji` at **173 under T2 and 173 under T3** —
it did not move at all. Rule (a) is not wrong here, merely unobservable once
(b) lands.

**Red allowance** (README) still applies; T4 re-pins once.
