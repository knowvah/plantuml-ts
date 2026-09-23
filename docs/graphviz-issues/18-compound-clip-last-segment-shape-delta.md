# Compound-edge clip lands ~20px short on the last bezier segment for some cluster-anchored edges (mechanism M1, cdd-T13)

**Impact:** 4 of the 723 class fixtures in the ratchet corpus:
`bejusa-95-gafo325` (two cluster-anchored edges whose clip lands on
their LAST bezier segment: `VCAN_DRV *-- PCAN_DRV` and `PCAN_DRV *--
Bus_Rx` — the sibling edge on the same fixture, `PCAN_DRV *-- Bus_Tx`,
structurally identical shape/decoration, is unaffected) and
`pecabi-95-demu756`/`sanixi-31-nofa193` (a `note top of <package>`
connector, the SAME `SvekEdge`/`simulateCompound` clip applied via
`note-layout-tip.ts#resolveGroupGeos`, cdd-T13). All diffs are `N`
(numeric) only — `compareSvg` structural count is 0 for every one of
these fixtures after the clip lands (`class-divergence-drive` T13).

**Finding:** `SvekEdge.java:671-672`'s `simulateCompound` clip
(`src/core/spline-clip.ts`, unmodified, faithfully ported — see
`class-shield-helpers.ts#clipClusterEdgeEnds`'s own doc comment) is
applied to the identical cluster rectangle on both engines — verified
BYTE-IDENTICAL: `bejusa-95-gafo325`'s rendered `<g class="cluster">`
`<path d>` for `PCAN_DRV`/`Bus_Tx`/`Bus_Rx` is character-for-character
equal between this port's render and the jar's oracle SVG, as are every
node's `<rect x y>` (`VCAN_DRV`, `PCAN_DRV.PCAN_DRV`, `Bus_Tx`,
`Tx_FIFO`, `Bus_Rx`, `Rx_FIFO` — all six, both engines, same `x`/`y` to
the hundredth). The chrome/title vertical shift is confirmed uniform
(35px, checked against a raw pre-chrome node position vs its final
rendered position) and does not explain the gap.

For `VCAN_DRV -> PCAN_DRV` (a 4-segment/13-point spline both sides) and
`PCAN_DRV -> Bus_Rx` (a 3-segment/10-point spline both sides), the
SEGMENT COUNT the clip returns is identical on both engines (so the
crossing-detection loop picked the same segment index), and the point
immediately BEFORE the subdivided pair matches to within 0.003px
(`Bus_Rx`: this port 365.764,314.632 vs jar 365.766,314.632). But the
subdivided pair itself — the final segment's own `cp2`/endpoint — differs
by a near-exact **20.0px** in `y` on both fixtures independently
(`Bus_Rx`: 315.715/316.803 vs jar's 335.716/336.804, Δ20.001 both;
`VCAN_DRV->PCAN_DRV`: 157.625/158.520 vs jar's 177.624/178.519, Δ19.999
both). Since the cluster rect and the clip algorithm are verified
identical, the only remaining variable is the RAW (pre-clip) spline's
own trailing control points — `@knowvah/dot-engine` routes this
specific segment's shape differently enough from real graphviz that the
midpoint-subdivision boundary search (`DotPath#simulateCompound`, 8
iterations of `XCubicCurve2D#subdivide`) converges ~20px earlier along
the curve, even though the segment's OWN leading point and the cluster
rectangle are themselves exact. `Bus_Tx`'s structurally-identical
sibling edge does not show this gap (its clip lands within 0.001px of
the jar's), so this is a per-edge curve-routing delta, not a systematic
clip-wiring bug — ruled out: wrong end/rect (cluster paths and node
positions verified byte-identical above), wrong segment index (segment
counts match on both engines), and the T13 clip's own arithmetic
(`spline-clip.ts` unmodified from its existing state/description
callers, itself unit-tested and matching upstream exactly on
`bajotu-30-soku184`, structural 0 / numeric 0 after this same clip).

**Classification: `@knowvah/dot-engine` spline-shape delta, per the
`Cluster.CENTER_ID`-anchored compound-edge routing path.** No upstream
fix applied here — filed per stop 8 (`plans/class-divergence-drive/
README.md`), not chased or tuned. Same family as issue 15 (a compound
clip landing differently because the two engines' underlying curve
shapes differ near a cluster boundary), but NOT the same root: issue 15
was a pure coordinate-frame mapping question (proven arithmetic, no
shape difference once mapped) resolved as "not a dot-engine defect";
this one is a genuine shape delta on the routed curve itself (~20px for
the two `bejusa` edges, ~4.9px for the `pecabi`/`sanixi` note
connector — same signature, different magnitude, consistent with a
per-curve routing difference rather than a fixed constant), confirmed
via matching cluster rects/node positions and an unaffected sibling
edge (`Bus_Tx`) as a negative control. `bajotu-30-soku184` (the T13
acceptance-criteria fixture) clips EXACT — the delta is not general to
every cluster-anchored clip, only to curves whose final segment happens
to straddle the boundary with a shape `@knowvah/dot-engine` computes
differently from real graphviz.

## Repro

`test-results/dot-cache/class/bejusa-95-gafo325/in.puml` (`PCAN_DRV *--
Bus_Tx : 1..1` / `PCAN_DRV *-- Bus_Rx : 1..1`, and `VCAN_DRV *--
PCAN_DRV`, all in one diagram). `npx jiti plans/class-divergence-
drive/tools/render-diff.mts bejusa-95-gafo325` after T13's clip:
`structural=0 numeric=4`, all four diffs the two Δ20 pairs above.

`test-results/dot-cache/class/pecabi-95-demu756/in.puml` (`package
oft_openflow_types { class cl1 } ; note top of oft_openflow_types :
bar`; `sanixi-31-nofa193` is the same diagram, no blank-line
whitespace difference) shows the identical signature on the note
connector: `structural=0 numeric=2`, leading point of the final segment
matches to 0.001px (52.042/52.043), trailing cp2/endpoint both differ
by a near-constant ≈4.89px (52.329/52.617 vs jar's 57.222/57.509) —
smaller in magnitude than the bejusa pair but the SAME shape (only the
final segment's trailing two points move, the cluster's own drawn
`<path>` is byte-identical between engines on this fixture too).

## Evidence trail

`plans/class-divergence-drive/decision-journal.md` (T13 row); cluster
path / node rect byte-comparison and the raw-geo-vs-rendered chrome-shift
check are in `.agent-notes/cdd-T13.md`.
