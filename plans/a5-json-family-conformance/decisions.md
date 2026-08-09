# Architecture decisions — A5 json family

Every decision here is **locked**. If execution turns up a conflicting
constraint, stop and log it in `decision-journal.md`; do not silently override.

---

## ADR-1 — Re-mirror upstream's layout: TB + swapped dims + `Mirror` + real record ports

**Status:** Accepted (maintainer, 2026-08-08)

### Context

Upstream `SmetanaForJson.java` builds its graphviz graph like this:

- `agopen(…, Agdirected)` with **no `rankdir` set at all** — graphviz default TB.
- Per node (`:236-244`): `shape=record`, and then the swap —
  ```java
  final String width  = "" + (dim.getWidth()  / 72);
  final String height = "" + (dim.getHeight() / 72);
  agsafeset(node, "height", width);   // height  <- WIDTH
  agsafeset(node, "width",  height);  // width   <- HEIGHT
  ```
- Record labels built from `<P0>|<P1>|…` port cells carrying
  `_dim_<height>_<width>_` placeholders (`getDotLabelArray` /
  `getDotLabelMap`).
- Per edge (`:217-230`): `tailport="P<num>"`, `arrowsize=.75`,
  `arrowhead=normal`, `arrowtail=none`.
- Every resulting point transposed back via `Mirror#invAndXYSwitch`
  (`x = max - pt.y; y = pt.x`), consumed by `JsonCurve`.

So the diagram a user sees left-to-right is laid out **top-to-bottom on a
transposed graph** and rotated afterwards.

This port does something different: `rankDir: 'LR'` (`json/layout.ts:303`) with
node dims passed straight through, and no record ports — edges carry a
fractional `tailportY` attribute (`layout.ts:283-296`) that approximates where
on the parent's edge the spline should leave.

### Decision

Mirror upstream's structure. Build the TB graph with swapped node dimensions,
emit real record labels with `P<n>` ports, set `tailport` per edge, and
transpose the result through a ported `Mirror`. Retire the fractional
`tailportY` approximation.

### Consequences

- **Easier:** spline geometry starts coming out of the same graph the jar
  solved, which is the only route to matching splines within tolerance. Every
  prior G-phase mission that chased geometry without matching the underlying
  graph converged slowly or not at all.
- **Harder:** this rewrites `json/layout.ts` and the edge-routing half of
  `json/renderer.ts`, and yaml + hcl ride along with no separate say.
- **Risk, named:** our engine is @knowvah/dot-engine; upstream's is Smetana, a
  graphviz-2.38 transpile. Even a correctly mirrored graph may not produce
  byte-identical splines. See ADR-2.
- **Falsifiable, and the mission says so:** if Batch 3's measurement shows the
  mirrored graph lands no closer than `rankDir: 'LR'`, that is a stop condition,
  not something to push through.

---

## ~~ADR-2 — For json, Smetana IS the conformance target~~ — SUPERSEDED 2026-08-09

**Status:** SUPERSEDED by ADR-2b. Kept because it was load-bearing for two
tasks and its reasoning explains what T7 spent effort on.

**What it got wrong:** it inferred, correctly, that Smetana is the only oracle
for this family — and then concluded that Smetana is therefore the *target*.
That does not follow. Being the only available comparison does not make
something worth reproducing.

---

## ADR-2b — Smetana is NOT a porting target; dot-engine wins and we accept the delta

**Status:** Accepted (maintainer ruling, 2026-08-09). Now a standing repo rule —
see CLAUDE.md, "Smetana is NOT a porting target. Ever."

### Context

Smetana is upstream's hand-transpile of graphviz 2.38 into Java, and it was
never brought to full fidelity because that was hard. `@knowvah/dot-engine` is
the work upstream did not do. Reproducing Smetana's shortfalls would mean
porting bugs deliberately.

T7 is the concrete case. Real `shape=record` nodes inflate by 16 per row —
graphviz's `XPAD` (4·GAP) on every record field, which upstream's
`colAwidth - 8` does not offset. Read from the Java, upstream *should* inflate
identically (`storeline` sets `lp->dimen` from the `_dim_` sentinel;
`size_reclbl` PADs on top), yet the jar shows none. Under ADR-2 that gap was a
blocker to reverse-engineer. Under ADR-2b it is very likely Smetana's own
infidelity, and reproducing it is explicitly out of scope.

