### zacajo-09-tamu628

- **bucketLabel:** concurrent-region
- **rows:**
  | scope | axis | idx | ours (in) | jar (in) | Δpx |
  |---|---|---|---|---|---|
  | 4 | width | 1 | 4.112429 | 4.164271 | -3.733 |
  | 4 | height | 1 | 7.388888 | 7.388889 | -0.000 |
- **status:** unresolved (mechanism identified and evidenced; fix proposed, not applied — D6)
- **mechanism:** NOT a dot-engine geometry finding — ruled out directly (see
  evidence below). It is an ours-side accumulator-wiring bug:
  `buildConcurrentBranchAcc` (`state-composite-concurrent.ts:235`) calls
  `newAccumulator()` with NO arguments, so the region's `PassAccumulator`
  carries `labelFont: undefined, measurer: undefined`. `attachTransitionLabel`
  → `attachInlineTransitionLabel` (`state-transition-label.ts:362-395`) gates
  its graphviz-position branch on `measured !== undefined`
  (`measureLabel(...)` requires the missing measurer), so for EVERY
  concurrent-region-local labeled transition it silently falls through to
  `perpendicularOffsetLabel(points)` (`:388`) — discarding the real,
  graphviz-returned `edgeResult.labelX/Y` — and `boxFields` becomes `{}`
  (`:393`, `measured === undefined`), so `transition.label.inkBox` is never
  set. `addTransitionInk` (`layout-ink-extent.ts:392-399`) then folds only the
  fallback anchor POINT, not the label's real BOX, into the region's ink
  extent. `regionInkGeometry`'s `Math.max(ink.width, p.result.width)`
  (`state-composite-concurrent.ts:139`) therefore silently prefers the raw
  dot-canvas value (which DOES correctly read the true `labelX`/`labelWidth`
  off the layout snapshot, via `canvasSize()`, `graph-layout.ts:366-383`)
  over the artificially-shrunk ink value — masking the gap for THIS fixture
  (canvas wins the max) but at the wrong number: canvas bakes in a flat
  `CANVAS_MARGIN=12` while jar's real formula (`SvekResult.calculateDimension`,
  ported faithfully elsewhere as `svekDimension`/`INK_DELTA=15`,
  `core/svek/SvekResult.ts:57-63`) is ink-bbox + 15, with no raw-canvas floor
  at all.
- **originFileLine:** src/diagrams/state/state-composite-concurrent.ts:235
  (`const acc = newAccumulator();` — the one call site of `newAccumulator`
  across `src/diagrams/state/` that omits `resolveArrowLabelFont(ctx.theme),
  ctx.measurer`; the two sibling call sites,
  `state-composite-autonom.ts:195` and `state-composite-pass.ts:281`, both
  pass them)
- **javaRef:** ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java:130-135
  (`calculateDimension`: `minMax = TextBlockUtils.getMinMax(this, stringBounder,
  false); ... return minMax.getDimension().delta(15, 15);` — a real ink walk
  over EVERY drawn element, including each region's own labeled transitions,
  no raw-canvas floor); ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ConcurrentStates.java:137-144
  (`calculateDimensionSlow`, confirms per-region `inner.calculateDimension()`
  is what gets maxed/summed — the SAME method, so jar's label ink is folded
  into EVERY region before the composite ever sees a number)
