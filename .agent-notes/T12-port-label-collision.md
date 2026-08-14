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
  engine was handed.
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
