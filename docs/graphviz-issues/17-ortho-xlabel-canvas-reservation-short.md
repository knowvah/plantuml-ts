# `splines=ortho` xlabel canvas reservation is ~1.58pt short of native graphviz

**MECHANISM FOUND 2026-09-03 (second pass).** The reclassification below is
right that this is ours and not the engine's, and its "one mechanism, not two"
arithmetic holds. Its *next step* was wrong, though, and so was its
intermediate geometry. The cause is not "some attribute that moves the ortho
port offset off `width/6`" — node `width`/`height` and the xlabel box all
match the jar's cached DOT exactly. **`splines=ortho` is never emitted at
all**, by either the DOT emitter or the layout builder, so every ortho layout
runs on graphviz's default *curved* routing.

- `applyGraphAttrs` (`src/core/graph-layout-build.ts:34-43`) sets `rankdir`,
  `nodesep`, `ranksep`, `aspect` — nothing else.
- `graphAttrLines` (`src/core/svek-dot-emit.ts:66-77`) pushes `nodesep`,
  `ranksep`, `remincross=true`, `searchsize=500`, `rankdir=LR` — nothing else.
- `DotInputGraph` has no field to carry it. Zero `splines`/`forcelabels`
  emission anywhere in `src/`.
- `theme.linetype` IS parsed and IS plumbed — but only to the per-edge
  `moveLabelToXlabel` switch (`state-dot-graph.ts:238`,
  `state-composite-edge-label.ts:98`, `link-edge-attrs.ts:361`). Issue 16
  wired the label half of the feature; the routing half was never wired.

Upstream emits both attrs at `DotStringFactory.java:161-169`, between
`searchsize=500;` (`:154`) and `rankdir=LR;` (`:171`) — exactly the gap in
`graphAttrLines`, which goes straight from one to the other.

**Proof — replaying this fixture's real captured `DotInputGraph` through the
identical build path, toggling only those two attrs:**

| quantity | ours today | + `splines=ortho`,`forcelabels` | native 15.1.1 |
|---|---|---|---|
| bb width | **106.581238** | **108.164568** | `108.16` |
| node centre x | **60.7500** | **62.3333** | `62.333` |
| edge 2 `xlabel.x` | **40.5000** | **43.6667** | `43.667` |

The left column reproduces the ORIGINAL filing's three "engine" numbers
(`106.581` / `60.75` / `40.5`) **to the digit**. Those measurements were
always real — they were measurements of *our own graph*, misattributed to the
engine. `108.164568 − 106.581238 = 1.58333`, the whole residual. Expected on
fix: `108.164568 + 35 = 143.164568 px = 1.988397 in` vs jar's `1.988368 in`
→ ~0.002 px.

**Two corrections to the reclassification's own text.** (1) Its derived
`±6.75` straight-port geometry is not what the failing path does — the spline
dump it explicitly asked for is now captured and shows the edges *curved* at
~±6.18 (`39.645 → 38.892 → 38.893 → 39.649`). (2) Its "dump the DOT and diff
node width/height and the xlabel box" next step would have found nothing;
those three are clean, and the missing term is a **graph** attribute.

**This is issue 03's un-consumed fix.** `03-splines-attr-unsupported.md`
("No way to set the `splines` graph attribute") is checked `[x]` in
`TRACKER.md`. Its upstream half landed and works — but nothing in this port
ever started emitting the attribute, so the consumption never happened. 17 is
03's downstream symptom. 03 is now unchecked with a note; the work belongs
there, sized as its own mission.

Full artifact, including why the DOT-parity harness cannot see this gap and
the 8-fixture blast radius: `.agent-notes/gvi17-splines-never-emitted.md`.

---

**RECLASSIFIED 2026-09-03: NOT a dot-engine defect.** The premise below —
that `@knowvah/dot-engine` reserves less horizontal canvas than native
graphviz on byte-identical input — does not reproduce. On this fixture's own
cached `svek-1.dot`, and on the 2-node reduction this filing quotes, the
pinned `1.6.0` this repo consumes is **exact against the native oracle** on
every quantity the table below attributed to native alone. There is no
upstream fix to wait for; the remaining `-1.579968 px` on
`pavuzo-79-zodu430` scope 2 width idx 2 is ours, in whatever this port hands
the engine. Kept open as a plantuml-ts work item, not as a dot-engine
filing. The original filing is preserved verbatim at the bottom.

## Disproof

