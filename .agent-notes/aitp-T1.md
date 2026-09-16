# aitp-T1 — activity `if` port diagnosis and element templates

Mission `activity-if-tile-port`, task T1. No `src/` edit lands from this
task. All instrumentation ran in a scratch worktree (`../aitp-t1-scratch`,
`git worktree add ../aitp-t1-scratch HEAD` off `c1d8fce9`, `node_modules` and
`assets/stdlib` symlinked in, removed at the end of the task). Control:
`npx tsx scripts/activity-probe.ts` in the scratch worktree reproduced
aggregate **52067** over 268 fixtures with **0** risers/fallers before any
other measurement was trusted; `plans/activity-if-tile-port/measurements/
base.json` (write-set) records the same run — `aggregate: 52067`, every
`delta: 0`.

Java paths are under
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/`
unless stated otherwise.

## Q0 — dispatch contract (`ifBuilderOf`)

**Mechanism.** `FtileFactoryDelegatorIf#createIf` (`vcompact/
FtileFactoryDelegatorIf.java:85-92`) routes any `if` with at least one
`elseif` (`thens.size() > 1`) to `FtileIfLongHorizontal` (`FtileIfLongVertical`
only under `!pragma useVerticalIf` — 0 fixtures, D8, not ported). A two-branch
`if` goes to `ConditionalBuilder.create` (`vcompact/cond/
ConditionalBuilder.java:143-164`), whose FOUR guard conditions choose between
`createDown` (with one of two argument orders) and `createWithLinks`; whichever
order is chosen, `createDown` (`:170-191`) RE-CHECKS its own two parameters
with its own four-branch priority to decide which branch is the visual main
flow and which (if either) is the `optionalStop` side box.

**Origin.** `ConditionalBuilder.java:149-161` (the outer 4-condition dispatch)
composed with `:177-190` (`createDown`'s own re-check). The composition
matters: the outer dispatch and the inner re-check use the SAME two
predicates but can be invoked with the branches in either order, and only
tracing both together produces the right `swapped`/`optionalStop` answer —
tracing either alone gives the wrong result on a fixture where the "wrong"
branch (of the outer dispatch's two params) is the one satisfying
`isOnlySingleStopOrSpot`.

**Causal chain.** `InstructionList.isOnlySingleStopOrSpot` (`InstructionList
.java:90-106`) requires `all.size()==1` and that lone instruction be an
`InstructionSimple` with `isKilled()==true`, an `InstructionSpot`, or a
note-less `InstructionStop`/`InstructionEnd`. Mapped onto our AST
(`src/diagrams/activity/ast.ts` `ActivityNode` kinds):

- `nodes.length===1 && (nodes[0].kind==='stop'||nodes[0].kind==='end')` →
  stop-or-spot. Our AST has no per-node "notes" field (a note is a SEPARATE
  sibling `ActivityNote` node, `ast.ts:135-140`) — Java's `hasNotes()` guard
  and our node-count naturally agree on the RESULT despite different
  mechanisms: a note attached to a stop in Java keeps `all.size()==1` but
  flips `hasNotes()` to make the predicate FALSE; in our AST the note is a
  second sibling, so `nodes.length===2` already fails the `length===1` check
  — same false answer, verified against `cujoni-21-somi079`
  (`then: [stop, note]`, `else: []`): the outer dispatch still routes to
  `down` (via `branch2.isEmpty()`, not via branch1's stop-or-spot), matching
  our node-count translation exactly.
- `nodes.length===2 && nodes[0].kind==='action' && (nodes[1].kind==='kill'||
  nodes[1].kind==='detach')` → stop-or-spot. `kill`/`detach` are the SAME
  command (`command/CommandKill3.java:58`, `RegexLeaf("kill|detach")`) and
  call `current().kill()` (`ActivityDiagram3.java:414-416`), which — per
  `InstructionList.kill()` (`:169-173`) — MUTATES the last-added instruction
  (`getLast().kill()`, `InstructionSimple.java:124-126` sets
  `killed=true`) rather than appending a new one, so a killed action is
  Java's `all.size()==1`. Our port models `kill`/`detach` as their OWN
  standalone `ActivityNode` (`node-dispatch.ts:74-77`, always `{ idx: idx+1,
  node: {kind:'kill',...} }` — never mutates the previous node), so the
  Java-equivalent single-killed-instruction branch is TWO of our nodes:
  `[action, kill]`.
- `nodes.length===1 && nodes[0].kind==='kill'|'detach'` (no preceding
  action) → **NOT** stop-or-spot. This has no Java equivalent (`kill`/
  `detach` with no preceding `InstructionSimple` errors `"kill cannot be used
  here"` at parse, `ActivityDiagram3.java:415-416`) — unreachable from valid
  markup, so the contract returns `false` rather than throwing (mirrors the
  `aedo-T1.md` Q1 convention for an unreachable-but-typed branch).
- `InstructionSpot` has no AST analogue at all — confirmed zero corpus
  fixtures use `<spot>`/`<$name>` markup (`grep -rlE '^<.*>$'
  tests/corpus/activity/*.puml` → 0 matches), so this is a documented gap,
  not a silent one.
