# aeg-T1 — the 8 fixtures T1 exposes are 4 separate pre-existing defects

Mission `plans/activity-element-granularity/`, T1 resumed after
`svg-comparator-alignment` landed. **No further `src/` change made for
these 8** — adjudicated as documented exceptions per the mission's stop
condition 6 ("a re-pin would raise a pin without a stated mechanism...
until proven otherwise" — mechanism IS stated below).

## The pattern

T1 (`<polyline>` → one `<line>` per segment) does not cause these 8
fixtures' root-`<g>` child count to MISMATCH the jar's; for these 8 it
happens to make the count land on an exact match, which routes them onto
`compareNodes`'s UNCHANGED equal-length positional loop (untouched by
`svg-comparator-alignment` D1 by design). That loop compares index i
against index i with no tag-awareness. Because these 8 fixtures'
underlying CONTENT does not actually correspond position-for-position
(the four defects below), landing on count parity converts a previously
short-circuited (charged-as-a-lump-sum) mismatch into a garbage positional
walk that charges tag-mismatch weight (~12–18 units) at nearly every
position. All 8 already showed a canvas-dimension mismatch
(`svg/@height`/`@width`/`@viewBox`) BEFORE T1 was applied — proof the
defect predates T1 and is not caused by it.

Re-pinned as adjudicated exceptions in
`oracle/goldens/svg-activity/diff-baseline.json`:

| slug | before | after T1 | mechanism |
|---|---|---|---|
| `cujoni-21-somi079` | 209 | 213 | #1 note-after-stop |
| `jipapo-14-kevu587` | 138 | 171 | #1 note-after-stop (`note right`) |
| `dozaxu-98-xetu961` | 213 | 231 | #2 diamond/font skinparams unwired |
| `kafevi-44-tesu096` | 212 | 228 | #2 diamond/font skinparams unwired |
| `sikino-19-vuca111` | 129 | 131 | #3 swimlane rendering architecture |
| `lukoxa-16-cecu095` | 236 | 281 | #3 swimlane rendering architecture |
| `noxasi-06-nejo322` | 368 | 445 | #3 swimlane + fork |
| `nexitu-74-luga914` | 312 | 360 | #4 nested split geometry |

## Defect #1 — a note attached to `stop` is laid out as flow height, not a floating side-note

**Evidence.** `cujoni-21-somi079` (`if (test) then (yes) / stop / note:foo /
else (no) / endif / stop`): jar's `<text>` for "foo" sits at `x=21 y=118`,
essentially BESIDE the "yes" branch's stop circle (`cx=85 cy=114.5`) — no
extra vertical space. Ours places the note text at `x=16 y=182`, well BELOW
our own stop circle (`cy=126`), and our second (final) stop lands at
`cy=230` vs the jar's `cy=179` — the note is stretching the flow's total
height by ~50px. `jipapo-14-kevu587` (`note right` + `break`) shows the
same shape.

**Not yet located in upstream.** Needs the Java's note-attached-to-a-
terminal-node tiling path (`FtileWithNoteOpale`/`FtileNoteBox` family or
similar under `activitydiagram3/ftile/`) — not investigated further; this
mission's scope is element granularity, not note tiling.

## Defect #2 — `DiamondFontSize`/activity diamond font skinparams are entirely unwired

**Evidence.** `grep -rn "DiamondFontSize" src/` → **zero matches**.
`dozaxu-98-xetu961` sets `skinparam activity { DiamondFontSize 40
FontSize 30 ArrowFontSize 7 }`; the jar sizes its diamond to fit (canvas
467px wide), ours ignores the skinparam entirely and stays at 212px — a
2.2× width deficit. `kafevi-44-tesu096` (same shape, `DiamondFontSize 40`)
shows the identical signature (212 vs 493 width).

**Not yet located in upstream.** `arrowFontSize` IS wired
(`src/core/skinparam-key-handlers.ts:139`, `style-cascade-class.ts:254`) —
the general skinparam-key mechanism exists; `DiamondFontSize` specifically
was never added to it. Likely a short, mechanical port once the upstream
`SkinParam` key name and its consumer (probably in the diamond-drawing
`Ftile` for `if`) are located.

## Defect #3 — swimlane rendering is a different visual model, not a sizing bug

**Evidence, the largest of the four.** `sikino-19-vuca111` (plain 2-lane
swimlane, `SwimlaneBorderColor blue`, `SwimlaneBorderThickness 5`,
`SwimlaneTitleFontSize 8`, `SwimlaneTitleFontColor red`):

- **Jar**: thin colored divider **`<line>`s** running the full canvas
  height (`stroke="#00F" stroke-width="5"`, respecting the skinparams
  exactly), with each lane's title as a small floating `<text>`
  (`fill="#F00" font-size="8"`) above the lane, no bounding box at all
  (one `stroke="none"` rect exists only as an invisible text-metrics
  placeholder).
