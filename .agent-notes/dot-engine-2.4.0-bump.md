# dot-engine 2.3.0 -> 2.4.0 bump (2026-10-14)

## Observation: 10 of 4903 fixtures move; one verdict changes
- **Context**: pinning `@knowvah/dot-engine` 2.4.0 (PR #85 via 2.3.1, PR #86 graphviz 16.1.0
  sync). Every cached fixture was rendered under each version with the survey's own
  `--render-many` worker pool (`runPersistentPool`, 60s per fixture). Both runs finished
  4903/4903 with no timeouts or errors. A rerun after clearing the jiti caches and running
  `npm ci` reproduced the 2.4.0 hashes exactly.
- **Finding**: the 10 that render differently are nugecu, xenusu, deroxu, revezi, jecici and
  5 `@startdot` rows (dot-engine's own SVG renderer picked up the 16.1 changes; all stay
  conformant). The only verdict mover is class/nugecu-04-tona107, structural-match ->
  conformant (render-diff 0/23 -> 0/0). xenusu went 7/29 -> 7/8.
- **Impact**: nugecu is pinned and its A3 acceptance retired. No re-baseline is needed
  elsewhere: the ratchets are shrink-only, and `npm test` passed under 2.4.0 before any pin.
- **Confidence**: High

## Observation: issue fixtures that did not move are blocked on our DOT input
- **Context**: the PR #85 fixes for 29/30/32/35 should have moved bamami, bobixe, pugodi,
  rufopi, zosuje, repoge and xagonu, but none of them changed a byte.
- **Finding**: on every one of those fixtures' cached `svek-1.dot`, dot-engine 2.4.0
  `renderSvg` equals native `dot -Tsvg` 16.1.0 (2.3.0 does not). Our pipeline's
  `layoutGraph` output for bamami is byte-identical under 2.3.0 and 2.4.0. Running our
  BUILDER graph (`applyGraphAttrs`/`addNodes`/`addClusters`/`addEdges`) through `-Tdot` shows
  why: the jar has `cluster6p0 > cluster6 (17x23 TABLE label) > cluster6p1`, we have one
  cluster with a plain-text label (bb 145x90.57 vs 177x113.07). `dotEqual` stays true because
  `compareStructural` compares cluster membership sizes, not nesting or label sizes. As a
  control, rubebe, zuduxu, pavuzo and xenusu match native exactly (bb plus every edge pos),
  so their residuals are post-layout.
- **Impact**: re-measuring the engine on a fixture needs our builder's layout compared with
  native on the jar DOT; `dotEqual` is not enough. Follow-ons are in
  planning/next-missions.md ("dot-engine 2.4.0 bump").
- **Confidence**: High for bamami-family and the four controls; Medium for deroxu (sizes differ,
  exact nodes not isolated)

## Observation: dump our builder graph as DOT
- **Context**: comparing our layout input to the jar's svek DOT.
- **Finding**: build the graph with the four `graph-layout-build*` functions (after
  `withSameContainerConstraints`), then `render(b.graph, 'dot')` returns graphviz `-Tdot`
  text with layout. `toSvekDot` is the parity emitter and does NOT reflect what the builder
  hands the engine. A script that imports src via jiti must live under the repo, or it cannot
  bare-import `@knowvah/dot-engine`.
- **Impact**: reusable for any "fix landed but the fixture didn't move" question.
- **Confidence**: High
