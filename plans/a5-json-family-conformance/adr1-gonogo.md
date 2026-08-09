# T5 — ADR-1 go/no-go

**Verdict: GO, with a scope correction the brief did not anticipate.**

Re-mirroring upstream's graph is directionally right and almost never worse —
but it does **not** close the document-dimension gap, which the brief named as
its target. A second, independent mechanism dominates that gap, and the mission
needs a task for it.

## Method

`layout.ts` was patched behind a temporary exported flag (reverted; never
committed) to build upstream's graph instead of ours:

| | current | mirrored variant |
|---|---|---|
| rankdir | `'LR'` | omitted (graphviz default TB) |
| node dims to graphviz | `width`, `height` | **swapped** — `SmetanaForJson.java:236-244` |
| separations | `rankSep: 40, nodeSep: 20` | `omitSepAttrs: true` (upstream sets neither, so graphviz defaults 36/18 apply) |
| extent | direct | computed in the transposed frame, then x/y switched (`Mirror`) |

Metric: absolute document-dimension error against each fixture's jar golden
(`|Δwidth| + |Δheight|`), over all 92 fixtures. Dimensions were chosen because
`baseline.md` ranks them as the highest-reach remaining signature — wrong on
every fixture.

Record ports (`tailport="P<n>"`) were **not** included in this variant: they
change edge routing, not node placement, so they cannot move this metric. T7
still needs its own verification.

## Result

| | LR (current) | mirrored |
|---|---|---|
| total \|dim error\| | 10293.0 | **9368.0** |
| mean \|dim error\| | 111.88 | **101.83** |
| per-fixture | closer on 2 | **closer on 68** (22 tied) |

**GO** on the count: 68–2 with 22 ties is a consistent directional win, not
noise, and the aggregate improves ~9%.

## Why this is a weak GO, and what it means for Batch 3

A 9% improvement on a mean error of 112 leaves the dimensions still badly
wrong. The per-fixture samples say why — several are **identical under both
variants**:

```
slug                      jar        LR         mirrored
json/babico-87-soxo095    103,75     82,79      82,79      <- unchanged
json/bidire-98-kege137     46,40     76,44      76,44      <- unchanged
json/cazuru-97-jala040     32,40     76,31      76,31      <- unchanged
json/cilemo-38-fafi313   1356,292  1839,348   1791,342     <- moved
```

A fixture whose dimensions do not move when the entire graph topology changes
is not being limited by topology. It is being limited by the size of the boxes
handed to the layout.

Confirmed directly on `cazuru-97-jala040`, whose source is just `{}`: the jar
draws a **10×18** node rect for the empty object (total document 32×40); we
produce 76×31. No rank direction produces that difference — the node itself is
measured differently.

## Consequence — a task the brief is missing

Batch 3 as written (T6 Mirror + TB, T7 record ports, T8 JsonCurve) is
**necessary but not sufficient**. It re-mirrors the graph; it does nothing
about how a node's own box is measured.

The json family needs its own **leaf/node sizing** work, the analogue of what
**S1L** was for description (`measureNode`/`buildRows` in `layout.ts` vs
upstream's `TextBlockJson`). That is a whole task at minimum, plausibly its own
batch, and nothing in the current brief covers it.

Recommended sequencing, for the maintainer:

1. **Proceed with T6** (Mirror + TB + swapped dims). It is a real win, it is
   what upstream does, and it is a precondition for T7/T8's edge work being
   measurable at all.
2. **Insert a node-sizing task before or beside T7**, ported from
   `jsondiagram/TextBlockJson.java`. Expect it to dominate the dimension
   metric.
3. Keep T7/T8 as planned; their target is edge geometry, which this metric
   deliberately does not measure.

## Ruled out

- **Not a separation-constant artefact.** The variant also dropped our
  `rankSep: 40 / nodeSep: 20` for upstream's defaults (36/18); the residual
  gap survives that change.
- **Not measurer-dependent.** The census reports identical buckets under
  `DeterministicMeasurer` and `jarMeasurer`, so text metrics are not the cause.
- **Not a `@knowvah/dot-engine` defect.** Nothing here indicates the engine
  laid out the graph it was given incorrectly; the inputs differ. No
  `docs/graphviz-issues/` filing is warranted from this task.

## Reproducing

The patch is not committed. Re-apply by swapping the node dims and replacing
the `dotInput` literal in `layoutJson` as tabulated above, then compare
`viewBox` against each `test-results/dot-cache/<type>/<slug>/in.svg`.
