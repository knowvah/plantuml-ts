# T1 diagnosis — the jar's spline control points are 2-decimal; ours are not

Mission `class-edge-spline-conformance`, batch-1/T1. Fixture
`oracle/goldens/svg-class/bipudo-23-xavu432` (four classes, four
inheritance edges).

## Mechanism

**The jar's edge-spline control points are quantized to 2 decimals before
clipping. Ours carry full precision. Clipping then amplifies the
difference at the trimmed end.**

## Origin

> **CORRECTED 2026-08-13.** The original attribution below — "inside
> Smetana's layout" — is **wrong**, and the section is kept so the
> reversal is auditable. The rounding is `dot -Tsvg`'s output format.
> Smetana is not in this path at all: this fixture has a `svek-1.dot`,
> and Smetana paths emit none. Everything downstream of the Mechanism
> section still holds; only the cause changes.

**In `dot -Tsvg`'s number formatting, which PlantUML scrapes as text.**

`svek/DotStringFactory.java:316` calls
`GraphvizRuntimeEnvironment.getInstance().create(skinParam, dotString, "svg")`;
`create` (`dot/GraphvizRuntimeEnvironment.java:141-153`) falls through to
`new GraphvizLinux(skinParam, dotString, type)` — the external `dot`
binary — and PlantUML then parses the resulting SVG text. The `-Tsvg`
writer prints coordinates to 2 decimals, so the jar never sees a
full-precision control point.

This answers the question the original diagnosis left open. It observed
that node `x=7 width=49.15` puts the centre at **31.575** while the jar
draws the vertical edge at **31.58**, and concluded the rounding must
happen "between layout and that edge's coordinates". It does — in the
serializer. Run directly on this fixture's own DOT:

```
$ dot -Tsvg test-results/dot-cache/class/bipudo-23-xavu432/svek-1.dot
d="M24.58,-107.74C24.58,-90.06 24.58,-65.87 24.58,-48.21"
```

`24.58`, not `24.575004`. Every jar value in the table above is real
graphviz 15.1.1's own SVG output, unmodified.

**Consequence:** this is a serialization-precision limit, not a stale-
engine artifact, so it does **not** go away when the jar updates graphviz.
The "we don't chase a graphviz 2.38 transpile" rationale that closed the
mission on 2026-08-08 does not apply to this fixture.

Superseded elimination steps, kept for the record:

- `sdot/SmetanaEdge.java#getPoint` reads `ST_pointf` straight through
  (`new XPoint2D(pt.x, pt.y)`) — no rounding there. *(Correct, but the
  wrong seam: this path never reaches SmetanaEdge.)*
- `h/ST_pointf.java` declares `public double x/y` — not `float`, so this
  is not float-precision truncation. *(Still true.)*

## Causal chain

1. Real graphviz 15.1.1 on the jar's own `svek-1.dot` gives, for
   `sh0006->sh0009`:
   `43.009,107.74 57.015,90.064 76.189,65.868 90.184,48.208`.
2. **Our engine matches that exactly.** `@knowvah/dot-engine` returns the
   same x values and y values that sum to a constant **156.000** against
   graphviz's — a pure y-flip about the graph height (2.1667in × 72 =
   156.0). No divergence at layout.
3. The jar's control points are ours rounded to 2 decimals, at every
   point checked:

   | raw point | ours / graphviz | jar |
   |---|---|---|
   | 3 | 76.189044, 90.132030 | 76.19, 90.13 |
   | 4 | 90.183850, 107.792146 | 90.18, 107.79 |
   | vertical x | 24.575004 | 24.58 |

4. Clipping the trimmed end from those slightly different control points
   yields start x **61.184** (jar) vs **61.189** (ours), and control x
   **75.184** vs **75.194** — the 0.0097 the ratchet reported.

## Proof

Quantizing our spline points to 2 decimals at `graph-layout.ts:81`
reproduces **all four** of the fixture's edge splines byte-for-byte,
including the failing one:

```
ours (quantized)  M61.184,69.372 C75.184,87.052 83.19,97.13 97.18,114.79
jar               M61.184,69.372 C75.184,87.052 83.19,97.13 97.18,114.79
```

## Ruled out

