# activity-if-connector-draw-order — planning observations (2026-09-15)

Recorded while trying to execute `plans/activity-if-connector-draw-order/`,
which did not exist; the mission was only FILED in `planning/next-missions.md`
(the `activity-edge-draw-order` D7 follow-on). Verifying that filing against
the Java disproved its premise. Java paths are under
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`.

## Observation: the live `if` walker emits no merge diamond and no out-connectors

- **Context**: The filing says "our per-branch in/out pairing agrees" with the
  jar and only the ORDER of the if's edge run is wrong, citing
  `tile-coordinates.ts:186-232`.
- **Finding**: `tile-layout.ts#tileIf` (`:115-136`) always passes `null` as
  the merge diamond (`new GtileIf(diamond, branches, null, …)`, `:136`), so
  `mergeDiamond` is `null` for every production `if` and the walker's
  `branch -> merge` edge (`tile-coordinates.ts:212-223`) and `if-merge` node
  (`:226-230`) are DEAD in production — only `tests/diagrams/activity/tiles/
  gtile-if.test.ts:77,113,124` ever construct a `GtileIf` with a merge. The
  renderer ALSO draws nothing for `if-merge` (`activity-renderer-shapes.ts`,
  `case 'if-merge': return ''`). Measured on synthetic `if (c) then :a; else
  :b; endif` (scratch `dump-if.ts`): our if emits ONE diamond node and TWO
  edges, both `diamond.south -> (down 14px) -> sideways along the branch's
  TOP edge` (`GConnectionSideThenVerticalThenSide`, points
  `(58.7,92) (58.7,106) (25.3,106)`); no `a -> merge`, no `b -> merge`, no
  merge diamond, no yes/no labels. The if's exit edge starts at the GtileIf's
  SOUTH_HOOK (`gtile-if.ts:61-63`), i.e. from empty space under the branches.
  The jar (`FtileIfWithLinks#addLinks`, `cond/FtileIfWithLinks.java`) draws
  `ConnectionHorizontalThenVertical(diamond1, tile1)`, the same for `tile2`,
  then `ConnectionVerticalThenHorizontal(tile1, diamond2)` and `(tile2,
  diamond2)`, plus `diamond2` itself (`FtileIfWithDiamonds.drawU`) and the
  `yes`/`no` labels (`ConditionalBuilder#getShape1`, `withSouth/withEast` or
  `withWestAndEast`).
- **Impact**: There is no draw ORDER to fix — the elements are absent. The
  filed mission is moot as scoped; the real gap is a structural port of the
  `if` tile (diamond2, out-connectors, connector shapes, labels), and only
  then does conns-list order apply. Positional "agreement 17/42" on `cemipu`
  was measuring missing elements, not misordered ones.
- **Confidence**: High (renders + geometry dump + Java read).

## Observation: the filing conflates the jar's four `if` builders

- **Context**: The filing cites `FtileIfLongHorizontal.java:203-257` for the
  "if's OWN entry `ConnectionIn` AFTER every branch connector" and says
  `FtileIfDown.java:135-157` "has the same shape".
