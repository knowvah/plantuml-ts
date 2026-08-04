# D3 — Diagnose package/container cluster geometry residuals

## Context

Same mission context as D1 (`plans/a2s-class-record-sizing/README.md`):
jar svek DOT is the size oracle, ratchet =
`npx tsx scripts/measure-class-size-deltas.ts`. You are a DIAGNOSIS task:
find the MECHANISM; do not edit `src/`.

NOTE the measurement unit here: the ratchet compares NODE width/height.
Container divergence can surface on nodes when cluster padding shifts
member geometry, or via cluster attributes the structural compare reads.
Establish WHICH before hypothesizing.

## Task

Diagnose the mechanism(s) behind (slug lists:
`plans/a2s-class-record-sizing/batch-1/clusters.md`):

- **0.085696 in = 6.1701 px — 6 fixtures** — package + hyperlink,
  package + shadowing, allow_mixing + database mixes.
- The **container-cluster bucket (81 fixtures)** — the classifier's label
  is a HYPOTHESIS; verify it by sampling ≥8 fixtures across delta values
  within the bucket and identifying what actually diverges.

For each mechanism: cause, our `file:line`, Java `file:line`, causal
chain, ruled-out list. Hand-derive expected values from the Java and match
a jar probe to <0.01px.

## Read-set

- `plans/a2s-class-record-sizing/README.md` (Key code map + probe recipe)
- `src/diagrams/class/class-namespace-shape.ts:190` (NAMESPACE_SIDE_PADDING=16)
- `src/diagrams/class/class-geo-builders.ts:166-170` (cluster footprint)
- `src/diagrams/class/class-dot-graph.ts:302-340` (cluster flattening, D5)
- Java: `svek/Cluster.java` and the group/package entity image classes —
  find what upstream adds around a package's members (title strip, margins)
  and how it reaches the svek DOT. Also `descdiagram`-side folder/package
  title margins if class routes there for `package` groups. Grep the WHOLE
  `net/` root.
- The description engine's already-diagnosed folder-title finding (title
  margin traces to `BodyEnhanced1.getMarginX()=6` —
  `plans/bodyenhanced-atom-seams/README.md` narrowing #1) — check whether
  the class package path has the analogous gap. If closing it REQUIRES
  BodyEnhanced1 itself, that is a STOP per ADR-1; report the measured size.
- 4-6 fixtures: `oracle/goldens/class/<slug>/input.puml` + `svek-*.dot`

## Probes

Same recipe + traps as README §Method constraints. Matrix: class inside
`package P { }` vs bare; empty package; `namespace` vs `package`;
allow_mixing with a database leaf — ONE varying element per probe.

## Boundaries

Same as D1: no `src`/test/oracle edits, no state-mutating git; fitted
constant = STOP; SI1 body-layer requirement = STOP (ADR-1).

## Output

Same schema and rules as `batch-1/overview.md` — one JSON block per
mechanism, closure predicted against the FULL backlog. ≤2k tokens, raw
data only.