- **Our layout engine** — matches real graphviz exactly (step 2).
- **DOT emission** — `parity-class.json` already records
  `dotEqual: true`; confirmed by using the jar's own dumped `svek-1.dot`
  as the input to both.
- **`spline-clip.ts#simulateCompound`'s 1/256 granularity** — the brief's
  leading hypothesis, and it is **wrong**. The divergence is present in
  the *unclipped* control points 3 and 4, which clipping never touches.
- **Float truncation** — `ST_pointf` is `double`.
- ~~**PlantUML's read seam** — `SmetanaEdge#getPoint` does not round.~~
  **Overturned 2026-08-13:** the read seam IS the cause, but it is the
  `-Tsvg` text scrape, not `SmetanaEdge`. See the corrected Origin above.
- **The size-reduction port** — pre-mission code produces the same raw
  values.

## Why the obvious fix is NOT the fix

Blanket 2-decimal quantization at `graph-layout.ts:81` takes the oracle
suites from **1969/1969 to 1961/1969**: it fixes `bipudo-23-xavu432` and
breaks eight other things, because that seam feeds **node geometry** as
well as splines. `tests/oracle/state-dot-parity.test.ts` fails on "node
size drift", and seven fixtures regress across class, component and
usecase.

So 2 decimals may be the right *quantity* at the wrong *place*. Any real
fix has to apply only where the jar applies it, which requires knowing
where that is.

## Open question — ANSWERED 2026-08-15

> **CLOSED** by `plans/transition-label-ink/` (commit `c62f7d21`). The
> three probes below are moot and were never needed: modern graphviz
> quantizes too, in the SVG writer.
>
> ```c
> /* ~/git/graphviz/lib/gvc/gvdevice.c:513-528 — gvprintdouble */
> if (num > -0.005 && num < 0.005) { gvwrite(job, "0", 1); return; }
> snprintf(buf, 50, "%.02f", num);
> size_t len = gv_trim_zeros(buf);
> ```
>
> So it is `%.02f` rounding (half-to-even, per C), not truncation, and not
> a 2.38-vs-modern behaviour difference — the corrected Origin section
> above already said `-Tsvg`; this is the line. Nothing about Smetana's
> vintage is involved, and there is no version question to settle.
>
> Verified end to end: real graphviz 15.1.1 on the jar's own
> `test-results/dot-cache/state/bemena-23-zebu249/svek-1.dot` puts that
> fixture's `EvNewValueSaved` label-table corner at `235.61`, where our
> engine carries `235.61168`.
>
> **"Do not apply quantization anywhere" is superseded, narrowly.** The
> measurement below still stands — a blanket quantization at
> `graph-layout.ts:81` is the wrong place, because that seam feeds node
> geometry too. A PER-READ-SEAM one is the right place, and the
> transition-label mission did one: it quantizes only the label's own ink
> box, inside one state module, and took
> `measure-composite-declared-size.ts` from 2454 to 2469 exact with zero
> regressions. Whoever takes this fixture's splines should do the same for
> the spline read seam rather than the shared one.
>
> The superseded text follows.

**Why does Smetana produce 2-decimal coordinates when modern graphviz does
not?** The strongest candidate is vintage: CLAUDE.md records Smetana as a
transpile of **graphviz 2.38**, while our engine targets a modern
graphviz (local reference is 15.1.1). A spline/position change between
those versions would explain a systematic sub-pixel offset.

Concrete next probes, cheapest first:

1. Read the transpiled `gen/lib/dotgen/` spline path (`dotsplines.c`
   equivalent) for a `ROUND`/`POINTS`-style quantization that modern
   graphviz has since dropped. That is a direct read, no build needed.
2. Compare `~/git/graphviz/lib/dotgen/dotsplines.c` at 2.38 against
   current for coordinate rounding.
3. If it is a genuine 2.38-vs-modern behaviour difference, the decision is
   a product one — match the oracle's vintage, or accept a documented
   sub-pixel divergence — and belongs to the maintainer, not to this
   mission's implementer.

**Do not** apply quantization anywhere until that is answered; the
measurement above shows it costs more than it buys.

## Confidence

High on the mechanism and on every "ruled out" line — each was measured,
including a reproduction that matches the jar byte-for-byte and a blast
radius that was run rather than estimated. **Unknown** on why Smetana
quantizes, which is exactly what step 1 above should settle.
