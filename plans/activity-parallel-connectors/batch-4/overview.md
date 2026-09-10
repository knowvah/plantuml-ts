# Batch 4 — pre-compression parallel geometry

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | `computeNewFtile`'s margins and centring; delete `BAR_OVERHANG` and the fork's `NODE_MARGIN_X` | typescript-pro | `src/diagrams/activity/tiles/gtile-fork.ts`, `src/diagrams/activity/activity-layout-constants.ts`, `tests/diagrams/activity/tiles/gtile-fork.test.ts`, `tests/diagrams/activity/tiles/gtile-split.test.ts` | T3 | [ ] |

**Stop condition 7's ONE pre-named mechanism lives here:** widths and x on
split/fork fixtures rise because our 28 px inter-branch gap is what the jar
shows BEFORE `CompressionXorYBuilder` removes `28 − 2×5` (C2). The journal
row must name it per fixture class before the commit. Stop condition 4:
the 10 may never become a margin.
