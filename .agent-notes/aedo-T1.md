# aedo-T1 — activity edge draw order, diagnosis

Mission `activity-edge-draw-order`, task T1. No `src/` edit lands from this
task; every instrumentation edit lived in a scratch worktree off `6ff347f8`
(`../aedo-t1-scratch`, removed at the end) behind two env gates, and a control
run with both gates OFF reproduced the baseline exactly — aggregate **52673**
over 268 fixtures, every delta 0. That control is what licenses reading the
three measured runs as the rule and nothing else.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## Q1 — where does a lane-less edge go? (D2, stop 4)

**Answer: the case cannot arise in a laned diagram. The jar's parser forbids
it.**

**Mechanism.** An `EdgeMeta` end is `undefined` only when the ambient lane is
undefined — `laneAt`/`laneIn`/`laneOut` fall through to `inherited`
(`src/diagrams/activity/layout/swimlane-lanes.ts:16-52`), and `inherited`
starts `undefined` at the root walk
(`layout/assign-coordinates-full.ts`'s `walkTile(root, …, { lane: undefined })`).
That means a lane-less edge needs content that precedes the first `|lane|`
declaration. Upstream rejects exactly that markup: the first non-swimlane
instruction latches `swimlaneStrategy = SWIMLANE_FORBIDDEN`
(`activitydiagram3/ActivityDiagram3.java:80-84`), and any later `|lane|` then
returns `CommandExecutionResult.error("This swimlane must be defined at the
start of the diagram.")` (`ActivityDiagram3.java:86-91`).

**Origin.** `ActivityDiagram3.java:90-91` (the guard), with
`ConnectionCross.java:53-61` as the second, independent barrier.

**Causal chain.** In a diagram that *does* declare lanes, every instruction is
created after `currentSwimlane` is non-null, so every `Connection` endpoint
carries a lane. Therefore `UGraphicInterceptorOneSwimlane.java:96-99`'s
`tileN.getSwimlaneX() == null` disjunct — the clause that would admit one
connection to EVERY pass — is never satisfied from user markup, and the
"appears more than once" risk D2 raises does not materialise. Independently,
even if such a connection existed, the final cross pass could not draw it:
`Swimlanes.Cross#draw` admits it (null `!=` non-null, `Swimlanes.java:178-216`)
but `ConnectionCross#drawU` returns early on either null swimlane
(`ConnectionCross.java:55-61`), emitting nothing.

**Evidence (jar dump, not the interceptor read).**
- Authored `.puml` with content before the first lane, rendered through
  `scripts/oracle-render.sh`: the jar produced an ERROR diagram, not a
  drawing — text node `This swimlane must be defined at the start of the
  diagram. (Assumed diagram type: activity)`, `[From v1.puml (line 4)]`.
  Three variants (lane after `start`, lane after a bare action, longer lane
  names) all failed identically at the `|lane|` line.
- Four *valid* laned fixtures authored to hunt a builder-made null lane
  (`fork` across lanes, `split` across lanes, `if` with an empty `else`,
  `if` + `detach`), rendered through the same script: **zero duplicated
  elements** in every one (`fork` 17 line/polygon elements, 17 distinct;
  `split` 25/25; `ifempty` 22/22; `detach` 18/18). Nothing is drawn twice.
- Corpus scan of all 268 baseline fixtures through the real layout
  (`assignCoordinatesFull`, reading `edgeMeta` directly): **59** declare a
  swimlane, and **0 of those 59** carry an edge with an `undefined` end. The
  197 fixtures that do carry lane-less edges have `ast.swimlanes === []`,
  where `Swimlanes#drawGtile` takes the `else` branch
  (`Swimlanes.java:275-280`) and runs no passes at all.

**Ruled out.**
- *"The interceptor admits a null lane to every pass, so it is drawn N
  times."* Ruled out twice over: the markup that would produce a null lane is
  rejected at parse (`ActivityDiagram3.java:90`), and the four authored laned
  fixtures show 0 duplicated elements.
- *"The cross pass is where it lands."* Ruled out by `ConnectionCross.java:
  55-61`, which returns before drawing when either end is null.
- *"`FtileEmpty`/`FtileKilled` can inject a null lane inside a laned
  diagram."* `FtileEmpty` holds a nullable lane (`FtileEmpty.java:95-106`) and
  IS constructed without one at `FtileRepeat.java:144` and
  `FtileIfDown.java:131`. Ruled out as reachable-and-visible by the authored
  `ifempty`/`detach` dumps above (no duplicates, no dropped connector), and
  `InstructionList.java:138` passes `defaultSwimlane` rather than null on the
  list path. Flagged as the one residual: a future compound could in
  principle re-open this, which is why the contract below keeps a defined
  answer instead of asserting unreachable.
- *"It is a `--slugs` selection artefact."* Ruled out: the scan is the full
  268-row `diff-baseline.json` baseline set, keyed on `ast.swimlanes.length`,
  not on a markup regex. (A markup regex was tried first and was WRONG — it
  called 60 fixtures laned, one of which, `letuke-04-poza319`, has
  `ast.swimlanes === []`. The AST count is 59, not the brief's 60.)

**Contract for T2/T3.** D2's stated default stands — no amendment needed.

```ts
// returns the lane whose pass draws this edge, or null for the cross pass
function passOf(meta: EdgeMeta, laneNames: readonly string[]): string | null;
```

Rule, in order:
1. `laneNames.length === 0` → no passes run at all (`Swimlanes.java:275-280`);
   the ordering is the identity and `passOf` is never consulted.
2. `lane1 === lane2` and defined → that lane
   (`UGraphicInterceptorOneSwimlane.java:96-101`).
3. both defined and different → `null`, the final cross pass
   (`Swimlanes.java:178-216`, `:350-352`).
4. either end `undefined` → **unreachable from user markup** (proved above).
   Keep D2's default — the FIRST pass it qualifies for, i.e. the known end's
   lane, or `laneNames[0]` if both are undefined. This mirrors the
   interceptor, where a null lane is contained in every pass and the first
   pass therefore draws it first. Do not `throw` on this branch: it is
   unreachable through the parser, not through the type.

## Q2 — both rules re-measured with the D1 permutation

Scratch worktree off `6ff347f8`, `edges` AND `edgeMeta` permuted by one index
array (D1's shape), applied as the last step of `assignCoordinatesFull`.

| run | aggregate | vs base | fell / rose | planning run |
|---|---|---|---|---|
| control (gates off) | **52673** | 0 | 0 / 0 | — |
| (a) alone | **52616** | −57 | 5 / 3 | 52616 — identical |
| (b) alone | **52078** | −595 | 31 / 5 | 52074 — 4 higher |
| (a)+(b) | **52067** | −606 | 33 / 5 | 52066 — 1 higher |

Runs are `plans/activity-edge-draw-order/measurements/{base,scratch-a,
scratch-b,scratch-ab}.json`.

**How they differ from the misaligned planning run.** Rule (a) is bit-identical
(52616, same riser and faller sets): (a) permutes only the in/out connectors
*within* one parallel, and on every split/fork in the baseline both connectors
of a branch already share `edgeMeta`, so permuting `edges` alone vs. both
arrays makes no difference to what `compressGeometry`/`shapesOf` read
(`compress/shapes-of.ts:376-377`). Rule (b) is 4 units HIGHER once `edgeMeta`
travels with `edges` — the misaligned scratch let compression read a
neighbour's lanes and, by luck, shave 4 units it was not entitled to. The
union of movers is the SAME 38 slugs in both runs.

`fixtures.md` is rewritten from this measurement. Note its provisional header
claimed a pin sum of 11035; re-adding its own rows gives **11193**, which
matches `diff-baseline.json` row for row — the header was a transcription
error, not a stale pin.

## Q3 — snake merging (D5)

**Mechanism.** `UGraphicForSnake#addPendingSnake` merges a new Snake into an
earlier pending one and keeps the EARLIER slot
(`svek/UGraphicForSnake.java:146-156`), and `flushUg` additionally strips an
arrowhead via `removeEndDecorationIfTouches` (`:158-165`, `:81-88`). Both
hinge on one precondition: `Snake#merge` returns non-null only when
`same(this.getLast(), other.getFirst())` — the two snakes must share an
endpoint to within 0.001 (`ftile/Snake.java:299-327`).

**Origin.** `Snake.java:312` (the `same(getLast(), getFirst())` gate).

**Causal chain / measurement.** On seven `fixtures.md` slugs I counted our
edges and segments against the jar's drawn elements, with arrowheads
identified by the probe's own rule (a `<polygon>` whose fill equals its
stroke, which excludes if/while diamonds):

| slug | our edges | our segments | jar lines | jar arrowheads | our touching pairs |
|---|---|---|---|---|---|
| `racana-82-zece676` | 12 | 28 | 34 | 12 | 0 |
| `gugala-11-suce270` | 9 | 15 | 20 | 9 | 0 |
| `bixefi-77-moki051` | 6 | 14 | 18 | 6 | 0 |
| `firibi-00-puki721` | 13 | 19 | 28 | 13 | 0 |
| `misiji-27-buje656` | 7 | 15 | 18 | 7 | 0 |
| `noxasi-06-nejo322` | 9 | 13 | 16 | 9 | 0 |
| `cemipu-87-dinu624` | 7 | 15 | 19 | 9 | 0 |

Arrowhead count equals our edge count on six of seven, so the jar emitted one
terminated connection per edge we emit — no merge collapsed two into one, and
no `removeEndDecorationIfTouches` fired. And **no two of our edges share an
endpoint on any slug** (`touching pairs = 0`), so `Snake.java:312`'s
precondition is not satisfiable by our edge set even in principle.

**Conclusion: merging explains none of the residual count or order gap on
these slugs.** The count gap that does exist is elsewhere: the jar draws more
`<line>` elements than we draw segments (34 vs 28 on `racana`) because its
`Worm` splits a route into more pieces than our `routeEdge`, and `cemipu`'s
2 extra arrowheads are the `if`'s own entry/exit connectors (Q4), not a merge.
D5 stands: T4 files `activity-snake-merge`; nothing here needs it.

**Ruled out.**
- *"Merging is why the jar's edge run is shorter/reordered."* Ruled out by
  arrowhead parity (6/7 exact) plus `touching pairs = 0`.
- *"The `<polygon>` count is the arrowhead count."* Ruled out and CORRECTED
  mid-measurement: a first pass counted all polygons and read 11 on `cemipu`,
  which conflated the if-diamond with arrowheads. Re-counted on fill==stroke,
  giving 9. The earlier number would have manufactured a merge that is not
  there.
- *"The line-count gap is merging."* Ruled out by direction — merging can only
  REDUCE the jar's element count, and the jar has MORE lines than we have
  segments on every slug.

## Q4 — other compounds (D7)

The shared upstream fact: every one of these builders accumulates a
`List<Connection>` and ends with `FtileUtils.addConnection(result, conns)`
(`FtileUtils.java:46-51`), which wraps in `FtileWithConnection`, whose
`drawU` draws the delegate FIRST and then every connection in list order
(`FtileWithConnection.java:69-74`). So yes — in the jar all three draw their
internals before their own connectors. Because our renderer already emits
every node before every edge (`renderer.ts:234-247`), the internals-then-
connectors split matches for all three; the divergence, where there is one, is
the order WITHIN the edge run.

**`if`.** Jar: `FtileIfLongHorizontal.java:203-257` appends, per branch, a
`ConnectionVerticalIn` then a `ConnectionVerticalOut` (`:226-227`), then the
inter-diamond horizontals (`:231-238`), then the if's OWN entry connector
`ConnectionIn` (`:239`), then `ConnectionLastElseIn`/`Out` (`:249-250`) and an
optional `ConnectionHline` (`:254`). `FtileIfDown.java:135-157` has the same
shape. Ours interleaves per branch inside the branch loop — diamond→branch
then branch→merge, pushed immediately after walking that branch
(`tile-coordinates.ts:186-232`). The per-branch in/out pairing therefore
agrees, but the if's entry edge is ours-emitted by the enclosing
`gtile-top-down` sibling loop (`tile-coordinates.ts:166-180`) BEFORE the if's
internals, where the jar appends it AFTER every branch connector. Measured on
`cemipu-87-dinu624`: our 42 drawn elements vs the jar's 46, (tag,lane)
positional agreement 17/42. Divergent — D7, file it.

**`while`.** Jar: `FtileWhile.java:151-168` — `ConnectionBackEmpty` or
`ConnectionIn`, then the back connectors, then `ConnectionOut`/
`ConnectionOutSpecial`. Ours walks header, then body, then pushes forward
(header→body) and back (body→header) (`walk-while-branch.ts:39-62`):
internals first, then connectors, in entry-then-back order. This is the
closest of the three — the ordering agrees up to the connectors the jar has
and we do not model (the explicit `ConnectionOut`). No action beyond D7's
filing.

**`repeat`.** Jar: `FtileRepeat.java:172-204` — `ConnectionIn`, then the
backward family, then `ConnectionOut` last. Ours pushes the body→condition
edge BEFORE it walks the condition tile (`tile-coordinates.ts:252-261`, then
`walkTile(condition, …)` at `:262`), i.e. an edge is emitted between two node
emissions. Harmless to output today because the renderer re-groups nodes and
edges, but it is a real structural divergence from
`FtileWithConnection.drawU`, and it means the repeat's edge run is ordered by
our walk rather than by the jar's conns list. D7, file it.

## Q5 — riser mechanisms

`weightedScore` pairs elements POSITIONALLY and its `[childCount]`
short-circuit charges the sum of both sides (`compare.ts:404`), so on any
fixture where our element count differs from the jar's, a reordering can move
the number in either direction without any geometry changing. Every riser
below is that, not a regression. Alignment figures are (tag, lane) positional
matches between our element run and the jar's, from `--dump`.

**`misiji-27-buje656` — the required one. Rule (b) owns it; landing both
removes it.** 40 elements on both sides.

| state | alignment | score |
|---|---|---|
| base | 29/40 | 205 |
| (a) alone | 27/40 | **+32** |
| (b) alone | 38/40 | −32 |
| (a)+(b) | 38/40 | −32 |

Mechanism: the fixture is a two-branch `fork` whose branches switch lanes
(`|ebee-vdq-form|` / `|ebee-ws|`), so its connectors are split across lane
passes. The jar's edge run is lane-GROUPED — reading the golden's tail, all
of lane 0's terminated edges come first (`line/0 polygon/0 line/0 polygon/0`),
then lane 1's (`line/1 polygon/1`), then the cross edges. Rule (a) alone
re-sorts those same connectors into all-ins-then-all-outs *within the fork*,
which is the jar's `doStep1`/`doStep2` grouping — but the jar then re-orders
that result again by lane pass, so (a) without (b) lands the connectors in an
order the jar never emits, dropping alignment 29→27 and costing +32. Applying
(b) sorts by lane pass and recovers 38/40, and (a)+(b) is identical to (b)
alone (−32) because after the lane partition the intra-parallel order is
already forced. So (a) is not wrong; it is unobservable until (b) lands.

**The four remaining (a)+(b) risers are all element-count mismatches.**

| slug | ours | jar | align base → (b) | (b) |
|---|---|---|---|---|
| `bumaca-51-kece901` | 29 | 35 | 13 → 13 | +4 |
| `decudi-92-bisu741` | 72 | 62 | 23 → 19 | +4 |
| `xarumo-26-zinu467` | 35 | 42 | 9 → 6 | +4 |
| `maketa-43-juja264` | 55 | 44 | 10 → 12 | +1 |
| `judatu-15-xize591` | 82 | 105 | 32 → 31 | +2 |

None has a matching element count, so the two runs are being compared
off-by-N from the first surplus/missing element onward. `bumaca` is the
cleanest illustration: rule (b) moves 9 elements and alignment does not change
at all (13 → 13), yet the score moves +4 — the pairing is dominated by the
6-element deficit, not by the order. `decudi` and `xarumo` lose alignment
because reordering changes WHICH of our surplus/deficit elements pairs with
which jar element. `maketa` is the opposite and the proof that the metric is
not tracking fidelity here: its alignment IMPROVES (10 → 12) while its score
RISES +1, which is only possible through the `childCount` short-circuit.

**`judatu-15-xize591` (+2 under (a) AND under (b)) and `jevoce-05-mumi686`
(+2 under (a), −22 under (b)).** Same mechanism, largest count gaps in the
set: `judatu` is 82 vs 105 (23 short), `jevoce` 77 vs 83. `jevoce` is the
sharpest case — under rule (a) its alignment IMPROVES 16 → 17 and its score
still rises +2.

**Does landing both rules remove them?** For `misiji`, yes — entirely. For the
other five, no: they rise by the same amount under (b) alone and under
(a)+(b), because their cause is the count mismatch, which neither rule
touches. They are expected to persist through T4 and each needs a journal row
at re-pin (stop 5), not a fix.

**Ruled out.**
- *"A riser means geometry moved."* Ruled out: both rules only permute
  `edges`/`edgeMeta`; the control run reproduces 52673 exactly with the gates
  off, and no node coordinate is read or written by either patch.
- *"`misiji` rises because rule (a) is wrong."* Ruled out by the (a)+(b)
  column: with (b) applied, (a) costs nothing (−32 either way).
- *"Alignment and score move together, so score is a fidelity proxy here."*
  Ruled out by `maketa` (+1 with alignment improving) and `jevoce` (+2 with
  alignment improving) — two independent counterexamples.
- *"The risers are the misaligned-`edgeMeta` artefact the provisional table
  guessed at."* Ruled out for `maketa`: its +1 SURVIVES the D1 permutation.

## Cross-checks against the handed-down numbers

- HEAD `6ff347f8` and baseline aggregate **52673** over 268: both reproduced.
- `fixtures.md`'s 38 slugs: membership reproduced exactly; its stated pin sum
  11035 is wrong, the correct sum of its own rows is **11193**.
- The brief's "60 of 268 baseline fixtures declare a swimlane" is **59** by
  the AST. The 60th (`letuke-04-poza319`) matches a `|`-leading markup regex
  but parses to `ast.swimlanes === []`.
- `src/diagrams/activity/layout/edge-draw-order.ts` does not exist — confirmed;
  T2 creates it.
- No finding contradicts D1–D7. D2's default is confirmed rather than
  overridden, so no amendment and no stop-3 halt.
