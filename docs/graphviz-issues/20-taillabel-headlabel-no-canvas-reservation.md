# A `taillabel`/`headlabel` HTML table does not widen the canvas or shift node centring

**Impact:** every class-diagram association edge that carries BOTH a
qualifier/role label on the tail AND on the head (`A "role1" --> "role2" B`,
`svek/SvekEdge.java:302-351`'s quantifier-box path) draws with every node and
every edge control point shifted a few px from the jar, plus a canvas a few
px narrower than the jar's own — even though the two engines agree on every
node's own width/height and on both label boxes' declared `WIDTH`/`HEIGHT`.
Concretely `class/focaci-80-suzu938` (`Transaction "1 initiating" -->
"~* initiators" ActorRole`), filed by plantuml-ts mission
`class-divergence-drive` task cdd-B7FU-R3 (item 4 of batch 7's residual
round).

**Finding.** Fed the byte-identical, cached oracle DOT (`test-results/
dot-cache/class/focaci-80-suzu938/svek-1.dot`, two `shape=rect` nodes, one
edge carrying `taillabel=<<TABLE … WIDTH="55" HEIGHT="13">…</TABLE>>` and
`headlabel=<<TABLE … WIDTH="53" HEIGHT="13">…</TABLE>>`), real graphviz
16.1.0 and `@knowvah/dot-engine` 1.6.0 disagree on where the two nodes are
centred, by exactly the same amount the label attributes add when present:

| | node centre (real graphviz, `dot -Tplain`) | node1 x-offset from node0's left edge (dot-engine, `layoutGraph`) |
|---|---|---|
| WITH `taillabel`/`headlabel` | x=0.76389in = 55.00008px | 5.8187500000000085px |
| WITHOUT `taillabel`/`headlabel` | x=0.73021in = 52.57512px | 5.8187500000000085px (unchanged) |
| Δ | **2.42496px** | **0px** |

Both node widths (`sh0006` 1.460417in, `sh0007` 1.298785in — 105.15px /
93.5125px) and both label boxes' declared sizes are identical inputs on
both sides; the WITHOUT-labels real-graphviz run is the SAME node pair with
only the `taillabel`/`headlabel` attributes deleted from the same `.dot`
text, and its node centre (52.57512px) matches dot-engine's node offset
(half the width delta between the two nodes, `(105.15-93.5125)/2 =
5.81875`, i.e. dot-engine centres the narrower node under the wider one
with ZERO extra reservation) **exactly** — confirming dot-engine's
behaviour is self-consistent and correct for the no-label case, and that
real graphviz's own no-label behaviour is IDENTICAL to dot-engine's. The
divergence appears ONLY when `taillabel`/`headlabel` are present: real
graphviz reserves ~2.425px of additional canvas (asymmetrically — the
node's right edge stays flush with the canvas edge in both cases, only the
LEFT side grows) that dot-engine's layout never reserves, regardless of
whether the label attributes are present at all — a controlled deletion of
just those two attributes from `@knowvah/dot-engine`'s own
`DotInputEdge.attributes` (`tailLabelWidth`/`tailLabelHeight`/`tailLabel`/
`headLabelWidth`/`headLabelHeight`/`headLabel`) produces byte-identical
`layoutGraph()` output to leaving them in.

**Controlled experiment (isolates the variable).**

```
$ dot -Tplain test-results/dot-cache/class/focaci-80-suzu938/svek-1.dot
graph 1 1.4941 2.1667
node sh0006 0.76389 1.8333 1.4604 0.66667 "" solid rect #000006 #000006
node sh0007 0.76389 0.33333 1.2988 0.66667 "" solid rect #000007 #000007
edge sh0006 sh0007 4 0.76389 1.4964 0.76389 1.2509 0.76389 0.91483 0.76389 0.66955 solid #000008
stop

$ dot -Tplain <same graph, taillabel/headlabel attributes on the edge deleted>
graph 1 1.4604 2.1667
node sh0006 0.73021 1.8333 1.4604 0.66667 "" solid rect #000006 #000006
node sh0007 0.73021 0.33333 1.2988 0.66667 "" solid rect #000007 #000007
edge sh0006 sh0007 4 0.73021 1.4964 0.73021 1.2509 0.73021 0.91483 0.73021 0.66955 solid #000008
stop
```

`@knowvah/dot-engine`, fed the equivalent graph via its own
`createGraph`/`addNode`/`addEdge` API (the exact path `plantuml-ts`'s
`core/graph-layout-build-edges.ts` uses to forward `tailLabelWidth`/
`headLabelWidth` as fixed-size HTML tables), gives the SAME node offset
(`5.8187500000000085px`, i.e. the plain node-width-delta centring) whether
or not the `tailLabel*`/`headLabel*` attributes are present on the edge —
proof the label tables never enter its canvas/centring computation for a
`rankdir=TB` two-node one-edge graph, unlike real graphviz's.

**What is NOT the cause (falsified — don't chase):**

- **Our own DOT/graph input.** `plantuml-ts`'s emitted `DotInputGraph` for
  this fixture matches the cached oracle `svek-1.dot` on every node width/
  height and both label box dimensions (`105.15`/`93.5125`/`48` and
  `55`/`13`, `53`/`13` respectively) — this is the SAME byte-equal-input
  check `docs/graphviz-issues/19-…` and `17-…` establish before filing.
- **Node width/height rounding.** Both engines report the identical node
  dimensions in both the with- and without-labels runs; only the CENTRING
  differs, and only when labels are present.
- **A version-specific dot-engine regression.** Not checked against an
  older release (no prior version pinned before this mission observed the
  fixture), but the behaviour is deterministic and reproduces on the
  currently pinned 1.6.0 via both the raw DOT text and the programmatic API.

**Workaround in plantuml-ts:** none applied. `focaci-80-suzu938` stays
`structural-match` (0 structural / ~92 numeric diffs, all attributable to
this one ~2.4px canvas/centring delta cascading through every downstream
coordinate) — any compensation here would be fitting a reservation formula
the engine itself should apply.