- **Ours**: a full-width boxed HEADER `<rect fill="#FFF" stroke="#181818">`
  spanning all lanes (`SWIMLANE_HEADER_H` in
  `src/diagrams/activity/renderer.ts:203`) with bold black 14px titles
  INSIDE the box, plus vertical divider lines using the DEFAULT stroke
  color/width — never reading `SwimlaneBorderColor`/
  `SwimlaneBorderThickness`/`SwimlaneTitleFontColor`/`SwimlaneTitleFontSize`
  at all (grepped, zero matches for any of the four).

This is not a missing skinparam on an otherwise-correct shape — it is a
architecturally different rendering (table-header-with-boxed-titles vs.
colored-divider-lines-with-floating-titles). `lukoxa-16-cecu095` (swimlane
+ if/else/stop) and `noxasi-06-nejo322` (swimlane + fork) inherit the same
divergence, compounded by their own control-flow content.

**Not yet located in upstream.** Needs
`activitydiagram3/ftile/vcompact/` or wherever upstream's swimlane
`Ftile` lives, plus the four skinparam keys' `SkinParam` accessors. This is
the biggest of the four — likely its own multi-task mission, not a quick
port.

## Defect #4 — nested `split`/`split again` geometry is badly wrong

**Evidence.** `nexitu-74-luga914` (`split { split { A / detach } split
again { B / detach } end split } split again { C / detach } end split`,
then two more actions): ours renders **504×380**; the jar renders
**169×193** — roughly 3× too wide and 2× too tall. No skinparam, no note,
no swimlane involved — this is pure nested-split-branch sizing.

**Not yet located in upstream.** Needs `activitydiagram3/ftile/vertical/`
or the `split`-specific `Ftile` (likely `FtileSplit`/similar) and how it
composes nested splits' widths — not investigated further; this is the
most severe of the four by ratio and should probably be the first of these
picked up.

## Why none of this is fixed here

`activity-element-granularity`'s own scope is element VOCABULARY
(`<polyline>`→`<line>`, `circle`→`ellipse`, text-per-line) — D5 already
ruled font-size differences out of scope once (theme default 14 vs 12).
These four are layout/feature-porting gaps, unrelated to which SVG element
draws a given shape, each large enough to want its own Java citation and
its own mission. User-directed 2026-09-03: land the other 260 fixtures now,
file all four as follow-ons (`planning/next-missions.md`), fix none today.

## Addendum (T3) — 2 more fixtures, same pattern, 2 more unrelated defects

T3 (one `<text>` per line) surfaced 2 additional fixtures via the identical
mechanism: element-count convergence exposing pre-existing content that
doesn't correspond position-for-position. Both already showed a canvas-
dimension mismatch BEFORE T3 (confirmed by measuring pre-T3), ruling out
T3 as the cause. Re-pinned as further documented exceptions.

| slug | before T3 | after T3 | mechanism |
|---|---|---|---|
| `bozido-07-geze049` | 257 | 273 | embedded diagram in an activity label |
| `vubolo-48-cubu499` | 338 | 418 | multi-line note sizing/overscan |

### Defect #5 — embedded diagrams (`{{wbs}}`/`{{mindmap}}`/`{{salt}}`/`{{gantt}}`) inside an activity label

**Evidence.** `bozido-07-geze049`'s label contains FOUR embedded
sub-diagrams via PlantUML's `{{...}}` creole syntax (a WBS, a mindmap, a
salt wireframe, a gantt chart) nested inside one action's text. Before T3,
this rendered as one `<text>` with **23 `<tspan>` children**
(`svg/g[1]/text[2][childCount]`, `a=23 e=1`) — the whole embedded-diagram
region collapsed into plain text lines rather than rendering as nested
diagrams. Canvas height 690 vs the jar's 419 (both BEFORE and after T3) —
a 65% oversized canvas, consistent with drawing 23 flat text lines where
the jar renders 4 compact nested diagrams.

**Not investigated further.** An entirely separate, exotic creole feature
(embedded-diagram rendering), unrelated to element vocabulary or text
line-height.

### Defect #6 — multi-line note sizing / overscan

**Evidence.** `vubolo-48-cubu499`: two notes attached to actions, one
explicitly testing overscan (puml comment: *"but without overscan"*).
Width mismatch is severe (522 vs 351, +171px) and pre-dates T3. Likely
related to Defect #1 (note-after-terminal sizing) but on regular action
nodes rather than terminal nodes, and specifically about note WIDTH, not
just height — may be the same root mechanism or a sibling one; not
distinguished here.

**Not investigated further.**
