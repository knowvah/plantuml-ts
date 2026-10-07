# add3-T3e — swimlane widths and cross-lane remainders

Worktree: `.claude/worktrees/add3-T3e`, branch `add3/T3e`. **No commits** —
every attempted mechanism either disproved itself against the oracle (never
landed) or was identified but requires an edit outside this task's
write-set (reported, not made). Tree is clean at `a3a329812` (unchanged).

## Commits

None. See "Not done and why" for the diagnosis-mode trail on each row.

## Row 1 — SWIMW (`cemipu-87-dinu624`, 82) / LANE-MINWIDTH (`nikinu-06-sace939`, 105): mechanism DISPROVEN, do not re-attempt as written

The census/fixtures.md citation for both rows (`Swimlanes.java:398-430`'s
`swimlaneWidth()`/`computeSizeInternal` content-width floor, `SkinParam.java
:1121-1130`'s `same`/digits/`0` parse) is **wrong** — `swimlane-context.ts`
already has the floor arithmetic fully built
(`resolveSwimlaneMinWidth`/`computeLaneWidths`, `SWIMLANE_WIDTH_SAME = -1`)
and only lacked a `swimlanewidth` skinparam key handler, so I built one (full
plumbing: `skinparam-accumulator.ts` field, a new handler in
`skinparam-key-handlers-table-c.ts` parsing `same`/digits/`0` exactly per
`SkinParam.java:1121-1130`, `theme-graph-colors-c.ts` field merged via the `A
& B & C` intersection — `-b.ts` is at its 500-line cap, confirmed by the
hook — `skinparam-theme-builder.ts` wiring, `swimlane-placement.ts
#measureLanes` reading `theme.colors.graph.activity?.swimlaneWidth`). Typecheck
clean, unit-tested the parse in isolation (passed), confirmed via a
temporary `console.error` that `min=400`/`min=-1` really did reach
`computeLaneWidths` and really did change rendered coordinates (420px ->
469px canvas width for `nikinu`).

**Then I rendered the REAL oracle jar** (`scripts/oracle-render.sh`, never a
hand `java -jar`) against three minimal fixtures to isolate the mechanism
before trusting the Java source reading, per CLAUDE.md's "read the Java
first" AND "never fit a value" — the oracle is the final arbiter, not the
source text:

- `skinparam swimlaneWidth 400` and `skinparam swimlaneWidth 9000` on an
  identical 2-lane/2-action fixture produce **byte-identical** divider
  positions (`33,100.625,190.3`) — if the content-width floor were real,
  9000 would balloon the canvas by thousands of px relative to 400. It does
  not. The floor is not being applied at either magnitude.
- `skinparam swimlaneWidth same` on a 3-lane fixture with one lane holding a
  deliberately long label does **not** equalise the three lanes (measured
  widths 47 / 219.8 / 47 — the long lane stays alone at its own content
  width, the other two stay at theirs). If `same` worked, all three would
  equal 219.8ish. It does not.
- Both block form (`skinparam swimlane { width same }`) and flat form
  (`skinparam swimlaneWidth 400`) key-normalise identically and produce the
  identical (wrong) result either way — ruling out a block-vs-flat parsing
  difference, confirming my handler's own key-recognition is not the
  problem.
- An unrecognised bogus key (`skinparam bogusUnknownKeyXyz 400`) produces
  the exact pre-existing baseline (`20,76.625,155.3`), proving unrecognised
  keys are true no-ops and ruling out "any skinparam line perturbs layout"
  as a confound.

So: recognising the key DOES change rendered output by a small, constant,
value-independent amount (+11px/lane for the 2-lane case, moving from
`20,76.625,155.3` baseline to `33,100.625,190.3` for both 400 AND 9000, and
to `27.025,94.65,184.325` for `same`) — but this is **not** the
`Math.max(min, content)` floor `Swimlanes.java:399-403` describes. I did not
isolate the true secondary mechanism (candidates not yet ruled out:
`getHalfMissingSpace`'s title-vs-width comparison reacting to some other
field touched by `FromSkinparamToStyle`'s per-key `convertNow` call, which
runs unconditionally for every `setParam` regardless of whether the key maps
to a style rule — `SkinParam.java:227-234`). I reverted the entire handler
(`git checkout --` on all 6 touched files) rather than ship a port that
provably diverges from its own oracle. **Do not re-attempt the naive
`Swimlanes.java:399-403` port for these two rows** — whatever actually
drives `cemipu`/`nikinu`'s diffs, it isn't this.

Separately, while comparing `cemipu`'s rendered rects to jar's (debug-only,
not committed), I noticed ours draws several lane-background/content rects
at `width="0.5"` where jar draws real widths (`239.45`, `58.7`, `104.825`,
...) — `0.5` is suspiciously exactly the default `BorderThickness`/stroke
value, suggesting a width/stroke-width argument-order mix-up somewhere in
the swimlane rect-emission path, unrelated to `swimlaneWidth` entirely. Not
investigated further (outside this row's claimed mechanism and my
remaining budget) — flagged for whoever picks up `cemipu` next as the REAL
lead, not the `SWIMLANE_WIDTH_SAME` theory.

## Row 2 — XLANE (`ruzica-16-deli877` 522, `nikivo-06-kaxa873` 330, `kijazo-83-kipu485` 220): mechanism IDENTIFIED, fix needs a file outside this task's write-set

T1c already fixed the if-with-links portion of these three rows (see
`.agent-notes/add3-T1c.md`). The documented residual ("`FtileWhile.java
:277-310` back edge... the up-arrow is drawn directly, so it precedes the
deferred snake in SVG order") is real and I traced it to an exact mechanism:

- `UGraphicForSnake.java:140-147`: `draw(UShape)` — if the shape is a
  `Snake`, it is **queued** (`addPendingSnake`, merged with touching
  pending snakes) and NOT drawn yet; every other shape type draws
  **immediately** via `getUg().draw(shape)`.
- `Swimlanes.java:342-346`: `drawWhenSwimlanes` wraps the WHOLE render in
  one `UGraphicForSnake` (constructed once in `drawU`, `:245`, threaded by
  reference through every `.apply()` — confirmed `UGraphicForSnake.apply`
  passes the same `snakes` list, not a copy). It draws every lane's content
  via `UGraphicInterceptorOneSwimlane` first, THEN the `Cross` pass (cross-
  lane connectors) via `full.drawU(cross)`, THEN calls `cross.flushUg()` —
  which drains **every** queued snake (same-lane AND cross-lane) accumulated
  across the ENTIRE render, in queue order, all at this one point — THEN
  `drawTitles(ug)` last.
- `FtileWhile.ConnectionBackSimple#drawTranslate` (`:277-308`, already cited
  by T1c) calls `ug.draw(snake)` (queued, deferred to the final flush) and
  THEN `ug.apply(...).draw(skinParam().arrows().asToUp())` (the up-arrow —
  NOT a `Snake`, drawn immediately, right there in the Cross pass, well
  before the final flush).

Net effect verified against the `kijazo` dump: jar's element list has the
up-arrow polygon at index `[17]` (immediately after the per-lane content,
before the Cross-pass's OTHER output) while the matching line segments that
form that same connector's snake appear at `[35]-[37]`, MUCH later — i.e.
jar draws an edge's own decorative arrow **before** that edge's own line
geometry whenever the arrow is a non-`Snake` immediate draw and the line is
a deferred `Snake`. Our `renderer.ts#renderEdge` draws every edge as one
atomic unit (segments, terminal arrow, `midArrowAt` — in that order, always
together), so this specific inversion can never happen in our output no
matter how `swimlane-loop-translate-while.ts#routeWhileBack`'s record is
shaped.

**This is a document-wide, two-phase emission architecture** (immediate
shapes first per visit; ALL snakes — same-lane and cross-lane — batched into
one final flush at the very end of the whole swimlange render, before
titles) that would need to live in `renderer.ts` (how multiple edges'
output gets concatenated/ordered) or a new seam it delegates to — neither
is in this task's write-set (`renderer.ts` is not listed as mine; `walk-
while-branch.ts`, which owns the push site for `ConnectionBackSimple`'s
non-cross-lane sibling, is explicitly NOT mine). I did not touch any file
over this — reporting the mechanism + owner per rule 7 rather than guessing
a workaround confined to my own files (e.g. reordering `LoopRouteResult`'s
`edges` array cannot fix this: array order would need to mean "flush-batch
position", a document-wide invariant no single `swimlane-loop-translate-*
.ts` module owns).

## Row 3 — PART-XLANE (`vodobe-33-kefa909` 90, `notuli-49-xugi698` 60): mechanism IDENTIFIED, corrects the census's own description; fix is a real feature gap, not completed

Read `FtileGroup.java:209-227` (`drawU`) directly: the frame symbol
(`type.asBig(...).drawU(ug)`) uses `dimTotal = calculateDimension(...)`,
which is the FULL, cached, lane-spanning inner dimension — the SAME value
regardless of which lane's `UGraphicInterceptorOneSwimlane` currently wraps
`ug`. Because `UGraphicInterceptorOneSwimlane.draw` (`:66-75`) re-invokes
`tile.drawU(this)` once per lane the group's `getSwimlanes()` touches
(`FtileGroup.getSwimlanes()` delegates to `inner.getSwimlanes()`,
`:128-130`), the frame gets drawn **once per lane, every copy the SAME
width/height**, each shifted to that lane's own translate — confirmed on
jar's actual `notuli` SVG: two `<rect>` frames, BOTH `width="80.05"
height="130"`, at `x="30.075"` (lane 1) and `x="128.275"` (lane 2) — not
"each sized to that lane's content" as `plans/activity-divergence-drive-3/
measurements/census-a.md` says (verified wrong per CLAUDE.md's "prior notes
have been wrong").

Our `tile-coordinates.ts#walkTileGroup` pushes exactly ONE node (`pushNode`,
tagged with the single `myLane` active when the walk entered the group),
confirmed on our own `notuli` render: one `<rect>` (`width="80.05"
height="153"`, only in lane 1), no second frame/fold-path/title copy at all
for lane 2's "Action2" content, which renders as a bare, un-framed action
box. Fixing this needs the group's **touched-lanes set** (not just the
single entry lane), computed before/during `walkTileGroup` over `tile
.children[0]`'s subtree, then one `pushNode` call per touched lane (same
`width`/`height`/local x,y, different `myLane` tag) — a real feature gap in
`walkTileGroup`, not a one-line fix, and I did not implement it this
session (see budget note below).