- **Finding**: `FtileFactoryDelegatorIf#createIf` (`vcompact/
  FtileFactoryDelegatorIf.java:85-92`) dispatches `thens.size() > 1` (any
  `elseif`) to `FtileIfLongHorizontal` (or `FtileIfLongVertical` under
  `!pragma useVerticalIf`), else to `ConditionalBuilder.create`
  (`vcompact/cond/ConditionalBuilder.java:144-161`), which picks
  `FtileIfDown` when exactly one branch is empty / a lone `stop`/spot
  (`:149-159`) and `FtileIfWithLinks` otherwise (`:161`). Their conns lists
  differ:
  - `FtileIfDown.java:135-157`: `ConnectionIn(diamond1 -> thenBlock)` FIRST,
    then `ConnectionElse1|Else2|ElseHline+Hline|ElseNoDiamond|Horizontal`,
    then `ConnectionOut(thenBlock -> diamond2)` LAST. Its `ConnectionIn` is
    `super(diamond1, thenBlock)` (`:196-200`) — a branch in-connector, NOT
    the if's own entry.
  - `FtileIfWithLinks#addLinks`: in1, in2, then out1, out2 (or a single
    `…Direct` when one branch has no point out; HLINE variant adds
    `ConnectionHline`).
  - `FtileIfLongHorizontal.java:203-257`: per branch VerticalIn+VerticalOut,
    then `ConnectionHorizontal(diam_i, diam_i+1)` for each pair, then
    `ConnectionIn(topInColor)` = `super(null, diamonds.get(0))` (`:300-321`),
    an elbow from the tile's own pointIn `(width/2, 0)` to diamond 0 at
    `y=25` (`getTranslateCouple1 :644-656`), then `ConnectionLastElseIn`,
    `ConnectionLastElseOut`, optional `ConnectionHline`.
  - `FtileIfLongVertical.java:180-203`: VerticalIn per branch,
    `ConnectionVertical` between diamonds, `ConnectionThenOut`,
    `ConnectionThenOutConnect` per extra branch, `ConnectionIn`,
    `ConnectionLastElse`, `ConnectionLastElseOut`.
  `cemipu-87-dinu624` (`if (foo) then :something; endif`) is `FtileIfDown`,
  not `FtileIfLongHorizontal`; the golden's lane-1 run reads exactly
  `In, Else2 (3 lines + 2 arrowheads), Out, then the sibling link
  third -> diamond1` — conns order, then the enclosing assembly's link.
- **Impact**: A port must model the dispatch, not one conns list. Of the 123
  baseline fixtures containing `if` (of 268), a markup classification gives
  ~20 elseif chains (Long*), ~28 single-branch (Down), ~46 two-branch
  (WithLinks), ~29 with several ifs (mixed) — scratch `if-classes.txt`,
  approximate (does not detect an `else` holding only `stop`).
- **Confidence**: High for the Java; Medium for the classification counts.

## Observation: the jar draws EVERY sibling link after BOTH endpoints

- **Context**: The filing attributes our early entry edge to the if alone.
- **Finding**: `FtileAssemblySimple#drawU` (`FtileAssemblySimple.java:108-112`)
  draws `tile1` then `tile2` and NO connection; the link is added around it
  by `FtileFactoryDelegatorAssembly#assembly` via
  `FtileUtils.addConnection(result, connection)` (`vcompact/
  FtileFactoryDelegatorAssembly.java:78-79`), and `FtileWithConnection#drawU`
  draws the delegate before its connections (`FtileWithConnection.java:69-74`).
  So for siblings `a, X, c` the jar's edge run is `X's internals, a->X, c's
  internals, X->c`. Ours pushes `a->X` BEFORE walking `X`
  (`tile-coordinates.ts:166-179`). Generic to every compound child
  (if/while/repeat/fork/split/group), not the if.
- **Impact**: A one-line, rule-shaped fix (walk child i+1, THEN push the
  link) — a candidate task for whichever mission owns draw order next.
  Unobservable for leaf children.
- **Confidence**: High.

## Observation: the `if` subset holds ~65% of the activity residual

- **Context**: `npx tsx scripts/activity-probe.ts --slugs-file <if-slugs>`
  at `b79502b5` (aggregate 52067 over 268).
- **Finding**: `subsetSum` 33909 over the 123 `if` fixtures = 65.1% of the
  aggregate.
- **Impact**: The structural `if` port is the largest single activity lever
  left; it dwarfs any draw-order-only change.
- **Confidence**: High (same seams as the ratchet gate).

## Observation: `planning/activity-deepdive.md` mis-maps the elseif builder

- **Finding**: `:283-284,357` say `elseif` chains use `FtileIfLongVertical`;
  the dispatch is `FtileIfLongHorizontal` unless `!pragma useVerticalIf`
  (`FtileFactoryDelegatorIf.java:85-90`). 0 of the 123 `if` fixtures set the
  pragma.
- **Impact**: Do not plan from that table; read the dispatch.
- **Confidence**: High.
