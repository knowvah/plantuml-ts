# Architecture decisions — `activity-element-granularity`

Confirmed 2026-09-03 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

## D1 — A multi-segment edge becomes N `<line>`, never one `<path>`

**Context:** `src/diagrams/activity/renderer.ts:104` emits a single
`polylineEl(pts, …)` for the whole edge path. Upstream has **no polyline
concept in the SVG driver at all** — `klimt/drawing/svg/` ships
`DriverLineSvg`, `DriverPolygonSvg`, `DriverEllipseSvg`, `DriverPathSvg`
and others, but no `DriverPolylineSvg`.
**Decision:** Emit one `<line>` per segment. `Worm.java:134` is
`for (int i = 0; i < size() - 1; i++)`, and `:183` is
`ug.draw(new ULine(x2 - x1, y2 - y1))` — one `ULine` per segment, rendered
by `DriverLineSvg` as one `<line>`.
**Consequences:** ~3047 additional root-group children, closing the bulk of
the 91.6%. This is the single highest-value change in the mission and it is
one call site.

## D2 — `circle()` → `ellipse(cx, cy, r, r)` at ACTIVITY call sites only

**Context:** the jar emits `<ellipse cx cy rx ry>` where we emit
`<circle cx cy r>` (488 v 518). But `src/core/svg-shapes.ts:269`'s own doc
comment defends the distinction: *"twelve call sites across the activity,
sequence and json engines already emit a real `<circle>`."*
**Decision:** Change the five activity call sites to call `ellipse` with
equal radii. **`src/core/svg-shapes.ts` is not in any write-set.**
**Consequences:** sequence and json cannot move. That is asserted by T2,
not assumed.

## D3 — Split on LINE boundaries; creole `<tspan>` survives within a line

**Context:** the jar emits one `<text>` per line of a multi-line label
(verified on `boxoto-53-sifo232`: two `<text>` at y=139.333 and y=151.333).
We emit one `<text>` carrying two `<tspan>` children. But `tspan` is core
creole serialisation (`src/core/creole-svg.ts`), shared with sequence, and
inline styling legitimately produces one.
**Decision:** The split is **per line, not per span**. A single line
carrying creole markup still emits ONE `<text>` with `<tspan>` children.
**Consequences:** ~522 additional `<text>` elements. `creole-svg.ts` is not
in any write-set.

## D4 — The per-line y advance is CITED from upstream or the task HALTS

**Context:** the mission's one fitting hazard. The sample shows the jar's
two lines 12 apart at `font-size="12"` — advance == font size. That is ONE
fixture, and our font size differs (14), so a coincidence is plausible.
**Decision:** T3 locates the advance in upstream's text-block layout and
cites it as `File.java:line`. **If it cannot be located, T3 halts and
reports.** Never fit a value, especially not one that shrinks the error.
**USER-CONFIRMED 2026-09-03.**
**Consequences:** T3 may halt with T1 and T2 already landed. That is an
acceptable outcome — the two element swaps stand on their own.

## D5 — Font size 14 vs the jar's 12 is OUT of scope

**Context:** surfaced while verifying D3. Ours renders labels at
`font-size="14"`, the jar at `12`.
**Decision:** A theme-default divergence, not element granularity. Name it
in the census; do not change it here.
**Consequences:** `@font-size` attribute diffs persist. Changing a theme
default mid-mission would move every fixture for a reason unrelated to the
gated quantity and make the descent unattributable.

## D6 — Pin the pre-swap element census BEFORE any source change

**Context:** the existing `diff-baseline.json` records `weightedScore` and
`diffCount` only. Neither says WHICH element moved, so three sequenced
swaps would be individually unattributable.
**Decision:** T0 pins per-fixture tag histograms and the `g[1][childCount]`
delta. T1–T3 change source. T4 re-pins, naming every riser.
**Consequences:** one extra commit; buys the only evidence each swap
worked. Mirrors the previous mission's D5, whose absence would have made
its −29.9% an assertion rather than a measurement.

## D7 — `style=` vs presentation attributes is NOT a divergence to chase