- Killing a NESTED compound (`if`/`while`/...) is possible in Java
  (`InstructionIf.kill()`, `InstructionIf.java:199-211`, propagates to the
  branches' own last instructions) but `isOnlySingleStopOrSpot`'s
  `last instanceof InstructionSimple` guard still excludes it (`last` is an
  `InstructionIf`, not an `InstructionSimple`) — so `[if, kill]` (a nested if
  followed by `kill;`) is correctly NOT stop-or-spot in both models. Verified
  against `rujuxa-07-neco067`'s outer `if(c1)`'s else-branch
  (`[nested-if, kill]`): classified `links`, not `down`.

`createDownMainIsA(a,b)` composes createDown's own re-check: `b` stop-or-spot
→ main is `a`; else `a` stop-or-spot → main is `b`; else `a` empty → main is
`b`; else (`b` empty, guaranteed by the outer guard) → main is `a`. Composed
with the outer dispatch's branch order, `swapped` (relative to the ORIGINAL
`then`/`else`) is `mainIsA === outerSwapped`.

```ts
type IfBuilder = 'down' | 'with-links' | 'long-horizontal';
function ifBuilderOf(node: ActivityIf):
  { builder: IfBuilder; swapped?: boolean; optionalStop?: boolean };
```

Verified against three hand-traced fixtures before trusting the classifier
at corpus scale:
- `cemipu-87-dinu624` (`if(foo) then :something; endif`, implicit empty
  else) → `down`, no swap, no optionalStop (matches `.agent-notes/
  aicdo-planning.md`'s independent Java trace).
- `becaje-01-vaji284` (`then: [end]`, `else: [action,action]`) → `down`,
  swap=true, optionalStop=true (else becomes the main flow, `end` becomes
  the side box) — confirms the outer-dispatch/inner-recheck composition,
  since this fixture fires the OUTER dispatch's `c3` branch.
- `vaxiki-78-nice114` (`then: [stop]`, implicit empty else) → `down`,
  swap=true, optionalStop=true, AND `diamond2` (the merge rhombus) is
  OMITTED entirely because `hasTwoBranches()` (`ConditionalBuilder.java:
  308-311`) is false whenever the optionalStop branch has no point out (any
  `stop`/`end`/killed-action does not) — confirmed by rendering: the golden
  SVG's only large SHAPE polygon is the condition hexagon (no rhombus among
  its 5 polygons — the other 4 are arrowheads), and the
  `then=[stop]` renders as a double-ellipse stop shape connected by a plain
  `ConnectionHorizontal` from the hexagon's east point (D8's "optionalStop +
  ConnectionHorizontal"). This is the deciding fact for the `down` template's
  two sub-shapes in Q1.

**Ruled out.**
- *"The outer dispatch alone decides swap/optionalStop."* Ruled out by
  `becaje-01-vaji284`: the outer dispatch's `c3` branch passes
  `(branch2,branch1)` to `createDown`, but `createDown`'s OWN re-check (not
  the outer condition) is what actually names the main flow — tracing only
  the outer condition would have gotten `optionalStop` right here but
  `swapped` wrong on a fixture where BOTH sides simultaneously satisfy
  empty-or-stop-or-spot (not present in the corpus, but the composed
  function handles it correctly either way, unlike a single-pass guess).
- *"A markup regex is an adequate substitute for the AST predicate."* Ruled
  out three ways: (1) case sensitivity — `besaga-58-poli497`,
  `lopone-15-xiki477`, `tobajo-64-mipi810` use `IF(...)THEN`/`If (...)`,
  invisible to a lowercase-only regex, found only by parsing; (2)
  `carapo-31-bisi880` (`if (test) then (yes) :a; else (no) endif` — an
  EMPTY else) was guessed `links` (else keyword present) by the provisional
  markup scan but is actually `down` (else is empty, not linked content); (3)
  `cujoni-21-somi079`'s `stop` + attached `note` is exactly the case
  `fixtures.md`'s own header flagged the old guess as unable to detect.
- *`InstructionSpot` needs porting for Q0 to be complete.* Ruled out: zero
  baseline (or corpus-wide) fixtures use spot markup; the branch is
  documented, not silently dropped.

## Q1 — element templates

