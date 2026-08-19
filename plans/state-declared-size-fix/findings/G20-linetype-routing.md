# G20 — composite ink under linetype polyline/ortho (kejabo-83, pavuzo-79)

Re-measured with `npx jiti scripts/measure-composite-declared-size.ts
kejabo-83-vinu490 pavuzo-79-zodu430`: both fixtures unchanged since SI28
(Batches 1–3 didn't touch this path) — kejabo scope 2 width +0.750px,
pavuzo scope 2 width −2.460px. Both re-diagnosed per T16's nextStep
(isolate the inner scope's DOT, route it through dot-engine AND real
graphviz `dot -Txdot` (v15.1.1, on PATH), diff). SI28's shared "dot-engine
arithmetic" hypothesis is WRONG for both — two different, more precise
mechanisms, neither one is dot-engine's arithmetic.

### kejabo-83-vinu490

- **bucketLabel:** skinparam-style (SI28) / linetype-routing (T16)
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 2.14434 | 2.133924 | +0.750 |
- **status:** resolved
- **mechanism:** Node-declaration-order divergence, NOT dot-engine spline
  arithmetic. Captured the inner-scope `DotInputGraph` via
  `setLayoutInputObserver` and printed it: our node order is `[Idle,
  Configuring, __init_NotShooting]` (pseudo-init LAST). The jar's own
  cached `svek-1.dot` declares `sh0006=circle([*]), sh0007=Idle,
  sh0008=Configuring` (pseudo-init FIRST). Proof this is an ORDER effect,
  not an arithmetic one: fed our own `toSvekDot()`-emitted DOT text
  (structurally EQUAL to jar's, verified by the state DOT-parity gate)
  through the SAME real `dot -Txdot` binary jar's oracle used. The
  forward edge (Idle→Configuring, `label=`) placed IDENTICALLY on both
  inputs — polygon `8.83,68 8.83,83 62.83,83 62.83,68` both times. The
  reverse edge (Configuring→Idle) placed at `63.58,68 … 117.58,83` on OUR
  declaration order vs `62.83,68 … 116.83,83` on jar's — a 0.75px x-shift,
  matching the reported Δ exactly, produced by real graphviz's own
  label-force-search reacting to node/edge declaration order, with every
  size/attribute byte-identical between the two inputs.
- **originFileLine:** src/diagrams/state/state-composite-autonom.ts:215-216
  (`buildPlainAutonomSpec`: `s.children.map(resolveMember...)` pushes
  Idle/Configuring onto `acc.nodes` BEFORE the following line calls
  `addLocalPseudoNodes(s.id, s.transitions, acc, ...)`, which pushes the
  `__init_NotShooting` circle onto the SAME `acc.nodes` array — the raw
  push order `runPass`/`layoutGraph` consume for the DOT layout input,
  independent of `state-composite-pseudo.ts:224`'s later
  `sortSpecsByCreationIndex([...pseudoSpecs, ...memberSpecs])`, which
  reorders `localSpecs` for GEOMETRY/materialization only, after
  `runPass` has already run on the unsorted `acc.nodes`)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/StateDiagram.java:92-107
  (`getStart`: `[*]`'s `Entity` is created via `reallyCreateLeaf` on FIRST
  REFERENCE — kejabo's `[*] --> Idle` is the composite's first transition
  line, so jar's real creation/registration order puts the init pseudo's
  node ahead of `Idle`/`Configuring`, which `svek/SvekResult.java#drawU`
  then draws in that same registration order, per
  `state-composite-pseudo.ts:63-116`'s own doc comment on
  `Bibliotekon`'s `LinkedHashMap` registration-order guarantee — the SAME
  order-fidelity mechanism family D4 already names, one level deeper
  (an inner autonom pass's own local push order, not D4's top-level
  cluster-sibling case)
- **causalChain:** Δpx = (2.14434 − 2.133924) × 72 = 0.750, entirely on
  the Configuring→Idle label box. Real graphviz's xdot output on our own
  emitted (structurally-EQUAL) DOT text reproduces this exact 0.75px
  offset when the ONLY difference from jar's input is node/edge
  declaration order — confirmed by running both through the identical
  `dot -Txdot` binary and diffing the `_ldraw_` label polygons directly.
- **ruledOut:** dot-engine's spline/xlabel arithmetic being non-bit-
  identical to real graphviz's (SI28's hypothesis) — REFUTED: real
  graphviz alone, given our declaration order, reproduces the delta with
  no dot-engine involved in this comparison. Not a leaf-sizing bug
  (scope-1 rows match exactly). Not the same mechanism as pavuzo-79 (see
  pavuzo's record — that one is a missing-attribute forwarding bug, this
  one is a pure ordering effect; confirmed by the different evidence
  paths, not assumed from topical proximity).
- **pairingRisk:** none — scope-2 values widely separated, idx2
  unambiguously pairs to "NotShooting" on both sides.
- **sharedCauseWith:** none by exact mechanism, but SAME FAMILY as D4
  (decisions.md) — the top-level `[*]`-position declaration-order
  divergence bemena-23-zebu249 exhibits; D4 already ruled this class
  "sorted pairing, not a src/ fix" for the mission's harness-level
  pairing problem. This T16 finding is the same family one scope deeper
  (an inner autonom pass's local push order), a narrower and
  in-principle-fixable instance (`addLocalPseudoNodes` could be called
  before `memberSpecs`, or the two spec lists merged via
  `sortSpecsByCreationIndex` BEFORE `runPass` consumes `acc.nodes`) but
  is NOT this mission's D6 diagnosis-only scope to apply.
- **proposedWriteSet:** `src/diagrams/state/state-composite-autonom.ts`
  (reorder the two push calls, or push through a creation-index-sorted
  list before `runPass`) + `src/diagrams/state/state-composite-pseudo.ts`
  (`addLocalPseudoNodes` currently pushes directly to `acc.nodes`
  independent of `sortSpecsByCreationIndex`). Same shape would need
  auditing in `state-composite-concurrent.ts` (calls `addLocalPseudoNodes`
  too, per the earlier grep) for the identical ordering bug.
- **sizeEstimate:** small (~2 files) but corpus-wide blast radius unknown
  — every composite fixture with a `[*]`-referencing autonom pass could
  shift by a similar small amount in either direction (graphviz's
  force-search is not monotonic in declaration order); would need a full
  corpus re-run to bound the blast radius, not a 1-fixture fix.
- **confidence:** high
- **nextStep:** N/A (resolved)

### pavuzo-79-zodu430

- **bucketLabel:** skinparam-style (SI28) / linetype-routing (T16)
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 2 | width | 2 | 1.954201 | 1.988368 | −2.460 |
- **status:** resolved
- **mechanism:** OURS-side attribute-forwarding bug, not dot-engine
  arithmetic. `skinparam linetype ortho` routes the transition label
  through `xlabel`/`xlabelWidth`/`xlabelHeight` on the `DotInputEdge`
  (`state-dot-graph.ts:215-223`'s `moveLabelToXlabel`), but
  `graph-layout-build-edges.ts#addEdges` — the ONLY seam that translates
  `DotInputEdge.attributes` into the real `@knowvah/dot-engine` builder
  call — reads `a?.label`/`a?.tailLabel`/`a?.headLabel` (lines 130, 152,
  157) and has NO `a?.xlabel` branch anywhere in the function. Confirmed
  by capturing the inner-scope `DotInputGraph` and calling
  `layoutGraph()` on it directly: the resulting edge for
  Idle→Configuring/Configuring→Idle carries NO `labelX`/`labelY` field at
  all (`undefined`), whereas the SAME probe on kejabo-83 (which uses
  `label=`, not `xlabel=`) DOES return `labelX`/`labelY` (35.83,132.5 and
  90.58,132.5). `@knowvah/dot-engine`'s xlabel-placement algorithm is
  never even INVOKED for this edge — there is nothing for its arithmetic
  to be imprecise about.
- **originFileLine:** src/core/graph-layout-build-edges.ts:129-176 (the
  whole label/tailLabel/headLabel attribute-forwarding block — no
  `a?.xlabel` case exists in it) feeding
  src/diagrams/state/state-transition-label.ts:383
  (`attachInlineTransitionLabel`'s `edgeResult?.labelX !== undefined`
  gate fails for this edge, so it falls through to the LEGACY
  `perpendicularOffsetLabel(points)` formula at :154-174 — a spline-
  midpoint + fixed-perpendicular-offset heuristic, unrelated to
  graphviz's real xlabel force-search — whose result then folds into the
  composite's declared size via
  src/diagrams/state/state-composite-pass.ts:250's
  `attachTransitionLabel` call and `layout-ink-extent.ts`'s `buildInkBox`
  (currently at :411, moved from SI28's :528 citation by Batches 1–3)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:433-437
  (confirms jar's OWN xlabel routing under `dotSplines==ORTHO` is a real,
  intentional fork — not itself the bug; the bug is that our port only
  half-ported the fork: `state-dot-graph.ts` correctly computes and
  labels the attribute as `xlabel` for the Svek-DOT TEXT EMITTER
  (`svek-dot-emit.ts:132-134`, used by the oracle DOT-parity gate, which
  is why the structural gate reports EQUAL and never caught this), but
  the SEPARATE real-layout builder path never learned about the new
  attribute name)
- **causalChain:** Δpx = (1.954201 − 1.988368) × 72 = −2.460, all on the
  scope-2 width. Jar's real graphviz places the `xlp` (external label
  position) for Idle→Configuring at `27,75.558` (graphviz y-up,
  `dot -Txdot` on jar's cached `svek-1.dot`) and Configuring→Idle's label
  box centred at `43.67,60.44` — both derived from graphviz's own
  `lib/label/xlabels.c` force-placement search over the whole graph.
  Ours instead computes each label's anchor from `perpendicularOffsetLabel`
  (spline midpoint ± a fixed offset along the edge normal), a materially
  different algorithm with no relation to the force-search jar's number
  comes from — the composite's ink box is under-measuring relative to
  jar's real xlabel-reserved space by 2.46px on this axis.
- **ruledOut:** dot-engine's own xlabel placement being slightly
  imprecise (SI28's hypothesis) — REFUTED: dot-engine's xlabel algorithm
  is never called for this edge at all (no `labelX`/`labelY` in the
  snapshot), so there is no dot-engine arithmetic to compare against
  real graphviz's. Not a leaf-sizing bug (scope-1 rows match exactly).
  Not the same mechanism as kejabo-83 (declaration-order effect there,
  confirmed via a completely different evidence path — real graphviz on
  two structurally-equal inputs — vs. here, a missing code path
  confirmed via the layout snapshot itself never receiving the label).
- **pairingRisk:** none — same well-separated scope-2 values as kejabo-83.
- **sharedCauseWith:** none — this IS the true, single mechanism (not a
  family/related-but-distinct pairing like SI28's kejabo/pavuzo split
  assumed); the "linetype family" grouping in SI28 was topical only.
- **proposedWriteSet:** `src/core/graph-layout-build-edges.ts` (add an
  `a?.xlabel !== undefined` branch mirroring the existing `label`
  branch — `edge.setHtmlAttr('xlabel', ...)` if `@knowvah/dot-engine`'s
  builder exposes an xlabel setter, or `attrs.xlabel = a.xlabel` if it's
  a plain string attr; needs checking `@knowvah/dot-engine`'s
  `GvGraphBuilder` edge API, which is outside this diagnosis task's
  write-set to inspect further) + `src/core/graph-layout.types.ts`'s own
  doc comment (currently silent on whether `xlabel` reaches the real
  layout call, unlike `tailLabel`/`headLabel`'s explicit note at :233-247
  saying they DO — that asymmetry is itself a clue this was an oversight,
  not a deliberate omission).
- **sizeEstimate:** small (~1-2 files) but every `linetype ortho`
  composite-state fixture with an inline transition label is affected —
  needs a `dot-sync-report.ts`-style corpus sweep to bound how many
  fixtures currently rely on (or are masked by) this missing forward.
- **confidence:** high
- **nextStep:** N/A (resolved)

## Cross-fixture note

T16's assignment framed these as "two mechanisms, not one" — confirmed,
but NOT the two mechanisms SI28 guessed at (dot-engine's spline-routing
vs. its own xlabel-placement arithmetic being imprecise in two different
ways). Neither fixture's cause is inside `@knowvah/dot-engine` at all:
kejabo-83 is a node-declaration-order effect in OUR code reacting inside
REAL graphviz's own label-search (same family as decisions.md#D4, one
scope deeper); pavuzo-79 is a straightforward missing-attribute-forward
bug in OUR code (`graph-layout-build-edges.ts` never reads `xlabel`).
Per this task's instruction: engine-side is reported with numbers above
but nothing is filed under `docs/graphviz-issues/` — correctly, since
neither cause is engine-side; both are OURS-side, `resolved` per SCHEMA
(mechanism + originFileLine + javaRef + non-empty ruledOut), with a
PROPOSED (not applied) fix in each `proposedWriteSet`, per D6.
