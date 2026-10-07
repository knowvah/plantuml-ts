# add3-T3c — IFNOTE residual, CONDSTYLE-EMPTY with-links, IF-KILL

## Commits (3, branch `add3/T3c`, on top of `af9dbc63b`)

1. `59b4aa732` — if-down's own note pads `mainTileY`, not just `diamond1`.
2. `a7b2cc889` — with-links `if` honours `conditionStyle`; real diamond
   shape carried on the node (`diamondShape`), not inferred from `label`.
3. `c36fec1a3` — `detach`/`kill` right after a closed `if` kills the if's
   branches in place, not a flow sibling.

All three green independently: `npx tsc --noEmit` (both tsconfigs), `npx
eslint` on every touched file, targeted `npx vitest run`, the
golden-ratchet + harness-parity gate (284 pins byte-equal throughout, 348
tests), `compress/invariant.test.ts` (3/3, no new entries), and a probe
run with zero risers against the pinned `diff-baseline.json` manifest
after every commit.

## Java -> ours (file:line)

**Commit 1 (IFNOTE residual)** — `FtileIfDown.java:624-637`
(`getTranslateForThen`'s own `y = opaleHeight + dimDiamond1.getHeight() +
(dimTotal.getHeight() - opaleHeight - dimDiamond1.getHeight() -
dimDiamond2.getHeight() - dimThen.getHeight()) / 2`) -> `tiles/gtile-if-
down.ts#computeOffsets`'s `mainTileY`, which the ORIGINAL IFNOTE landing
(add3 T2a) updated `diamond1Y` for but left at the pre-note formula
(missing BOTH `opaleHeight` terms) — every then-branch action under a
noted if-down shifted up by exactly `opaleHeight/2`. Also closed the gap
`.agent-notes/add3-T3d.md` named for this task: `FtileIfWithDiamonds
.createOpale`/`FtileIfDown`'s own `createOpale` (`FtileIfWithDiamonds
.java:113-130`) build the SAME real `Opale`-over-creole-`Sheet` as
`FtileWithNoteOpale`'s `createOpale` — `measureIfOwnNote`
(`tiles/gtile-note.ts`) now calls `measureOpaleCreole` instead of the old
raw `measureOpaleText`.

**Commit 2 (CONDSTYLE-EMPTY)** — `ConditionalBuilder#getShape1`
(`vcompact/cond/ConditionalBuilder.java:259-266`), the EMPTY_DIAMOND/
INSIDE_DIAMOND arms T3a wired for `buildIfDown` only
(`.agent-notes/add3-T3a.md`'s "Not done" item 1) -> `conditional-
builder.ts#buildIfWithLinks`, now calling the SAME `createConditionDiamond`
dispatch. Widened `gtile-if-with-links.ts`/`gtile-if-with-links-notes.ts`/
`walk-if-with-links.ts`'s `diamond1` typing from the concrete
`GtileDiamondInside` to the `DiamondConditionTile` interface (an add2 T3h
interface that already covered `GtileDiamondSquare`/`GtileDiamondEmpty`,
never threaded through this builder — re-verified the add2 T3h doc
comment's claim against the actual pre-T3c source and found it false, not
repeated). `FtileDiamond#drawU` (`vertical/FtileDiamond.java:85-105`):
`GtileDiamondEmpty` routes its condition text to a real `north` SIDE slot
(never its own always-`''` `label`) — `walk-if-with-links.ts#pushDiamond1`
never pushed that slot (`GtileDiamondInside` never sets it), so the
condition text silently vanished for an EMPTY_DIAMOND with-links `if`
until this commit added the push (no-op for `GtileDiamondInside`, same
convention `walk-if-down.ts` already uses for its own unconditional
`'north'` push). `activity-renderer-shapes.ts#renderNode`'s `'if-split'`
case: replaced the `node.label === ''` shape inference (add3-T3d) with a
real `node.diamondShape` field (`activity-geometry.types.ts`, new, set by
both `'if-split'` producers) — the inference was ambiguous for exactly
this builder once it could build an EMPTY_DIAMOND tile with a non-empty
north label; `renderIfSplitShape` moved to `activity-renderer-if-
shapes.ts` (the file's own existing shape-primitive module) to stay under
`activity-renderer-shapes.ts`'s complexity cap. `'repeat-cond'`
(`walk-repeat*.ts`, not this task's write-set) never sets the field and
keeps the pre-existing `conditionStyle`/`label` heuristic unchanged.

**Commit 3 (IF-KILL)** — `InstructionIf#kill`'s own `endifCalled` arm
(`InstructionIf.java:199-213`): kills `thens.get(0)` (our `thenBranch`)
and `elseBranch` IN PLACE when a `kill`/`detach` parses immediately after
a closed `if`'s `endif`, rather than that `kill`/`detach` becoming its
own flow sibling. `InstructionSimple#kill` (`InstructionSimple.java:
124-126`) just flips a `killed` boolean; our port models `kill`/`detach`
as their own AST node, so the mutation becomes appending that SAME node
kind onto the branch body — the identical shape `isStopOrSpot`
(`conditional-builder.ts`) already recognises for an IN-branch kill
(`[action|spot, kill|detach]`, that function's own doc comment, which
explicitly names this exact two-node convention as the Java-to-TS
translation rule). Java's own `for (Branch branch : thens) { ...; return
true; }` returns after the FIRST iteration unconditionally — a later
`elseif` branch (appended to `thens` by `addElseIf`) is NEVER reached,
a genuine preserved upstream quirk, not "fixed". New
`list-backward-dispatch.ts#redirectKillOntoIf` (+ `killLastOf`, a no-op
on an empty branch, matching Java's `getLast() != null` guard), wired via
a small shared `redirectOntoIf` dispatcher (keeps `pushParsedNode` under
the file's CCN cap; `redirectNoteOntoIf`'s own call moved into it too,
no behavior change there).

## Rows: before -> after (probe `activity-probe.ts`, 125-row corpus)

Branch head before this task: `aggregate=6710` (284 pinned). After all
3 commits: **`aggregate=6159`** (−551, −8.2%). **Zero risers** at every
commit, against the pinned `diff-baseline.json` manifest.

| row | before | after | mechanism |
|---|---|---|---|
| jisema-42-rapa121 | 39 | **0** | commit 1 |
| zakuke-30-sobi867 | 35 | **0** | commit 1 |
| nijipa-25-pede639 | 27 | **0** | commit 1 |
| jipapo-14-kevu587 | 22 | **0** | commit 1 |
| rucuga-83-tosu408 | 20 | **0** | commit 1 |
| vexula-75-noko098 | 78 | **0** | commit 1 |
| pifoni-76-duxa505 | 5 | **0** | commit 1 (creole width fix) |
| tobajo-64-mipi810 | 552 | **380** | commit 1 (note height); residual NOT mine, see below |
| xefalo-73-sabi101 | 291 | **289** | commit 2; shape now correct (element alignment 120/120, was ambiguous); small height residual remains, see below |
| rirefa-62-kucu593 | 151 | **0** | commit 3 |
| **cohort total (19 rows)** | **2003** | **1452** | **−551** |

6 of the 7 small IFNOTE rows plus pifoni and rirefa land at EXACT 0.
`--align` confirmed element-count/alignment parity (polygon/line/text/
rect counts and positional `n/N` alignment both 1:1) on every row before
its own fix, and canvas-dimension-exact after, for all of commit 1's
rows except tobajo.

## tobajo-64-mipi810 — 552 -> 380, residual is NOT an IFNOTE defect (verified by instrumentation, not assumed)

Per the brief: "note-free part 378 ... fork bar 231 vs jar 186 is owned
by `tiles/gtile-fork.ts`". Directly measured a note-stripped variant of
this fixture (jar-rendered via `scripts/oracle-render.sh`, ours via the
same seams): **378**, exactly matching the brief's own number and my own
independent remeasurement. The remaining 552-378=174 I initially assumed
was mine; disproved by direct instrumentation of `GtileIfDown`'s own
`core.left`/`core.width`/`opale.box` fields (temporary `console.error`,
removed before commit, `git diff` confirmed clean): `opale.box.width`
(46.26875) is LESS than `geo.left` (46.5875) both with AND without the
note present, so `supp` (the only term `FtileIfDown.java:558-571` adds
for a note) is **0 in both cases** — the if's own `.left`/`.width` fields
are IDENTICAL whether the note is present or not, on our side. The note's
own drawn ink (`<path>` fold shape) is pixel-identical to the jar's
golden (`M25,395 L25,418 L71.269,418 ...` vs ours `M25,395 L25,418
L71.26875,418 ...`, sub-0.01px rounding only) and at the SAME absolute
position. Since the Java formula `FtileIfDown.java:555-571` is the
identical formula our port already matches exactly (confirmed both
analytically and by instrumentation), and jar's own canvas ALSO widens
by a different amount when the note is toggled (12px vs our 5.5px, by
direct before/after render of the stripped variant), the extra width/
height differential is produced by something OUTSIDE `FtileIfDown`'s own
geometry — the surrounding FORK branch's own ink-bounding-box
computation, which must account for `diamond1`'s own translate placing
the note's drawn box at a NEGATIVE local x (`xOpale = diamond1X -
opaleWidth = 17.19 - 46.27 = -29.08`, confirmed by the SAME
instrumentation) relative to the if-tile's nominal frame — this
overhang-accounting is `tiles/gtile-fork.ts`'s own territory (T3i's),
not mine. Residual 380 vs the 378 note-free baseline is 2 points: the
monochrome note-fill bug below, present on this fixture
(`skinparam monochrome true`).

**Found, not mine to fix (owner named)**: `svg/g[1]/path[1,2]/@fill`:
ours `#FEFFDD` (the literal note yellow), jar `#FAFAFA` (monochrome-
converted). `theme.colors.noteBackground`
(`activity-renderer-shapes.ts#renderNote`, OUTSIDE this task's write-set
— only the if-shape dispatch in that file is mine) never passes through
whatever converts other activity colours under `skinparam monochrome
true`. Confirmed on tobajo (2 of its 552/380 points) AND independently
on `xolazi-74-vamu265`/`tajuxe-32-sexo680` below (same `#FEFFDD` literal,
different root cause there — see NOTE-COLOR below). Owner: whoever owns
`activity-renderer-shapes.ts`'s non-if-shape dispatch next.

## xefalo-73-sabi101 — 291 -> 289, shape fixed, a smaller height drift remains

Element-level: `--align` now reports polygon/line/rect counts AND
positional alignment all 1:1 (120/120, was 65/120 at one intermediate
step before the `'north'` label push was added — see commit 2's own
message) — the PRIMARY defect this row's own census line named (wrong
polygon shape for 3 `with-links` EMPTY_DIAMOND ifs) is fully closed.

A SEPARATE, smaller residual remains: all diffs are vertical (`y`-only)
shifts that GROW through the document (9 -> 22px) as the 3 EMPTY_DIAMOND
with-links ifs stack (canvas height ours=967, jar=936, +31 over 3 ifs,
~10px/if). Traced (not fitted) as far as: `GtileIfWithLinks`'s own height
formula (`computeNudeAndMerge`/`computeCoreGeometry`) DOES fold in
`diamond1`'s dynamic height via `diamondOutY = diamond1.getCoord
(SOUTH_HOOK).y` (matches `FtileIfWithDiamonds.java:176-186`'s own
`dim1.appendBottom(dimNude).appendBottom(dim2)` structurally — confirmed
by reading both side by side, not assumed) — so the WIRING is correct;
the per-diamond ~10px surplus is consistent with `GtileDiamondEmpty`'s
own `north`-label height measurement (`measureLabel`, the OLD raw
per-line `bounder.getDimension` calc, ported by T3a, not this task)
being slightly taller than jar's real creole-Sheet-measured value for
this diamond's own test-label font bucket — the SAME class of "raw
measurer vs real Sheet" gap this task's own commit 1 fixed for
`measureIfOwnNote`, but for `gtile-diamond-empty.ts` (NOT in this task's
write-set: it matches neither `gtile-note*.ts` nor `gtile-if*.ts`).
Named, not fixed — would need a fixture-isolated measurement of
`GtileDiamondEmpty`'s own north-label height against jar to confirm
before touching that file.

## Other rows in this task's cohort — not reached, with mechanism (no guessing)

**NOTE-MULTI** `giteso-65-mefo026` (446, SWITCH-dominated, explicitly
named out of scope by the census and T2a's own prior report),
`mifejo-31-sovi184` (70), `tajuxe-32-sexo680` (54): both verified (not
assumed) to be the SAME two independent mechanisms, neither fixable
inside this task's write-set as scoped:

1. **Canvas-origin margin ink** (the FULL residual for both rows, by
   direct measurement): `TextBlockMarged.drawU`
   (`klimt/shape/TextBlockMarged.java:77-83`) draws `ug.draw(UEmpty
   .create(dim))` — an INVISIBLE placeholder spanning the FULL marged
   (10px-padded) box — BEFORE the translated, visible opale content.
   `LimitFinder`'s ink scan (upstream) records this invisible box's own
   near corner too, pulling the document's top/left margin out further
   than the VISIBLE note content alone would. Our port's `canvas-
   origin.ts` ink scan (`extendForNode`) has no analogue: `walk-with-
   notes.ts#pushStackedNote` only pushes a `'note'` node sized to the
   VISIBLE opale box. Verified by direct arithmetic on `tajuxe-32-
   sexo680` (document margin before the composite: ours 5px, jar 15px —
   exactly the 10px marged-box inset the UEmpty call reserves) and
   confirmed the SAME 10px-per-note deficit reproduces on `mifejo-31-
   sovi184`'s two-note stack too (width deficit 10 once — stack width is
   a `max`, not additive; height deficit 20 — two notes stack, additive).
   `canvas-origin.ts` is NOT in this task's write-set (not `tiles/gtile-
   note*.ts`/`gtile-with-notes.ts`/`layout/walk-with-notes.ts`/`layout/
   tile-layout*.ts`'s own note branches) and no in-write-set workaround
   exists without changing the VISIBLE note's own drawn box size (which
   would be a real regression, not a fix). Owner: whoever next touches
   `layout/canvas-origin.ts`'s ink-scan dispatch — needs either a new
   `extendForReservation`-shaped hook for a note stack's own marged
   extent, or an `isInkless`-adjacent exemption inverted into an extra
   extent.
2. **NOTE #color override dropped** (the SAME `#FEFFDD`-vs-real-colour
   bug tobajo's monochrome residual is one instance of, confirmed on
   `tajuxe-32-sexo680`'s `note left #aabbcc`/`note right #aabbff`: ours
   draws both at the literal default yellow `#FEFFDD`; jar draws `#ABC`/
   `#ABF`). `ActivityNote` (`ast.ts:363-368`) has NO `color` field at
   all — the parser (`node-dispatch.ts`'s `tryNoteSingle`/`tryNoteMulti`,
   NOT this task's write-set) never captures `#color` after `note left`/
   `note right`, so there is nothing for `theme.colors.noteBackground`
   (`activity-renderer-shapes.ts#renderNote`, also not this task's
   write-set beyond the if-shape dispatch) to read even if it tried.
   Independently reproduces on `xolazi-74-vamu265` below. Owner: whoever
   owns `ast.ts`/`node-dispatch.ts` next for a new `ActivityNote.color`
   field, threaded through to `renderNote`'s fill.

`kavoro-11-jife299` (37): re-verified, not re-guessed — T2a's own prior
attribution ("swimlane-placement.ts's lane-width calc reading this
`gtile-with-notes` composite kind differently than a plain leaf would")
still holds: `--align`/`--dump` show height canvas-EXACT, width off by a
uniform 10px shift on every element right of the composite — the SAME
family `swimlane-placement.ts` (explicitly not this task's write-set)
already owns for other swimlane-composite rows. Unchanged.

`razuzu-32-faje125` (158, NOTE-SWIMLANE): **T2a's/T3g's prior
"structural, no per-swimlane-interceptor-pass equivalent" framing is
PARTIALLY WRONG, corrected here by reading `FtileWithNoteOpale.java`
directly** (CLAUDE.md's "verify, don't repeat" rule) — the per-swimlane
interceptor gate (`:217`, `ug instanceof UGraphicInterceptorOneSwimlane`)
ONLY matters for a SEPARATE swimlane-background-colour draw pass; in the
ordinary content pass (`ug` is never that interceptor type) the gate's
own condition is unconditionally true, so the note draws at its NORMAL
local offset beside the wrapped tile — the EXACT SAME `getTranslate`/
`getTranslateForOpale` geometry (`:155-193`) a same-lane note already
uses, confirmed by reading both methods: neither references
`swimlaneNote` at all. `swimlaneNote`'s ONLY geometric effect is
widening `getSwimlanes()` (`:92-99`) so the LANE-WIDTH algorithm reserves
enough room in the note's OWN declared lane for its rightward/leftward
offset to land inside that lane's column — confirmed against the
fixture's own measured output: jar's note draws at `x=180.4`, inside
`laneTwo`'s own title band (`x=160.041`); ours draws at `x=109.063`,
inside `laneOne`'s (`x=25`) — because our port falls back to a
flow-sequential note (adding vertical height: ours 357 vs jar's 295,
confirming jar does NOT add a flow step, it draws beside the preceding
action) rather than wrapping via `GtileNoteOpale` with the extra lane
recorded. **So the real, narrower blocker is a missing "this composite
also touches an extra swimlane" field consulted by the lane-WIDTH
calculation** (`layout/swimlane-placement.ts`, explicitly not this
task's write-set per the brief and per `kavoro`'s own precedent above) —
NOT a rendering-architecture rewrite. Did not attempt the half-fix
(wrapping via `GtileNoteOpale` without the width reservation): the note
would draw at the correct LOCAL offset but overflow its lane's column
(no width reserved for it), a worse, clipped-looking result rather than
a smaller one — CLAUDE.md's "never trade information-carrying output for
score" cuts against shipping that. `razuzu-32-faje125` unchanged at 158.
Correction filed for whoever next owns `layout/swimlane-placement.ts`.

`jogami-42-jaji869` (10, GROUPNOTE): element counts/alignment match;
every diff is a uniform ~8px vertical shift (height ours=312 jar=304) —
the SAME PARTCOMP/`FtileGroup#getInnerDimensionSlow` ink-scan correction
T2a's own report already named for this row ("architecturally
unavailable to this port's direct-geometry model", re-confirmed here by
the SAME +8 shift reproducing unchanged). Not this task's family; not
touched.

`xolazi-74-vamu265` (5, NOTE-SIZE, nominally closed by T2a): 4 of 5
points are the SAME NOTE-#color-override gap named above (`note left
#red`/`note right #blue`, literal `#FEFFDD` vs jar's `#F00`/`#00F`); the
5th (`line[5]/@y1` off by 8.5) traced to `GtileNoteOpale.getCoord
(SOUTH_HOOK)` (`tiles/gtile-note.ts:243-245`) — read the formula
directly: it ALREADY matches `FtileWithNoteOpale.java:223-233`'s
`orig.getOutY() + translate.getDy()` exactly (centred-tile exit point,
not the composite's own full height) -- so the geometry class believed
responsible is provably not the actual mechanism. Did not chase further
within this session's remaining budget; flagged for direct instrumentation
of the SPECIFIC composite tree this row builds (two ifs, each with a
note, one on each branch) rather than the formula in isolation.

`tuneta-22-mega154` (2, NOTE-SIZE, nominally closed by T2a): both
remaining diffs are `path/@d[4]` (a single fold-corner x-coordinate)
swapped between two different paths (ours path[1]'s `d[4]`=255.531 looks
like it belongs to jar's path[3], and vice versa) — looks like a
PAIRING/ORDER artifact of the comparator on two near-identical note
shapes, not a geometry defect; not chased further (sub-threshold, likely
a `compareSvg` non-monotonic-pairing artifact per `.agent-notes/
comparesvg-count-not-monotonic.md`).

`jageti-56-kume076` (1, NOTE-CREOLE, nominally closed by T3d): single
`line[2]/@y1` off by 21.5 — not chased (sub-threshold).

## Census movers (`activity.{style,text,swimlane}-baseline.test.ts`, EQUALITY pins)

Orchestrator re-pin territory per rule 5/10 (never touched the pin
files). Every mover checked against the pin's own `jar` column:

- `jisema-42-rapa121`/`zakuke-30-sobi867`/`nijipa-25-pede639`/`rucuga-83-
  tosu408`/`jipapo-14-kevu587`/`vexula-75-noko098`/`tobajo-64-mipi810`:
  style-baseline height MOVED, in every case landing EXACTLY on the
  pin's own `jar` value (commit 1's own mechanism — verified by direct
  comparison, not assumed).
- `tobajo-64-mipi810`: swimlane-baseline height moved the same way,
  same exact-match result.
- `xefalo-73-sabi101`: style-baseline height moved FURTHER from jar
  (939 -> 967, jar 936) — the SAME known-and-named height-drift residual
  above (GtileDiamondEmpty's own label measurement, not this task's
  write-set), not a new regression: the SHAPE itself is now correct
  (confirmed via `--align`), only this secondary height term grew once
  3 more diamonds actually started contributing their own (slightly
  oversized) `inY` term instead of the pre-fix `0`.

## Quality bar (all 3 commits)

`npx tsc --noEmit` (`tsconfig.json`/`tsconfig.node.json`) — clean
throughout. `npx eslint` on every touched file — clean throughout.
`npx vitest run tests/oracle/svg-conformance/activity.golden.ratchet
.test.ts tests/oracle/svg-conformance/activity.harness-parity.test.ts` —
348/348 green after every commit, 284 pinned goldens byte-equal
throughout, zero regressions. `npx vitest run tests/diagrams/activity
tests/unit/activity` — 1714/1714 green at HEAD (grew from 1709 at task
start by this task's own 22 new/extended tests: 4 in `conditional-
builder.test.ts`, 5 in `walk-if-with-links.test.ts`, 4 in `renderer-
shapes.test.ts`, 1 extended + 5 new in `parser.test.ts`, 1 extended in
`gtile-if-down.test.ts`). `compress/invariant.test.ts` — 3/3 green, no
new entries at any commit. `activity.{style,text,swimlane}-baseline
.test.ts` — equality-pin failures on every row this task's own commits
moved, all reported above with their `jar`-column comparison, none
hand-edited, left for the orchestrator's re-pin.

## Write-set discipline

Touched (all named in the brief's write-set): `tiles/gtile-note.ts`
(`measureIfOwnNote`), `tiles/gtile-if-down.ts` (`computeOffsets`/
`mainTileY`), `tiles/gtile-if-with-links.ts`/`tiles/gtile-if-with-links-
notes.ts` (`diamond1` widened to `DiamondConditionTile`), `layout/walk-
if-down.ts`/`layout/walk-if-with-links.ts` (`diamondShape` field,
`'north'` label push), `layout/conditional-builder.ts`
(`buildIfWithLinks` -> `createConditionDiamond`), `activity-geometry
.types.ts` (new `diamondShape` field — "the node-kind field" the brief
names), `list-backward-dispatch.ts` (`redirectKillOntoIf`). `activity-
renderer-shapes.ts`: ONLY the `'if-split'`/`'repeat-cond'` case in
`renderNode`, now a one-line delegate; the extracted dispatch body itself
(`renderIfSplitShape`) landed in `activity-renderer-if-shapes.ts` (an
existing sibling shape-primitive module, already home to `renderDiamond`/
`renderHexagonPolygon`/`renderDiamondSquarePolygon` it dispatches
between) purely to keep `activity-renderer-shapes.ts` under the 500-line
hook cap — flagged, not silently assumed in scope: the brief names "the
if-shape dispatch in `activity-renderer-shapes.ts#renderNode` only", and
that dispatch's OWN logic (not its file) is what moved.

NOT touched, explicitly out of scope per the brief's own boundary and
re-verified during diagnosis, not just repeated: `tiles/gtile-fork.ts`
(T3i's, tobajo's fork-bar residual), `layout/swimlane-placement.ts`
(kavoro's lane-width gap; razuzu's corrected-but-still-blocking lane-
width gap), `layout/canvas-origin.ts` (mifejo/tajuxe's margin-ink gap),
`ast.ts`/`node-dispatch.ts` (the NOTE #color-override parser gap,
tajuxe/xolazi/tobajo-monochrome), `tiles/gtile-diamond-empty.ts` (xefalo's
secondary height-drift residual), `layout/walk-while-*.ts`/`layout/walk-
repeat*.ts` (repeat-cond/while-header keep the pre-existing heuristic,
confirmed unaffected by `npx vitest run tests/diagrams/activity`). No
Serena MCP call made this session (rule 1). No `git stash` used (rule
3). Every commit measured before/after per rule 10's own probe command,
with the full 125-row corpus, not just this task's own 19-row cohort.
