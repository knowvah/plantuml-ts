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


## Verification attempt on dot-engine 1.4.0 (2026-08-13) — inconclusive

Not verified, and the blocker is an instrument gap rather than a result.

**There is no gate for this corpus.** `@startjson`/`@startyaml`/`@starthcl` are
the Smetana-path types: per `CLAUDE.md` they emit no `svek-N.dot`, so they have
no DOT-parity gate by design, and the `test-results/dot-cache/json/*` fixtures
carry only `in.puml` + `in.svg`. `dot-sync-report.ts json --type-tag JSON` does
run (49 analysed, 1 EQUAL) but it compares DOT *input*, while this issue's
symptom is a spline missing from layout *output* — the wrong instrument.

**The symptom did not reproduce on either version.** Rendering all 50 cached
json fixtures through `renderSync`: 50/50 succeeded, 0 threw, and zero
`routesplines`/`Pshortestpath`/`lost n… n… edge` warnings reached stderr, on
1.4.0 AND on 1.3.0. So there is no before-state to observe going green.

**What would settle it:** a reproducer that emits the warning on a known-bad
version, or a count of edges-with-splines against edges-declared for the 7
named fixtures. Until one exists, this box cannot honestly be checked from the
plantuml-ts side — the fix may well be correct and simply unobservable here.
