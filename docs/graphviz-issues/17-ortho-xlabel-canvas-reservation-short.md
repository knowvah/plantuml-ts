# `splines=ortho` xlabel canvas reservation is ~1.58pt short of native graphviz

**Impact:** every `skinparam linetype ortho` / `polyline` composite whose
declared size is derived from its inner scope's ink extent comes out narrower
than the jar's. `pavuzo-79-zodu430` scope 2 width idx 2 is the measured case:
after issue 16's `xlabel` position landed and was consumed (SI31 T1), the row
went `-2.460024 px` -> `-1.579968 px` and stopped there. The remaining
`1.58 pt` is not in this port and not in the jar — it is the engine reserving
less horizontal room for an ortho edge's xlabels than native graphviz does on
byte-identical input.

Distinct from issue 16, which was about the position not being *published*.
The position is now published and the first edge's `xlp.x` matches native
exactly; this is about the **canvas/rank centring** the search feeds back into.

## Finding

Same reduced sub-graph (pavuzo-79-zodu430's inner scope: `Idle` ->
`Configuring` plus two `EvConfig` xlabeled edges, `splines=ortho`), fed jar's
own cached node widths `0.694444` / `1.273090`:

| Quantity | native `dot -Txdot` 15.1.1 | `@knowvah/dot-engine` `getLayout()` |
|---|---|---|
| edge 1 `xlp` | `27,75.558` | `{x: 27, y: 75.47}` |
| edge 2 `xlp` | `43.667,60.442` | `{x: 40.5, y: 60.47}` |
| node centre x | `62.333` | `60.75` |
| bb width | `108.16` | `106.581` |

Dropping the `xlabel` attributes from the *same* native input collapses its
bb to `91.662` (bare node width, centred at `45.831`). So xlabels widen
native's canvas by **+16.502 pt** and this engine's by **+14.919 pt** — a
`1.583 pt` shortfall, which is the whole residual.

Read back through `getLayout()` at full float precision, not text-serialized:
an earlier spot-check that appeared to show exact agreement was an artifact of
a hand-typed node width (`1.2731` instead of `1.273090`) applied to both sides,
and is retracted.

## Where it comes from

Native's path is `lib/dotgen/dotsplines.c`'s `EDGETYPE_ORTHO` branch
(`setEdgeLabelPos` / `orthoEdges`) together with `lib/common/postproc.c:405-616`
(`addXLabels`). The engine ports this in `src/label/xlabels.ts`. Two candidate
divergences, not yet separated:

1. the second edge's `xlp.x` drifts `3.17 pt` (`40.5` vs `43.667`);
2. the node centring itself shifts `1.58 pt` (`60.75` vs `62.333`) — this is
   the one that binds the ink extent.

**Open question for whoever picks this up:** whether (1) and (2) are one
mechanism or two coincident ones. (1) never binds either extent bound on this
fixture (verified by direct computation on both geometries), so (2) is what
the measured row is made of.

## Why it is not the jar and not this port

The jar's own arithmetic downstream of the canvas is verified faithful here,
by gated tracing since reverted:

- `SvekResult.java:130-133` — `calculateDimension` = `minMax.getDimension().delta(15, 15)`
- `InnerStateAutonom.java:186-195` — `calculateDimensionSlow`, `MARGIN`=`MARGIN_LINE`=5, delta 20
- `XDimension2D.java:101-105` — `mergeTB`'s 3-arg form is `Math.max` of three widths
- `SvekEdge.java:433-437` (the ortho fork) and `:504-521` (`appendTable`'s
  `(int)` truncation) — the `54x15` reservation this port emits is
  byte-identical to the jar's own cached `svek-1.dot`

This port reproduces that chain exactly: ink `106.5825` + 15 + 20 = `141.5825`,
which is the harness's measured "ours" to the digit.

## Causal chain

Ink width = `maxX - minX`. `maxX` is `Configuring`'s right edge and `minX` is
the `Idle->Configuring` label's box left edge — both dominant on both sides and
translation-invariant. Half-width is identical (`45.831`, same node dims), so
the entire gap is the centre-x shift:

```
ink:      jar 108.164   ours 106.581    delta 1.583
+15 +20:  jar 143.164   ours 141.581    delta 1.583
in inches: 1.988368 x 72 = 143.162      1.966424 x 72 = 141.583
```

`143.164 - 141.581 = 1.583`, versus the harness's `-1.579968 px`. The ~`0.003`
difference is the harness's own 6-decimal rounding on both `ours` and `jar`,
not a third cause.

## Ruled out

1. **`getMinXY`'s 2-decimal SVG-scrape quantization**
   (`state-transition-label.ts#svgPrecision`) — bounded at <= `0.005 px`, two
   orders of magnitude too small.
2. **`labelShield`** (`SvekEdge.java:353-356`) — proven 0 against the jar's own
   cached DOT (`WIDTH="54"` matches this port's unshielded reservation exactly;
   a nonzero shield would inflate both sides).
3. **`divideLabelWidthByTwo` / `eventuallyDivideByTwo`** — note-on-link only.
4. **`appendTable` truncation** — identical on both sides.
5. **Title text dominating `mergeTB`'s `Math.max`** — `77.087` vs `77.0875`,
   nowhere near the threshold.
6. **SI31 T1's own consumption seam** — unit-tested; the first edge's
   reservation and `xlp` match the jar exactly.

## Verification when it lands

`pavuzo-79-zodu430` scope 2 width idx 2 reaches exact (`-1.579968 px` -> 0)
with no change to this repo, since the consumption seam is already in place.