### Decision

Where upstream calls Smetana, this port calls dot-engine and accepts the
geometry delta, named and measured. Mirror upstream's *structure* — the graph
it builds, the attributes it sets — but not its transpile's arithmetic.

### Consequences

- **The json family's exit bar cannot be byte-exact geometry.** Hold it to
  structure, node sizing, and everything this port controls; carry the layout
  delta as a named entry. `README.md`'s bar is amended accordingly.
- **T7 is unblocked**, and its remaining question changes from "why doesn't the
  jar inflate?" to "does dot-engine's own record sizing produce a sane
  diagram?" — a question about our output, not about matching Smetana.
- `scripts/json-node-oracle.ts` stays valuable: node sizing and structure are
  still legitimate targets, and it is what caught the mirrored-diagram bug that
  no dimension metric could see.

### Context

The repo carries a standing note that *"Smetana is not a conformance target"* —
the jar's svek layout is graphviz 2.38 via Smetana, ours is modern, and the
0.01pt tolerance absorbs the difference. That note was written about the **svek
family**, where the jar shells out to a real graphviz for its DOT.

For json it is **inverted**. The jar never shells out; `SmetanaForJson` IS the
layout. There is no other oracle, and no version of this mission in which we
compare against "real" graphviz.

### Decision

Treat the jar's json output as the target unconditionally. Do not invoke the
"Smetana is not a target" note to excuse a json geometry miss.

### Consequences

A residual geometry gap traceable to a genuine Smetana-vs-dot-engine algorithm
difference is a **named divergence** requiring a `DIVERGENCES.md` entry with the
measured delta and the mechanism — not a silent tolerance widening, and not an
appeal to the svek-family note.

---

## ADR-3 — SVG-only oracle; no DOT gate, and no `parity-json.json`

**Status:** Accepted (resolves mission-index spike S2, 2026-08-08)

### Context

Verified by experiment: the pinned jar with `-DPLANTUML_DUMP_DOT=<dir>` over an
`@startjson` diagram emits the SVG and no `.dot` file, because the layout never
leaves the JVM.

### Decision

The exit bar is SVG conformance measured by the existing
`normalize`/`compare`/census/ratchet harness. There is no DOT-parity gate and no
`parity-json.json` eligibility file (AC3).

### Consequences

The sibling ratchets gate eligibility on a fixture already being DOT-equal, so a
residual SVG diff is attributable to assembly rather than layout. That
attribution is unavailable here: a json diff could be either. Batch 2's
attribution pass carries the weight the DOT gate carries elsewhere, which is why
it is its own task and not folded into a fix.

Precedent: `oracle/goldens/svg-dot/` (D14) already ships a ratchet with no
`parity-*.json` for the same structural reason, documented in its README.

---

## ADR-4 — All three types get goldens and ratchets from Batch 1

**Status:** Accepted (maintainer, 2026-08-08)

### Context

yaml and hcl have no layout of their own (`yaml/index.ts`, `hcl/index.ts` both
route to `layoutJson`). A json layout change moves them silently.

### Decision

`oracle/goldens/svg-json/`, `svg-yaml/`, and `svg-hcl/` are all created in Batch
1, seeded as each type reaches zero-diff. yaml and hcl are never "verified at
the end."

### Consequences

Costs a little more harness up front and makes yaml/hcl regressions visible the
moment a json layout change causes them, which is the point.

---

## ADR-5 — Port under upstream's names

**Status:** Accepted (standing CLAUDE.md rule, restated because this mission
creates new files)

### Decision

`Mirror` → `src/diagrams/json/Mirror.ts`. `JsonCurve` → `JsonCurve.ts`. The
graph builder mirrors `SmetanaForJson`'s structure and says so in a `@see`.
Do not rename to `transpose.ts`, `coordinate-flip.ts`, or similar.

### Consequences

Grepping upstream's source and issue tracker for the same identifier keeps
working. This is the difference between a ten-minute and a multi-day
investigation later.
