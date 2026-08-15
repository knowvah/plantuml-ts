## Observation: tail/head label boxes never reached the layout engine
- **Context**: T12, porting `SvekEdge#manageCollision` for port-label placement.
- **Finding**: `tailLabelWidth`/`tailLabelHeight`/`headLabel*` were computed and
  documented as **emitter-only** (`graph-layout.types.ts:195-198`) — they reached
  the Svek-DOT text emitter for the parity gate but never the layout engine,
  which got the raw TEXT and reserved a box of its own measurement. Jar hands
  graphviz a FIXEDSIZE TABLE truncated with `(int)` (`SvekEdge.java:504-506`).
  `getXY`'s `getMinXY` reads that box, so the gap lands straight on placement.
  This is the SAME gap batch 1 found for the main `label`; batch 2 fixed the
  centre label and left the two ends.
- **Impact**: worth checking for any other attribute pair that exists in
  `svek-dot-emit.ts` but not in `graph-layout-build-edges.ts` — the DOT gate
  cannot see the difference, because it compares the emitted text, not what the
  engine was handed. (2026-08-15, D7: the gate now asserts the emitted label
  BOX SIZE via `svek-dot.ts#labelSizeOk`, so at least the emitter's side of
  the pair is measured; the emit-vs-engine split itself is still invisible.)
- **Confidence**: High — closing it moved 55 class/object fixtures, 0 regressions.

## Observation: a "uniform" measured offset can be two rules averaged
- **Context**: Issue 12 originally measured a uniform +10.611 port-label offset.
- **Finding**: that was the midpoint of a +18.244/+3.022 pair, and neither is a
  constant — both are outputs of a 5-iteration bisection over node geometry.
  A single formula fitted to sampled offsets lands on the average of whatever
  real rules produced them.
- **Impact**: when per-element deltas cluster into groups with opposite signs,
  suspect a geometry-dependent solver before fitting an offset.
- **Confidence**: High — `manageCollision` reproduces 12 of 14 edges byte-exact.

## Observation: builder and DOT emitter disagree on numeric precision
- **Context**: chasing the last 2 diffs on `tobuka-93-jale775` after T12.
- **Finding**: `svek-dot-emit.ts#inches` writes node dims as
  `(px/72).toFixed(6)` (jar's own 6dp), so jar's graphviz reads
  `width=5.555556` = **400.000032px**. `graph-layout-build.ts#addNodes` passes
  `(n.width/72).toString()` — full float — giving the engine **400.0px**. The
  two paths lay out numerically different graphs from one `DotInputGraph`.
  Isolated by injecting full-precision width into the ORACLE DOT text, which
  reproduces the builder path's output exactly.
- **Impact**: this is the THIRD builder/emitter divergence found in one
  session (the others: tail/head label boxes never reaching the engine, and
  this). The DOT parity gate compares emitted TEXT and is structural with a
  0.01-inch tolerance, so it can see none of them. Any future "our geometry
  differs but dotEqual is true" should suspect this seam first.
- **Confidence**: High — controlled experiment, engine exonerated against
  real graphviz 15.1.1 on both its entry points.

## Observation: the engine is NOT the default suspect
- **Context**: two hypotheses in a row blamed `@knowvah/dot-engine`.
- **Finding**: on the fixture's own `svek-1.dot` the engine is byte-identical
  to real graphviz via `renderSvg` AND via `parse` -> `render` -> `getLayout`.
  Both prior hypotheses (issue-01-style getLayout drift; a sub-pixel N25/N62
  residual) were wrong.
- **Impact**: run the canonical check BEFORE writing a graphviz-issue file.
  Two of three graphviz-issue-shaped hypotheses this session were ours.
- **Confidence**: High.

## Observation: cancelling errors make a fixture look conformant
- **Context**: `state/buniva-95-zije634` "regressed" 36 -> 53 when node-dim
  precision was aligned with jar's 6dp.
- **Finding**: it had been landing on jar's node position because two
  independent errors cancelled — a transition label box 2px short in both
  dims (19x13 vs jar's 21x15, pulling the node left) and a full-precision
  node width that inflated the engine's separation by one point (pushing it
  right). On jar's OWN svek-1.dot, 6dp width reproduces jar's position
  exactly and full precision does not.
- **Impact**: a fixture at a low diff count is not evidence that the inputs
  feeding it are right. When a correctness fix RAISES a count, check whether
  it un-masked a compensator before treating it as a regression — twice this
  mission (batch 2's `xamule`, and this).
- **Confidence**: High — controlled substitution on the oracle DOT isolates
  both terms independently.
