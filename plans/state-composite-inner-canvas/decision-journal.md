# Decision journal — state-composite-inner-canvas

Appended during execution. Every non-trivial judgement call gets a row:
"non-trivial" means a reasonable developer might have chosen differently.

Also record here, because later tasks are measured against them:

- **T1's baseline** — the `exact`/`mismatched`/`unmatched` counts, and the
  reproduced 0.527 on the three named fixtures. If 0.527 does NOT
  reproduce, that is a stop, and the row says so.
- **T3's numbers alone** — the one sanctioned dip (batch-2/overview.md).
  They may be worse than baseline; record them, do not chase them.
- **T4's numbers** — the dip must be gone by here.
- **T5's frame finding** — what `clusterManager.moveDelta` actually moves,
  and whether this port already shifted inner content anywhere. This is the
  task's central question; the answer belongs here even if it is "nothing".
- **Every composite still mismatched at T6**, with its named mechanism and
  `file:line`.

| Date | Task | Decision | Why | Alternative rejected |
|---|---|---|---|---|
| 2026-08-15 | T1 | Report `lastDigit` mismatches (one unit in the 6th decimal) as their own bucket rather than as mismatches or as exact | The three named fixtures' HEIGHTS differ by 7e-5 px (3.555555 vs jar's 3.555556) — the last digit of the shared `toFixed(6)` emission, not a size defect. Counting them as mismatches would swamp the corpus signal; counting them exact would hide that our arithmetic lands a hair under jar's | Widening `EXACT_EPSILON` to absorb them, which would have silently reduced the gate's sensitivity — the exact defect the brief's own T1 spec warns about |
| 2026-08-15 | T1 | Pair nodes per AXIS, not by the pooled sort `svek-dot.ts#sizeDeltas` uses | Pooling widths and heights into one sorted array yields a scalar but cannot attribute a delta to a node or an axis, and attribution is the harness's entire purpose | Reusing `sizeDeltas` unchanged |
| 2026-08-15 | T1 | Baseline **2454 exact / 160 mismatched / 28 lastDigit / 4 unmatched / 91 dirty** over 271 fixtures, 2642 declarations. 0.527 reproduced on all three named fixtures (deltaPx 0.52668) | Acceptance criterion 1 met; the harness sees the right thing | — |
| 2026-08-15 | T2 | **STOP — decision D1 is contradicted by measurement. The mission's premise is FALSE.** | See the diagnosis below | Silently re-scoping the mission to the real mechanism, which would have buried a wrong premise instead of retiring it |

---

## STOP diagnosis (T2, 2026-08-15) — the brief targeted the wrong code

Per `~/.claude/rules/diagnosis.md`, the full artifact.

### Mechanism

A state composite's declared node size is **already** a faithful port of
`SvekResult#calculateDimension`, and the brief's claim that it comes from a
child-rect bounding box plus an uncited `BOX_PAD` is false for this path.
The 0.527 enters one level deeper: the composite's inner INK extent is set
by a transition LABEL's reserved box, and that label's placed `x` is 0.527
right of jar's. Because graphviz centres the composite node, a node 0.527
wider pushes everything to its right by half — which is exactly the 0.261
the evidence note recorded.

### Origin

- `src/diagrams/state/layout-ink-extent.ts:391` — `addPoint(box,
  transition.label.x + transition.label.width, transition.label.y)`, the
  fold that makes a label's right edge the composite's ink max-X.
- The value folded comes from `transition.label.x`, set by
  `state-transition-label.ts#attachTransitionLabel` (G8's port, which
  consumes graphviz's returned `labelX`).

### Causal chain, measured not inferred

Probe on `bemena-23-zebu249` (`Configuring`), instrumentation since reverted:

```
spec kind      = autonom        <- NOT a cluster spec, never touches BOX_PAD
ink extent     = 357.86168      <- computeSvekResultGeometry's box
geometry.width = 372.86168      = extent + INK_DELTA(15)          ✓ SvekResult
wrapper.width  = 392.86168      = + 20 (MARGIN*2 + 2*MARGIN_LINE) ✓ InnerStateAutonom
dx = dy        = 6                                                 ✓ moveDelta
declared node  = 392.86168 px   = 5.456412in   (jar: 5.449097in, Δ 0.527px)

label "EvNewValueSaved": x = 244.86168, width = 113, right = 357.86168
                                                     ^^^^^^^^^ IS the ink max-X
```

The label's width is an integer, so the whole 0.527 sits in its placed `x`.

### Ruled out, with the evidence

- **The sizing formula.** Measured above: `+15`, `+20`, `dx/dy=6` all match
  `SvekResult`/`InnerStateAutonom` exactly. Nothing to port here.
- **`boundingBox`/`BOX_PAD` (the brief's target).** `Configuring` is an
  `autonom` spec — probe-verified — and the autonom path never calls it.
  `BOX_PAD` is a fallback for CLUSTER composites lacking cluster geometry
  (`state-composite-geo.ts:37`). The brief reached it by grepping for a
  suspicious constant instead of tracing the path the fixture takes.
- **Inner node sizes.** T1's harness reports every scope-1 declaration for
  this fixture exact; only the outer scope's composite differs.
- **Our DOT and the engine.** Already ruled out with evidence in
  `.agent-notes/class-ink-shared-offset-groups.md` item (c); nothing here
  contradicts that.

### What the real mission is

Not "port `SvekResult` for state composites" — that is already done. It is
"a transition label's placed x is sub-pixel off jar's, and the composite ink
fold turns that into a node-size error." That is the **label-placement**
family (G8's `attachTransitionLabel`), not composite sizing, and it needs
its own brief written against this diagnosis.

Batches 2 and 3 of this brief are void as written.