Three baseline fixtures per builder, chosen from the REAL predicate (not the
mission brief's provisional guesses — verifying those against Q0 first, per
the brief's own instruction, disqualified 4 of the 9 originally-suggested
slugs: `carapo-31-bisi880`, `rerovo-62-nazo755`'s and `vimako-25-mega336`'s
ORIGINAL role as `with-links` candidates were wrong builder, and
`carapo-31-bisi880` is additionally D8-out-of-scope). `nijipa-25-pede639`
(the brief's other `down` suggestion) was ALSO dropped after inspection: its
`then`-branch is `[note, action]` — a note floating inside the `if` before
any action — which is the D8-excluded "notes attached to an if" case
(`cond/FtileIfWithDiamonds.java:79-114`), not a clean template. Final
slugs, smallest-pin-first within each variant, confirmed unlaned, no
D8-excluded skinparam, no notes: see `fixtures.md`'s own "Q1 representative
slugs" section (kept in sync with this note; do not let the two drift).

Draw order and conns-list citations already established in
`decisions.md` D1/D5: `drawU` order `FtileIfDown.java:524-537`, `cond/
FtileIfWithDiamonds.java:200-218`, `FtileIfLongHorizontal.java:671-677`;
conns order `FtileIfDown.java:135-157`, `cond/FtileIfWithLinks.java:531-560`,
`FtileIfLongHorizontal.java:203-255`. This section adds the per-ELEMENT
Java-class mapping those citations don't spell out, read directly off each
representative's golden SVG (`test-results/dot-cache/activity/<slug>/in.svg`)
element-by-element.

### Template: down

Two structurally distinct sub-shapes, both `FtileIfDown`:

**(a) plain / swap (no optionalStop) — `rerovo-62-nazo755`, `vimako-25-
mega336`.** `diamond2` IS drawn (`hasTwoBranches()`,
`ConditionalBuilder.java:308-311`, is true whenever both branches — even an
empty pass-through one — have a point out).

| element | Java class | file:line | count |
|---|---|---|---|
| condition hexagon (`diamond1`) | `FtileDiamondInside`, `Hexagon.asPolygon(shadow,w,h)` | `vertical/FtileDiamondInside.java:104-116` sizing; `Hexagon.java:65-83` (6-pt polygon) | 1 polygon |
| branch label(s) (south=then, east=else, `getShape1(false,...)`) | `TextBlock` via `.withSouth`/`.withEast` | `ConditionalBuilder.java:280-283` (`getLabelPositive`), `FtileDiamondInside.java:84-102` (placement) | 0-2 text |
| condition text (inside hexagon) | `TextBlock tbTest` | `ConditionalBuilder.java:238-248` | 1 text (1 per source line) |
| merge rhombus (`diamond2`) | `FtileDiamond`, `Hexagon.asPolygon(shadow)` (fixed-size 4-pt) | `vertical/FtileDiamond.java:85-112` sizing; `Hexagon.java:48-64` | 1 polygon |
| `ConnectionIn` (diamond1→then-block) | `AbstractConnection` | `FtileIfDown.java:196-200` | 1 line + 1 arrowhead polygon |
| `ConnectionElse2` (empty/plain else branch, side-then-vertical-then-side, WITH an `emphasizeDirection` mid-arrow on its vertical leg per D6) | `AbstractConnection` | `FtileIfDown.java:139-146` (Else1 vs Else2 selection: Else2 fires when the if is unlaned or not `isSmallerThanAllOthers`) | 3 lines + 2 arrowhead polygons (mid + terminal) |
| `ConnectionOut` (then-block→diamond2) | `AbstractConnection` | `FtileIfDown.java:196-200` (symmetric to `ConnectionIn`) | 1 line + 1 arrowhead polygon |

Verified element-by-element against `rerovo-62-nazo755`'s golden (`if(test)
then(yes): a; else(no): endif`): hexagon(1) + rhombus(1) + labels("yes","no")
(2) + condition text("test")(1) + rect+text branch content("a", not
if-owned)(2) + `ConnectionIn`(2) + `ConnectionElse2`(5) + `ConnectionOut`(2)
= exactly the golden's 6 polygon / 5 line / 4 text / 1 rect. `vimako-25-
mega336` (swap: `then` empty, `else`="do something") reproduces the same
shape with the branch roles swapped — 6 polygon / 5 line / 5 text (one extra
branch label; the "no:" else-label spans 3 wrapped lines) / 1 rect.

**(b) optionalStop — `vaxiki-78-nice114`.** `diamond2` is OMITTED (an
invisible `FtileEmpty(0, hexagonHalfSize/2)`, `ConditionalBuilder.java:
309-311`) because the optionalStop branch (a lone `stop`/`end`/killed-action)
has no point out, so `hasTwoBranches()` is false. The optionalStop side is
the branch's OWN Ftile (a stop/end shape), not wrapped in any diamond,
connected by a plain `ConnectionHorizontal` (D8, in scope) from `diamond1`'s
east point — NOT the snake-shaped `ConnectionElse2`.

| element | Java class | file:line | count |
|---|---|---|---|
| condition hexagon (`diamond1`) | `FtileDiamondInside` | same as (a) | 1 polygon |
| branch label (only ONE side has a label here — the optionalStop branch's) | `TextBlock` | `ConditionalBuilder.java:280-283` | 0-2 text |
| condition text | `TextBlock tbTest` | `ConditionalBuilder.java:238-248` | 1 text/line |
| merge rhombus | — OMITTED — | `ConditionalBuilder.java:308-311` (`hasTwoBranches()==false`) | 0 polygon |
| optionalStop shape (the branch's own Ftile, e.g. `FtileStop`, double ellipse) | branch's own Ftile, unwrapped | `ConditionalBuilder.java:177-179` (`branch2.getFtile()` passed straight to `FtileIfDown.create`) | 2 ellipse (stop) |
| `ConnectionIn` (diamond1→main flow) | `AbstractConnection` | `FtileIfDown.java:196-200` | 1 line + 1 arrowhead (may snake-merge with `ConnectionOut` when the main flow is an empty pass-through, `Snake.java:312`) |
| `ConnectionHorizontal` (diamond1 east → optionalStop shape) | `AbstractConnection` | D8 scope citation, `FtileIfDown.java` (optionalStop path) | 1 line + 1 arrowhead |
| `ConnectionOut` (main flow→where `diamond2` would be, now a straight-through) | `AbstractConnection` | `FtileIfDown.java:196-200` | 1 line + 1 arrowhead |

Verified against `vaxiki-78-nice114`'s golden: 1 hexagon polygon + 4
arrowhead polygons (no rhombus — the jar's 5 total `<polygon>` elements per
`--align` below are 1 shape + 4 arrowheads, never a second shape), 2
`<ellipse>` (the stop shape — a DIFFERENT tag, outside `--align`'s four
tracked tags), branch label "foo" at the EAST slot (since the stop branch
became `createDown`'s local `branch2`, `getShape1(false,tb1="",tb2="foo")`
puts it east), condition text absent here (this fixture's hexagon carries no
condition label). Matches the golden element-for-element.

Base `--align` figures (`npx tsx scripts/activity-probe.ts --align <slug>`):

| slug | polygon o/j | line o/j | text o/j | rect o/j | alignment |
|---|---|---|---|---|---|
| `rerovo-62-nazo755` | 3/6 | 4/5 | 2/4 | 1/1 | 4/16 |
| `vimako-25-mega336` | 3/6 | 4/5 | 2/5 | 1/1 | 4/17 |
| `vaxiki-78-nice114` | 6/5 | 7/4 | 3/6 | 2/2 | 8/18 |

### Template: with-links (`FtileIfWithLinks`)

Draw order confirmed element-by-element on `suzuci-53-biku826` (`if(foo)
then(foo1): bar1; else(foo2): bar2; endif`, `skinparam
activityArrowFontColor red` — a font-COLOR-only skinparam, immaterial to
element counts): hexagon(`diamond1`), condition text, west label("foo1"),
east label("foo2") [`getShape1(true,tb1,tb2)` → `.withWestAndEast`,
`ConditionalBuilder.java:238-244`], `tile1`(bar1 rect+text), `tile2`(bar2
rect+text), rhombus(`diamond2`) — matching `cond/
FtileIfWithDiamonds.java:200-218`'s cited draw order exactly — then conns in
`addLinks` order (`cond/FtileIfWithLinks.java:531-560`): `in1`
(`ConnectionHorizontalThenVertical`, diamond1 west→bar1 top: 2 lines + 1
arrowhead), `in2` (diamond1 east→bar2 top: 2 lines + 1 arrowhead), `out1`
(bar1 bottom→diamond2 west, `ConnectionVerticalThenHorizontal`: 2 lines + 1
arrowhead), `out2` (bar2 bottom→diamond2 east: 2 lines + 1 arrowhead).

| element | Java class | file:line | count |
|---|---|---|---|
| condition hexagon (`diamond1`) | `FtileDiamondInside`, `.withWestAndEast` | `ConditionalBuilder.java:238-244`; `Hexagon.java:65-83` | 1 polygon |
| west/east branch labels (only when `(label)` given in markup) | `TextBlock` | `ConditionalBuilder.java:280-283` | 0-2 text |
| condition text | `TextBlock tbTest` | `ConditionalBuilder.java:238-248` | 1 text/line |
| merge rhombus (`diamond2`) | `FtileDiamond` | `FtileDiamond.java:85-112`; `Hexagon.java:48-64` | 1 polygon |
| `in1`/`in2` (`ConnectionHorizontalThenVertical`) | `AbstractConnection` | `cond/FtileIfWithLinks.java:531-560` (order); `:96-101` (null end decoration when branch empty, D6) | 2 lines + 1 arrowhead EACH (0 arrowhead if that branch is empty) |
| `out1`/`out2` (`ConnectionVerticalThenHorizontal`) | `AbstractConnection` | `cond/FtileIfWithLinks.java:531-560` | 2 lines + 1 arrowhead EACH |

If-owned element count on `suzuci-53-biku826` (excluding the sibling
start-ellipse and the two branch action rects+texts): hexagon(1) +
rhombus(1) + labels("foo1","foo2")(2) + condition("foo")(1) + in1(3) +
in2(3) + out1(3) + out2(3) = 17, matching the golden. `feceme-58-xodo415`
and `copisa-69-xisi273` have NO branch labels (`then`/`else` given without a
`(label)`) so their if-owned count is 15 (hexagon+rhombus+1-or-3-line
condition text + 4×3 connectors) — `copisa`'s condition wraps to 3 lines
(3 text elements) confirmed against its golden.

Base `--align` figures:

| slug | polygon o/j | line o/j | text o/j | rect o/j | alignment |
|---|---|---|---|---|---|
| `suzuci-53-biku826` | 4/7 | 5/9 | 3/5 | 2/2 | 7/23 |
| `feceme-58-xodo415` | 5/8 | 6/10 | 5/5 | 4/4 | 12/27 |
| `copisa-69-xisi273` | 5/8 | 6/10 | 5/7 | 2/2 | 6/27 |

### Template: long-horizontal (`FtileIfLongHorizontal`)

Diamonds are `FtileDiamondInside2` (`FtileIfLongHorizontal.java:177-186`,
built per branch), each `.withNorth(branch's own label)` and the LAST
diamond additionally `.withEast(else's label)`; an optional `.withWest`
in-label is unused by every representative (no fixture uses `->label->`
in-branch labels here). **Two must-preserve upstream quirks, verified by
direct render, NOT to be "fixed" per CLAUDE.md:**
1. `FtileDiamondInside2`'s private constructor
   (`vertical/FtileDiamondInside2.java:73`) calls
   `super(label, ..., north, south, EAST, WEST)` — swapping east/west
   relative to the public `withWest`/`withEast` setters' own field names.
   Whatever is set via `.withWest(x)` ends up drawn at the geometric EAST
   slot and vice versa.
2. `drawU` (`:80-81`) translates BOTH `north.drawU` and `south.drawU` to the
   IDENTICAL offset `(4+w/2, h)` (the shape's bottom) — so a `.withNorth()`
   label always renders visually BELOW the hexagon, never above; `south` is
   simply never populated by this builder so the redundant draw call is a
   no-op today, not a visible collision.
   Verified numerically on `lifeve-53-zubi598` (`if(One) then(Yes) elseif
   (Two) then(Yes) endif`): golden hexagon 0 spans y=15-39 (0-indexed to
   y=55-79 in our fixture's actual render since no `start` circle... — see
   the golden directly), "Yes" (the `.withNorth()` call) renders at y=87.556,
   BELOW the hexagon's y=79 bottom edge, exactly the "south" position.

| element | Java class | file:line | count |
|---|---|---|---|
| per-branch hexagon (`diamonds[i]`) | `FtileDiamondInside2` | `vertical/FtileDiamondInside2.java:82` (`Hexagon.asPolygon(shadow,w,h)`) | 1 polygon per branch (`thens.size()`) |
| per-branch own label (`.withNorth`, renders south — quirk 2 above) | `TextBlock tb1` | `FtileIfLongHorizontal.java:167-172` | 0-1 text per branch |
| condition text (centred in each hexagon) | `TextBlock tbTest` | `FtileIfLongHorizontal.java:172-176`; `FtileDiamondInside2.java:84-86` | 1 text/line per branch |
| last branch's else-label (`.withEast`, quirk 1: renders WEST) | `TextBlock tb2` | `FtileIfLongHorizontal.java:190-192` | 0-1 text |
| `ConnectionVerticalIn`/`ConnectionVerticalOut` per branch | `AbstractConnection` | `FtileIfLongHorizontal.java:203-227` | 1 line + 1 arrowhead EACH when the branch tile is non-empty; snake-merges into a SINGLE line+arrowhead when the branch is an empty pass-through (`Snake.java:312`, shared endpoint) |
| `ConnectionHorizontal` (between adjacent diamonds) | `AbstractConnection` | `FtileIfLongHorizontal.java:231-238` | 1 line + 1 arrowhead per adjacent pair (`diamonds.size()-1`) |
| `ConnectionIn` (tile's own pointIn elbow into diamond 0) | `AbstractConnection` | `FtileIfLongHorizontal.java:239, :300-321` | 3 lines (elbow: down, across, down) + 1 arrowhead |
| `ConnectionLastElseIn` (last diamond → the merge Y) | `AbstractConnection` | `FtileIfLongHorizontal.java:249` | 2 lines (across, down) + 1 arrowhead |
| `ConnectionLastElseOut` (the exit bar) | `AbstractConnection` | `FtileIfLongHorizontal.java:250` | 1 line, no arrowhead (terminates in whatever follows) |
| `ConnectionHline` (only when `nbOut>0`, D8 out of scope) | — | `FtileIfLongHorizontal.java:253-254` | filed, not built |

Verified element-by-element against `lifeve-53-zubi598` (2 empty branches,
no else content): 2 hexagons + 5 arrowhead polygons = 7 polygon; 9 lines
(2 merged branch-verticals + 1 horizontal + 3 ConnectionIn + 2
ConnectionLastElseIn + 1 ConnectionLastElseOut); 4 text (2 condition + 2
branch labels, no else-label since no explicit `else` clause) — matches the
golden's element counts with ZERO elements left unattributed (every
polygon/line/text in the golden, minus the sibling start-ellipse, is
accounted for above).

Base `--align` figures:

| slug | polygon o/j | line o/j | text o/j | rect o/j | alignment |
|---|---|---|---|---|---|
| `lifeve-53-zubi598` | 5/7 | 6/9 | 1/4 | 0/0 | 5/20 |
| `pekefu-66-mepa144` | 5/9 | 7/11 | 3/6 | 2/2 | 5/28 |
| `sofoje-37-tila554` | 7/10 | 8/12 | 3/3 | 3/3 | 10/28 |

## Q2 — `GtileDiamond` vs `FtileDiamondInside`

**Mechanism.** `GtileDiamond` (`src/diagrams/activity/tiles/gtile-
diamond.ts:15-29`) uses `DIAMOND_MIN=20`/`DIAMOND_LABEL_PAD=10`
(`activity-layout-constants.ts:79-80`): `width = max(measured.width+20,40)`,
`height = max(measured.height+8,40)`. `FtileDiamondInside.
calculateDimensionAlone` (`vertical/FtileDiamondInside.java:104-116`) is
`24x24` for an empty label else `dimLabel.atLeast(24,24).delta(24,0)` —
i.e. `width = max(dimLabel.width,24)+24`, `height = max(dimLabel.height,24)`
(`hexagonHalfSize=12`, `Hexagon.java:46`; `XDimension2D.atLeast`/`.delta`,
`klimt/geom/XDimension2D.java:87,114`).

**Origin.** `activity-layout-constants.ts:79-80` (the `20`/`8`/`40` figures)
vs `Hexagon.java:46` + `FtileDiamondInside.java:104-116` (the `24` figures)
— two independently-chosen constant sets that were never reconciled.

**Causal chain.** WIDTH: ours adds `measured.width+20`, jar adds
`dimLabel.width+24` (once both exceed their floor) — ours is systematically
**4px narrower** per label. HEIGHT: ours floors at `40`, jar floors at `24`
— for any label short enough to hit both floors (true of essentially every
single-line 11pt condition, since `measured.height/2+4` and
`dimLabel.height` are both well under the respective thresholds for one
line), ours is **16px taller**, and even above the floor ours adds `+8` to
`measured.height` where the jar adds `+0`.

**Measured (not just formula-derived), on a `while` header
(`cemagu-66-vazo965`, `while (check filesize with a very long name?) is (not
empty) ... endwhile`):**
- Jar hexagon polygon: `x` spans 104.856–292.206 → **width 187.35**; `y`
  spans 15–39 → **height 24**.
- Our hexagon polygon (same fixture, `DeterministicMeasurer`): `x` spans
  12–195.35 → **width 183.35**; `y` spans 12–52 → **height 40**.
- **Width delta: −4.00px** (ours smaller) — EXACTLY the `20` vs `24` pad
  difference. **Height delta: +16.00px** (ours taller) — EXACTLY the `40`
  vs `24` floor difference. Both deltas match the formula prediction to the
  pixel, confirming the two constant sets are the entire cause (no
  additional text-measurement discrepancy).
- Cross-check on `bounder.getDimension`: solving ours' width equation
  backward (`91.675 = measured.width/2+10` → `measured.width=163.35`) and
  the jar's forward (`187.35 = dimLabel.width+24` → `dimLabel.width=163.35`)
  gives the SAME measured width on both sides — `bounder.getDimension`
  (`DeterministicMeasurer`) and the jar's `TextBlock.calculateDimension`
  agree on the raw text metric; the mismatch is 100% in the
  pad/floor arithmetic, 0% in text measurement.

**Conclusion: `GtileDiamond` does NOT equal `FtileDiamondInside`** (D2, stop
13). Per stop 13 and D2's own text ("`GtileDiamond` is untouched... if not,
T7 files a while/repeat follow-on"), this is NOT fixed here — flagged for T7
to file as `activity-diamond-sizing` or similar, with these exact numbers.

**Ruled out.**
- *"The gap is a text-measurement discrepancy (`bounder.getDimension` vs
  `TextBlock.calculateDimension` disagree on line height/padding)."* Ruled
  out by the width cross-check above: both measurers agree exactly
  (`163.35`) on the SAME label; only the pad-constant arithmetic differs.
- *"The height gap only applies to labels near the floor; longer labels
  converge."* Not fully ruled out for arbitrarily long labels (ours adds
  `+8` where the jar adds `+0` even above the floor, so the gap persists —
  narrows only in RELATIVE terms, never to zero), but confirmed the CURRENT
  16px gap is a floor-vs-floor effect on this representative single-line
  fixture, which is the common case.

## Q3 — mid-arrow placement (D6 safety)

**Mechanism.** `midArrow` (`activity-layout-types.ts:41`) is set to `true`
in exactly ONE place in the entire `src/` tree:
`activity-layout-repeat.ts:105` — which belongs to `layout.old.ts`'s OLD
layout engine, confirmed by import-graph analysis to be **dead in
production**: `src/diagrams/activity/index.ts:10,25` wires `layoutActivity`
from `./layout/tile-layout.js` (the LIVE tile engine), never from
`layout.old.ts`; every LIVE file that imports FROM `layout.old.ts`
(`tile-layout.ts:30`, `tile-coordinates.ts:2`, `compress/shapes-of.ts:14`)
imports ONLY types (`import type`), never the `layoutActivity` function.
`grep -rln "activity-layout-repeat" src/` confirms its only importers are
`layout.old.ts` and `activity-layout-sequence.ts` (itself only reachable
from the old engine).

**Origin.** `activity-layout-repeat.ts:105` (the sole `midArrow: true`
assignment) is unreachable from `src/diagrams/activity/index.ts`'s
`activityPlugin` entry point.

**Causal chain.** Because nothing in the LIVE walker (`tile-coordinates.ts`
`'gtile-repeat'` case, `:238-297`) ever sets `midArrow`, `renderer.ts`'s
`edge.midArrow === true` branch (`:178-195`, the "longest segment" logic
this question's premise describes) is ALSO dead in production — verified by
direct render of `biguku-39-voxu233` (`start; repeat; :Reviews...; repeat
while (was it proper?);`): our back-edge draws exactly 3 lines + 1 arrowhead
(the TERMINAL arrowhead only); no second, mid-segment arrowhead polygon
appears anywhere in the output. **Every baseline `repeat` fixture's back-edge
currently renders with ZERO mid-arrows**, so "does today's longest-segment
rule move any pin when replaced by `emphasize:'up'`" is answered `no` for a
reason stronger than the brief's framing assumed: there is no live
behaviour to preserve, because the longest-segment rule never fires today.

What DOES need verifying for D6's forward safety is structural, not
pin-based: does `emphasize:'up'` (first UP-direction segment, `Worm.java:
138-139`) land on the SAME segment the jar emphasizes? `GConnectionDownThenUp
.getPoints` (`routing/gconnection-down-then-up.ts:7-9`) is called from BOTH
repeat back-edge sites (`tile-coordinates.ts:270-286`, the `backwardBody`
and no-`backwardBody` cases) and ALWAYS returns exactly 4 points / 3
segments: horizontal (leftward), vertical, horizontal (rightward back) — by
construction there is exactly ONE vertical segment, and because the `from`
endpoint (condition/backwardBody south) is always geometrically BELOW the
`to` endpoint (body north) in this stacked layout, that lone vertical
segment always goes UP. So `emphasize:'up'` deterministically selects the
SAME segment on every repeat fixture, by construction, independent of
segment length.

On `biguku-39-voxu233`'s golden (jar), the mid-arrow IS on that vertical
segment (length 96px) even though one of the flanking HORIZONTAL segments is
LONGER (123.6px) — direct evidence that "first UP segment" and "longest
segment" are NOT the same rule in general, and that the OLD dead code's
longest-segment heuristic would have picked the WRONG segment on this exact
fixture had it ever been live. `emphasize:'up'` is the correct rule; the
"pins can't move" framing is moot only because nothing currently draws a
mid-arrow at all.

**Every baseline `repeat` fixture** (43 found via `grep -l repeat` restricted
to the 268 baseline slugs — see the corpus scan below) is covered by this
SAME structural argument (`GConnectionDownThenUp`'s point construction is
unconditional on lane/content), with **zero exceptions**: `becanu-19-diti597`,
`biguku-39-voxu233` (traced in
detail above), `bizono-61-sasa740`, `boxoto-53-sifo232`, `bozuro-33-celo170`,
`bulasi-17-vafa634`, `bumaca-51-kece901`, `camavo-50-kaku123`,
`cixave-47-milo698`, `cufega-65-beji958`, `dacuga-41-popo038`,
`dixiku-28-guzo497`, `doziki-93-rosi997`, `felega-00-saxi785`,
`gacaja-15-keko600`, `gelono-70-zuce760`, `gesogi-81-xoma900`,
`givanu-33-kire967`, `gofebi-87-zeka817`, `guceja-66-tola192`,
`judatu-15-xize591`, `jupoxe-15-sugo110`, `kasadu-53-tuki533`,
`katopo-68-xajo866`, `kudedo-31-pafi082`, `levuma-67-cego489`,
`loxija-71-joku558`, `mafete-03-rapa918`, `manata-12-rido730`,
`megara-21-rumi574`, `navene-45-cozo466`, `nivese-34-zavo418`,
`novata-87-muti352`, `perate-09-gale335`, `reluvi-59-pifi444`,
`ribapo-84-xudu593`, `rujuxa-07-neco067`, `tobajo-64-mipi810`,
`vupuse-73-nuso490`, `xabesu-51-dimi831`, `xekame-27-geba281`,
`zepima-96-peco612`, `ziboco-73-kazu841` — all 43 construct their back edge
through the SAME two call sites, so no per-fixture geometry trace was
needed once the code path was confirmed unconditional.

**Ruled out.**
- *"`emphasize:'up'` risks moving an existing pin."* Ruled out: `midArrow`
  is unreachable dead code today (import-graph proof + direct render, both
  independent evidence), so there is no existing mid-arrow output on ANY
  baseline fixture to disturb.
- *"'Longest segment' and 'first UP segment' coincide in practice, so the
  distinction is academic."* Ruled out by `biguku-39-voxu233`'s own numbers:
  the longest segment (123.6px, a horizontal leg) is NOT the vertical
  segment (96px) the jar actually emphasizes.
- *"The `GConnectionDownThenUp` shape could produce more than one vertical
  segment on some fixture (e.g. a laned reroute), breaking the 'always
  unique' claim."* Ruled out by reading `getPoints` itself
  (`gconnection-down-then-up.ts:7-9`): it returns a literal 4-point array
  independent of any lane input; lane crossing (per Q4/`swimlane-
  placement.ts`) only shifts coordinate VALUES post-hoc, never adds points.

## Q4 — cross-lane middle rules

**Mechanism.** `crossLaneMiddleY` (`swimlane-placement.ts:348-357`) has
three `EdgeShape` tags today: `'parallel-in'` (`mp1.y+4`), `'parallel-out'`
(`mp2.y-14`), `'default'` (`(mp1.y+mp2.y)/2`).

**Origin.** `swimlane-placement.ts:74` (`EdgeShape` union), `:348-357`
(the switch).

**Causal chain.** `FtileIfDown`'s `ConnectionIn`/`ConnectionOut.
drawTranslate` (`FtileIfDown.java:225-238,286-301`) uses middle
`= (y1+y2)/2` — this is EXACTLY `'default'`'s existing formula; **no new
tag is needed for `FtileIfDown`'s cross-lane connectors**, T4 reuses
`'default'` as-is. `FtileIfLongHorizontal`'s `ConnectionVerticalIn.
drawTranslate` (`:419-435`) uses middle `= y1+4` — numerically IDENTICAL to
`'parallel-in'`'s existing formula, but semantically a DIFFERENT upstream
`Connection` class (a per-branch if-diamond entry, not a fork/split bar
offset). `ConnectionVerticalOut` does NOT implement `ConnectionTranslatable`
at all (no `drawTranslate` override in `FtileIfLongHorizontal.java:438+`) —
it needs no cross-lane handling.

T3–T5's choice (numeric reuse of `'parallel-in'` vs a new semantically-named
tag with the identical formula) is a judgment call for those tasks, not
dictated here — reuse risks the two Java classes' formulas silently
diverging later without an obvious break point; a new tag costs one line.
Flagged, not decided.

**Laned `fixtures.md` slugs exercising each:**
- `FtileIfDown`'s `ConnectionIn`/`ConnectionOut` (`'default'`, no new tag):
  `cemipu-87-dinu624` (laned, plain `down`).
- `FtileIfLongHorizontal`'s `ConnectionVerticalIn` (needs the new/reused
  tag): `jucidi-98-zato093`, `nojije-35-teta491`, `zeporo-46-zicu301` (all
  laned `long`).

**Ruled out.** *"`'parallel-in'`/`'parallel-out'` might already be
consumed by an if-adjacent path, making this a non-issue."* Ruled out by
reading `swimlane-placement.ts`'s own doc comment (`:340-346`): both tags
are documented as fork/split-only (`walk-fork-branches.ts` citations),
confirming they are not already shared with any `if` connector.

## Q5 — label font and text placement

**Mechanism.** `getLabelPositive` builds branch/condition labels with the
ARROW style's font (`ConditionalBuilder.java:117` field assignment,
`:280-283` usage) — `plantuml.skin`'s `activityDiagram arrow FontSize`.
Ours: `activityFontSize(theme,'arrow')` resolves via `FONT_SIZE_DEFAULTS.
arrow = ARROW_FONT_SIZE = 11` (`activity-style-defaults.ts:92,133`) unless a
user skinparam overrides it — **11**, confirmed against every representative
fixture's golden (`font-size="11"` on every branch/condition text observed
in Q1's dumps).

**Origin.** `activity-style-defaults.ts:92` (`ARROW_FONT_SIZE=11`);
`activity-renderer-shapes.ts:76` (`ASCENT_FRACTION = 1-1/4.5 = 7/9`).

**Causal chain.** `renderLabel` (`activity-renderer-shapes.ts:107-117`)
takes `cy` as the text's BASELINE y directly (forwarded straight to the SVG
`<text y>` attribute) — it does NOT itself apply any top-left-to-baseline
offset; that conversion is the CALLER's job (`renderNode`'s callers pass
`cy + size/3` for vertically-centred boxes, `:277,398,428`).
`centeredFirstBaselineY` (`:97-98`) is the single-source formula: for a
label whose box height equals exactly `fontSize` (true of every `if-label`
this mission adds, per D3 — a plain one-line arrow-font label with no extra
padding), `baseline_y = topY + fontSize * ASCENT_FRACTION`.

**Measured, not just derived**, on `rerovo-62-nazo755`'s "yes" south label:
hexagon bottom (`topY`) `=39`; observed baseline `y=47.556`.
`39 + 11 * (7/9) = 39 + 8.556 = 47.556` — exact match. On the SAME
fixture's condition text "test" (centred in the WHOLE hexagon, `topY=15`,
`height=24`, so `center_y=27`): `27 + 11*(7/9-0.5) = 27+3.056=30.056` —
matches the observed `y=30.056` exactly (the general `centeredFirstBaselineY`
form, since the condition text centres in a box taller than one line).

**Contract for T3:** for an `if-label` node whose top-left origin `(x0,y0)`
matches the jar's `UTranslate` (`FtileDiamondInside.java:84-102`'s
`south`/`west`/`east` translates), call
`renderLabel(label, cx, y0 + ARROW_FONT_SIZE*ASCENT_FRACTION, theme,
{ sname: 'arrow', fontSize: ARROW_FONT_SIZE })`, with `cx` computed by
`activityTextLineX` per the label's own alignment (LEFT for west-anchored
labels, matching the jar's `HorizontalAlignment.LEFT` at
`ConditionalBuilder.java:280`).

**Ruled out.**
- *"`renderLabel` applies its own baseline offset internally, so `cy` should
  be the box's TOP y, not a pre-computed baseline."* Ruled out by reading
  `renderLabel`'s body (`:107-117`): `cy` is passed straight to `text(x, cy,
  ...)` with no transform; every existing caller (action/diamond/box labels)
  already does the `+ size/3`-style conversion BEFORE calling it, confirming
  the convention T3 must follow.
- *"The arrow font size might be theme-overridden in the representative
  fixtures, invalidating the `11` figure as a general contract."* Ruled out:
  none of the 9 representative or laned-check fixtures set
  `skinparam ArrowFontSize`; `11` is the `plantuml.skin` default figure,
  confirmed identical across every dump in Q1.

## Q6 — `--align` flag

Added to `scripts/activity-probe.ts` (`--align <slug>`, wired through
`FLAG_SETTERS`/`main()` exactly like `--dump`/`--lanes`). The per-tag-count
and positional-alignment LOGIC lives in a new sibling module,
`scripts/activity-probe-align.ts` (pure functions, no fs/CLI): adding it
inline would have pushed `activity-probe.ts` from 442 lines past the file's
500-line cap (`~/.claude/rules/code-principles.md`), so it was split
proactively rather than discovered by the complexity hook — logged as a
push-forward decision-journal row. `activity-probe.ts`'s own
`flattenElements` was widened from a private to an exported function so the
sibling module can reuse it rather than duplicating the SVG-tree walk.

`taggedElementsOf`/`perTagCounts`/`alignmentOf`/`alignReport` are unit-tested
in `tests/unit/scripts/activity-probe-align.test.ts` (a second test file,
alongside the existing `activity-probe.test.ts`, matching the source split).
Verified end-to-end against a real fixture (`--align rerovo-62-nazo755`):
`polygon: ours=3 jar=6`, `line: ours=4 jar=5`, `text: ours=2 jar=4`,
`rect: ours=1 jar=1`, `alignment: 4/16` — cross-checked by hand against the
golden SVG's raw element list (Q1's rerovo trace) and found to match exactly
(jar polygon=6 is hexagon+rhombus+4 arrowheads; jar text=4 is
"a"/"yes"/"test"/"no"; jar line=5 matches the 5 `<line>` elements traced in
Q1). `--align` output for all 9 Q1 representative slugs is recorded in Q1's
tables above, satisfying the acceptance criterion that `--align` reproduces
the base figures Q1 records by hand.
