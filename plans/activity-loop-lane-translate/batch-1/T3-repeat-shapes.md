# T3 — `FtileRepeat` `ConnectionOut` / `BackSimple1` / `BackSimple2` / `BackComplex1` `drawTranslate`

**Agent:** typescript-pro · **Depends on:** T0, T1 · Isolated worktree.

## Context

Read [`../README.md`](../README.md), [`../decisions.md`](../decisions.md)
D1–D3, D7, D8, T1's `LoopTranslate` and the stubs in
`layout/swimlane-loop-translate-repeat.ts`, T0's `../fixtures.md`
(representatives `becanu`, `mafete`, `manata`, `tobajo`; both-builder rows
`judatu`, `gesogi`, `bulasi`), and `plans/activity-loop-tile-port/stop-11-complex1.md`
plus D5 there (which back connection a repeat selects — `simple1`/`simple2`/
`complex1` is decided by `walk-repeat.ts#buildRepeatFrame`, keep it).

**The Java**, all in `ftile/vcompact/FtileRepeat.java`:
- `ConnectionOut#drawTranslate` (`:309-331`): skipped when the body has no
  point out; snake 1 (no arrow, no label): `mp1a -> (mp1a.x, middle) ->
  (mp2b.x, middle)` with `middle = (mp1a.y + mp2b.y)/2`; snake 2 `small`
  (`asToDown`, label `tbout`): `(mp2b.x, middle) -> mp2b`. TWO edges (D3).
- `ConnectionBackSimple1#drawTranslate` (`:579-606`): `asToLeft`,
  `emphasizeDirection(UP)`, label `tbback`; `x1 = p1.x; y1 = p1.y +
  dimDiamond2.height/2; x2 = p2.x; y2 = p2.y + dimDiamond1.height/2; xmax =
  p1.x + dimDiamond2.width/2 + dimRepeat.width/2 + 12`; `(x1,y1) -> (xmax,y1)
  -> (xmax,y2) -> (x2,y2)`.
- `ConnectionBackSimple2#drawTranslate` (`:651-676`): `x1 = p1.x +
  dimDiamond2.width; y1 = p1.y + dimDiamond2.height/2; x2a = p2.x; x2b = p2.x
  + dimDiamond1.width; isOnA = x1 < (x2a+x2b)/2; x2 = isOnA ? x2a : x2b; y2 =
  p2.y + dimDiamond1.height/2`; arrow `asToRight` if `isOnA` else `asToLeft`;
  `emphasizeDirection(UP)`, label; `(x1,y1) -> (xmiddle,y1) -> (xmiddle,y2) ->
  (x2,y2)` with `xmiddle = (x1+x2)/2`.
- `ConnectionBackComplex1#drawTranslate` (`:357-404`): read it whole; port
  it as written, naming each term.
`p1`/`p2` are each connection's own `getP1`/`getP2` (untranslated) — read
them (`:225-249`, `:282-308`, `:340-356`, `:545-578`, `:616-650`).
`ConnectionIn#drawTranslate` (`:250-259`) is the generic shape: no work.

**Ours today.** `walk-repeat.ts#pushRepeatOut` (`:235-241`, two points),
`#pushRepeatBack` (`:337-346`, `simple1Points`/`simple2Points`/
`complex1Points`, `emphasize: 'up'`), all overwritten by `routeEdge` when
lanes differ.

## Fix

1. `pushRepeatOut`: attach `{ kind: 'repeat-out', p1, p2, label }`.
   `pushRepeatBack`: attach the matching `repeat-simple1|simple2|complex1`
   record with the diamond/repeat dimensions the Java reads. Pushed points
   stay the `drawU` shapes.
2. `swimlane-loop-translate-repeat.ts`: replace the four stubs with the
   arithmetic above. `repeatOutTranslate` returns TWO edges (first
   `arrowhead: false`, no label; second the label + terminal arrow).
   `simple2` decides the terminal arrow side from `isOnA` (the edge's last
   segment direction gives `arrowTip` its orientation — verify the renderer
   already orients from the final segment; if not, that is stop 10, not a
   renderer edit). All keep `emphasize: 'up'` (these snakes DO call
   `emphasizeDirection`, unlike the while's).
3. Tests (`tests/diagrams/activity/layout/swimlane-loop-translate-repeat.test.ts`,
   new): each function against hand-derived numbers and against golden
   coordinates for one row per kind from T0's classification.

## Read-set

`src/diagrams/activity/layout/walk-repeat.ts:90-392`;
`src/diagrams/activity/layout/swimlane-loop-translate.ts` (T1);
`src/diagrams/activity/tiles/gtile-repeat.ts`;
`src/diagrams/activity/renderer.ts:178-215` (arrow orientation, read only);
`ftile/vcompact/FtileRepeat.java:221-404,537-676`; T0's
`../measurements/<representative>.txt`; `plans/activity-loop-tile-port/stop-11-complex1.md`.

## Write-set

`src/diagrams/activity/layout/swimlane-loop-translate-repeat.ts`,
`src/diagrams/activity/layout/walk-repeat.ts`,
`tests/diagrams/activity/layout/swimlane-loop-translate-repeat.test.ts` (new),
`tests/diagrams/activity/layout/walk-repeat.test.ts` if it exists (assertions
updated with a Java cite, never deleted), `../measurements/t3.json`, journal
rows, `docs/catalog.md` on drift.

## Acceptance criteria

- Given a cross-lane repeat exit, when placed, then two edges: the unarrowed
  elbow to `middle` and the short arrowed, labelled drop (`:309-331`)
- Given `simple1`, then the four points with `xmax = p1.x + d2.w/2 +
  repeat.w/2 + 12`; given `simple2`, then `isOnA` picks `x2a|x2b` and the arrow
  side; given `complex1`, then the `:357-404` shape
- Given a repeat whose tiles share one lane, then byte-identical to `t1.json`
- Given the rows T0 classed `repeat-*`, when `--align` runs, then per-tag
  parity and 0.01 px endpoints, or a named residual with its Java cite
- Given `t3.json` vs `t1.json`, then every mover is a `fixtures.md` repeat
  row or a named parent re-centring

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
