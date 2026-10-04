## Observation: switch+swimlane fixture shows duplicate case-row geometry in the jar (CONFIRMED mechanism)
- **Context**: Mission `activity-divergence-drive-2`, batch 1p, T1p-e
  (port `FtileSwitchWithManyLinks.java:297-end`'s cross-swimlane
  connectors). Authored `tests/fixtures/activity/T1p-e/switch-cross-
  swimlane.puml` (no corpus fixture exercises `switch` across swimlanes)
  and rendered it through `scripts/oracle-render.sh` to get a ground-truth
  oracle SVG. Orchestrator (journal row 7) asked for this to be confirmed
  or refuted by reading the Java before any fix.
- **Finding**: The oracle SVG draws the switch's `:A;`/`:B;` case boxes
  TWICE each -- once at Lane1's x-offset (`x=26`/`x=104`, `y=145.056`) and
  once at Lane2's x-offset (`x=142`/`x=180`, same `y`), byte-for-byte
  identical geometry in both copies. Our port places each case box exactly
  once, in whichever lane it is tagged with.
- **Mechanism (confirmed, not a guess)**: `FtileSwitchWithDiamonds#drawU`'s
  `BIG_DIAMOND` branch calls `tile.drawU(ug.apply(getTranslateOf(tile,
  stringBounder)))` **directly** on every case tile -- a plain method
  call, not a `ug.draw(tile)` dispatch.
- **Origin**: `net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithDiamonds.java:136-138`:
  ```java
  if (mode == Mode.BIG_DIAMOND)
      for (Ftile tile : tiles)
          tile.drawU(ug.apply(getTranslateOf(tile, stringBounder)));
  ```
- **Causal chain**: `Swimlanes#drawWhenSwimlanes`
  (`Swimlanes.java:328-343`) loops `for (Swimlane swimlane :
  swimlanesSpecial())` and calls `full.drawU(new
  UGraphicInterceptorOneSwimlane(ug, swimlane, swimlanes())...)` **once per
  lane** -- the WHOLE diagram tree is re-walked N times (N = lane count).
  `UGraphicInterceptorOneSwimlane#draw` (`UGraphicInterceptorOneSwimlane
  .java:66-72`) is the ONLY place that gates an `Ftile`'s draw by swimlane
  membership (`swimlanes.contains(swimlane)`), but that gate is consulted
  only when something calls `ug.draw(someFtile)` -- a direct `.drawU()`
  method call bypasses it entirely. Since the BIG_DIAMOND branch calls
  `tile.drawU()` directly, every one of the N per-lane passes re-emits
  every case tile's content at that pass's own lane-translate, producing
  one visible copy per lane regardless of the tile's real swimlane tag.
  `Mode` is set once in the constructor
  (`FtileSwitchWithDiamonds.java:73-81`): `mode = (w13 > w9) ?
  BIG_DIAMOND : SMALL_DIAMOND`, where `w9` sums only the "middle" tiles
  (`getW9`, `:84-90`: `for (i=1; i<tiles.size()-1; i++)`). For my 2-case
  fixture, `tiles.size()==2` makes that loop body unreachable, forcing
  `w9==0` and therefore `mode==BIG_DIAMOND` (confirmed empirically too: the
  SVG shows exactly 2 copies, matching exactly 2 swimlanes).
- **Ruled out**: `FtileSwitchNude#drawU` (the `SMALL_DIAMOND` path,
  `FtileSwitchNude.java:104-108`) uses `ug.apply(getTranslateNude(tile,
  stringBounder)).draw(tile)` -- a properly-gated `ug.draw()` dispatch, NOT
  a direct method call. So this is NOT a universal switch-rendering bug;
  it is specific to the `BIG_DIAMOND` branch (switches with <=2 case tiles,
  or whose edge tiles are wide enough relative to the diamond -- the exact
  `w13 > w9` condition above).
- **Impact / scope decision**: Reproducing this in our port (CLAUDE.md:
  "preserve information-carrying output... including behavior that looks
  like a bug" -- a user WOULD notice two "A" boxes) requires a new
  rendering primitive our architecture does not have anywhere else: our
  `GtileSwitch`/`walk-switch.ts` lay out and emit each case tile exactly
  ONCE (single pass-1 walk, later shifted into its own lane by
  `swimlane-placement.ts#placeSwimlanes`'s 1:1 `nodes.map(shiftNode)`). A
  faithful port would need: (1) a `BIG_DIAMOND`/`SMALL_DIAMOND`-equivalent
  mode computed from `w13`/`w9` in `gtile-switch.ts` (no such field exists
  today); (2) N-copies-per-case-tile node emission in `walk-switch.ts`,
  shifted by EVERY lane's own origin, not just the tile's tagged lane; (3)
  `swimlane-placement.ts#placeSwimlanes`'s node pipeline would need to
  become a flatMap (1:N), the same change its `edges` pipeline already
  made for the repeat-out case (`routed.flatMap`) -- but for `nodes`,
  which no caller anywhere expects today. (3) is squarely outside both
  T1p-e's original write-set and the orchestrator's extension (which
  covers `swimlane-loop-translate.ts`'s edge-routing dispatch only, not
  `placeSwimlanes`'s node-shifting pipeline). Per CLAUDE.md's own bar
  ("genuinely large AND separable... earns a deferral, proven by
  measurement, as a tracked mission"), this is reported, not fixed here.
- **Files a fix would need**: `src/diagrams/activity/tiles/gtile-switch.ts`
  (mode/width accounting), `src/diagrams/activity/layout/walk-switch.ts`
  (N-copy emission), `src/diagrams/activity/layout/swimlane-placement.ts`
  (node pipeline cardinality change -- NOT in T1p-e's write-set or its
  extension).
- **Confidence**: High (both file:line-quoted Java AND the empirical SVG
  byte-count match the `w9==0`-forces-`BIG_DIAMOND` structural argument).