Separately, and NOT yet reconciled with the frame gap above: our `notuli`
render also has an extra elbow+arrowhead connector (`70.1,203.5 ->
70.1,228.5 -> 168.3,228.5 -> 168.3,243.5` plus its arrow polygon) that jar
does not draw at all (jar's Action2 -> stop is a plain straight vertical
line, no elbow). This looks like a second, independent defect — possibly
`walk-fork-branches.ts` or the group-exit connector treating the lane
boundary as a branch merge — not diagnosed to a `file:line` this session.
Flagged, not fixed.

## Row 4 — `tobajo-64-mipi810` (552, mostly IFNOTE/T2a's domain)

Confirmed via `census-b.md` the note-free residual (378 of 552) is the
part potentially in scope here ("lane `test a` 45px wider... fork bar 231
vs 186"). Confirmed the fixture's own `.puml` has no `swimlaneWidth`
skinparam at all — this is a `fork`/`fork again` spanning three lanes with
nested `repeat`/`if` per branch, a `walk-fork-branches.ts` candidate (in my
write-set) but entangled with the dominant IFNOTE mechanism (owned by T2a,
not mine) in the same row's score. Not diagnosed further — ran out of
session budget after the three mechanism investigations above. No
`file:line` claim made; nothing ruled out here beyond "not a swimlaneWidth
row."

## Probe Σ

Unchanged throughout: Σ 9220 over 76 baseline rows (branch head,
`a3a329812`) — no commit altered it. `--slugs` subset checks during
investigation (`cemipu`/`nikinu`: 82+105=187 before and after my reverted
attempt) confirm the revert left zero residue.

## Quality gates

`npx tsc --noEmit` (both configs): clean at every point I ran it, including
after the final revert (confirmed the tree matches HEAD exactly,
`git diff --stat HEAD` empty). No `npm test` run (not needed — no net
source change to verify; targeted `vitest run` used only for throwaway
debug specs, all deleted, none committed). No Serena MCP tools used
(Read/Edit/Write/Bash/grep only, per this task's hard rule).

## Not done and why

- **SWIMW / LANE-MINWIDTH**: mechanism from the brief/census disproven
  against the real oracle (see Row 1); true mechanism not isolated within
  budget. A `0.5`-width rect anomaly on `cemipu` (unrelated to
  `swimlaneWidth`) is a stronger lead for the next attempt, not chased.
- **XLANE residual** (`ruzica`/`nikivo`/`kijazo`): mechanism fully
  identified (`UGraphicForSnake`'s deferred-snake/immediate-shape split) but
  the fix point (`renderer.ts`'s multi-edge emission order, or a new shared
  seam) is outside this task's write-set — reported per rule 7, not
  attempted.
- **PART-XLANE** (`vodobe`/`notuli`): mechanism identified and the census's
  prior description corrected; the actual per-lane-frame-duplication
  feature was not implemented (needs a touched-lanes-set computation ahead
  of `walkTileGroup`'s single `pushNode`, plus renderer support for
  multiple same-sized frame copies) — a real feature port, not a bounded
  fix, deferred rather than attempted half-done. A second, unrelated
  phantom-connector defect on the same fixture is flagged, not diagnosed.
- **`tobajo-64-mipi810`**: not reached beyond confirming it is NOT a
  `swimlaneWidth` row and isolating the in-scope fraction of its score
  (378 of 552, note-free). No mechanism claim made.
