# Data flow — how an edge label becomes a reserved box

The target state, after all seven batches. Today the class engine skips the
cardinality cascade and the note sizer entirely, and computes its own box
instead of calling the shared module — that divergence is M1 and M2.

```plantuml
@startuml
title Edge label to DOT reservation (target state)

participant "class-layout-edge-labels" as CL
participant "style-cascade-class" as SC
participant "edge-label-box (core)" as EB
participant "note sizer" as NS
participant "StringMeasurer" as SM
participant "svek-dot-emit-labels" as EM
participant "dot-engine" as DE

CL -> SC : resolve arrow.cardinality (T1)
SC --> CL : cardinality font spec

group quantifier and role labels (M1, T5 + T6)
  CL -> EB : computeQuantifierBox at cardinality font
  EB -> SM : measure each newline-split line
  SM --> EB : per-line widths
  EB --> CL : truncated width x height, no shield
end

group note on link only (M2, T8 + T10)
  CL -> NS : dimension of the decorated note image
  NS --> CL : note width x height
  CL -> EB : computeMergedLabelBox with note position
  EB --> CL : merged box plus twice the label shield
end

CL -> EM : label, taillabel and headlabel attributes
EM -> DE : fixed-size table reservation per label
DE --> CL : laid-out geometry
@enduml
```

**Why the two groups differ.** The label arm adds `2 * labelShield` and
`2 * marginLabel`; the quantifier arm adds neither and takes the raw measured
dimension (`SvekEdge.java:440-445` against `:447-467`). That asymmetry is the
reason `computeQuantifierBox` exists as a separate function rather than a flag
on the existing one.

**Where the gate sits.** `svek-dot-emit-labels` writes the reservation, and
SI22's D7 comparator reads it back out of both our DOT and the oracle's. Before
D7 the comparator checked only that a label existed — which is how a 336-wide
box scored equal to a 72-wide one, and why the backlog exists at all.
