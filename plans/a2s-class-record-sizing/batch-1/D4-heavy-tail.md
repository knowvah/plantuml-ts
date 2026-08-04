# D4 — Diagnose the heterogeneous 0.055371 cluster, interface-shield bucket, and heavy tail

## Context

Same mission context as D1 (`plans/a2s-class-record-sizing/README.md`):
jar svek DOT is the size oracle, ratchet =
`npx tsx scripts/measure-class-size-deltas.ts`. You are a DIAGNOSIS task:
find the MECHANISM; do not edit `src/`.

## Task

Diagnose the mechanism(s) behind (slug lists:
`plans/a2s-class-record-sizing/batch-1/clusters.md`):

- **0.055371 in = 3.9867 px — 20 fixtures** — forensics found NO shared
  feature (simple links, namespaces, usecase/actor mixed into class
  diagrams). A near-4px offset with heights exact. NOTE: class diagrams
  route usecase/actor leaves through the faithful EntityImageDescription
  path (`src/diagrams/class/class-layout-leaf-shapes.ts:25-52`) — check
  whether the mixed-type fixtures diverge on the LEAF node or the class
  node before assuming a classifier mechanism.
- The **interface-shield bucket (31 fixtures)** — label is a HYPOTHESIS.
  `interface` entities carry the circled character; check badge geometry
  (2r with r = FontSize(CIRCLED_CHARACTER)/3+6, margins withMargin(4,0,5,5))
  and the lollipop/shield rendering variants.
- **0.499348 in = 35.95 px — 7 fixtures** — all complex multi-feature
  diagrams (members + stereotypes + packages + notes + skinparam). Expect
  a SUM of mechanisms; decompose it: after attributing known mechanisms
  from your own and (if visible in the shared scratchpad) other D-tasks'
  findings, name what remains.

For each mechanism: cause, our `file:line`, Java `file:line`, causal
chain, ruled-out list. Hand-derive expected values from the Java and match
a jar probe to <0.01px.

## Read-set

- `plans/a2s-class-record-sizing/README.md` (Key code map + probe recipe)
- `src/diagrams/class/class-layout-leaf-shapes.ts` (mixed-type leaves)
- `src/diagrams/class/class-layout-helpers.ts:238-390` (dispatch)
- `src/diagrams/class/class-badge.ts` (badge box; BADGE_RADIUS=11,
  BADGE_LEFT_MARGIN=4, BADGE_TOP_BOTTOM_MARGIN=5)
- `src/diagrams/class/class-member-rows.ts` (rows; TextBlockLineBefore
  margin (6,4) upstream at MethodsOrFieldsArea:83-85; icon zone
  radius+3 at :156-157)
- Java: `svek/image/EntityImageClass.java`, `EntityImageClassHeader.java`,
  `svek/HeaderLayout.java`, `cucadiagram/MethodsOrFieldsArea.java`,
  `klimt/shape/CircledCharacter.java:85-86`. Grep the WHOLE `net/` root.
- 4-6 fixtures per group: `oracle/goldens/class/<slug>/input.puml` + `svek-*.dot`

## Probes

Same recipe + traps as README §Method constraints. Matrix: `interface I`
bare vs with members; `class C` + one field with/without visibility icon;
a class-diagram fixture containing one usecase leaf — ONE varying element
per probe.

## Boundaries

Same as D1: no `src`/test/oracle edits, no state-mutating git; fitted
constant = STOP; SI1 body-layer requirement = STOP (ADR-1).

## Output

Same schema and rules as `batch-1/overview.md` — one JSON block per
mechanism, closure predicted against the FULL backlog. For 0.499348, an
explicit decomposition table (component mechanism → px) replaces
`upstreamExpression` if it is a composite. ≤2k tokens, raw data only.