- **causalChain:** Direct instrumentation (`layoutGraph()` re-run on the
  captured `DotInputGraph` for scope 2, the `ScrollLock` region — matches
  `svek-2.dot` byte-for-byte per SI28): `result.width = 276.0948632863643`px,
  traced to `canvasSize()`'s `labelX + labelWidth/2 + CANVAS_MARGIN` term on
  the REVERSE edge (`ScrollLockOn→ScrollLockOff`) — `203.09486328636427 +
  61 + 12 = 276.09486…`, exact. Running the SAME `svek-2.dot` through REAL
  local `dot` (graphviz 15.1.1, `dot -Tplain`) gives that edge's label center
  at printed plain-text value `"<TABLE>" 2.8208 1.0486` → `2.8208in × 72 =
  203.0976`px — within `0.003`px of dot-engine's own `203.09486328636427`px
  (float/rounding noise, not a structural difference). **This is the disproof of the dot-engine-geometry hypothesis
  the task asked to test**: dot-engine's own label placement for this exact
  two-node/two-parallel-labeled-edge topology already matches real graphviz
  to a small fraction of a pixel. The 3.733px gap is NOT in graphviz-vs-
  dot-engine layout; it is entirely downstream, in which of the TWO numbers
  (canvas-with-embedded-`+12`, vs ink-bbox-with-`+15`-but-currently-using-the-
  wrong-anchor-point) our `Math.max` picks. Fixing the accumulator wiring
  would let `attachTransitionLabel` read the real `edgeResult.labelX=203.095`
  and fold the REAL box (`labelWidth=122` → `2*marginLabel`-adjusted) into
  `ink.width`, which the arithmetic above (`≈264 + 15 ≈ 279`) shows would then
  exceed and REPLACE the canvas value in the `Math.max`, moving toward jar's
  `279.828`px implied region contribution (`4.164271×72 − 20 = 279.828`) — the
  right order of magnitude and the right direction, though the exact
  post-fix residual is NOT verified (fix proposed, never applied, per D6).
- **ruledOut:** dot-engine raw layout divergence — DISPROVEN this task by
  direct `dot -Tplain` comparison on the byte-identical `svek-2.dot` (label
  center within ~0.1px of dot-engine's own number; SI28's own byte-identical-
  DOT-emission finding still holds and is now explained rather than left as a
  dead end). Edge-label-box WIDTH/HEIGHT attribute mismatch — SI28 already
  disproved (byte-identical `WIDTH="122"`). `clusterPosMap` gap — SI28 already
  disproved (this fixture has zero nested composites). `stackConcurrentRegions`
  formula itself — SI28 already confirmed it reproduces our own numbers
  exactly (not implicated; the input it receives is what's wrong). A graphviz-
  VERSION-drift hypothesis (SI28's own `nextStep`) — NOT confirmed and no
  longer the leading candidate: the accumulator-wiring bug fully explains the
  direction and rough magnitude without invoking any version difference.
- **pairingRisk:** none (scope 4 has 2 nodes, `Active` vs. the 20px
  `__initial__` pseudo-state — unambiguous)
- **sharedCauseWith:** none confirmed this task (write-set restricted to this
  one fixture/record). Plausible-but-UNVERIFIED candidate for the fix batch to
  check: `jetuse-93-gopi146` (batch-3 journal: "5.000 px width... remains,
  push-forward, journaled, not chased" — same `concurrent-region` bucket,
  unresolved, same shape of composite). Not asserted as shared; needs its own
  re-measurement.
- **proposedWriteSet:** `src/diagrams/state/state-composite-concurrent.ts`
  (one line: `const acc = newAccumulator(resolveArrowLabelFont(ctx.theme),
  ctx.measurer);` at `:235`, mirroring `state-composite-autonom.ts:195` /
  `state-composite-pass.ts:281`, plus one new import,
  `import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';` —
  ≤5 lines total). NOT applied (D6, diagnosis-only).
- **sizeEstimate:** one file, one call-site edit + one import; blast radius is
  every concurrent-region fixture with an inline-labeled (guard/action/plain)
  transition INSIDE a `--`-delimited region — likely more than zacajo-09
  alone (this also fixes the region-local label DRAW position, which
  currently uses the legacy perpendicular-offset anchor instead of graphviz's
  real placement for every such transition — a rendering-visible change, not
  just a size one). Verification cost: full `harness-diff.py` +
  `state-dot-parity` re-run is required before landing, since the blast
  radius is not scoped to one fixture.
- **confidence:** high (mechanism read directly from source at both ends —
  the omitted call-site argument and the exact gate it fails — and confirmed
  numerically against a live re-run of both `@knowvah/dot-engine` and real
  local graphviz 15.1.1 on the byte-identical DOT)
- **nextStep:** (fix batch, not this task) apply the proposed one-line fix,
  re-run `npx jiti scripts/measure-composite-declared-size.ts
  zacajo-09-tamu628` and the full `harness-diff.py`/`state-dot-parity` gates;
  if any OTHER concurrent-region fixture's row grows, that is expected (label
  anchor position changes for every region-local labeled transition) and
  should be accounted for exactly as batch-2's `<sup>` residual was
  (jar-verified account, not blind revert). Separately confirm/measure
  `jetuse-93-gopi146` under the same hypothesis.
