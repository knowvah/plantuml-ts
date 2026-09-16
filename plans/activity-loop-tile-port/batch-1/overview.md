# Batch 1 — loop hexagons and side labels

Sequential after Batch 0.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Build the while header and repeat condition as `GtileDiamondInside` with the jar's label slots; emit the labels from both walkers through a shared helper | typescript-pro | `src/diagrams/activity/layout/tile-layout.ts`, `src/diagrams/activity/layout/diamond-labels.ts` (new), `src/diagrams/activity/layout/walk-while-branch.ts`, `src/diagrams/activity/layout/tile-coordinates.ts` (repeat case), `src/diagrams/activity/tiles/gtile-while.ts`, `src/diagrams/activity/tiles/gtile-repeat.ts` (header/condition types only), tests named in the spec, `measurements/t2.json` | T1 | [ ] |

Spec: [`T2-loop-hexagons.md`](T2-loop-hexagons.md). Expected movers: every
`fixtures.md` row (hexagon 4 px wider / 16 px shorter on all, plus text
elements on the labelled ones) and any parent that re-centres on a loop's
new width — name each.
