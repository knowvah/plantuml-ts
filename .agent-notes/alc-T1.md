# alc-T1 — lane capture mechanism diagnosis

Mission `activity-lane-capture`, batch 1. No `src/` edit; all throwaway
instrumentation lived in `../alc-t1-scratch` (removed at the end of this
task) or in a scratchpad script outside the repo. D1/D2 (`decisions.md`):
**confirmed against the Java, no contradiction found.**

## Q1

**Setup.** `git worktree add ../alc-t1-scratch HEAD`; confirmed base
aggregate 52954/subsetSum 11783 over 40 (pre-amendment fixture count) in the
worktree before editing. Edited `node-dispatch.ts`'s `tryFork`/`trySplit`
only: moved `swimlaneSpread(ctx)` to capture BEFORE the branch-parsing loop
instead of after, keeping the single `swimlane` field (no `swimlaneOut`
added — that is D1's separate-field shape, out of this experiment's scope
per the task spec's "keeping the single field").

**Measurement.** `jevoce-05-mumi686`: 439 → 662 (rise, +223). Aggregate
52954 → 53039. 6 risers (`decudi-92-bisu741`, `gesogi-81-xoma900`,
`gugala-11-suce270`, `jevoce-05-mumi686`, `judatu-15-xize591`,
`maketa-43-juja264`), 8 fallers (`bixefi-77-moki051`, `bugaja-31-jaso630`,
`misiji-27-buje656`, `nupose-71-vido428`, `racana-82-zece676`,
`roboja-69-susa752`, `sopape-11-laxo488`, `tobajo-64-mipi810`).

**Which element/edge changed lane, and why the score rises.**

`--lanes jevoce-05-mumi686` is UNCHANGED before/after this edit:
`split/join line[0]: ours=4 jar=1` (top line), `diamond/hexagon[0]: ours=4
jar=1`. Ruled out that the rise comes from the split's own top-line/diamond
misclassification — verified identical `--lanes` output before and after.

**Mechanism.** `jevoce`'s split (`split` at swimlane `S1`) contains an `if`
as its first branch; that `if`'s `then`-branch stays in `S1` but its `else`
switches to `|S3|` before closing. Under the CURRENT (unfixed) code, the
`if` node's own `.swimlane` field is captured AFTER its whole body parses
(`if-dispatch.ts:189`), so `if.swimlane = S3` — the lane at `endif`, not at
`if (...)`. `swimlane-placement.ts#laneIn` (`:84-91`) short-circuits on
`tile.swimlane !== undefined` BEFORE ever consulting the inherited/ambient
lane, so `laneIn(t.children[0]!, myLane)`
(`walk-fork-branches.ts:137`, the split top line's own call site) reads the
if-tile's own field and returns `S3` regardless of what `myLane` is. This is
**independent of the fork/split-only edit** — confirmed by the unchanged
`--lanes` output — and is the `if` kind's own defect (T3's scope), not
fork/split's.

What DOES change under the fork/split-only edit is `ForkBranchContext.myLane`
(`walk-fork-branches.ts:17`), which the split's own field feeds via
`laneAt(splitTile, inherited)` at the point `tile-coordinates.ts`'s
`'gtile-split'` case is reached. Before this edit, `myLane` = the split's
`.swimlane` captured AFTER the whole split closes (here, `S3`, since the
LAST branch — `split again |S3| :foo3 foo3;` — ends in `S3`, and the split's
own field never resets between `split again` clauses, matching upstream's
single shared `Swimlanes` state, `AbstractParallelFtilesBuilder`'s `list99`
threading). After this edit, `myLane` = `S1` (the split's true opener).
`myLane` is the OUT-drop's landing lane in `pushBranchConnectors`
(`walk-fork-branches.ts:92-94`: `pushEdge(out, [...], laneOut(branch,
ctx.myLane), ctx.myLane, 'parallel-out')`) — so under the fix, every
branch's out-drop is now labelled as landing in `S1`, while the join
bar/line itself still sits at `laneOut(lastBranch, myLane)`
(`:169`, descends into the LAST branch's own tile — `S3`, unaffected by
`myLane` at all). **The out-drop's declared landing lane (`S1`) and the join
line's actual lane (`S3`) now disagree** — this metadata mismatch is what
`swimlane-placement.ts#routeEdge` (`:394-411`) uses to decide the cross-lane
4-point jog shape; a wrong/inconsistent lane pairing produces extra
polyline/point elements that do not align positionally with the jar's own
(differently-structured) SVG at that index, raising `weightedScore` per D5's
positional-pairing note. Confirmed in the raw dump diff: elements [39]-[74]
(36 items) before become [39]-[82] (44 items) after — 8 new `<line>`/
`<polygon>` entries, all inside the split's branch-connector region.

**Ruled out:**
- The rise is NOT the split top-line/diamond mismatch — `--lanes` unchanged.
- The rise is NOT caused by the `if` kind's own defect being newly exposed —
  the `if` fixture component was already broken before this edit (`--lanes`
  before AND after both show `ours=4 jar=1`); the edit touches fork/split
  code only, and if-dispatch.ts was never modified in the scratch worktree
  for Q1.
- The unverified planning hypothesis ("the edge leaving the split now reads
  S1 where the jar reads the lane at end split, S3") is CONFIRMED for the
  out-drop connectors specifically (verified above via the `myLane`/
  `laneOut(lastBranch, myLane)` mismatch), not merely plausible.

**Does D1's separate `swimlaneOut` remove the rise?** REASONED, not
measured — building the full D1 shape (a second `swimlaneOut` field on
`ActivitySplit`/`ActivityFork`, threaded into `ForkBranchContext` as a
SECOND lane alongside `myLane`, so the IN-drop keeps reading the opener and
the OUT-drop/join-bar-consistency reads the closer) requires restructuring
`ForkBranchContext` from one `myLane` field to two — this is the
"T2 lane-helper move" the README pre-authorizes as a stop-1 exception, i.e.
T2/T6/T7's job, not a "keep the single field" experiment. Reasoning: giving
the OUT-drop a `swimlaneOut`-sourced landing lane (`S3`, matching the join
bar's own `laneOut(lastBranch, myLane)`) removes the metadata disagreement
identified above, which is the specific mechanism causing this rise. It does
NOT fix `jevoce`'s `if`-driven top-line/diamond mismatch (`S3` vs jar's
`S1`) — that requires T3's `if` capture-timing fix separately. Both fixes
are needed before `jevoce` matches the jar; T1 does not predict the NET
score after both land, only that this specific rise's cause is addressed.

## Q2 — split top line / join line

`AbstractParallelFtilesBuilder`'s constructor
(`ftile/vcompact/AbstractParallelFtilesBuilder.java:80-84`) fills `list99`
(a `List<Ftile>`, NOT `List<InstructionList>`) from the `all` parameter in
order, decorated (margins/height) but never reordered
(`decorateAllTiles`, `:86-95`). `list99.get(i)` is `InstructionList
.createFtile(factory)`'s result for branch `i`
(`InstructionList.java:82-150,204-218`): for a non-empty branch, `result =
cur` (the first instruction's own Ftile) since `eventuallyAddNote(factory,
null, getSwimlaneIn(), ...)` returns `null` when there are no notes
(`:146`) — so `InstructionList.getSwimlaneIn()`'s `defaultSwimlane` field
(`:204-206`, always returned regardless of branch contents) is NEVER
consulted for a non-empty branch; only for an EMPTY one
(`FtileEmpty(factory.skinParam(), defaultSwimlane)`, `:132-137`).

`ParallelBuilderSplit.java:83`'s `list99.get(0).getSwimlaneIn()` therefore
descends, via `FtileAssemblySimple.getSwimlaneIn() = tile1.getSwimlaneIn()`
(`FtileAssemblySimple.java:71-72`), to the FIRST LEAF instruction's own
captured swimlane (each leaf `Instruction` — e.g. `InstructionSimple` —
captures `swimlanes.getCurrentSwimlane()` in ITS OWN constructor, at ITS OWN
parse position). Ours (`laneIn(t.children[0]!, myLane)`,
`walk-fork-branches.ts:137`) does the SAME descent: `laneIn`
(`swimlane-placement.ts:84-91`) recurses into a `gtile-top-down`'s first
child until it finds an explicit `.swimlane`, which for a non-empty branch
is set by `tile-layout.ts#withSwimlane` from the leaf `ActivityNode
.swimlane` field — already captured correctly at each leaf's own parse
position (leaves are not part of the D1 defect). **Ours matches upstream for
non-empty first branches.**

`swimlaneOutForStep2()` (`AbstractParallelFtilesBuilder.java:208-210`)
returns `list99.get(last).getSwimlaneOut()` — same reasoning, descends to
the LAST branch's LAST leaf's own captured lane. Ours
(`laneOut(lastBranch, myLane)`, `walk-fork-branches.ts:169`) matches.

**One narrow, out-of-scope divergence found (EMPTY first branch only):**
`InstructionFork`'s constructor and `forkAgain` both create branches via
`InstructionList.empty()` → `defaultSwimlane = null`
(`InstructionFork.java:83,133`), so an EMPTY fork branch's
`getSwimlaneIn()` is `null`. `InstructionSplit`'s constructor and
`splitAgain` instead pass `new InstructionList(swimlane)` /
`new InstructionList(swimlaneIn)` (`InstructionSplit.java:73,124`) — an
EMPTY split branch's `getSwimlaneIn()` is the split's OWN opener lane, not
`null`. Ours (`laneIn`'s `gtile-top-down` case, `:86-90`) returns `inherited`
(`myLane`) for BOTH kinds when a branch has zero children — matching
split's behavior, diverging from fork's (`null` vs a real lane) for an
EMPTY FORK branch specifically. Not one of the 40/30 fixtures (none has an
empty fork branch); flagging for the record, not fixing (outside T1's
write-set; a candidate follow-on, not this mission's D3/D7 filings).

## Q3 — which getter reaches a drawn connection

Grepped `getSwimlaneIn()`/`getSwimlaneOut()` across
`~/git/plantuml/.../activitydiagram3/` (`activitydiagram3/**/*.java`, both
`net/sourceforge/plantuml/activitydiagram3/*.java` — the `Instruction*`
classes — and its `ftile/**`/`gtile/**` subtrees).

**Mechanism.** Two disjoint caller groups:

1. **Instruction-level** (`InstructionRepeat.java:236-242`,
   `InstructionWhile.java:175-181`, `InstructionSplit.java:166-167,
   171-173`): all delegate UP to `parent.getSwimlaneOut()` (repeat, while,
   split's `getSwimlaneIn()`) — i.e. "whatever lane the PRECEDING sibling
   instruction in the enclosing `InstructionList` left off at", never this
   construct's OWN captured lane. These feed `InstructionList
   .getSwimlaneOut()` (`:209-217`: 0 lanes → `null`, 1 lane → that lane,
   else → `getLast().getSwimlaneOut()`) and `.getSwimlaneIn()` (`:204-206`,
   always `defaultSwimlane`) — consumed ONLY by `InstructionList
   .createFtile()`'s `eventuallyAddNote(factory, null, getSwimlaneIn(),
   ...)` (empty-list/note-placement bookkeeping, `:135-146`) and by
   `getSwimlanes()`'s membership set (`:198-201`) — NEVER by a `Connection`
   object or a translate/lane-shift decision.

2. **Ftile/Gtile-level** (`FtileRepeat.java:101-106` reading
   `repeat.getSwimlaneIn()`/`diamond2.getSwimlaneOut()`;
   `FtileWhile.java:102-107` reading `diamond1.getSwimlaneIn()`;
   `FtileIfDown.java:97-105` reading `diamond1`/`thenBlock`; and the
   generic `FtileAssemblySimple`/`FtileHeightFixed*`/`FtileMarged*`
   delegators): these are what a drawn `Connection` actually reads.
   `Swimlanes.Cross#draw` (`ftile/Swimlanes.java:194-198`) reads
   `connection.getFtile1().getSwimlaneOut()` /
   `connection.getFtile2().getSwimlaneIn()` to decide whether to draw a
   `ConnectionCross`; `UGraphicInterceptorOneSwimlane.java:96-99` and
   `UGraphicInterceptorAllSwimlanes.java:134-137` read the SAME pair of
   getters on a connection's two tiles to pick which lane's `UTranslate` to
   apply before `ConnectionVerticalDown#drawTranslate`
   (`ftile/vcompact/ConnectionVerticalDown.java:81-99`) runs. Confirmed via
   `FtileFactoryDelegatorAssembly.java:74-75`: the general sequential
   connector (`InstructionList`'s own statement-to-statement link) is built
   as `new ConnectionVerticalDown(tile1, tile2, p1, p2, ...)` — holding
   Ftile REFERENCES, not baked-in swimlane values — so the getters are read
   lazily, at DRAW time, off the Ftile, never off the Instruction.

**Causal chain.** Only Ftile/Gtile-level lanes reach a drawn connection or a
translate decision. The Instruction-level parent-delegating getters are a
dead end for geometry — pure `InstructionList` bookkeeping (empty-list
swimlane, note placement, membership set).

**Ruled out:** that the Instruction-level getters could matter for ANY
drawn output — traced every call site (`InstructionList.java:146,204-217`)
and found none reaches a `Connection`/translate; the only consumers are
`eventuallyAddNote` (guarded by `Display.isNull`/empty-notes checks) and
`getSwimlanes()` (a `Set` used for membership tests in
`UGraphicInterceptor*`, not for picking a translate).

### Call-site table

| call site | compound | reads In or Out of which tile | upstream cite |
|---|---|---|---|
| `tile-coordinates.ts:176-177` | sequential (`gtile-top-down`, any block body) | Out of `child`, In of `next` (forward edge between adjacent siblings) | `ftile/vcompact/FtileFactoryDelegatorAssembly.java:74-75` (`ConnectionVerticalDown` construction); `ftile/vcompact/ConnectionVerticalDown.java:81-99` (`drawTranslate`, the shape ported); lane selection via `ftile/vcompact/UGraphicInterceptorOneSwimlane.java:96-99` |
| `tile-coordinates.ts:208-221` | if / switch (branch + merge edges) | Out of `diamond`, In of `branch`; then Out of `branch`, In of `mergeDiamond` | `ftile/vcompact/FtileIfDown.java:97-105` (`getSwimlaneIn`/`getSwimlaneOut`); `ftile/vcompact/cond/FtileIfNude.java:81-94` (branch-level diamond swimlane) |
| `tile-coordinates.ts:258-296` | repeat (body↔condition, condition/backward↔body forward+back edges) | Out of `body`, In of `condition`; then Out of `condition`/`backwardBody`, In of `backwardBody`/`body` | `ftile/vcompact/FtileRepeat.java:101-106` (`getSwimlaneIn`/`getSwimlaneOut`); `InstructionRepeat.java:107` (`swimlanes.getCurrentSwimlane()` opener capture) |
| `tile-coordinates.ts:336-349` | switch (case + merge edges) | Out of `diamond`, In of `c`; then Out of `c`, In of `mergeDiamond` | `ftile/vcompact/FtileSwitch.java:91-96` (`getSwimlaneIn`/`getSwimlaneOut`, delegates to `tiles.get(0)`) |
| `walk-while-branch.ts:48-61` | while (header↔body forward edge, body↔header back edge) | Out of `header`, In of `body`; then Out of `body`, In of `header` | `ftile/vcompact/FtileWhile.java:102-107` (`getSwimlaneIn`/`getSwimlaneOut`, delegates to `diamond1`) |
| `walk-fork-branches.ts:79` | fork/split (per-branch in-drop) | In of `branch` (destination); source is `ctx.myLane` (the bar) | `ftile/vcompact/ParallelBuilderFork.java:151-163` / `ParallelBuilderSplit.java:194-203` (`ConnectionIn#drawU`) |
| `walk-fork-branches.ts:92` | fork/split (per-branch out-drop) | Out of `branch` (source); destination is `ctx.myLane` (the join bar) | `ftile/vcompact/ParallelBuilderFork.java:202-216` / `ParallelBuilderSplit.java:246-261` (`ConnectionOut#drawU`) |
| `walk-fork-branches.ts:137` | split (top line's own lane) | In of `t.children[0]` (first branch) | `ftile/vcompact/ParallelBuilderSplit.java:83` (`list99.get(0).getSwimlaneIn()`) |
| `walk-fork-branches.ts:153` | fork (join bar's own lane) | Out of `lastBranch` | `InstructionFork.java:174-181` (`swimlaneIn`/`swimlaneOut` fields, opener/`fork again`/`end fork` capture) — the JOIN BAR ITSELF always draws (D5's fork-never-`FtileKilled` amendment), unconditional |
| `walk-fork-branches.ts:169` | split (join line's own lane) | Out of `lastBranch` | `ftile/vcompact/AbstractParallelFtilesBuilder.java:208-210` (`swimlaneOutForStep2`); `InstructionSplit.java:139-141` (`FtileKilled` guard — split's join line is conditional on `hasPointOut()`) |

## Q4 — fixture set verification

**Mechanism (why the original scan was wrong).** The planning regex scan
flagged a fixture's kind whenever a `\|lane\|` header appears textually
inside a compound's body — but a lane switch that DETOURS and RETURNS to
the same lane by the construct's close produces `opener === closer`, so
D1's fix (capture-at-open vs capture-at-close) is byte-identical for that
instance. The scan also has a false-positive surface for `if`/`while`/
`repeat`/`fork`/`split` bodies that contain a multi-line action with a
creole TABLE (`| cell | cell |`) — those `|...|` lines are consumed by
`readMultilineActionBody` (`node-dispatch.ts:113-133`) before the swimlane
dispatcher ever sees them (correctly, no lane switch), but a naive `\|`
count still matches them.

**Method.** Scratch-worktree throwaway (never committed): added a SECOND,
opener-time capture (`__opener`, `swimlaneSpread(ctx)` called before body
parse) alongside the EXISTING closer-time `swimlane` field, for ALL FIVE
compound kinds (`tryIf`/`tryWhile`/`tryRepeat`/`tryFork`/`trySplit`), then
parsed every fixture once and compared `node.__opener !== node.swimlane`
per compound instance. A first draft used a pure-AST re-derivation (thread
an inferred "current lane" across siblings without re-parsing) and produced
WRONG results for any compound preceded by a bare `\|lane\|` switch with no
intervening leaf node (that switch has no AST node of its own, so
inference from sibling fields alone silently drops it) — this draft was
discarded; ruled out via direct instrumentation disagreeing with it on
`gugala-11-suce270` (`split` inference said 0/1, direct capture says 1/1)
and confirmed by hand-tracing the source.

**Ruled out (corroboration).** Hand-traced 3 "removal" candidates
(`noxasi-06-nejo322`, `megara-21-rumi574`, `tuneta-22-mega154`) and the most
complex "removal" candidate (`rujuxa-07-neco067`, 3-level-nested if/repeat/
if, lane hops L1→L2→L3→L2→L1) line-by-line against `dispatch-support.ts`'s
actual `ctx.currentSwimlane` threading rules — all 4 traces match the
direct-instrumentation tool exactly (if:0/3, repeat:0/1 for `rujuxa`,
matching every one of its 4 compound instances). Also hand-traced
`ruzica-16-deli877` (the one kind-corrected row) and independently derived
if:0/2, while:2/2, matching the tool.

**Amendments** (full detail + pins in `decision-journal.md`'s T1 row, not
repeated here since this file's slugs are NOT regex-extracted by the
probe): 10 rows removed as false positives (`bumaca-51-kece901`,
`firibi-00-puki721`, `letuke-04-poza319`, `megara-21-rumi574`,
`nojije-35-teta491`, `noxasi-06-nejo322`, `rujuxa-07-neco067`,
`tuneta-22-mega154`, `xarumo-26-zinu467`, `xovano-23-tazo278`); 1 row's kind
corrected (`ruzica-16-deli877`: `if, while` → `while`). New fixture count:
30 (was 40). New subsetSum: 8950 (was 11783).

**Spot-checked kinds NOT flagged as amendments, confirmed correct as-is:**
`decudi-92-bisu741` (if 1/1, split 1/2 — fork 0/1 correctly not claimed),
`judatu-15-xize591` (split 1/2 — if/while/repeat 0 correctly not claimed),
`gesogi-81-xoma900` (fork 1/1 — while/repeat 0 correctly not claimed),
`maketa-43-juja264` (if 1/1, split 1/1 — fork 0/1 correctly not claimed),
`tobajo-64-mipi810` (fork 1/1 — if 0/4, repeat 0/3 correctly not claimed).
All 5 "(pin)" fixtures (`bixefi`, `bugaja`, `racana`, `maketa`, `tobajo`)
remain confirmed with their claimed kind — no interaction with D5's
`ALLOWED_NEW_OVERLAPS` allowlist.

## Q5 — base measurement

`plans/activity-lane-capture/measurements/base.json`: `aggregate: 52954`,
`subsetSum: 8950` (over the 30-slug amended `fixtures.md`).
`plans/activity-lane-capture/measurements/base-lanes.txt`: `--lanes` output
for all 30 amended fixtures.

## `--lanes` heuristic defects found

None beyond the two exclusions the probe's own doc comments already record
(`activity-probe.ts`'s `isSplitJoinLine`/`isDiamondOrHexagon` docs: a
vertical swimlane divider at the same 1.5 stroke-width as a split/join
line; an arrowhead polygon sharing fill=stroke). Spot-checked one fixture
per compound category against `--dump`: `bixefi-77-moki051` (fork bars —
confirmed the `ours=2 jar=0` row is a REAL geometry defect, not a
classification error: both our bars sit at the SAME x=214.75, the jar's sit
at x=26 and x=242.75 — traced to the fork's own `.swimlane` field
[captured at close, `S`-something after all fork-again branches] feeding
`pushTopBarOrLine`'s fork case directly), `bugaja-31-jaso630` (split lines),
`tobajo-64-mipi810` (diamond/hexagon — has 2 `note` blocks; confirmed the
note shapes do not collide with the polygon fill≠stroke heuristic: all
14 genuine diamond/hexagon polygons have `fill="#F1F1F1"` vs
`stroke:#181818`, all 24 arrowhead polygons have fill=stroke=`#181818`, and
notes render as non-`<polygon>` tags this probe's `DUMP_TAGS`/`categoryOf`
never touch).
