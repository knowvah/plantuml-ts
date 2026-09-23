# cdd-T2 — ordered links (SB2)

## Observation: mutating the shared `ast` object is the actual wiring
  mechanism, not a second return value
- **Context**: Wiring `getOrderedLinks` into `class-dot-graph.ts#buildDotGraph`
  so DOT emission (`buildDotEdges`, index-keyed `edge-${i}` ids) and the SVG
  draw-order consumer (`layout.ts#buildEdgeGeos`, which reads
  `effAst.relationships` and looks its `i` back up via the same `edge-${i}`
  id) stay in lock step.
- **Finding**: `layout.ts`'s `effAst` and `buildDotGraph`'s `ast` parameter
  are the SAME object reference (passed straight through, no clone).
  `layout.ts` calls `buildEdgeGeos(effAst, ...)` AFTER `buildDotGraph(effAst,
  ...)` returns. Reassigning `ast.relationships = getOrderedLinks(...)` as
  the first statement inside `buildDotGraph` therefore propagates to
  `layout.ts`'s later `buildEdgeGeos` call for free — no edit to `layout.ts`
  needed, and the write-set stayed inside `class-dot-graph.ts` as specified.
  This is the exact same pattern `applySameClassWidthFloor` already uses one
  line below (mutates the shared `measuredMap` so `layout.ts`'s later
  `buildClassifierGeos` sees the update) — i.e. this file already has this
  idiom, not a new one introduced here.
- **Impact**: Any future consumer added between `buildDotGraph`'s return and
  `layout.ts`'s use of `effAst.relationships`/`buildEdgeGeos` must be aware
  `ast.relationships` is POST-reorder from that point on, not declaration
  order. Dense uid re-numbering (`renderer-uid.ts#buildClassUidPlan`) is
  unaffected by this because it sorts by each relationship's `creationIndex`
  field (stamped at parse time on the object itself), never by array
  position — confirmed by reading `assignExact`'s sort key before wiring.
- **Confidence**: High (read both call sites, verified via passing test +
  `dot-sync-report` fraction unchanged at 710/711).

## Observation: golden-SVG `<!--(reverse )?link A to B-->` comments give a
  cheap document-order oracle, but need leaf-name normalization
- **Context**: Verifying the 7 SB2 fixtures' DOT/draw order against the jar
  without hand-decoding `ent%04d` ids.
- **Finding**: Both the jar's golden SVG and this port's own rendered SVG
  emit an HTML comment `<!--link X to Y-->` / `<!--reverse link X to Y-->`
  immediately before each `<g class="link">`, in document order. Comparing
  the SORTED-pair sequence of these comments between `.jar.svg`/`.ours.svg`
  gives an exact, fixture-agnostic order-replay check. One gotcha: for
  namespaced fixtures (`cobumi-83-bapu892`, `delasa-80-jusu462`) this port's
  comment uses the fully-qualified dotted id (`entities.mindmap.MindMapNode`)
  while the jar's uses the bare leaf name (`MindMapNode`) — an unrelated,
  pre-existing comment-text divergence, not an order bug. Take the last
  `.`-segment of each side before comparing, or the check reports false
  diffs at every namespaced edge.
- **Impact**: Useful, reusable technique for any future class-order/draw
  mission; the leaf-name caveat is namespace-comment-text drift, not an
  order defect — filed here so it isn't re-diagnosed as one.
- **Confidence**: High (measured directly against all 7 SB2 fixtures' cached
  golden + freshly-rendered SVGs; 7/7 exact after normalization).

## Observation: `pin-diff` only reports a "diff count rose" line, never a
  fall, so an in-scope fixture's improving count is silent by design
- **Context**: `cobumi-83-bapu892` and `gujigi-63-roki030` both had their
  raw structural+numeric diff counts CHANGE after this fix but only cobumi
  printed in `pin-diff`'s output (count rose 1003->1040); gujigi's count
  FELL (42/595 -> 30/576) and printed nothing, per `pin-diff.mts`'s own doc
  comment ("diff-count deltas where `b > a`" only).
- **Impact**: Absence of a `pin-diff` line for a named SB2 slug does not
  mean "no measured effect" — always cross-check with `render-diff.mts`'s
  own structural/numeric pair for slugs you expect to move, per mission
  brief item 5.
- **Confidence**: High (measured both tools' output side by side for all 7).
