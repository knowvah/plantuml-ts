## Observation: a member-port classifier's LEFT EDGE is derived from our unquantized width, not graphviz's quantized one

- **Context**: closing the `namespace-cluster-box` mission (T5). Nine of the
  eleven fixtures with a named residual went fully exact once the package box
  became the cluster polygon. Two did not — `cidepu-54-bemo048` and
  `kicolo-81-sidi387` reached exact DOCUMENT size but stayed at 13/28 matched
  shapes. This is the mechanism behind that remainder. It is **not** the
  `(8, 4)` box error, which T5 closed, and it is **not** a dot-engine defect
  (that was the first hypothesis, and measurement killed it).

- **Finding**:

  Graphviz sizes an HTML-table node from the table laid out in **whole
  points**. For a cell declared `WIDTH="76.44999999999999"` it draws a box
  **76** wide; for `WIDTH="77.23750000000001"`, **77**. Jar then scrapes that
  polygon and draws its own 76.45-wide box starting at the scraped left edge.

  We do not. `graph-layout.ts#mapNodes:136` computes the corner as
  `n.x - width / 2`, and `portNodeSize:122` returns the **declared** width
  (not the engine's) whenever `d.portRows !== undefined` or the node is a
  plaintext port. So our left edge is `centre - 76.45/2` where jar's is
  `centre - 76/2`.

  The error is therefore exactly **half the fractional part** of the declared
  width:

  | declared | graphviz drew | predicted Δ | measured Δ |
  |---|---|---|---|
  | 76.44999999999999 | 76 | 0.225 | -0.23 |
  | 77.23750000000001 | 77 | 0.11875 | -0.12 |
  | 76.44999999999999 | 76 | 0.225 | -0.22 |

  (measured on `cidepu`'s three class boxes; display rounding accounts for the
  last digit.)

  **The centres are not in dispute.** Real graphviz 15.1.1 `-Tsvg` on jar's own
  cached `svek-1.dot` puts the three nodes at x = 40, 40.5, 167, which is jar's
  rendered 30, 30.5, 157 after its -10 document shift; our centres reproduce
  graphviz's to the digit. Only the half-width subtracted from them differs.

  Ruled out, with the evidence that ruled it out:

  - **Not a dot-engine divergence.** First hypothesis was that dot-engine keeps
    a fractional HTML-table width where graphviz quantizes. A minimal two-node
    repro (`shape=plaintext`, the same two fractional `WIDTH=` cells, no
    cluster) run through `render()` + `getLayout()` returns w = **92 / 93** —
    identical to real graphviz's `-Tplain` 1.2778in / 1.2917in. The engine
    quantizes exactly as the C does. Do NOT file this as a graphviz-issue; it
    is our seam.
  - **Not our DOT.** Our emitted node declarations for `cidepu` are
    byte-identical to jar's cached `svek-1.dot`, including both fractional
    `WIDTH=` values.
  - **Not the cluster box.** Both fixtures' document size is exact after T5,
    and the package outline, title, edges and arrowheads all match to the
    digit. Only node-derived shapes (class rects, member ellipses, member
    text) carry the offset.

  Why only these two of the eleven: both are member-port diagrams
  (`pack.ClassA::a --> ClassB::b`), which is the `portRows !== undefined`
  branch. The other nine have no ports and take the engine width.

- **Impact**: this is the same family as T15's fix (`portNodeSize` reading a
  member-port classifier back at graphviz's `PAD`ded size), not a new one. A
  fix belongs in the centre→corner conversion: derive the corner from the box
  graphviz actually laid out, then draw our measured width from that corner,
  which is what jar does. Blast radius is wide — every HTML-table node with a
  fractional declared width, i.e. most class nodes — so it is mission-sized,
  not a commit, and it must be measured with `scripts/shape-match-report.ts`
  rather than by fixture spot-checks.

- **Confidence**: High — every number measured against real graphviz 15.1.1
  and the cached jar oracle; the competing hypothesis was tested with an
  isolated repro and disproved rather than argued away.
