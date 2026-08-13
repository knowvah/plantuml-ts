# Observation: description edge-label boxes are ~5x the jar's on `jecici-56-bimu826`

- **Context**: surfaced while porting `constraint=false` (2026-08-13). That
  change raised this fixture's SVG diff count 143 -> 151, and diagnosing the
  rise turned up a much larger unrelated defect sitting underneath it.

- **Finding**: our emitted DOT and the oracle's agree on edge topology,
  `minlen`, and now `constraint=false` (byte-exact: the same 4 of 6 edges).
  They disagree wildly on the label reservation:

  | edge | ours | oracle |
  |---|---|---|
  | `sh0008->sh0006` | `WIDTH="346" HEIGHT="13"` | `WIDTH="72" HEIGHT="22"` |
  | `sh0006->sh0008` | `WIDTH="156" HEIGHT="13"` | `WIDTH="67" HEIGHT="12"` |

  Width is ~5x too large on the wide case and ~2.3x on the narrow one, and the
  height is wrong in both directions (13 vs 22, 13 vs 12). The pattern suggests
  we measure the label as ONE long line where the jar wraps or splits it —
  `346 ≈ 72 * 5` is close to what an unwrapped multi-line label would give.

- **Impact**: the label box is a rank-separation input
  (`SvekEdge#getVerticalDzeta` feeds `ranksep`), so oversizing it distorts
  layout for every fixture that hits the same path — not just this one. It is
  also **invisible to the DOT gate**: `parseEdges` records only
  `hasLabel: boolean`, never the dimensions, so a 346-vs-72 divergence scores
  EQUAL. That is the same blind-spot shape as `sametail` and `constraint`, and
  the third instance found in this corpus.

- **Why it showed up now**: `constraint=false` removes an edge from rank
  constraints, which changes how the oversized labels push nodes around. The
  constraint port is correct — measured independently, and the structural
  (non-`norank`) half of it moved this same fixture 143 -> 133. Wiring
  `norank` then took it to 151. The baseline was raised deliberately with this
  reasoning recorded in `oracle/goldens/svg-description/diff-baseline.json`.

- **Next step if picked up**: compare `link-edge-attrs.ts#applyMainLabel` /
  `computeLinkDzeta`'s measurement against `Labels.java` for a multi-line link
  label, and consider adding edge-label dimensions to `StructuralEdge` so the
  gate can see this class of defect at all.

- **Confidence**: High — read directly off both DOT files; the constraint
  placement was ruled out by line-by-line comparison, and the engine was ruled
  out by laying out the oracle's own DOT with both dot-engine and real
  graphviz (identical node positions).
