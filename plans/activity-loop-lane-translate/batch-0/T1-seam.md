# T1 — the seam: `LoopTranslate` on `EdgeMeta`, array `routeEdge`, `midArrowAt`

**Agent:** typescript-pro · **Depends on:** — (isolated worktree) ·
Output must be byte-identical to main on all 268 baseline rows (stop 7).

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md),
[`../decisions.md`](../decisions.md) D1–D4 and
[`../diagrams/component-map.md`](../diagrams/component-map.md). Today:
`tile-coordinates.ts#pushEdge` (`:70-79`) records `{lane1, lane2, shape}`;
`swimlane-placement.ts#routeEdge` (`:373-388`) returns ONE edge and, when
the lanes differ, replaces the points with the four-point elbow from
`crossLaneMiddleY` (`:354-364`); `PlacementResult` (`:82-95`) carries
`reservations` filled only by the divider loop; `renderer.ts#renderEdge`
(`:178-215`) draws `emphasize` via `findEmphasisSegment` (`:162-176`).
`swimlane-placement.ts` is 475 lines; the 500-line hook is why the new
code lives in three new modules.

## Task

1. `layout/swimlane-loop-translate.ts` (new): export the `LoopTranslate`
   tagged union (D2) —
   `{ kind: 'while-back', p1, p2, dimTotalWidth, diamond: { inY, outY, width } }`,
   `{ kind: 'repeat-out', p1, p2, label? }`,
   `{ kind: 'repeat-simple1', p1, p2, repeatWidth, diamond1: {height}, diamond2: {width, height}, label? }`,
   `{ kind: 'repeat-simple2', p1, p2, diamond1: {width, height}, diamond2: {width, height}, label? }`,
   `{ kind: 'repeat-complex1', … }` (fields per `FtileRepeat.java:357-404`,
   read it; leave a `// T3 fills` note only if a field is genuinely undecidable
   without the port), and `HEXAGON_HALF_SIZE = 12` (`ftile/Hexagon.java:46`);
   export `routeLoopTranslate(loop, edge, dx1, dx2): { edges: ActivityEdgeGeo[];
   reservations: Reservation[] }` dispatching by `kind` to the two modules.
2. `layout/swimlane-loop-translate-while.ts` and
   `layout/swimlane-loop-translate-repeat.ts` (new): one exported function per
   kind, each a STUB for this task that returns the generic middle-Y elbow
   (call the same arithmetic `routeEdge` uses today) and no reservations,
   with a `@see` to the Java lines T2/T3 will port.
3. `tile-coordinates.ts#pushEdge`: optional trailing `loop?: LoopTranslate`,
   stored on `EdgeMeta`.
4. `swimlane-placement.ts`: `EdgeMeta.loop?: LoopTranslate`; `EdgeShape` gains
   the five loop kinds; `routeEdge` returns `{ edges, reservations }` — the
   existing paths return one edge and none; a tagged edge whose lanes differ
   delegates to `routeLoopTranslate`; `placeSwimlanes` flat-maps and pushes
   reservations after the divider ones.
5. `activity-layout-types.ts`: `ActivityEdgeGeo.midArrowAt?: { x: number; y:
   number; dir: 'up'|'down'|'left'|'right' }` (D4). `renderer.ts#renderEdge`:
   when present, one extra `arrowTip` at that point with the direction's
   `(dx, dy)`, drawn after the emphasize element.
6. Tests: extend `tests/diagrams/activity/layout/swimlane-placement.test.ts`
   "edge routing" — `routeEdge` result shape, flat-map of a two-edge return,
   reservations appended; `tests/unit/activity/renderer.test.ts` — `midArrowAt` draws exactly one
   extra polygon at the point.
7. `npx tsx ../tools/render-all.mts` -> `../measurements/t1.json`; `cmp`
   against T0's `base.json` (or regenerate on the same tree if T0 has not
   landed): zero movers. `docs/catalog.md` regen if the new exports drift it.

## Read-set

`src/diagrams/activity/layout/swimlane-placement.ts:1-110,354-475`;
`src/diagrams/activity/layout/tile-coordinates.ts:60-100`;
`src/diagrams/activity/layout/hexagon-reservations.ts` (the `Reservation`
type); `src/diagrams/activity/activity-layout-types.ts:30-60`;
`src/diagrams/activity/renderer.ts:150-230`;
`tests/diagrams/activity/layout/swimlane-placement.test.ts:254-360`;
`ftile/vcompact/FtileWhile.java:277-308`; `ftile/vcompact/FtileRepeat.java:
309-331,357-404,579-606,651-676` (for the union's fields only).

## Write-set

`src/diagrams/activity/layout/swimlane-loop-translate.ts` (new),
`…/swimlane-loop-translate-while.ts` (new), `…/swimlane-loop-translate-repeat.ts`
(new), `…/swimlane-placement.ts`, `…/tile-coordinates.ts`,
`src/diagrams/activity/activity-layout-types.ts`, `src/diagrams/activity/renderer.ts`,
`tests/diagrams/activity/layout/swimlane-placement.test.ts`,
`tests/unit/activity/renderer.test.ts`, `docs/catalog.md` on drift, `../measurements/t1.json`, journal rows.

## Interface out (consumed by T2, T3)

`LoopTranslate` union and `routeLoopTranslate` signature above; the stub
function names in the two modules; `ActivityEdgeGeo.midArrowAt`;
`routeEdge`'s `{ edges, reservations }` return.

## Acceptance criteria

- Given no loop tag on any edge, when `placeSwimlanes` runs over all 268
  baseline rows, then `t1.json` equals `base.json` (`cmp`, zero movers)
- Given an edge tagged with any loop kind whose lanes differ, when `routeEdge`
  runs, then it returns `{ edges, reservations }` and `placeSwimlanes` output
  contains every returned edge and reservation
- Given an edge tagged with a loop kind whose lanes are EQUAL, then it is
  shifted like any same-lane edge (no dispatch)
- Given `midArrowAt` on an edge, when rendered, then exactly one extra
  polygon, at that point, pointing `dir`; absent -> byte-identical SVG
- Given `npm test`, then collected count = on-disk count and all four gates green

## Observability / rollback

N/A — no new observable operations; the gates are the SLIs. Reversible
(revert the commit; no data, no migration).

## Quality bar

`npm test` (JSON-reporter collected count = on-disk count), `npm run
typecheck`, `npm run lint`, `npm run build` all green before the commit. One
commit, `<type>(allt-TN): …` per `~/.claude/rules/commits.md`, body says
why. `git diff --name-only HEAD~1` = this write-set only.

## Boundaries

Always: read the Java method body before stating why anything differs;
every constant carries its `file:line`. Ask first (halt + journal): any
stop condition in `../README.md`. Never: refactor while porting; fit a
value; delete an assertion; touch `layout.old.ts` or `compress-geometry.ts`.