**Context:** the jar writes `style="stroke:#181818;stroke-width:1;"` where
we write `stroke="#181818" stroke-width="1"`.
**Decision:** Out of scope. `tests/oracle/svg-conformance/normalize.ts:124`
expands a `style` attribute into its constituent presentation attributes
before comparison, so the two forms compare **identically**.
**Consequences:** the gate cannot see this difference. Work here would
measure nothing. Recorded so a future reader does not rediscover it as a
gap.

## D8 — `<a>`, `<image>` and gradients are not ported here

**Context:** the jar emits 9 `<a>`, 6 `<image>`, 1 `<linearGradient>` and
2 `<stop>` that we emit zero of.
**Decision:** Out of scope. 16 occurrences across 268 fixtures, against a
91.6% target. Each is a separate feature port with its own upstream surface
(links, sprites, gradient colour syntax).
**Consequences:** they remain in the census as named, sized follow-ons.

## D9 — SVG output growth is accepted, not mitigated

**Context:** splitting 1666 polylines into ~3047 `<line>` elements makes
every activity SVG larger. Upstream itself ships two "reduce SVG output
size" commits inside the current pin range
(`ba68279df92`, `4f3a0dcc63b`, both touching `SvgGraphics.java`).
**Decision:** Accept the growth. Upstream actively optimises output size
and **still** emits one `ULine` per segment — so per-segment lines are what
an output-size-conscious upstream chose, and matching it is correct.
**Consequences:** larger SVGs, deliberately. Not a regression; do not add a
polyline "optimisation" back.

## Not applicable — backwards compatibility

plantuml-ts has **no consumers**. This mission changes `renderSync`'s
emitted element vocabulary for activity diagrams; that is movement toward
jar parity, not a breaking change to manage. No versioning, no deprecation
window, no dual-write. Classified only by reversibility: **Reversible** —
two source files, `git revert` restores the prior shape.

---

## D10 — AMENDED MID-MISSION 2026-09-03, after T1. **HALTED for review.**

**Stop condition 3 fired**: the code contradicts the mission's exit bar, not
one of D1–D9. D1 is *confirmed* — upstream ships no polyline driver and
`Worm.java:134-183` emits one `ULine` per segment. What broke is the
**instrument**.

**Context.** T1 landed exactly what D1 specifies and every element-level
measure improved: `<polyline>` 1666 → **0**, `<line>` 289 → **2702** against
the jar's 3336, the summed absolute element delta across all eleven censused
tags **−57.0%** (7153 → 3074), and the summed absolute root-`<g>`
child-count delta **−19.3%** (2676 → 2159). The gated `weightedScore`
nevertheless **ROSE 7.0%** (108447 → 116083) and the ratchet failed **207 of
268** fixtures.

**Mechanism** (full artifact: `.agent-notes/aeg-T1.md`).
`compare.ts:404` charges a `[childCount]` short-circuit
`sumUnits(actualChildren) + sumUnits(expectedChildren)` — the **sum** of both
sides' sizes, not their difference. On a subtree that still short-circuits,
enlarging our side raises the charge no matter how much closer to the jar the
enlargement made us. Proven by holding the jar side fixed: on
`tobajo-64-mipi810` `jarUnits` is 1236 before and after while `oursUnits`
goes 686 → 902, and the weight rises by exactly 216 = 902 − 686.

**Consequence — the exit bar is unreachable as written.** `weightedScore` is
monotone under element *substitution* (the fixed-node-count class of change
every prior mission made) and **anti-monotone under growth**. All three of
this mission's swaps grow the document: T1 adds ~2413 nodes, T2 adds 518
attribute units (`r` → `rx`,`ry`), T3 adds ~522 `<text>`. A fixture only
improves by reaching *exact* count equality, and 203 of the 268 cannot,
because `polygon` (−615) is out of scope entirely and `line` retains a −634
residual. D9 ("SVG output growth is accepted, not mitigated") and the exit
bar ("the aggregate `weightedScore` falls") are in direct conflict, and
nothing in D1–D9 anticipated it.

**Decision: HALT. Do not re-pin, do not proceed to T2/T3, do not revert the
port.** T1 is preserved unmerged on `wip/aeg-T1-measured-halt` (`f59c26bb`).
Resolving this is a choice about the instrument and belongs to the human:

1. **Change the gated quantity** for element-granularity work — e.g. gate on
   summed \|element delta\| or \|childCountDelta\|, both of which already show
   a large, unambiguous descent. Cheapest; leaves `compare.ts` alone; needs a
   new pin and a new gate.
2. **Fix the weighting** so a `[childCount]` short-circuit charges the
   *difference* rather than the sum. Correct at the root, but `compare.ts` is
   the SHARED comparator behind the sequence, class, state, object,
   description and json ratchets — every one of their baselines would have to
   be re-pinned. Its own mission.
3. **Accept the rise and re-pin**, on the stated mechanism. Legal under stop
   condition 6's "until proven otherwise", but it bakes the anti-monotonicity
   in: T2 and T3 and every later element-granularity mission would each need
   the same exemption, and the ratchet stops meaning what its own failure
   message says it means.

Option 2 is the recommendation — it is the only one that leaves a gate whose
claim about itself is true — but it is out of every write-set in this mission
(stop condition 1) and must be decided, not assumed.

---

## D11 — T1 resumed and landed with 8 documented exceptions

**Context.** After `svg-comparator-alignment` fixed D10's instrument
defect, T1 was reapplied. 260 of 268 fixtures fall or hold cleanly. 8 rise,
but not because of anything T1 did: T1 happens to make their root-`<g>`
child count land on an exact match with the jar's, routing them onto
`compareNodes`'s untouched equal-length positional loop, which then walks
garbage because the underlying CONTENT does not correspond position-for-
position — a pre-existing condition, confirmed by all 8 already showing a
canvas-dimension mismatch (`svg/@height`/`@width`/`@viewBox`) BEFORE T1 was
even applied.

Investigated (`.agent-notes/aeg-T1-8-exceptions.md`) and found **four
separate, unrelated defects**, none of them element-granularity: a note
attached to a terminal node laid out as flow height instead of a floating
side-annotation; `DiamondFontSize`/activity font skinparams entirely
unwired; swimlanes rendered as a boxed table header instead of the jar's
colored divider-lines-with-floating-titles (architecturally different, not
a sizing bug); and nested `split` geometry ~3x too wide, 2x too tall.

**Decision, user-directed 2026-09-03:** land the other 260 now; re-pin
these 8 as documented exceptions (mechanism stated, not silent — legal
under stop condition 6); file all four defects as named follow-on missions
in `planning/next-missions.md` rather than fixing any today.

**Consequences.** T1 lands with an aggregate `weightedScore` of 76922
against T0's pin of 108447 (−29.1%) — the exit bar's "aggregate falls" is
met. The 8 exceptions carry a stated mechanism in
`oracle/goldens/svg-activity/diff-baseline.json`'s own re-pin and this
decision; a future mission fixing any of the four defects is expected to
LOWER these 8 fixtures' scores further, not just hold them.

## D12 — T4 confirms zero adopted regressions; corrects two of T4's own spec projections

**Context.** T4's full, unconditional re-pin (against the mission-start
baseline, `804232d4`, not any possibly-stale intermediate pin — see
`.agent-notes/aeg-T4.md`) found **zero** fixtures rose across the whole
mission. The 10 fixtures D11 named as "exceptions" all rose only at
*intermediate* checkpoints and finished net-improved.

**Two premises in T4's own task spec did not survive measurement:**
1. `tspan` was projected to stay nonzero ("must NOT go to zero", creole
   carve-out). Verified during T3's implementation: none of activity's 5
   multi-line call sites carry creole markup — the pre-T3 249 tspans were
   the old per-line splitting artifact, not creole spans. Zero is correct.
2. `text` was projected to rise by ~522 toward the jar's 1915; it rose by
   195. Not investigated further — per T4's own instruction, projections
   are not results, and the gap is plausibly explained by the six named
   pre-existing defects and out-of-scope missing content.

**Decision.** Record both corrections in the T4 report rather than
treating the mismatch as a task failure or silently adjusting the
narrative to fit the original projection.

**Consequences.** The mission's headline number (108447 → 61677, −43.1%,
`svg/g[][childCount]` 91.6% → 39.9%) is now the audited, corrected final
result — verified against the mission's true start, not an intermediate
or partially-stale checkpoint.