Oracle: `GVBINDIR=/tmp/ghl ~/git/graphviz/build/cmd/dot/dot -Tdot`
(15.1.1, headless GVBINDIR per `dot-engine/test/corpus/gen-headless-gvbindir.sh`).
Engine: `plantuml-ts/node_modules/@knowvah/dot-engine`, installed `1.6.0` —
the published artifact this repo's `^1.6.0` spec resolves to, **not**
dot-engine's `src/` HEAD (both were measured; both are exact, so the result
does not turn on HEAD having drifted from the release).

1. **`-Tdot` on `oracle/goldens/state/pavuzo-79-zodu430/svek-1.dot`** —
   engine output is **byte-identical** to the oracle's, blank lines ignored.
2. **Through the exact API path `graph-layout-build-edges.ts` uses** —
   `createGraph` + `addNode`/`addEdge` + `setHtmlAttr('xlabel',
   fixedSizeTable(54, 15))` + `getLayout()`:

| Quantity | native `dot -Txdot` 15.1.1 | this filing recorded for the engine | pinned `1.6.0`, measured |
|---|---|---|---|
| edge 1 `xlp.x` | `27` | `27` | `27` |
| edge 2 `xlp.x` | `43.667` | `40.5` | `43.666656` |
| node centre x | `62.333` | `60.75` | `62.333328` |
| bb width | `108.16` | `106.581` | `108.164568` |

The engine matches native on all four, including the two this filing reports
as diverging. Robust to dropping `forcelabels`, `searchsize` and
`remincross`, and to including or excluding the start-circle node `sh0006`
(the full 3-node `svek-1.dot` and the 2-node reduction agree).

## Where the 1.583 actually lives

Not in xlabel placement. It is the **ortho edge port offset from the node
centre**. Native routes the two `sh0007` <-> `sh0008` edges at `x = 54` and
`x = 70.667`, i.e. `+-8.333` about the centre `62.333` — `50/6`, where `50`
is `sh0007`'s width (`0.694444 in`). The geometry this filing measured has
them at `+-6.75`:

```
native:  62.333 -+ 8.333  ->  54, 70.667      bb 108.164
theirs:  60.75  -+ 6.75   ->  54, 67.5        bb 106.581
delta:            1.583                            1.583
```

Each 54-wide xlabel box sits flush against its edge (native's edge-1 label
spans `[0, 54]`, its right edge exactly on the spline at `x = 54`), so the
bb's left bound is `edge1.x - 54` and its right bound is
`centre + 45.831`. Shrinking the port offset pulls the leftmost label right
by the same amount it pulls the node left, and the box loses `1.583` — the
whole residual, in one term.

Caveat on provenance: the `+-6.75` is derived from this filing's own quoted
`xlp` values (`27` and `40.5`) and centre (`60.75`) under native's flush
placement, not read off a spline dump of that run. The arithmetic closes
exactly, but a spline dump from the failing path would confirm it directly
and is the first thing to capture.

This also settles the filing's "open question": (1) the second edge's
`3.17 pt` `xlp` drift and (2) the `1.58 pt` centring shift are **one
mechanism, not two coincident ones** — `3.167 = 2 x 1.583`, the two edges
being displaced symmetrically about the centre.

## What is actually left to do (ours)

The `106.581` was measured on a graph built through this port's own
`addNodes`/`addEdges`, so the divergence is in what that path feeds the
engine — some attribute that moves the ortho port offset off `width/6`.
Next step:

1. Dump the DOT this port actually builds for `pavuzo-79-zodu430`'s inner
   scope and diff it against the jar's cached `svek-1.dot`. The candidates
   that would move the offset are node `width`/`height` and the xlabel box
   dimensions; `forcelabels`/`searchsize`/`remincross` are ruled out above.
2. Whatever the diff shows, this becomes a plantuml-ts fix, and the
   `-1.579968 px` row closes here with no dot-engine release involved.

## Retraction

The "Finding", "Where it comes from" and "Causal chain" sections of the
original filing (preserved below) attribute the shortfall to
`@knowvah/dot-engine`'s port of `lib/dotgen/dotsplines.c`'s `EDGETYPE_ORTHO`
branch / `lib/common/postproc.c`'s `addXLabels` in `src/label/xlabels.ts`.
That attribution is **withdrawn** — those code paths reproduce native
exactly on this input. The jar-side "Why it is not the jar" analysis and the
"Ruled out" list stand; they were never in question. Issue 16's own
`STILL UNCHECKED` block in `TRACKER.md` carries the same withdrawn
attribution and is corrected there.

---

# ORIGINAL FILING (2026-08-19, SI31 T1) — attribution withdrawn above


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
