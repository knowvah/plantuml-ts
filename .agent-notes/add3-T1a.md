## Observation: ActivityEdgeGeo has no alignment field at all
- **Context**: T1a census of every `Snake.withLabel` site (add3 batch 1).
- **Finding**: `src/diagrams/activity/activity-geometry.types.ts:39-67`
  (`ActivityEdgeGeo`) carries `label?: string` and no field resembling
  `VerticalAlignment`/`HorizontalAlignment`. Every edge label we DO draw
  renders through the single generic fallback in
  `src/diagrams/activity/renderer.ts:277-284` (`midPt.x+4, midPt.y-4`,
  `mid = Math.floor(pts.length/2)`), never through
  `Snake.java:244-267`'s five branches (BOTTOM/CENTER/zigzag/RD/LD/default).
- **Impact**: T1b cannot fix individual branches without first adding an
  alignment field to `ActivityEdgeGeo` and threading it through every
  push site in table 1 of `label-census.md`.
- **Confidence**: High (read the type + the renderer function body).

## Observation: generic `-> label;` text is silently dropped, not just misaligned
- **Context**: Oracle mini-case `label-default` (`:Foo; -> hello; :Bar;`).
- **Finding**: `src/diagrams/activity/layout/tile-layout.ts:118-137`
  (`tileNodes`) and its `EARLY_LEAF_KINDS` set (`:405-412`) treat
  `'arrow-label'` nodes as always producing `null` and `continue`s past
  them — the text never reaches any edge's `.label`. Confirmed by
  render: jar SVG has `<text ...>hello</text>`; ours has none, and the
  jar's canvas is 19px taller (it reserves height for the label row,
  `FtileFactoryDelegatorAssembly#assembly:60-61` in the Java) while ours
  never does. This affects ~21 of the 34 `withLabel` sites in the
  census — every one fed by the generic "next arrow" mechanism
  (`CommandArrow3`/`LinkRendering`), as opposed to the ~12 fed by a
  dedicated AST field (`backward:`, `repeat`/`while` keyword args,
  `end fork {label}`) which DO carry text through today.
- **Impact**: This is a bigger gap than "wrong alignment" — for most
  call sites there is no text to align yet. T1b's scope should include
  wiring the generic arrow-label mechanism (dropped node → attach to the
  following edge, same shape as `ftile1.getOutLinkRendering()` in Java),
  not just the five `getTextBlockPosition` branches.
- **Confidence**: High (read the code path AND rendered both jar+ours to
  confirm the observable symptom matches the code-level mechanism).

## Observation: coloured-label pill is structurally wrong, not just mis-sized
- **Context**: Oracle mini-case `label-colored-pill` (`-><back:red> hello;`).
- **Finding**: The jar never draws a background rect for `<back:color>`
  text. `net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:
  732-735,772-786` (`getFilterBackColor`) builds an SVG `<filter>`
  (`feFlood` + `feComposite operator="over"`) and sets
  `filter="url(#...)"` directly on the `<text>` element — a vector-exact
  flood clipped to the glyph shapes. Our `renderEdgeLabel`
  (`src/diagrams/activity/renderer.ts:82-111`) instead draws a `<rect>`
  sized by a `label.length * fontSize * 0.6 + 8` heuristic. This is a
  mechanism mismatch (wrong SVG primitive), not a constant to retune.
- **Impact**: T1b (or a follow-on) needs to replace the rect-pill
  approach with an SVG filter def matching `getFilterBackColor`'s shape,
  if pixel/structural fidelity on coloured labels is in scope.
- **Confidence**: High (read the Java method body; confirmed via direct
  jar SVG output, which contains the `<filter>`/`feFlood`/`feComposite`
  elements verbatim).

## Observation: edge labels never widen the canvas extent
- **Context**: Task item 4 (canvas extent / `Snake.getMaxX`).
- **Finding**: `Snake.getMaxX` (`ftile/Snake.java:234-242`) loops every
  label `text` and does `result = max(result, position.x + dim.width)`.
  Our analogue, `extendForEdge`/`edgeInkX`
  (`src/diagrams/activity/layout/canvas-origin.ts:227-250`), accumulates
  `acc.maxX`/`acc.maxY` from `edge.points` and arrowhead tips ONLY — it
  never reads `edge.label`. Confirmed by reading the full function body.
- **Impact**: Once T1b wires edge-label text through, a long/far-right
  label can still clip at the canvas edge unless `extendForEdge` is also
  taught to account for it. Independent defect from the two above.
- **Confidence**: High (read the full function; no `label` token appears
  anywhere in it).

## Observation: three FtileIfWithLinks cross-swimlane shapes have no LoopTranslate kind
- **Context**: Table 2 (`drawTranslate` census).
- **Finding**: `ConnectionHorizontalThenVertical`/`ConnectionVerticalThen
  Horizontal`/`ConnectionVerticalThenHorizontalDirect`
  (`vcompact/cond/FtileIfWithLinks.java:90-367`, `drawTranslate` at
  `:149,238,328` respectively) each implement a genuine two-phase zigzag
  with a `MergeStrategy.LIMITED` small-snake elbow. No `LoopTranslate`/
  `EdgeShape` tag for any of the three exists in
  `swimlane-placement.ts`/`swimlane-loop-translate*.ts`, and
  `walk-if-with-links.ts` never tags its edges with one. Distinct from
  the already-known, self-documented `FtileRepeat$ConnectionBackBackward
  1/2` gap (`walk-repeat-backward.ts:14-21`, which explicitly says it's
  unported) — this one had no prior documentation anywhere I found.
- **Impact**: An if-with-links branch crossing a swimlane boundary
  renders through the generic `'default'` middle-Y shape instead of the
  real zigzag, for all three connector types. New finding for T1c.
- **Confidence**: High (grepped every `LoopTranslate`/`EdgeShape` variant
  name against the three Java class names — no match).

## Observation: FtileWhile's two Backward connectors are Java-side same-lane-only
- **Context**: Table 2, rows for `FtileWhile$ConnectionBackBackward1/2`.
- **Finding**: Both classes `extends AbstractConnection` WITHOUT
  `implements ConnectionTranslatable` (`vcompact/FtileWhile.java:313,367`).
  `ConnectionCross#drawU` (`ftile/ConnectionCross.java:47-63`) only calls
  `drawTranslate` when the wrapped connection `instanceof
  ConnectionTranslatable`, with no `else`/same-lane fallback — so
  upstream itself draws NOTHING for these two connectors when they cross
  a swimlane. This is a Java design choice, not a port gap.
- **Impact**: T1c should NOT try to port a `drawTranslate` for these two
  — there is nothing to port. Worth confirming our `walk-while-
  backward.ts` doesn't accidentally draw something upstream wouldn't
  (not verified here — flagged, not confirmed, for T1c).
- **Confidence**: Medium — the Java mechanism is confirmed by reading
  both files; whether our port over-draws in this exact scenario was
  not independently checked (would need a cross-lane while fixture).
