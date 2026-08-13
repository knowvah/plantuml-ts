# `routesplines` fails and DROPS the edge on record nodes with tail ports

**Impact:** 7 of the 92 `@startjson`/`@startyaml` corpus fixtures lose at
least one edge outright. An edge that "fails to route" is not degraded —
`getLayout()` returns no spline for it, so the diagram silently renders
with a missing connector.

**Finding (A5 ledger, 2026-08-09):** laying out a json-family graph emits

```
in routesplines, Pshortestpath failed
lost n13 n14 edge
```

on stderr, and the named edge is absent from the result. The graphs are
`shape=record` nodes carrying `<Pn>` field ports, with every edge setting
`tailport` — the shape `SmetanaForJson` builds and this port mirrors.

**It is dimension-dependent, which is the useful part.** The identical
92-fixture corpus laid out with this port's *deterministic* text measurer
produces **zero** occurrences; with the production (jar-metrics) measurer it
produces them on 7 fixtures. Same graph topology, same attributes, same
ports — only the node `width`/`height` differ, by fractions of a point. So
this is a geometry-sensitive failure in spline routing, not a malformed
input: some node dimensions leave `Pshortestpath` with no route it accepts.

## Affected fixtures

`test-results/dot-cache/…` in plantuml-ts, laid out with `jarMeasurer`:

| fixture | warning lines |
|---|---|
| `json/civofu-04-loku952` | 12 |
| `json/cilemo-38-fafi313` | 10 |
| `yaml/bafemu-96-luji978` | 4 |
| `json/gejena-99-veme626` | 2 |
| `json/gibego-39-pelu609` | 2 |
| `yaml/jozapu-14-datu953` | 2 |
| `yaml/mudeno-46-rado553` | 2 |

## Repro

`json/gejena-99-veme626` — 15 record nodes, 14 edges, every edge with a
`tailport`, no `rankdir` (transposed by the caller after layout). The graph
handed to `getLayout()` begins:

```
node n0  shape=record  width=40.9765632  height=193.735351594
  label {_dim_24.976563199999994_68.46582033_|{<P0>_dim_4.488281599999997_109.…}}
node n1  shape=record  width=61.4648448  height=23.2890625
  label <P0>_dim_4.488281599999997_15.2890625_|<P1>…
…
edge n0->n1  tailport=P1
edge n1->n4  tailport=P0
edge n4->n5  tailport=P3
…
```

Lost edge: `n13->n14`.

To reproduce inside plantuml-ts:

```sh
npx tsx <script calling renderFixtureJson(fixture, jarMeasurer)> \
  test-results/dot-cache/json/gejena-99-veme626/in.puml
```

and watch stderr. Swapping `jarMeasurer` for `DeterministicMeasurer` makes it
go away, which is the discriminating experiment — run both before concluding
anything about a candidate fix.

**Procedure note:** do not try to observe this from rendered SVG. A dropped
edge is invisible in a diff against the jar's output for this family, because
the jar's geometry differs from ours by design anyway (ADR-2b, one layout
engine). It was found on stderr during a census and only then attributed.

## Evidence trail

`plans/a5-json-family-conformance/ledger.md` — "Not observed, and worth
stating". The warning had been seen once during an earlier census and left
unattributed for a batch; the per-fixture isolation above is what turned it
into a filed finding.

## Verification on dot-engine 1.4.0 (2026-08-13) — REPRODUCED, still open

**Correcting an earlier attempt in this same file.** A first pass reported the
symptom as unreproducible on either 1.3.0 or 1.4.0 and speculated it might be
unobservable from this repo. That was wrong, and this file already said why:
the probe used the DETERMINISTIC measurer, which the Finding above states
produces **zero** occurrences. Wrong instrument, not a null result.

Re-run with `jarMeasurer` over the seven fixtures named in the table:

| version | warning lines | lost edges |
|---|---|---|
| 1.3.0 | 34 | 17 |
| 1.4.0 | 34 | 17 |

The **lost-edge sets are identical** between the two versions (`diff` over the
sorted `lost nX nY edge` lines is empty), and 34 is exactly the sum of this
issue's own per-fixture warning-line column — so the behaviour is unchanged
from the original filing. **Not fixed in 1.4.0.**

Reproducer, for whoever picks this up next:

```ts
import { renderSync } from 'src/index.js';
import { jarMeasurer } from 'src/core/measurer-jar.js';
renderSync(readFileSync('test-results/dot-cache/json/gejena-99-veme626/in.puml','utf8'),
           { measurer: jarMeasurer });   // stderr: "in routesplines, Pshortestpath failed" / "lost n3 n4 edge"
```

The measurer is load-bearing: swap in `WidthTableMeasurer` and the warnings
vanish, which is the dimension-sensitivity the Finding describes and the trap
that produced the wrong verification above.

**Attribution (maintainer, 2026-08-13): the Smetana-lineage port carries this
bug.** The failing routine is `routesplines`/`Pshortestpath` in the
graphviz-2.38-derived routing code, on the `shape=record` + `<Pn>` tailport
shape `SmetanaForJson` builds — so it is inherited from that lineage rather
than introduced by dot-engine, and it will not be resolved by a
regression-style fix. Note this does NOT fall under the project's "never chase
a Smetana-specific number" ruling: that ruling accepts geometry deltas, and a
dropped connector is a missing diagram element, not a delta.

